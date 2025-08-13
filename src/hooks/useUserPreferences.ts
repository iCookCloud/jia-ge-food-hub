// 用户偏好管理 Hook
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recommendationService, UserPreferences } from '@/services/recommendationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface UseUserPreferencesOptions {
  enabled?: boolean;
}

export const useUserPreferences = (options: UseUserPreferencesOptions = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enabled = true } = options;

  // 获取用户偏好
  const {
    data: preferences,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: () => recommendationService.getUserPreferences(user!.id),
    enabled: enabled && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟内不重复请求
    gcTime: 10 * 60 * 1000,   // 缓存10分钟
  });

  // 更新用户偏好
  const updatePreferencesMutation = useMutation({
    mutationFn: (newPreferences: Omit<UserPreferences, 'id' | 'updated_at'>) =>
      recommendationService.updateUserPreferences(newPreferences),
    onSuccess: (updatedPreferences) => {
      // 更新缓存
      queryClient.setQueryData(['userPreferences', user?.id], updatedPreferences);
      
      // 清除相关的推荐缓存
      queryClient.invalidateQueries({ 
        queryKey: ['personalizedRecommendations', user?.id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['caseRecommendations'] 
      });
      
      toast({
        title: "偏好设置已保存",
        description: "您的个性化推荐将基于新的偏好设置进行调整",
      });
    },
    onError: (error) => {
      toast({
        title: "保存失败",
        description: error.message || "保存偏好设置时出现错误",
        variant: "destructive",
      });
    },
  });

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (!user?.id) {
      toast({
        title: "请先登录",
        description: "需要登录后才能保存偏好设置",
        variant: "destructive",
      });
      return;
    }

    const fullPreferences: Omit<UserPreferences, 'id' | 'updated_at'> = {
      user_id: user.id,
      preferred_styles: preferences?.preferred_styles || [],
      preferred_categories: preferences?.preferred_categories || [],
      budget_range: preferences?.budget_range || { min: 0, max: 10000 },
      quality_priority: preferences?.quality_priority || 5,
      price_priority: preferences?.price_priority || 5,
      brand_preferences: preferences?.brand_preferences || [],
      recent_views: preferences?.recent_views || [],
      recent_cases: preferences?.recent_cases || [],
      ...newPreferences,
    };

    updatePreferencesMutation.mutate(fullPreferences);
  };

  // 快速更新单个偏好字段
  const updateSinglePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    updatePreferences({ [key]: value });
  };

  // 添加偏好风格
  const addPreferredStyle = (style: string) => {
    const currentStyles = preferences?.preferred_styles || [];
    if (!currentStyles.includes(style)) {
      updateSinglePreference('preferred_styles', [...currentStyles, style]);
    }
  };

  // 移除偏好风格
  const removePreferredStyle = (style: string) => {
    const currentStyles = preferences?.preferred_styles || [];
    updateSinglePreference('preferred_styles', currentStyles.filter(s => s !== style));
  };

  // 添加偏好类别
  const addPreferredCategory = (category: string) => {
    const currentCategories = preferences?.preferred_categories || [];
    if (!currentCategories.includes(category)) {
      updateSinglePreference('preferred_categories', [...currentCategories, category]);
    }
  };

  // 移除偏好类别
  const removePreferredCategory = (category: string) => {
    const currentCategories = preferences?.preferred_categories || [];
    updateSinglePreference('preferred_categories', currentCategories.filter(c => c !== category));
  };

  // 更新预算范围
  const updateBudgetRange = (min: number, max: number) => {
    updateSinglePreference('budget_range', { min, max });
  };

  // 添加品牌偏好
  const addBrandPreference = (brand: string) => {
    const currentBrands = preferences?.brand_preferences || [];
    if (!currentBrands.includes(brand)) {
      updateSinglePreference('brand_preferences', [...currentBrands, brand]);
    }
  };

  // 移除品牌偏好
  const removeBrandPreference = (brand: string) => {
    const currentBrands = preferences?.brand_preferences || [];
    updateSinglePreference('brand_preferences', currentBrands.filter(b => b !== brand));
  };

  // 记录商品浏览
  const recordProductView = (productId: string) => {
    const currentViews = preferences?.recent_views || [];
    const updatedViews = [productId, ...currentViews.filter(id => id !== productId)].slice(0, 20); // 保留最近20个
    updateSinglePreference('recent_views', updatedViews);
  };

  // 记录案例浏览
  const recordCaseView = (caseId: number) => {
    const currentCases = preferences?.recent_cases || [];
    const updatedCases = [caseId, ...currentCases.filter(id => id !== caseId)].slice(0, 20); // 保留最近20个
    updateSinglePreference('recent_cases', updatedCases);
  };

  // 获取默认偏好设置
  const getDefaultPreferences = (): Omit<UserPreferences, 'id' | 'updated_at'> => ({
    user_id: user?.id || '',
    preferred_styles: ['现代简约'],
    preferred_categories: ['家具'],
    budget_range: { min: 100, max: 5000 },
    quality_priority: 7,
    price_priority: 5,
    brand_preferences: [],
    recent_views: [],
    recent_cases: [],
  });

  // 重置偏好设置
  const resetPreferences = () => {
    updatePreferences(getDefaultPreferences());
  };

  // 检查是否已初始化偏好
  const hasPreferences = !!preferences;

  // 初始化默认偏好（如果用户没有偏好记录）
  const initializeDefaultPreferences = () => {
    if (user?.id && !isLoading && !preferences && !error) {
      updatePreferences(getDefaultPreferences());
    }
  };

  return {
    // 状态
    preferences,
    isLoading,
    error,
    hasPreferences,
    isUpdating: updatePreferencesMutation.isPending,

    // 操作方法
    updatePreferences,
    updateSinglePreference,
    
    // 风格管理
    addPreferredStyle,
    removePreferredStyle,
    
    // 类别管理
    addPreferredCategory,
    removePreferredCategory,
    
    // 预算管理
    updateBudgetRange,
    
    // 品牌管理
    addBrandPreference,
    removeBrandPreference,
    
    // 浏览记录
    recordProductView,
    recordCaseView,
    
    // 工具方法
    resetPreferences,
    initializeDefaultPreferences,
    getDefaultPreferences,
    refetch,
  };
};

