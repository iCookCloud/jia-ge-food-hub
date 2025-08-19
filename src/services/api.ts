import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import { recommendationAPI } from '@/api/recommendations';
import { supplierService, UnifiedSupplier, SupplierApplication } from './supplierService';
import { orderListResponseService, OrderListResponse, ItemModification } from './orderListResponseService';

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
    try {
      // 使用新的 products_with_categories 视图进行统一查询
      let query = supabase
        .from('products_with_categories')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // 分类筛选（支持层级搜索）
      if (filters.category) {
        let categoryId: number;
        
        // 判断传入的是分类ID还是分类名称
        if (!isNaN(Number(filters.category))) {
          categoryId = Number(filters.category);
        } else {
          // 传入的是分类名称，需要查找对应的ID
          const { data: categoryData } = await supabase
            .from('product_categories')
            .select('id')
            .eq('name', filters.category)
            .single();

          if (!categoryData) {
            return { data: [], error: null, count: 0 };
          }
          categoryId = categoryData.id;
        }

        // 使用层级搜索：包含该分类及其所有子分类的产品
        query = query.contains('searchable_category_ids', [categoryId]);
      }

      // 搜索过滤（使用预构建的搜索字段）
      if (filters.search) {
        if (filters.sku_search) {
          // SKU优先搜索：先搜索SKU字段，再搜索其他字段
          query = query.or(`sku.ilike.%${filters.search}%,search_text.ilike.%${filters.search}%`);
        } else {
          // 普通搜索
          query = query.ilike('search_text', `%${filters.search}%`);
        }
      }

      // 应用排序
      if (filters.sortBy) {
        const order = filters.sortOrder === 'asc' ? 'asc' : 'desc';
        query = query.order(filters.sortBy, { ascending: order === 'asc' });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      // 应用分页
      if (pagination.page && pagination.limit) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      } else if (pagination.offset !== undefined && pagination.limit) {
        query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
      }

      const { data, error, count } = await query;
      
      if (error) {
        return { data: null, error, count: 0 };
      }

      return { 
        data: data || [], 
        error: null, 
        count: count || 0 
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return { data: null, error };
      }
      
      if (!data) {
        return { data: null, error: { message: 'Product not found' } };
      }
      
      return { data, error: null };
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

// 供应商相关API
export const supplierApi = {
  // 获取所有用户作为供应商
  async getAllSuppliers(search?: string): Promise<UnifiedSupplier[]> {
    try {
      return await supplierService.getAllSuppliers(search);
    } catch (error) {
      console.error('Error in supplierApi.getAllSuppliers:', error);
      return [];
    }
  },

  // 申请成为供应商
  async applyForSupplier(companyInfo: {
    company_name: string;
    company_description?: string;
    business_license?: string;
    company_address?: string;
    company_phone?: string;
    company_email?: string;
  }): Promise<void> {
    return await supplierService.applyForSupplier(companyInfo);
  },

  // 管理员审核供应商申请
  async reviewApplication(userId: string, approved: boolean, reason?: string): Promise<void> {
    return await supplierService.reviewSupplierApplication(userId, approved, reason);
  },

  // 获取待审核申请
  async getPendingApplications(): Promise<SupplierApplication[]> {
    return await supplierService.getPendingApplications();
  },

  // 搜索供应商（用于询价和咨询）
  async searchSuppliers(query: string): Promise<UnifiedSupplier[]> {
    return await supplierService.searchAllSuppliers(query);
  }
};

// 货单响应相关API
export const orderListResponseApi = {
  // 处理货单（转发或确认）
  async processOrderList(
    orderListId: string,
    modifications: ItemModification[],
    responseType: 'forward' | 'confirm',
    targetSupplierId?: string,
    message?: string
  ): Promise<string> {
    return await orderListResponseService.processOrderList(
      orderListId, modifications, responseType, targetSupplierId, message
    );
  },

  // 获取用户的货单响应
  async getUserResponses(userId?: string): Promise<OrderListResponse[]> {
    return await orderListResponseService.getUserResponses(userId);
  },

  // 更新响应状态
  async updateResponseStatus(responseId: string, status: string): Promise<void> {
    return await orderListResponseService.updateResponseStatus(responseId, status);
  },

  // 转发货单给其他供应商
  async forwardOrderList(
    orderListId: string,
    modifications: ItemModification[],
    targetSupplierId: string,
    message?: string
  ): Promise<string> {
    return await orderListResponseService.forwardToSupplier(
      orderListId, modifications, targetSupplierId, message
    );
  },

  // 确认货单给发送方
  async confirmOrderList(
    orderListId: string,
    modifications: ItemModification[],
    message?: string
  ): Promise<string> {
    return await orderListResponseService.confirmToSender(
      orderListId, modifications, message
    );
  },

  // 获取用户收到的报价
  async getReceivedQuotations(userId?: string): Promise<any[]> {
    return await orderListResponseService.getReceivedQuotations(userId);
  },

  // 确认订单
  async confirmOrder(orderId: string, buyerUserId?: string): Promise<boolean> {
    return await orderListResponseService.confirmOrder(orderId, buyerUserId);
  },

  // 取消未确认订单
  async cancelUnconfirmedOrder(orderId: string, buyerUserId?: string): Promise<boolean> {
    return await orderListResponseService.cancelUnconfirmedOrder(orderId, buyerUserId);
  },

  // 获取用户的订单
  async getUserOrders(userId?: string): Promise<any[]> {
    return await orderListResponseService.getUserOrders(userId);
  },

  // 接受报价并确认订单
  async acceptQuotationAndCreateOrder(quotationId: string, buyerUserId?: string): Promise<string> {
    return await orderListResponseService.acceptQuotationAndCreateOrder(quotationId, buyerUserId);
  }
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