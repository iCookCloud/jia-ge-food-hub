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

// 统一的查询构建器
export class QueryBuilder {
  private query: any;

  constructor(tableName: string) {
    this.query = supabase.from(tableName);
  }

  select(columns: string = '*') {
    this.query = this.query.select(columns);
    return this;
  }

  filter(filters: FilterParams) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'search') {
          // 实现搜索逻辑
          return;
        }
        this.query = this.query.eq(key, value);
      }
    });
    return this;
  }

  paginate(pagination: PaginationParams) {
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;
    this.query = this.query.range(offset, offset + limit - 1);
    return this;
  }

  order(column: string, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending });
    return this;
  }

  async execute<T>(): Promise<ApiResponse<T[]>> {
    const { data, error } = await this.query;
    return { data, error };
  }

  async executeSingle<T>(): Promise<ApiResponse<T>> {
    const { data, error } = await this.query.single();
    return { data, error };
  }
}

// 基础CRUD操作
export const createRecord = async <T>(
  tableName: string, 
  data: Partial<T>
): Promise<ApiResponse<T>> => {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single();
  
  return { data: result, error };
};

export const updateRecord = async <T>(
  tableName: string,
  id: string,
  data: Partial<T>
): Promise<ApiResponse<T>> => {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  return { data: result, error };
};

export const deleteRecord = async (
  tableName: string,
  id: string
): Promise<ApiResponse<null>> => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
  
  return { data: null, error };
};

export const getRecord = async <T>(
  tableName: string,
  id: string,
  select: string = '*'
): Promise<ApiResponse<T>> => {
  const { data, error } = await supabase
    .from(tableName)
    .select(select)
    .eq('id', id)
    .single();
  
  return { data, error };
};