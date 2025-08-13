// 成本预估组件
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  PieChart, 
  Download,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { CostEstimation, CostBreakdown, CostItem } from '@/services/integrationApiService';
import { DesignCase } from '@/services/designCaseService';
import { ProductRecommendation } from '@/services/recommendationService';

interface CostEstimationProps {
  case?: DesignCase;
  costEstimation?: CostEstimation;
  recommendations?: ProductRecommendation[];
  onBudgetLevelChange?: (level: 'low' | 'medium' | 'high') => void;
  onExportReport?: () => void;
  showDetailedBreakdown?: boolean;
}

interface CostBreakdownCardProps {
  breakdown: CostBreakdown;
  totalCost: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface BudgetComparisonProps {
  estimatedCost: { min: number; max: number };
  caseBudget?: { min?: number; max?: number };
}

const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({
  breakdown,
  totalCost,
  isExpanded = false,
  onToggleExpand
}) => {
  const percentage = totalCost > 0 ? (breakdown.subtotal_max / totalCost) * 100 : 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="mb-3">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{breakdown.category}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {breakdown.items.length} 个商品
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {formatCurrency(breakdown.subtotal_min)} - {formatCurrency(breakdown.subtotal_max)}
            </div>
            <div className="text-sm text-gray-500">
              占比 {percentage.toFixed(1)}%
            </div>
          </div>
        </div>
        
        <Progress value={percentage} className="mt-2" />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {breakdown.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-500">
                    数量: {item.quantity} • 
                    单价: {formatCurrency(item.unit_price_min)} - {formatCurrency(item.unit_price_max)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(item.total_min)} - {formatCurrency(item.total_max)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const BudgetComparison: React.FC<BudgetComparisonProps> = ({
  estimatedCost,
  caseBudget
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!caseBudget?.min && !caseBudget?.max) {
    return null;
  }

  const budgetMin = caseBudget.min || 0;
  const budgetMax = caseBudget.max || Infinity;
  const estimatedMin = estimatedCost.min;
  const estimatedMax = estimatedCost.max;

  const isWithinBudget = estimatedMax <= budgetMax && estimatedMin >= budgetMin * 0.8;
  const isOverBudget = estimatedMin > budgetMax;
  const isUnderBudget = estimatedMax < budgetMin * 0.8;

  let status: 'within' | 'over' | 'under' = 'within';
  let statusColor = 'text-green-600';
  let statusIcon = <CheckCircle className="h-5 w-5" />;
  let statusText = '预算范围内';

  if (isOverBudget) {
    status = 'over';
    statusColor = 'text-red-600';
    statusIcon = <AlertCircle className="h-5 w-5" />;
    statusText = '超出预算';
  } else if (isUnderBudget) {
    status = 'under';
    statusColor = 'text-blue-600';
    statusIcon = <Info className="h-5 w-5" />;
    statusText = '低于预期';
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          预算对比分析
          <div className={`flex items-center gap-1 ${statusColor}`}>
            {statusIcon}
            <span className="text-sm font-normal">{statusText}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>预期预算:</span>
            <span className="font-semibold">
              {formatCurrency(budgetMin)} - {formatCurrency(budgetMax)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>估算成本:</span>
            <span className={`font-semibold ${statusColor}`}>
              {formatCurrency(estimatedMin)} - {formatCurrency(estimatedMax)}
            </span>
          </div>

          {status === 'over' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">
                当前选择的材料超出预算约 {formatCurrency(estimatedMin - budgetMax)}，
                建议选择更经济的替代方案或调整需求。
              </p>
            </div>
          )}

          {status === 'under' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                当前预算还有剩余约 {formatCurrency(budgetMin - estimatedMax)}，
                可以考虑升级部分材料或增加功能。
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const CostEstimationComponent: React.FC<CostEstimationProps> = ({
  case: designCase,
  costEstimation,
  recommendations = [],
  onBudgetLevelChange,
  onExportReport,
  showDetailedBreakdown = true
}) => {
  const [selectedBudgetLevel, setSelectedBudgetLevel] = useState<'low' | 'medium' | 'high'>(
    costEstimation?.budget_level || 'medium'
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleBudgetLevelChange = (level: 'low' | 'medium' | 'high') => {
    setSelectedBudgetLevel(level);
    onBudgetLevelChange?.(level);
  };

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const stats = useMemo(() => {
    if (!costEstimation) return null;

    const avgCost = (costEstimation.total_min + costEstimation.total_max) / 2;
    const categoryCount = costEstimation.breakdown.length;
    const itemCount = costEstimation.breakdown.reduce((sum, b) => sum + b.items.length, 0);
    
    return {
      avgCost,
      categoryCount,
      itemCount,
      priceRange: costEstimation.total_max - costEstimation.total_min,
      priceRangePercentage: costEstimation.total_min > 0 
        ? ((costEstimation.total_max - costEstimation.total_min) / costEstimation.total_min) * 100
        : 0
    };
  }, [costEstimation]);

  if (!costEstimation) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无成本预估数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="cost-estimation space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          成本预估
        </h3>
        {onExportReport && (
          <Button variant="outline" onClick={onExportReport}>
            <Download className="h-4 w-4 mr-2" />
            导出报告
          </Button>
        )}
      </div>

      {/* 总览卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>总体预估</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(costEstimation.total_min)}
              </div>
              <p className="text-sm text-gray-500">最低预估</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.avgCost || 0)}
              </div>
              <p className="text-sm text-gray-500">平均预估</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(costEstimation.total_max)}
              </div>
              <p className="text-sm text-gray-500">最高预估</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span>商品类别:</span>
              <span className="font-medium">{stats?.categoryCount} 个</span>
            </div>
            <div className="flex items-center justify-between">
              <span>商品总数:</span>
              <span className="font-medium">{stats?.itemCount} 个</span>
            </div>
            <div className="flex items-center justify-between">
              <span>价格波动:</span>
              <span className="font-medium">±{stats?.priceRangePercentage.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预算对比 */}
      {designCase && (
        <BudgetComparison
          estimatedCost={{
            min: costEstimation.total_min,
            max: costEstimation.total_max
          }}
          caseBudget={{
            min: designCase.estimated_budget_min,
            max: designCase.estimated_budget_max
          }}
        />
      )}

      {/* 预算等级切换 */}
      <Card>
        <CardHeader>
          <CardTitle>预算等级调整</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedBudgetLevel} onValueChange={handleBudgetLevelChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="low" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                经济型
              </TabsTrigger>
              <TabsTrigger value="medium" className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-current" />
                标准型
              </TabsTrigger>
              <TabsTrigger value="high" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                高端型
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 text-sm text-gray-600">
              <TabsContent value="low">
                选择性价比高的基础材料，满足基本功能需求，预算控制在最低范围。
              </TabsContent>
              <TabsContent value="medium">
                平衡质量与价格，选择品质可靠的中档材料，适合大多数项目需求。
              </TabsContent>
              <TabsContent value="high">
                追求高品质和设计感，选择premium材料，打造精品项目。
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 详细分解 */}
      {showDetailedBreakdown && (
        <div>
          <h4 className="text-lg font-semibold mb-4">成本分解</h4>
          <div className="space-y-3">
            {costEstimation.breakdown.map((breakdown, index) => (
              <CostBreakdownCard
                key={index}
                breakdown={breakdown}
                totalCost={costEstimation.total_max}
                isExpanded={expandedCategories.has(breakdown.category)}
                onToggleExpand={() => toggleCategoryExpansion(breakdown.category)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 成本优化建议 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            优化建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {stats?.priceRangePercentage && stats.priceRangePercentage > 30 && (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <p>价格波动较大，建议进一步确认具体规格和数量以获得更精准的报价。</p>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <p>可以通过批量采购、选择本地供应商或调整材料规格来降低成本。</p>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <p>建议与多个供应商比价，通常可以节省 10-20% 的成本。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};