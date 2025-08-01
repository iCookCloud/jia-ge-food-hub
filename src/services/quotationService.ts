import { supabase } from '@/integrations/supabase/client';
import { FilterParams, PaginationParams, ApiResponse } from './api';

export interface QuotationFilters extends FilterParams {
  status?: 'draft' | 'sent' | 'accepted' | 'rejected';
  customer_id?: string;
  supplier_id?: string;
}

export const quotationService = {
  // 获取报价列表
  getQuotations: async (
    filters: QuotationFilters = {},
    pagination: PaginationParams = {}
  ) => {
    let query = supabase
      .from('quotations')
      .select(`
        *,
        profiles (nickname)
      `);

    // 应用过滤器
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    // 应用分页
    if (pagination.page && pagination.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  // 获取单个报价
  getQuotation: async (id: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        profiles (nickname),
        quotation_items(*)
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  // 创建报价
  createQuotation: async (data: any) => {
    const { data: result, error } = await supabase
      .from('quotations')
      .insert(data)
      .select()
      .single();
    
    return { data: result, error };
  },

  // 更新报价状态
  updateQuotationStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};