// 推荐系统 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService, ProductRecommendation, RecommendationParams } from '@/services/recommendationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// 案例推荐 Hook
export const useCaseRecommendations = (
  caseId: number, 
  params: Omit<RecommendationParams, 'case_id'> = {},
  options: { enabled?: boolean } = {}
) => {
  const { user } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['caseRecommendations', caseId, user?.id, params],
    queryFn: () => recommendationService.getRecommendationsForCase(caseId, {
      ...params,
      user_id: user?.id
    }),
    enabled: enabled && !!caseId,
    staleTime: 5 * 60 * 1000, // 5分钟内不重复请求
    gcTime: 15 * 60 * 1000,   // 缓存15分钟
  });
};

// 个性化推荐 Hook
export const usePersonalizedRecommendations = (
  params: Omit<RecommendationParams, 'user_id'> = {},
  options: { enabled?: boolean } = {}
) => {
  const { user } = useAuth();
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['personalizedRecommendations', user?.id, params],
    queryFn: () => recommendationService.getPersonalizedRecommendations(user!.id, params),
    enabled: enabled && !!user?.id,
    staleTime: 3 * 60 * 1000, // 3分钟内不重复请求
    gcTime: 10 * 60 * 1000,   // 缓存10分钟
  });
};

// 通用推荐 Hook
export const useGeneralRecommendations = (
  params: RecommendationParams = {},
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['generalRecommendations', params],
    queryFn: () => recommendationService.getGeneralRecommendations(params),
    enabled,
    staleTime: 10 * 60 * 1000, // 10分钟内不重复请求
    gcTime: 30 * 60 * 1000,    // 缓存30分钟
  });
};

// 相似商品推荐 Hook
export const useSimilarProducts = (
  productId: string,
  limit = 10,
  options: { enabled?: boolean } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['similarProducts', productId, limit],
    queryFn: () => recommendationService.getSimilarProducts(productId, limit),
    enabled: enabled && !!productId,
    staleTime: 15 * 60 * 1000, // 15分钟内不重复请求
    gcTime: 60 * 60 * 1000,    // 缓存1小时
  });
};

