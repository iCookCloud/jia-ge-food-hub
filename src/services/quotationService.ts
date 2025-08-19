import { supabase } from '@/integrations/supabase/client';
import { FilterParams, PaginationParams, ApiResponse } from './api';

export interface QuotationFilters extends FilterParams {
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
  customer_id?: string;  // 保持兼容性，内部映射为 quoted_by
  supplier_id?: string;  // 保持兼容性，内部映射为 quoted_by
  shared_by?: string;    // 货单分享者ID
  quoted_by?: string;    // 报价者ID (供应商)
}

export const quotationService = {
  // 获取报价列表 - 现在查询 order_list_quotations 表
  getQuotations: async (
    filters: QuotationFilters = {},
    pagination: PaginationParams = {}
  ) => {
    let query = supabase
      .from('order_list_quotations')
      .select(`
        *,
        quoted_by_profile:profiles!quoted_by(nickname, avatar_url),
        shared_by_profile:profiles!shared_by(nickname, avatar_url)
      `);

    // 应用过滤器 - 字段映射到新表结构
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.customer_id) {
      // customer_id 映射为 quoted_by (供应商ID)
      query = query.eq('quoted_by', filters.customer_id);
    }
    if (filters.supplier_id) {
      // supplier_id 映射为 quoted_by
      query = query.eq('quoted_by', filters.supplier_id);
    }

    // 应用分页
    if (pagination.page && pagination.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  // 获取单个报价 - 现在查询 order_list_quotations 表
  getQuotation: async (id: string) => {
    const { data, error } = await supabase
      .from('order_list_quotations')
      .select(`
        *,
        quoted_by_profile:profiles!quoted_by(nickname, avatar_url),
        shared_by_profile:profiles!shared_by(nickname, avatar_url),
        generated_order:orders!generated_order_id(id, status, is_confirmed, total_amount)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  // 创建报价 - 使用 order_list_quotations 表
  createQuotation: async (data: any) => {
    const { data: result, error } = await supabase
      .from('order_list_quotations')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error };
  },

  // 更新报价状态 - 使用 order_list_quotations 表
  updateQuotationStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('order_list_quotations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};