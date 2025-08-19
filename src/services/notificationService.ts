import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  action_url?: string;
}

/**
 * 通知服务 - 统一处理各种系统通知
 */
class NotificationService {
  /**
   * 创建通知
   */
  async createNotification(params: CreateNotificationParams): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: params.user_id,
          title: params.title,
          message: params.message,
          type: params.type,
          action_url: params.action_url,
          is_read: false
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw new Error(`创建通知失败: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * 批量创建通知（发送给多个用户）
   */
  async createNotifications(users: string[], params: Omit<CreateNotificationParams, 'user_id'>): Promise<void> {
    try {
      const notifications = users.map(user_id => ({
        user_id,
        title: params.title,
        message: params.message,
        type: params.type,
        action_url: params.action_url,
        is_read: false
      }));

      const { error } = await supabase
        .from('user_notifications')
        .insert(notifications);

      if (error) {
        console.error('Error creating notifications:', error);
        throw new Error(`批量创建通知失败: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in createNotifications:', error);
      throw error;
    }
  }

  /**
   * 获取所有管理员用户ID
   */
  async getAdminUserIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }

      return data?.map(admin => admin.id) || [];
    } catch (error) {
      console.error('Error in getAdminUserIds:', error);
      return [];
    }
  }

  /**
   * 发送供应商申请通知给管理员
   */
  async notifySupplierApplication(applicantName: string, applicantId: string, companyName?: string): Promise<void> {
    try {
      const adminIds = await this.getAdminUserIds();
      
      if (adminIds.length === 0) {
        console.warn('No admin users found for supplier application notification');
        return;
      }

      const title = '新的供应商申请';
      const message = companyName 
        ? `${applicantName}（${companyName}）申请成为认证供应商，请及时审核。`
        : `${applicantName} 申请成为认证供应商，请及时审核。`;

      await this.createNotifications(adminIds, {
        title,
        message,
        type: 'info',
        action_url: '/admin/supplier-verification'
      });

      console.log(`Supplier application notification sent to ${adminIds.length} admins`);
    } catch (error) {
      console.error('Error in notifySupplierApplication:', error);
      throw error;
    }
  }

  /**
   * 发送供应商审核结果通知
   */
  async notifySupplierApplicationResult(
    applicantId: string, 
    applicantName: string, 
    approved: boolean, 
    reason?: string
  ): Promise<void> {
    try {
      const title = approved ? '供应商申请已通过' : '供应商申请未通过';
      const message = approved 
        ? `恭喜！您的供应商申请已通过审核，现在您可以享受认证供应商的特权。`
        : `很抱歉，您的供应商申请未通过审核。${reason ? `原因：${reason}` : ''}您可以完善资料后重新申请。`;

      await this.createNotification({
        user_id: applicantId,
        title,
        message,
        type: approved ? 'success' : 'warning',
        action_url: '/profile/management'
      });

      console.log(`Supplier application result notification sent to ${applicantName}`);
    } catch (error) {
      console.error('Error in notifySupplierApplicationResult:', error);
      throw error;
    }
  }

  /**
   * 发送货单分享通知
   */
  async notifyOrderListShared(
    supplierId: string, 
    supplierName: string, 
    orderListName: string, 
    orderListId: string,
    sharedBy: string
  ): Promise<void> {
    try {
      const title = '收到新的货单';
      const message = `${sharedBy} 向您分享了货单"${orderListName}"，请查看并处理。`;

      await this.createNotification({
        user_id: supplierId,
        title,
        message,
        type: 'info',
        action_url: `/order-lists/${orderListId}`
      });

      console.log(`Order list shared notification sent to ${supplierName}`);
    } catch (error) {
      console.error('Error in notifyOrderListShared:', error);
      throw error;
    }
  }

  /**
   * 发送货单处理结果通知
   */
  async notifyOrderListProcessed(
    buyerId: string,
    buyerName: string,
    orderListName: string,
    orderListId: string,
    processType: 'confirmed' | 'forwarded',
    supplierName: string,
    targetSupplierName?: string
  ): Promise<void> {
    try {
      const title = processType === 'confirmed' ? '货单已确认' : '货单已转发';
      const message = processType === 'confirmed'
        ? `${supplierName} 已确认您的货单"${orderListName}"，请查看详情。`
        : `${supplierName} 已将您的货单"${orderListName}"转发给 ${targetSupplierName}。`;

      await this.createNotification({
        user_id: buyerId,
        title,
        message,
        type: 'success',
        action_url: `/order-lists/${orderListId}`
      });

      console.log(`Order list processed notification sent to ${buyerName}`);
    } catch (error) {
      console.error('Error in notifyOrderListProcessed:', error);
      throw error;
    }
  }

  /**
   * 发送商品咨询通知
   */
  async notifyProductInquiry(
    supplierId: string,
    supplierName: string,
    productName: string,
    productId: string,
    inquirerName: string
  ): Promise<void> {
    try {
      const title = '收到商品咨询';
      const message = `${inquirerName} 对商品"${productName}"发起咨询，请及时回复。`;

      await this.createNotification({
        user_id: supplierId,
        title,
        message,
        type: 'info',
        action_url: `/products/${productId}`
      });

      console.log(`Product inquiry notification sent to ${supplierName}`);
    } catch (error) {
      console.error('Error in notifyProductInquiry:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();