// 智能推荐管理 Hook
export const useSmartRecommendations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 刷新推荐缓存
  const refreshRecommendations = () => {
    queryClient.invalidateQueries({ queryKey: ['personalizedRecommendations'] });
    queryClient.invalidateQueries({ queryKey: ['caseRecommendations'] });
    queryClient.invalidateQueries({ queryKey: ['generalRecommendations'] });
  };

  // 记录推荐反馈
  const recordFeedbackMutation = useMutation({
    mutationFn: async ({ 
      recommendationId, 
      productId, 
      action 
    }: { 
      recommendationId: string;
      productId: string;
      action: 'like' | 'dislike' | 'view' | 'add_to_cart' | 'purchase';
    }) => {
      // TODO: 实现推荐反馈记录到数据库
      console.log('Recording recommendation feedback:', { recommendationId, productId, action, userId: user?.id });
      
      // 模拟API调用
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      // 可以根据反馈更新推荐算法或缓存
      console.log('Recommendation feedback recorded successfully');
    },
    onError: (error) => {
      console.error('Failed to record recommendation feedback:', error);
    },
  });

  const recordFeedback = (
    recommendationId: string,
    productId: string,
    action: 'like' | 'dislike' | 'view' | 'add_to_cart' | 'purchase'
  ) => {
    recordFeedbackMutation.mutate({ recommendationId, productId, action });
  };

  // 获取推荐配置
  const getRecommendationConfig = () => ({
    enablePersonalized: !!user?.id,
    defaultLimit: 20,
    cacheTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  // 预加载推荐数据
  const preloadRecommendations = async (params: {
    caseId?: number;
    style?: string;
    category?: string;
  }) => {
    const queryClient = useQueryClient();

    if (params.caseId) {
      await queryClient.prefetchQuery({
        queryKey: ['caseRecommendations', params.caseId, user?.id],
        queryFn: () => recommendationService.getRecommendationsForCase(params.caseId!, {
          user_id: user?.id
        }),
        staleTime: 5 * 60 * 1000,
      });
    }

    if (user?.id) {
      await queryClient.prefetchQuery({
        queryKey: ['personalizedRecommendations', user.id],
        queryFn: () => recommendationService.getPersonalizedRecommendations(user.id),
        staleTime: 3 * 60 * 1000,
      });
    }
  };

  return {
    refreshRecommendations,
    recordFeedback,
    getRecommendationConfig,
    preloadRecommendations,
    isRecordingFeedback: recordFeedbackMutation.isPending,
  };
};

// 推荐性能监控 Hook
export const useRecommendationMetrics = () => {
  const queryClient = useQueryClient();

  const getMetrics = () => {
    const cache = queryClient.getQueryCache();
    const recommendationQueries = cache.getAll().filter(query => 
      query.queryKey[0]?.toString().includes('Recommendations') ||
      query.queryKey[0]?.toString().includes('similarProducts')
    );

    const metrics = {
      totalQueries: recommendationQueries.length,
      cacheHits: recommendationQueries.filter(q => q.state.data && !q.state.isLoading).length,
      activeFetches: recommendationQueries.filter(q => q.state.isFetching).length,
      staleCaches: recommendationQueries.filter(q => q.isStale()).length,
      
      // 推荐类型分布
      byType: {
        personalized: recommendationQueries.filter(q => q.queryKey[0] === 'personalizedRecommendations').length,
        case: recommendationQueries.filter(q => q.queryKey[0] === 'caseRecommendations').length,
        general: recommendationQueries.filter(q => q.queryKey[0] === 'generalRecommendations').length,
        similar: recommendationQueries.filter(q => q.queryKey[0] === 'similarProducts').length,
      },
      
      // 缓存效率
      cacheEfficiency: recommendationQueries.length > 0 
        ? Math.round((recommendationQueries.filter(q => q.state.data && !q.state.isLoading).length / recommendationQueries.length) * 100)
        : 0,
    };

    return metrics;
  };

  const clearCache = () => {
    queryClient.invalidateQueries({ queryKey: ['personalizedRecommendations'] });
    queryClient.invalidateQueries({ queryKey: ['caseRecommendations'] });
    queryClient.invalidateQueries({ queryKey: ['generalRecommendations'] });
    queryClient.invalidateQueries({ queryKey: ['similarProducts'] });
    
    toast({
      title: "推荐缓存已清理",
      description: "系统将重新获取最新的推荐数据",
    });
  };

  return {
    getMetrics,
    clearCache,
  };
};

// 批量推荐 Hook
export const useBatchRecommendations = () => {
  const { user } = useAuth();

  const batchRecommendationsMutation = useMutation({
    mutationFn: async (requests: Array<{
      id: string;
      type: 'case' | 'personalized' | 'similar';
      params: any;
    }>) => {
      const results = await Promise.allSettled(
        requests.map(async (request) => {
          switch (request.type) {
            case 'case':
              return {
                id: request.id,
                data: await recommendationService.getRecommendationsForCase(
                  request.params.caseId,
                  { ...request.params, user_id: user?.id }
                )
              };
            case 'personalized':
              if (!user?.id) throw new Error('User not authenticated');
              return {
                id: request.id,
                data: await recommendationService.getPersonalizedRecommendations(
                  user.id,
                  request.params
                )
              };
            case 'similar':
              return {
                id: request.id,
                data: await recommendationService.getSimilarProducts(
                  request.params.productId,
                  request.params.limit
                )
              };
            default:
              throw new Error(`Unknown recommendation type: ${request.type}`);
          }
        })
      );

      return results.map((result, index) => ({
        id: requests[index].id,
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      if (successCount === totalCount) {
        toast({
          title: "批量推荐获取成功",
          description: `成功获取 ${successCount} 个推荐结果`,
        });
      } else {
        toast({
          title: "部分推荐获取失败",
          description: `${successCount}/${totalCount} 个推荐获取成功`,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "批量推荐获取失败",
        description: error.message || "获取推荐时出现错误",
        variant: "destructive",
      });
    },
  });

  return {
    getBatchRecommendations: batchRecommendationsMutation.mutate,
    isLoading: batchRecommendationsMutation.isPending,
    results: batchRecommendationsMutation.data,
    error: batchRecommendationsMutation.error,
  };
};