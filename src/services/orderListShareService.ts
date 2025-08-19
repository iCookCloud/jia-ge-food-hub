// 货单分享服务
import { supabase } from '@/integrations/supabase/client';

export interface ShareSupplier {
  id: string;
  nickname: string;
  avatar_url?: string;
  company_name?: string;
  company_description?: string;
  company_phone?: string;
  company_email?: string;
  company_address?: string;
  created_at: string;
  is_supplier?: boolean;
}

export interface OrderListShare {
  id: string;
  order_list_id: string;
  shared_by: string;
  shared_to: string;
  share_message?: string;
  shared_at: string;
  viewed_at?: string;
  responded_at?: string;
  status: 'pending' | 'viewed' | 'quoted' | 'declined';
  supplier_info?: ShareSupplier;
  order_list_info?: {
    name: string;
    description?: string;
    total_amount?: number;
    created_at: string;
  };
  sharer_info?: {
    nickname: string;
    avatar_url?: string;
  };
}

export const orderListShareService = {
  // 获取可分享的用户列表（包括供应商和其他用户）
  async getAvailableSuppliers(searchQuery?: string): Promise<ShareSupplier[]> {
    try {
      // 获取当前用户信息
      const currentUser = await supabase.auth.getUser();
      
      // 查询所有用户，不限制is_supplier标记
      let query = supabase
        .from('profiles')
        .select('id, nickname, avatar_url, company_name, company_description, company_phone, company_email, company_address, created_at, is_supplier');

      // 排除当前用户
      if (currentUser.data.user?.id) {
        query = query.neq('id', currentUser.data.user.id);
      }

      if (searchQuery && searchQuery.trim()) {
        // 支持按昵称、公司名、邮箱搜索
        query = query.or(`nickname.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,company_email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('获取用户列表失败');
    }
  },

  // 分享货单给供应商
  async shareOrderListToSuppliers(
    orderListId: string,
    supplierIds: string[],
    message?: string
  ): Promise<void> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('用户未登录');
      }

      // 创建分享记录
      const shareRecords = supplierIds.map(supplierId => ({
        order_list_id: orderListId,
        shared_by: currentUser.data.user!.id,
        shared_to: supplierId,
        share_message: message || null
      }));

      const { error } = await supabase
        .from('order_list_shares')
        .insert(shareRecords);

      if (error) {
        throw error;
      }

      // 更新货单状态为已分享（只有在状态为draft时才更新）
      const { error: updateError } = await supabase
        .from('product_lists')
        .update({ status: 'shared' })
        .eq('id', orderListId)
        .eq('status', 'draft'); // 只更新草稿状态的货单

      if (updateError) {
        console.error('Error updating order list status:', updateError);
        // 不抛出错误，因为可能是重复分享，状态已经是shared
      }
    } catch (error) {
      console.error('Error sharing order list:', error);
      throw new Error('分享货单失败');
    }
  },

  // 获取货单的分享状态
  async getOrderListShares(orderListId: string): Promise<OrderListShare[]> {
    try {
      const { data, error } = await supabase
        .from('order_list_shares')
        .select(`
          *,
          supplier_info:profiles!shared_to(
            nickname,
            avatar_url,
            company_name,
            is_supplier
          )
        `)
        .eq('order_list_id', orderListId)
        .order('shared_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(share => ({
        ...share,
        supplier_info: {
          id: share.shared_to,
          company_name: share.supplier_info?.company_name || share.supplier_info?.nickname || '未知用户',
          nickname: share.supplier_info?.nickname || '未知用户',
          avatar_url: share.supplier_info?.avatar_url,
          created_at: share.shared_at
        }
      }));
    } catch (error) {
      console.error('Error fetching order list shares:', error);
      throw new Error('获取分享状态失败');
    }
  },

  // 获取分享给我的货单列表（供应商视图）
  async getSharedOrderLists(): Promise<OrderListShare[]> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('用户未登录');
      }

      const { data, error } = await supabase
        .from('order_list_shares')
        .select(`
          *,
          order_list:product_lists!order_list_id(
            name,
            description,
            total_amount,
            created_at
          ),
          sharer:profiles!shared_by(
            nickname,
            avatar_url
          )
        `)
        .eq('shared_to', currentUser.data.user.id)
        .order('shared_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(share => ({
        ...share,
        order_list_info: share.order_list ? {
          name: share.order_list.name,
          description: share.order_list.description,
          total_amount: share.order_list.total_amount,
          created_at: share.order_list.created_at
        } : undefined,
        sharer_info: share.sharer ? {
          nickname: share.sharer.nickname || '未知用户',
          avatar_url: share.sharer.avatar_url
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching shared order lists:', error);
      throw new Error('获取分享货单失败');
    }
  },

  // 更新分享状态（如标记为已查看）
  async updateShareStatus(
    shareId: string,
    status: 'viewed' | 'quoted' | 'declined'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('order_list_shares')
        .update({ status })
        .eq('id', shareId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating share status:', error);
      throw new Error('更新分享状态失败');
    }
  },

  // 确保当前用户是供应商
  async ensureCurrentUserIsSupplier(): Promise<boolean> {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        return false;
      }

      // 检查用户是否已标记为供应商
      const { data, error } = await supabase
        .from('profiles')
        .select('is_supplier')
        .eq('id', currentUser.data.user.id)
        .single();

      if (error) {
        console.error('Error checking supplier status:', error);
        return false;
      }

      return data?.is_supplier || false;
    } catch (error) {
      console.error('Error ensuring supplier role:', error);
      return false;
    }
  },

  // 获取分享统计信息
  async getShareStats(orderListId: string) {
    try {
      const { data, error } = await supabase
        .from('order_list_shares')
        .select('status')
        .eq('order_list_id', orderListId);

      if (error) {
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        pending: 0,
        viewed: 0,
        quoted: 0,
        declined: 0
      };

      data?.forEach(share => {
        stats[share.status as keyof typeof stats]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching share stats:', error);
      throw new Error('获取分享统计失败');
    }
  }
};