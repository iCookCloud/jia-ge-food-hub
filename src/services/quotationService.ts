import { QueryBuilder, FilterParams, PaginationParams, ApiResponse } from './api';

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
    return new QueryBuilder('quotations')
      .select(`
        *,
        supplier_credentials!quotations_supplier_id_fkey(company_name),
        profiles!quotations_customer_id_fkey(nickname)
      `)
      .filter(filters)
      .paginate(pagination)
      .order('created_at', false)
      .execute();
  },

  // 获取单个报价
  getQuotation: async (id: string) => {
    return new QueryBuilder('quotations')
      .select(`
        *,
        supplier_credentials!quotations_supplier_id_fkey(company_name, contact_person),
        profiles!quotations_customer_id_fkey(nickname),
        quotation_items(*)
      `)
      .filter({ id })
      .executeSingle();
  },

  // 创建报价
  createQuotation: async (data: any) => {
    const { createRecord } = await import('./api');
    return createRecord('quotations', data);
  },

  // 更新报价状态
  updateQuotationStatus: async (id: string, status: string) => {
    const { updateRecord } = await import('./api');
    return updateRecord('quotations', id, { status, updated_at: new Date().toISOString() });
  }
};