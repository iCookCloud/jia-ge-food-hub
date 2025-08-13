import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { globalErpService } from './globalErpService';
import { recommendationAPI } from '@/api/recommendations';

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

// Global ERP 数据映射函数
const mapGlobalErpProduct = (item: any) => ({
  id: item.id,
  sku: item.sku,
  standard_chinese_name: item.standard_chinese_name,
  standard_english_name: null,
  category_chinese: item.category,
  unit_price: item.price?.toString() || null,
  specifications: item.specification,
  product_image: item.main_image_url,
  is_active: item.is_active,
  weight: item.weight,
  variants: item.variants,
  created_at: item.created_at,
  updated_at: item.updated_at
});

// 产品相关操作
export const productService = {
  async getAll(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    try {
      // 转换page参数为offset参数
      const globalErpPagination = {
        limit: pagination.limit,
        offset: pagination.page && pagination.limit 
          ? (pagination.page - 1) * pagination.limit 
          : pagination.offset
      };
      
      const { data, count } = await globalErpService.fetchProducts(filters, globalErpPagination);
      return { 
        data: data.map(mapGlobalErpProduct), 
        error: null, 
        count 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }, 
        count: 0 
      };
    }
  },

  async getById(id: string) {
    try {
      const data = await globalErpService.fetchProductById(id);
      if (!data) {
        return { data: null, error: { message: 'Product not found' } };
      }
      return { data: mapGlobalErpProduct(data), error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' } 
      };
    }
  },

  async create(productData: any) {
    // 产品创建应通过Global ERP进行
    return { 
      data: null, 
      error: { message: 'Product creation should be done through Global ERP system' } 
    };
  },

  async update(id: string, productData: any) {
    // 产品更新应通过Global ERP进行
    return { 
      data: null, 
      error: { message: 'Product updates should be done through Global ERP system' } 
    };
  },

  async delete(id: string) {
    // 产品删除应通过Global ERP进行
    return { 
      data: null, 
      error: { message: 'Product deletion should be done through Global ERP system' } 
    };
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

// 推荐系统API扩展
export const recommendationApiService = {
  // 获取案例推荐
  async getCaseRecommendations(caseId: number, params: any = {}) {
    try {
      const response = await recommendationAPI.getCaseRecommendations(caseId, params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 获取个性化推荐
  async getPersonalizedRecommendations(userId: string, params: any = {}) {
    try {
      const response = await recommendationAPI.getPersonalizedRecommendations(userId, params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 获取通用推荐
  async getGeneralRecommendations(params: any = {}) {
    try {
      const response = await recommendationAPI.getGeneralRecommendations(params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 获取相似商品
  async getSimilarProducts(productId: string, params: any = {}) {
    try {
      const response = await recommendationAPI.getSimilarProducts(productId, params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 获取案例完整信息
  async getCaseComplete(caseId: number, params: any = {}) {
    try {
      const response = await recommendationAPI.getCaseComplete(caseId, params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 获取成本预估
  async getCostEstimation(caseId: number, budgetLevel: 'low' | 'medium' | 'high' = 'medium') {
    try {
      const response = await recommendationAPI.getCostEstimation(caseId, budgetLevel);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 更新用户偏好
  async updateUserPreferences(userId: string, preferences: any) {
    try {
      const response = await recommendationAPI.updateUserPreferences(userId, preferences);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 记录推荐反馈
  async recordFeedback(params: {
    user_id?: string;
    recommendation_id: string;
    product_id: string;
    action: 'like' | 'dislike' | 'view' | 'add_to_cart' | 'purchase';
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await recommendationAPI.recordFeedback(params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  },

  // 获取推荐统计
  async getRecommendationStats(params: any = {}) {
    try {
      const response = await recommendationAPI.getStats(params);
      return response;
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error as Error)
      };
    }
  }
};