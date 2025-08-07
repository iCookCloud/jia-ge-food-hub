import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | null;
  loading?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  search?: string;
  category?: string;
  status?: string;
  [key: string]: any;
}

// 统一的API错误处理
export const handleApiError = (error: PostgrestError | Error): string => {
  if ('code' in error) {
    // PostgrestError
    switch (error.code) {
      case 'PGRST116':
        return '未找到相关数据';
      case '23505':
        return '数据已存在，请检查重复项';
      case '23503':
        return '违反数据完整性约束';
      case '42501':
        return '权限不足，无法执行此操作';
      default:
        return error.message || '操作失败';
    }
  }
  return error.message || '未知错误';
};

// 专用的服务函数，避免动态表名的类型问题

// 产品相关操作
export const productService = {
  async getAll(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // 应用过滤器
    if (filters.category && filters.category !== '全部') {
      query = query.eq('category_chinese', filters.category);
    }
    if (filters.search) {
      query = query.or(`standard_chinese_name.ilike.%${filters.search}%,standard_english_name.ilike.%${filters.search}%,specifications.ilike.%${filters.search}%`);
    }

    // 应用分页
    if (pagination.page && pagination.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    // 应用排序
    const sortBy = filters.sortBy || 'created_at';
    const ascending = filters.sortOrder === 'asc';
    
    if (sortBy === 'price') {
      // 价格排序：unit_price字段
      query = query.order('unit_price', { ascending, nullsFirst: false });
    } else if (sortBy === 'name') {
      // 名称排序：优先中文名，再英文名
      query = query.order('standard_chinese_name', { ascending, nullsFirst: false })
                   .order('standard_english_name', { ascending, nullsFirst: false });
    } else if (sortBy === 'updated_at') {
      // 更新时间排序
      query = query.order('updated_at', { ascending, nullsFirst: false });
    } else {
      // 默认按创建时间排序
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create(productData: any) {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    return { data, error };
  },

  async update(id: string, productData: any) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...productData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    return { data: null, error };
  }
};


// 通用分页辅助函数
export const applePagination = (query: any, pagination: PaginationParams) => {
  if (pagination.page && pagination.limit) {
    const offset = (pagination.page - 1) * pagination.limit;
    return query.range(offset, offset + pagination.limit - 1);
  }
  return query;
};

// 通用搜索辅助函数
export const applyTextSearch = (query: any, searchTerm: string, columns: string[]) => {
  if (searchTerm && columns.length > 0) {
    const searchConditions = columns.map(col => `${col}.ilike.%${searchTerm}%`).join(',');
    return query.or(searchConditions);
  }
  return query;
};