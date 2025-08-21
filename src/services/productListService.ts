import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  name: string;
  price: string;
  unit: string;
  image?: string;
  specifications?: string;
  sku?: string;
  supplier: {
    name: string;
    verified: boolean;
  };
  quantity: number;
}

export const productListService = {
  // 从购物车创建货单
  createFromCart: async (
    cartItems: CartItem[], 
    name: string, 
    description?: string, 
    deliveryLocation?: string, 
    specialRequirements?: string, 
    expectedDeliveryDate?: string
  ) => {
    try {
      const totalAmount = cartItems.reduce((sum, item) => 
        sum + (parseFloat(item.price) * item.quantity), 0
      );

      // 创建货单
      const { data: productList, error: listError } = await supabase
        .from('product_lists')
        .insert({
          name,
          description: description || null,
          total_amount: totalAmount,
          status: 'draft',
          share_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (listError) {
        return { data: null, error: listError };
      }

      // 创建货单商品项，包含产品快照
      const items = cartItems.map(item => ({
        product_list_id: productList.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: parseFloat(item.price),
        position: 0,
        // 产品快照
        product_snapshot: {
          id: item.id,
          sku: item.sku || '',
          standard_chinese_name: item.name,
          price: parseFloat(item.price),
          specification: item.specifications,
          main_image_url: item.image,
          source: 'global_erp',
          snapshot_time: new Date().toISOString()
        } as any, // 使用 any 类型避免 JSON 类型检查问题
        product_sku: item.sku,
        product_name: item.name,
        snapshot_source: 'global_erp'
      }));

      const { error: itemsError } = await supabase
        .from('product_list_items')
        .insert(items);

      if (itemsError) {
        return { data: null, error: itemsError };
      }

      // 如果有额外信息，更新货单
      if (deliveryLocation || specialRequirements || expectedDeliveryDate) {
        const updateData: any = {};
        if (deliveryLocation) updateData.delivery_location = deliveryLocation;
        if (specialRequirements) updateData.special_requirements = specialRequirements;
        if (expectedDeliveryDate) updateData.expected_delivery_date = expectedDeliveryDate;

        const { error: updateError } = await supabase
          .from('product_lists')
          .update(updateData)
          .eq('id', productList.id);

        if (updateError) {
          console.warn('Failed to update additional fields:', updateError);
        }
      }

      return { data: productList, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 获取用户的货单列表
  getUserProductLists: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: new Error('用户未登录') };
      }

      const { data, error } = await supabase
        .from('product_lists')
        .select(`
          *,
          product_list_items (
            id, quantity, unit_price,
            product_sku, product_name, product_snapshot
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }

      // 转换数据格式以匹配UI期望的格式，使用快照数据
      const formattedData = data?.map(list => ({
        ...list,
        items: list.product_list_items?.map(item => ({
          name: item.product_name || (item.product_snapshot as any)?.standard_chinese_name,
          sku: item.product_sku,
          image: (item.product_snapshot as any)?.main_image_url,
          specifications: (item.product_snapshot as any)?.specification,
          quantity: item.quantity,
          price: item.unit_price
        })) || []
      })) || [];

      return { data: formattedData, error: null };
    } catch (error) {
      return { data: [], error: error as any };
    }
  },

  // 获取单个货单详情
  getProductList: async (id: string) => {
    if (!id || typeof id !== 'string') {
      return { 
        data: null, 
        error: { 
          message: '货单ID无效', 
          code: 'INVALID_ID' 
        } 
      };
    }

    // 检查用户认证状态
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { 
        data: null, 
        error: { 
          message: '用户未登录，无法访问货单', 
          code: 'UNAUTHENTICATED' 
        } 
      };
    }

    try {
      const { data, error } = await supabase
        .from('product_lists')
        .select(`
          *,
          product_list_items (
            id, quantity, unit_price,
            product_sku, product_name, product_snapshot
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error in getProductList:', error);
        return { data: null, error };
      }

      if (!data) {
        return { 
          data: null, 
          error: { 
            message: '货单不存在', 
            code: 'NOT_FOUND' 
          } 
        };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error in getProductList:', error);
      return { data: null, error: error as any };
    }
  },

  // 更新货单状态
  updateStatus: async (id: string, status: 'draft' | 'shared' | 'negotiating' | 'confirmed' | 'delivered') => {
    try {
      const { data, error } = await supabase
        .from('product_lists')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 更新货单信息
  updateOrderList: async (id: string, updateData: {
    name?: string;
    description?: string;
    delivery_location?: string;
    special_requirements?: string;
    expected_delivery_date?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('product_lists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 分享货单给选中的供应商
  // Note: shareToSuppliers 和 getQuotationStatus 方法已移除
  // 现在使用 orderListShareService.shareOrderListToSuppliers 替代
  // 报价状态查询使用 order_list_quotations 表
};