// 用户偏好统计 Hook
export const useUserPreferencesStats = () => {
  const { preferences } = useUserPreferences();

  const stats = {
    totalPreferredStyles: preferences?.preferred_styles.length || 0,
    totalPreferredCategories: preferences?.preferred_categories.length || 0,
    totalBrandPreferences: preferences?.brand_preferences.length || 0,
    recentViewsCount: preferences?.recent_views.length || 0,
    recentCasesCount: preferences?.recent_cases.length || 0,
    
    // 偏好完整度评分 (0-100)
    completenessScore: (() => {
      if (!preferences) return 0;
      
      let score = 0;
      if (preferences.preferred_styles.length > 0) score += 25;
      if (preferences.preferred_categories.length > 0) score += 25;
      if (preferences.budget_range.min > 0 || preferences.budget_range.max < 10000) score += 20;
      if (preferences.brand_preferences.length > 0) score += 15;
      if (preferences.recent_views.length > 0) score += 15;
      
      return score;
    })(),
    
    // 推荐精度评级
    recommendationAccuracy: (() => {
      if (!preferences) return 'unknown';
      
      const score = preferences.preferred_styles.length * 2 + 
                   preferences.preferred_categories.length * 2 + 
                   (preferences.recent_views.length > 5 ? 3 : 1);
      
      if (score >= 10) return 'high';
      if (score >= 6) return 'medium';
      return 'low';
    })() as 'high' | 'medium' | 'low' | 'unknown'
  };

  return stats;
};