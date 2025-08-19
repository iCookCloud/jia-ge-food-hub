// 货单响应处理服务
import { supabase } from '@/integrations/supabase/client';

// 商品修改信息
export interface ItemModification {
  item_id: string;
  modified_price?: number;
  modified_quantity?: number;
  product_name?: string;
  original_price?: number;
  original_quantity?: number;
}

// 货单报价信息
export interface OrderListResponse {
  id: string;
  order_list_id: string;
  shared_by: string;
  quoted_by: string;
  quoted_items: ItemModification[];
  original_total_amount?: number;
  quoted_total_amount?: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

// 货单响应创建数据
export interface OrderListResponseData {
  original_order_list_id: string;
  response_type: 'forward' | 'confirm';
  modified_items: ItemModification[];
  message?: string;
  target_supplier_id?: string; // 转发时需要
}

export const orderListResponseService = {
  // 处理接收的货单
  async processOrderList(
    orderListId: string,
    modifications: ItemModification[],
    responseType: 'forward' | 'confirm',
    targetSupplierId?: string,
    message?: string
  ): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (responseType === 'forward') {
        if (!targetSupplierId) throw new Error('转发需要指定目标供应商');
        return await this.forwardToSupplier(
          orderListId, modifications, targetSupplierId, message, user.id
        );
      } else {
        return await this.confirmToSender(
          orderListId, modifications, message, user.id
        );
      }
    } catch (error) {
      console.error('Error processing order list:', error);
      throw new Error('处理货单失败');
    }
  },

  // 转发给其他供应商
  async forwardToSupplier(
    orderListId: string,
    modifications: ItemModification[],
    targetSupplierId: string,
    message?: string,
    currentUserId?: string
  ): Promise<string> {
    try {
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        currentUserId = user.id;
      }

      // 获取原始货单信息
      const { data: originalOrderList, error: orderError } = await supabase
        .from('product_lists')
        .select('*')
        .eq('id', orderListId)
        .single();

      if (orderError || !originalOrderList) {
        throw new Error('原始货单不存在');
      }

      // 计算金额
      const originalAmount = await this.calculateTotalAmount(originalOrderList, []);
      const modifiedAmount = await this.calculateTotalAmount(originalOrderList, modifications);

      // 创建新货单（转发后的货单）
      const newOrderList = await this.createForwardedOrderList(
        originalOrderList, modifications, targetSupplierId
      );

      // 转发功能暂时简化 - 不记录响应表
      // TODO: 如果需要转发功能，需要重新设计表结构

      // 发送通知给目标供应商
      await this.notifySupplier(targetSupplierId, newOrderList.id, 'received_forwarded_order');

      return newOrderList.id;
    } catch (error) {
      console.error('Error forwarding to supplier:', error);
      throw new Error('转发货单失败');
    }
  },

  // 确认给发送方
  async confirmToSender(
    orderListId: string,
    modifications: ItemModification[],
    message?: string,
    currentUserId?: string
  ): Promise<string> {
    try {
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        currentUserId = user.id;
      }

      // 获取原始货单信息
      const { data: originalOrderList, error: orderError } = await supabase
        .from('product_lists')
        .select('*')
        .eq('id', orderListId)
        .single();

      if (orderError || !originalOrderList) {
        throw new Error('原始货单不存在');
      }

      // 计算金额
      const originalAmount = await this.calculateTotalAmount(originalOrderList, []);
      const modifiedAmount = await this.calculateTotalAmount(originalOrderList, modifications);

      // 检查是否已经存在待确认的报价
      const { data: existingQuotation } = await supabase
        .from('order_list_quotations')
        .select('*')
        .eq('order_list_id', orderListId)
        .eq('quoted_by', currentUserId)
        .eq('status', 'pending')
        .single();

      let response;
      let isUpdate = false;

      if (existingQuotation) {
        // 更新现有报价
        const { data: updateResponse, error: updateError } = await supabase
          .from('order_list_quotations')
          .update({
            original_total_amount: originalAmount,
            quoted_total_amount: modifiedAmount,
            quoted_items: modifications,
            message,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingQuotation.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating order_list_quotations:', updateError);
          throw updateError;
        }
        response = updateResponse;
        isUpdate = true;
      } else {
        // 创建新的报价
        const { data: createResponse, error: createError } = await supabase
          .from('order_list_quotations')
          .insert({
            order_list_id: orderListId,
            shared_by: originalOrderList.user_id,
            quoted_by: currentUserId,
            original_total_amount: originalAmount,
            quoted_total_amount: modifiedAmount,
            quoted_items: modifications,
            message,
            status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating order_list_quotations:', createError);
          throw createError;
        }
        response = createResponse;
      }

      // 根据新的业务逻辑：创建未确认订单
      let orderId = null;
      if (!isUpdate) {
        // 只有新建报价时才创建订单
        const order = await this.createConfirmationOrder(
          response.id,
          orderListId,
          modifications
        );
        orderId = order.id;

        // 更新报价记录，关联生成的订单ID
        await supabase
          .from('order_list_quotations')
          .update({ generated_order_id: orderId })
          .eq('id', response.id);
      } else if (existingQuotation.generated_order_id) {
        // 更新现有未确认订单
        await this.updateExistingOrder(existingQuotation.generated_order_id, orderListId, modifications);
        orderId = existingQuotation.generated_order_id;
      }

      // 发送通知给原发送方
      await this.notifySupplier(originalOrderList.user_id, response.id, isUpdate ? 'quotation_updated' : 'received_confirmation');

      return response.id;
    } catch (error) {
      console.error('Error confirming to sender:', error);
      throw new Error('确认货单失败');
    }
  },

  // 创建转发的货单
  async createForwardedOrderList(
    originalOrderList: { id: string; name: string; description?: string; user_id: string },
    modifications: ItemModification[],
    targetSupplierId: string
  ): Promise<{ id: string; name: string; user_id: string }> {
    try {
      // 创建新货单
      const { data: newOrderList, error: orderError } = await supabase
        .from('product_lists')
        .insert({
          name: `转发-${originalOrderList.name}`,
          description: originalOrderList.description,
          user_id: targetSupplierId,
          is_active: true,
          is_public: false,
          status: 'draft'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 获取原始商品项目
      const { data: originalItems, error: itemsError } = await supabase
        .from('product_list_items')
        .select('*')
        .eq('product_list_id', originalOrderList.id);

      if (itemsError) throw itemsError;

      // 创建修改后的商品项目
      const modifiedItems = originalItems.map(item => {
        const modification = modifications.find(m => m.item_id === item.id);
        return {
          product_list_id: newOrderList.id,
          product_sku: item.product_sku,
          product_name: item.product_name,
          quantity: modification?.modified_quantity || item.quantity,
          unit_price: modification?.modified_price || item.unit_price,
          product_snapshot: item.product_snapshot
        };
      });

      const { error: insertError } = await supabase
        .from('product_list_items')
        .insert(modifiedItems);

      if (insertError) throw insertError;

      return newOrderList;
    } catch (error) {
      console.error('Error creating forwarded order list:', error);
      throw error;
    }
  },

  // 更新现有未确认订单
  async updateExistingOrder(
    orderId: string,
    originalOrderListId: string,
    modifications: ItemModification[]
  ): Promise<void> {
    try {
      // 获取原始货单信息
      const { data: originalOrderList, error: orderError } = await supabase
        .from('product_lists')
        .select('*')
        .eq('id', originalOrderListId)
        .single();

      if (orderError) throw orderError;

      // 计算新的总金额
      const { data: originalItems, error: itemsError } = await supabase
        .from('product_list_items')
        .select('*')
        .eq('product_list_id', originalOrderListId);

      if (itemsError) throw itemsError;

      const totalAmount = originalItems.reduce((sum, item) => {
        const modification = modifications.find(m => m.item_id === item.id);
        const price = modification?.modified_price ?? item.unit_price;
        const quantity = modification?.modified_quantity ?? item.quantity;
        return sum + (price * quantity);
      }, 0);

      // 只更新未确认的订单
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('is_confirmed', false); // 只能更新未确认的订单

      if (updateError) throw updateError;

      // 删除旧的订单项目
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) throw deleteError;

      // 创建新的订单项目
      const orderItems = originalItems.map(item => {
        const modification = modifications.find(m => m.item_id === item.id);
        return {
          order_id: orderId,
          product_sku: item.product_sku,
          product_name: item.product_name,
          quantity: modification?.modified_quantity || item.quantity,
          unit_price: modification?.modified_price || item.unit_price,
          product_snapshot: item.product_snapshot
        };
      });

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error updating existing order:', error);
      throw error;
    }
  },

  // 创建确认单
  async createConfirmationOrder(
    responseId: string,
    originalOrderListId: string,
    modifications: ItemModification[]
  ): Promise<{ id: string; user_id: string; total_amount: number }> {
    try {
      // 获取原始货单信息
      const { data: originalOrderList, error: orderError } = await supabase
        .from('product_lists')
        .select('*')
        .eq('id', originalOrderListId)
        .single();

      if (orderError) throw orderError;

      // 计算总金额
      const { data: originalItems, error: itemsError } = await supabase
        .from('product_list_items')
        .select('*')
        .eq('product_list_id', originalOrderListId);

      if (itemsError) throw itemsError;

      const totalAmount = originalItems.reduce((sum, item) => {
        const modification = modifications.find(m => m.item_id === item.id);
        const price = modification?.modified_price ?? item.unit_price;
        const quantity = modification?.modified_quantity ?? item.quantity;
        return sum + (price * quantity);
      }, 0);

      // 创建未确认订单（供应商创建给买家的报价订单）
      const { data: order, error: createError } = await supabase
        .from('orders')
        .insert({
          user_id: originalOrderList.user_id, // 订单属于买家
          total_amount: totalAmount,
          status: 'pending',
          is_confirmed: false, // 未确认状态
          quotation_id: responseId // 关联报价记录
        })
        .select()
        .single();

      if (createError) throw createError;

      // 创建订单项目（注意：需要使用正确的字段名）
      const orderItems = originalItems.map(item => {
        const modification = modifications.find(m => m.item_id === item.id);
        return {
          order_id: order.id,
          product_sku: item.product_sku,
          product_name: item.product_name,
          quantity: modification?.modified_quantity || item.quantity,
          unit_price: modification?.modified_price || item.unit_price,
          product_snapshot: item.product_snapshot
        };
      });

      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (insertError) throw insertError;

      return order;
    } catch (error) {
      console.error('Error creating confirmation order:', error);
      throw error;
    }
  },

  // 获取用户的货单响应
  async getUserResponses(userId?: string): Promise<OrderListResponse[]> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('order_list_quotations')
        .select(`
          *,
          order_list:product_lists!order_list_id(name, description),
          shared_by_profile:profiles!shared_by(nickname, company_name),
          quoted_by_profile:profiles!quoted_by(nickname, company_name)
        `)
        .or(`shared_by.eq.${userId},quoted_by.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user responses:', error);
      return [];
    }
  },

  // 更新响应状态
  async updateResponseStatus(responseId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('order_list_quotations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', responseId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating response status:', error);
      throw new Error('更新响应状态失败');
    }
  },

  // 计算总金额
  async calculateTotalAmount(orderList: { id: string }, modifications: ItemModification[]): Promise<number> {
    try {
      // 获取订单项目
      const { data: items, error } = await supabase
        .from('product_list_items')
        .select('*')
        .eq('product_list_id', orderList.id);

      if (error) throw error;

      return items.reduce((total, item) => {
        const modification = modifications.find(m => m.item_id === item.id);
        const price = modification?.modified_price ?? item.unit_price;
        const quantity = modification?.modified_quantity ?? item.quantity;
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating total amount:', error);
      return 0;
    }
  },

  // 买家接受报价并创建订单
  async acceptQuotationAndCreateOrder(
    quotationId: string,
    buyerUserId?: string
  ): Promise<string> {
    try {
      if (!buyerUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        buyerUserId = user.id;
      }

      // 获取报价信息
      const { data: quotation, error: quotationError } = await supabase
        .from('order_list_quotations')
        .select('*')
        .eq('id', quotationId)
        .eq('shared_by', buyerUserId) // 确保只有货单发送者可以接受报价
        .single();

      if (quotationError || !quotation) {
        throw new Error('报价不存在或无权限');
      }

      // 确认现有的未确认订单
      if (!quotation.generated_order_id) {
        throw new Error('该报价没有关联的订单');
      }

      // 调用数据库函数确认订单
      const { data: confirmResult, error: confirmError } = await supabase
        .rpc('confirm_order', { order_id: quotation.generated_order_id });

      if (confirmError || !confirmResult) {
        throw new Error('确认订单失败');
      }

      const order = { id: quotation.generated_order_id };

      // 更新报价状态为已接受
      await supabase
        .from('order_list_quotations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', quotationId);

      // 发送通知给报价者
      await this.notifySupplier(quotation.quoted_by, quotationId, 'quotation_accepted');

      return order.id;
    } catch (error) {
      console.error('Error accepting quotation:', error);
      throw new Error('接受报价失败');
    }
  },

  // 获取用户收到的报价
  async getReceivedQuotations(userId?: string): Promise<any[]> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('order_list_quotations')
        .select(`
          *,
          order_list:product_lists!order_list_id(name, description),
          quoted_by_profile:profiles!quoted_by(nickname, company_name),
          generated_order:orders!generated_order_id(id, is_confirmed, confirmed_at, status, total_amount)
        `)
        .eq('shared_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching received quotations:', error);
      return [];
    }
  },

  // 确认订单
  async confirmOrder(orderId: string, buyerUserId?: string): Promise<boolean> {
    try {
      if (!buyerUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        buyerUserId = user.id;
      }

      // 调用数据库函数确认订单
      const { data: result, error } = await supabase
        .rpc('confirm_order', { order_id: orderId });

      if (error) {
        console.error('Error confirming order:', error);
        throw error;
      }

      return result === true;
    } catch (error) {
      console.error('Error confirming order:', error);
      throw new Error('确认订单失败');
    }
  },

  // 取消未确认订单
  async cancelUnconfirmedOrder(orderId: string, buyerUserId?: string): Promise<boolean> {
    try {
      if (!buyerUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        buyerUserId = user.id;
      }

      // 调用数据库函数取消订单
      const { data: result, error } = await supabase
        .rpc('cancel_unconfirmed_order', { order_id: orderId });

      if (error) {
        console.error('Error canceling order:', error);
        throw error;
      }

      return result === true;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw new Error('取消订单失败');
    }
  },

  // 获取用户的订单（包括确认和未确认的）
  async getUserOrders(userId?: string): Promise<any[]> {
    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          quotation:order_list_quotations!quotation_id(
            id,
            quoted_by,
            quoted_by_profile:profiles!quoted_by(nickname, company_name),
            order_list:product_lists!order_list_id(name, description)
          ),
          order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  },

  // 发送通知
  async notifySupplier(
    supplierId: string,
    responseId: string,
    notificationType: string
  ): Promise<void> {
    try {
      // 这里可以集成实际的通知服务
      console.log(`Notification sent to ${supplierId}: ${notificationType} for response ${responseId}`);
      
      // 暂时使用简单的数据库通知记录
      // 实际项目中可以集成推送通知、邮件等
    } catch (error) {
      console.error('Error sending notification:', error);
      // 通知失败不应该影响主要业务流程
    }
  }
};