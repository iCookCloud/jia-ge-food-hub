// 推荐系统 API 接口
import { recommendationService, ProductRecommendation, RecommendationParams } from '@/services/recommendationService';
import { integrationApiService } from '@/services/integrationApiService';
import { designCaseService } from '@/services/designCaseService';
import { supplierService } from '@/services/supplierService';

// API 响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  total: number;
  page: number;
  pageSize: number;
  filters?: Record<string, any>;
}

export interface CostEstimationResponse {
  cost_estimation: Record<string, unknown>;
  case_info?: Record<string, unknown>;
  recommendations_count: number;
}

// 推荐API类
export class RecommendationAPI {
  // 获取案例推荐
  static async getCaseRecommendations(
    caseId: number,
    params: {
      user_id?: string;
      limit?: number;
      page?: number;
      category?: string;
      budget_range?: { min: number; max: number };
    } = {}
  ): Promise<ApiResponse<RecommendationResponse>> {
    try {
      const { limit = 20, page = 1, ...filters } = params;
      const offset = (page - 1) * limit;

      const recommendations = await recommendationService.getRecommendationsForCase(
        caseId,
        {
          ...filters,
          limit,
          exclude_products: []
        }
      );

      // 分页处理
      const paginatedRecommendations = recommendations.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          recommendations: paginatedRecommendations,
          total: recommendations.length,
          page,
          pageSize: limit,
          filters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取案例推荐失败'
      };
    }
  }

  // 获取个性化推荐
  static async getPersonalizedRecommendations(
    userId: string,
    params: {
      limit?: number;
      page?: number;
      category?: string;
      style?: string;
      budget_range?: { min: number; max: number };
    } = {}
  ): Promise<ApiResponse<RecommendationResponse>> {
    try {
      const { limit = 20, page = 1, ...filters } = params;
      const offset = (page - 1) * limit;

      const recommendations = await recommendationService.getPersonalizedRecommendations(
        userId,
        {
          ...filters,
          limit: limit * 2 // 获取更多数据以支持分页
        }
      );

      // 分页处理
      const paginatedRecommendations = recommendations.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          recommendations: paginatedRecommendations,
          total: recommendations.length,
          page,
          pageSize: limit,
          filters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取个性化推荐失败'
      };
    }
  }

  // 获取通用推荐
  static async getGeneralRecommendations(
    params: {
      limit?: number;
      page?: number;
      category?: string;
      style?: string;
      budget_range?: { min: number; max: number };
    } = {}
  ): Promise<ApiResponse<RecommendationResponse>> {
    try {
      const { limit = 20, page = 1, ...filters } = params;
      const offset = (page - 1) * limit;

      const recommendations = await recommendationService.getGeneralRecommendations({
        ...filters,
        limit: limit * 2
      });

      const paginatedRecommendations = recommendations.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          recommendations: paginatedRecommendations,
          total: recommendations.length,
          page,
          pageSize: limit,
          filters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取通用推荐失败'
      };
    }
  }

  // 获取相似商品推荐
  static async getSimilarProducts(
    productId: string,
    params: {
      limit?: number;
      page?: number;
    } = {}
  ): Promise<ApiResponse<RecommendationResponse>> {
    try {
      const { limit = 10, page = 1 } = params;
      const offset = (page - 1) * limit;

      const recommendations = await recommendationService.getSimilarProducts(
        productId,
        limit * 2
      );

      const paginatedRecommendations = recommendations.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          recommendations: paginatedRecommendations,
          total: recommendations.length,
          page,
          pageSize: limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取相似商品推荐失败'
      };
    }
  }

  // 获取案例完整信息（包含推荐和成本预估）
  static async getCaseComplete(
    caseId: number,
    params: {
      user_id?: string;
      budget_level?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<ApiResponse<any>> {
    try {
      const { user_id, budget_level = 'medium' } = params;

      // 并行获取数据
      const [caseComplete, costEstimation] = await Promise.all([
        integrationApiService.getCaseComplete(caseId),
        integrationApiService.getCasesCostEstimation(caseId, budget_level)
      ]);

      return {
        success: true,
        data: {
          ...caseComplete,
          cost_estimation: costEstimation,
          user_id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取案例完整信息失败'
      };
    }
  }

  // 获取成本预估
  static async getCostEstimation(
    caseId: number,
    budgetLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ApiResponse<CostEstimationResponse>> {
    try {
      const [costEstimation, caseInfo, recommendations] = await Promise.all([
        integrationApiService.getCasesCostEstimation(caseId, budgetLevel),
        designCaseService.fetchCaseById(caseId),
        recommendationService.getRecommendationsForCase(caseId, { limit: 50 })
      ]);

      return {
        success: true,
        data: {
          cost_estimation: costEstimation,
          case_info: caseInfo,
          recommendations_count: recommendations.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取成本预估失败'
      };
    }
  }

  // 批量获取推荐
  static async getBatchRecommendations(
    requests: Array<{
      id: string;
      type: 'case' | 'personalized' | 'similar';
      params: any;
    }>
  ): Promise<ApiResponse<Record<string, any>>> {
    try {
      const results: Record<string, any> = {};

      const promises = requests.map(async (request) => {
        try {
          let data;
          switch (request.type) {
            case 'case':
              data = await this.getCaseRecommendations(request.params.caseId, request.params);
              break;
            case 'personalized':
              data = await this.getPersonalizedRecommendations(request.params.userId, request.params);
              break;
            case 'similar':
              data = await this.getSimilarProducts(request.params.productId, request.params);
              break;
            default:
              throw new Error(`Unknown request type: ${request.type}`);
          }
          
          results[request.id] = data;
        } catch (error) {
          results[request.id] = {
            success: false,
            error: error instanceof Error ? error.message : `Failed to process ${request.type} request`
          };
        }
      });

      await Promise.all(promises);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量推荐请求失败'
      };
    }
  }

  // 更新用户偏好
  static async updateUserPreferences(
    userId: string,
    preferences: {
      preferred_styles?: string[];
      preferred_categories?: string[];
      budget_range?: { min: number; max: number };
      quality_priority?: number;
      price_priority?: number;
      brand_preferences?: string[];
    }
  ): Promise<ApiResponse<any>> {
    try {
      const currentPreferences = await recommendationService.getUserPreferences(userId);
      
      const updatedPreferences = await recommendationService.updateUserPreferences({
        user_id: userId,
        preferred_styles: preferences.preferred_styles || currentPreferences?.preferred_styles || [],
        preferred_categories: preferences.preferred_categories || currentPreferences?.preferred_categories || [],
        budget_range: preferences.budget_range || currentPreferences?.budget_range || { min: 0, max: 10000 },
        quality_priority: preferences.quality_priority || currentPreferences?.quality_priority || 5,
        price_priority: preferences.price_priority || currentPreferences?.price_priority || 5,
        brand_preferences: preferences.brand_preferences || currentPreferences?.brand_preferences || [],
        recent_views: currentPreferences?.recent_views || [],
        recent_cases: currentPreferences?.recent_cases || []
      });

      return {
        success: true,
        data: updatedPreferences,
        message: '用户偏好更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新用户偏好失败'
      };
    }
  }

  // 记录推荐反馈
  static async recordRecommendationFeedback(
    params: {
      user_id?: string;
      recommendation_id: string;
      product_id: string;
      action: 'like' | 'dislike' | 'view' | 'add_to_cart' | 'purchase';
      metadata?: Record<string, any>;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      // TODO: 实现推荐反馈记录到数据库
      console.log('Recording recommendation feedback:', params);
      
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 200));

      return {
        success: true,
        data: { message: '反馈记录成功' },
        message: '感谢您的反馈，这将帮助我们改进推荐系统'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '记录反馈失败'
      };
    }
  }

  // 获取推荐统计
  static async getRecommendationStats(
    params: {
      user_id?: string;
      date_range?: { start: string; end: string };
      type?: 'case' | 'personalized' | 'general' | 'similar';
    } = {}
  ): Promise<ApiResponse<any>> {
    try {
      // TODO: 实现推荐统计查询
      const mockStats = {
        total_recommendations: 1250,
        user_interactions: 89,
        conversion_rate: 0.071,
        popular_categories: ['家具', '照明', '装饰品'],
        popular_styles: ['现代简约', '北欧风', '工业风'],
        avg_score: 0.85,
        feedback_summary: {
          likes: 67,
          dislikes: 8,
          views: 145,
          add_to_cart: 23,
          purchases: 6
        }
      };

      return {
        success: true,
        data: mockStats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取推荐统计失败'
      };
    }
  }
}

// 推荐API的便捷方法
export const recommendationAPI = {
  // 案例推荐
  getCaseRecommendations: RecommendationAPI.getCaseRecommendations,
  
  // 个性化推荐
  getPersonalizedRecommendations: RecommendationAPI.getPersonalizedRecommendations,
  
  // 通用推荐
  getGeneralRecommendations: RecommendationAPI.getGeneralRecommendations,
  
  // 相似商品
  getSimilarProducts: RecommendationAPI.getSimilarProducts,
  
  // 案例完整信息
  getCaseComplete: RecommendationAPI.getCaseComplete,
  
  // 成本预估
  getCostEstimation: RecommendationAPI.getCostEstimation,
  
  // 批量推荐
  getBatchRecommendations: RecommendationAPI.getBatchRecommendations,
  
  // 用户偏好
  updateUserPreferences: RecommendationAPI.updateUserPreferences,
  
  // 反馈记录
  recordFeedback: RecommendationAPI.recordRecommendationFeedback,
  
  // 统计数据
  getStats: RecommendationAPI.getRecommendationStats
};