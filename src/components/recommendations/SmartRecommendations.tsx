// 智能推荐总组件
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  Refresh, 
  Settings,
  Filter,
  SortAsc,
  Eye,
  Heart
} from 'lucide-react';
import { RecommendedMaterials } from './RecommendedMaterials';
import { CostEstimationComponent } from './CostEstimation';
import { useCaseRecommendations, usePersonalizedRecommendations, useGeneralRecommendations } from '@/hooks/useRecommendations';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { integrationApiService, CostEstimation } from '@/services/integrationApiService';
import { DesignCase } from '@/services/designCaseService';
import { SupplierProfile } from '@/services/supplierService';
import { ProductRecommendation } from '@/services/recommendationService';
import { toast } from '@/hooks/use-toast';

interface SmartRecommendationsProps {
  designCase?: DesignCase;
  caseId?: number;
  style?: string;
  category?: string;
  userId?: string;
  showCostEstimation?: boolean;
  showPersonalized?: boolean;
  maxRecommendations?: number;
  layout?: 'grid' | 'list';
  onProductSelect?: (product: ProductRecommendation) => void;
  onAddToCart?: (product: ProductRecommendation, quantity?: number) => void;
}

interface RecommendationFilters {
  category?: string;
  priceRange?: { min: number; max: number };
  sortBy?: 'score' | 'price' | 'popularity';
  showOnlyInStock?: boolean;
}

const LoadingSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  designCase,
  caseId,
  style,
  category,
  userId,
  showCostEstimation = true,
  showPersonalized = true,
  maxRecommendations = 20,
  layout = 'grid',
  onProductSelect,
  onAddToCart
}) => {
  const [activeTab, setActiveTab] = useState('case');
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [costEstimation, setCostEstimation] = useState<CostEstimation | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [isLoadingCost, setIsLoadingCost] = useState(false);

  const { preferences, hasPreferences } = useUserPreferences();

  // 案例推荐
  const {
    data: caseRecommendations,
    isLoading: isLoadingCase,
    error: caseError,
    refetch: refetchCase
  } = useCaseRecommendations(
    caseId || 0,
    {
      style,
      category: filters.category,
      budget_range: filters.priceRange,
      limit: maxRecommendations,
      user_id: userId
    },
    { enabled: !!caseId || !!style }
  );

  // 个性化推荐
  const {
    data: personalizedRecommendations,
    isLoading: isLoadingPersonalized,
    error: personalizedError,
    refetch: refetchPersonalized
  } = usePersonalizedRecommendations(
    {
      category: filters.category,
      budget_range: filters.priceRange,
      limit: maxRecommendations
    },
    { enabled: showPersonalized && !!userId && hasPreferences }
  );

  // 通用推荐
  const {
    data: generalRecommendations,
    isLoading: isLoadingGeneral,
    error: generalError,
    refetch: refetchGeneral
  } = useGeneralRecommendations(
    {
      style,
      category: filters.category || category,
      budget_range: filters.priceRange,
      limit: maxRecommendations
    },
    { enabled: !userId || !hasPreferences }
  );

  // 获取成本预估
  useEffect(() => {
    if (caseId && caseRecommendations && showCostEstimation) {
      loadCostEstimation();
    }
  }, [caseId, caseRecommendations, showCostEstimation]);

  const loadCostEstimation = async () => {
    if (!caseId) return;
    
    setIsLoadingCost(true);
    try {
      const estimation = await integrationApiService.getCasesCostEstimation(caseId, 'medium');
      setCostEstimation(estimation);
    } catch (error) {
      console.error('Failed to load cost estimation:', error);
      toast({
        title: "成本预估加载失败",
        description: "无法获取成本预估数据",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCost(false);
    }
  };

  // 获取供应商信息
  useEffect(() => {
    const currentRecommendations = getCurrentRecommendations();
    if (currentRecommendations?.length) {
      loadSuppliers(currentRecommendations);
    }
  }, [caseRecommendations, personalizedRecommendations, generalRecommendations, activeTab]);

  const loadSuppliers = async (recommendations: ProductRecommendation[]) => {
    const supplierIds = new Set<string>();
    recommendations.forEach(rec => {
      if (rec.product_info.supplier_id) {
        supplierIds.add(rec.product_info.supplier_id);
      }
    });

    try {
      const supplierData = await Promise.all(
        Array.from(supplierIds).map(async (id) => {
          try {
            const response = await fetch(`/api/suppliers/${id}`);
            return response.ok ? await response.json() : null;
          } catch {
            return null;
          }
        })
      );
      
      setSuppliers(supplierData.filter(Boolean));
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const getCurrentRecommendations = (): ProductRecommendation[] => {
    switch (activeTab) {
      case 'case':
        return caseRecommendations || [];
      case 'personalized':
        return personalizedRecommendations || [];
      case 'general':
        return generalRecommendations || [];
      default:
        return [];
    }
  };

  const filterAndSortRecommendations = (recommendations: ProductRecommendation[]): ProductRecommendation[] => {
    let filtered = [...recommendations];

    // 价格过滤
    if (filters.priceRange) {
      filtered = filtered.filter(rec => {
        const price = rec.product_info.price;
        return price >= (filters.priceRange!.min || 0) && 
               price <= (filters.priceRange!.max || Infinity);
      });
    }

    // 库存过滤
    if (filters.showOnlyInStock) {
      // TODO: 实现库存状态检查
      filtered = filtered.filter(rec => true); // 暂时保留所有商品
    }

    // 排序
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'score':
            return b.score - a.score;
          case 'price':
            return a.product_info.price - b.product_info.price;
          case 'popularity':
            return b.priority - a.priority;
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case 'case':
        refetchCase();
        break;
      case 'personalized':
        refetchPersonalized();
        break;
      case 'general':
        refetchGeneral();
        break;
    }
    
    if (showCostEstimation && caseId) {
      loadCostEstimation();
    }
    
    toast({
      title: "推荐已刷新",
      description: "获取最新的推荐结果",
    });
  };

  const handleBudgetLevelChange = async (level: 'low' | 'medium' | 'high') => {
    if (!caseId) return;
    
    setIsLoadingCost(true);
    try {
      const estimation = await integrationApiService.getCasesCostEstimation(caseId, level);
      setCostEstimation(estimation);
    } catch (error) {
      console.error('Failed to update cost estimation:', error);
    } finally {
      setIsLoadingCost(false);
    }
  };

  const renderRecommendations = () => {
    const currentRecommendations = getCurrentRecommendations();
    const filteredRecommendations = filterAndSortRecommendations(currentRecommendations);
    
    const isLoading = activeTab === 'case' ? isLoadingCase :
                     activeTab === 'personalized' ? isLoadingPersonalized :
                     isLoadingGeneral;
    
    const error = activeTab === 'case' ? caseError :
                  activeTab === 'personalized' ? personalizedError :
                  generalError;

    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (error) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">推荐加载失败: {error.message}</p>
            <Button onClick={handleRefresh} variant="outline">
              <Refresh className="h-4 w-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (!filteredRecommendations.length) {
      return (
        <Card>
          <CardContent className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无匹配的推荐商品</p>
            <Button onClick={handleRefresh} variant="outline">
              <Refresh className="h-4 w-4 mr-2" />
              刷新推荐
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <RecommendedMaterials
        recommendations={filteredRecommendations}
        suppliers={suppliers}
        onProductSelect={onProductSelect}
        onAddToCart={onAddToCart}
        layout={layout}
        maxItems={maxRecommendations}
      />
    );
  };

  const getTabCounts = () => ({
    case: caseRecommendations?.length || 0,
    personalized: personalizedRecommendations?.length || 0,
    general: generalRecommendations?.length || 0,
  });

  const tabCounts = getTabCounts();

  return (
    <div className="smart-recommendations space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">智能推荐</h2>
          {designCase && (
            <Badge variant="outline">{designCase.style}</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <Refresh className="h-4 w-4 mr-2" />
            刷新
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
        </div>
      </div>

      {/* 推荐标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="case" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            案例推荐
            {tabCounts.case > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tabCounts.case}
              </Badge>
            )}
          </TabsTrigger>
          
          {showPersonalized && hasPreferences && (
            <TabsTrigger value="personalized" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              个人推荐
              {tabCounts.personalized > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tabCounts.personalized}
                </Badge>
              )}
            </TabsTrigger>
          )}
          
          <TabsTrigger value="general" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            热门推荐
            {tabCounts.general > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {tabCounts.general}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 推荐内容 */}
        <div className="mt-6">
          <TabsContent value="case">
            <div className="space-y-6">
              {designCase && (
                <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  基于 <strong>{designCase.title}</strong> 的{designCase.style}风格为您推荐适合的材料
                </div>
              )}
              {renderRecommendations()}
            </div>
          </TabsContent>
          
          <TabsContent value="personalized">
            <div className="space-y-6">
              {preferences && (
                <div className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
                  基于您的偏好风格: {preferences.preferred_styles.join('、')} 为您个性化推荐
                </div>
              )}
              {renderRecommendations()}
            </div>
          </TabsContent>
          
          <TabsContent value="general">
            <div className="space-y-6">
              <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                为您推荐当前热门和高评分的优质商品
              </div>
              {renderRecommendations()}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 成本预估 */}
      {showCostEstimation && designCase && (
        <CostEstimationComponent
          case={designCase}
          costEstimation={costEstimation || undefined}
          recommendations={getCurrentRecommendations()}
          onBudgetLevelChange={handleBudgetLevelChange}
          showDetailedBreakdown={true}
        />
      )}
    </div>
  );
};