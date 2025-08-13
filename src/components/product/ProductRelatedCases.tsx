// 商品关联案例展示组件
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  Heart, 
  ExternalLink, 
  Palette, 
  Home,
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { designCaseService, DesignCase } from '@/services/designCaseService';
import { toast } from '@/hooks/use-toast';

interface ProductRelatedCasesProps {
  productId: string;
  productCategory?: string;
  maxCases?: number;
  showTitle?: boolean;
  layout?: 'grid' | 'list';
}

interface CaseCardProps {
  case: DesignCase;
  layout?: 'grid' | 'list';
  productUsage?: string;
  onView?: () => void;
}

const CaseCard: React.FC<CaseCardProps> = ({ 
  case: designCase, 
  layout = 'grid',
  productUsage,
  onView 
}) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "已取消收藏" : "已添加到收藏",
      description: designCase.title,
    });
  };

  const handleView = () => {
    onView?.();
  };

  if (layout === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <div className="flex p-4 gap-4">
          {/* 案例图片 */}
          <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {designCase.main_image_url ? (
              <img
                src={designCase.main_image_url}
                alt={designCase.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* 案例信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <Link to={`/cases/${designCase.id}`} className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1 hover:text-primary transition-colors">
                  {designCase.title}
                </h4>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`ml-2 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {designCase.style}
              </Badge>
              {designCase.area && (
                <span className="text-xs text-muted-foreground">
                  {designCase.area}m²
                </span>
              )}
            </div>

            {productUsage && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                用途: {productUsage}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {designCase.view_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {designCase.like_count || 0}
                </span>
              </div>
              <Link to={`/cases/${designCase.id}`}>
                <Button variant="ghost" size="sm" onClick={handleView}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  查看详情
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Grid 布局
  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className="relative">
        {/* 案例图片 */}
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          {designCase.main_image_url ? (
            <img
              src={designCase.main_image_url}
              alt={designCase.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 收藏按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`absolute top-2 right-2 bg-white/80 backdrop-blur-sm ${
            isLiked ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 案例标题 */}
          <Link to={`/cases/${designCase.id}`}>
            <h4 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
              {designCase.title}
            </h4>
          </Link>

          {/* 风格和面积 */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              {designCase.style}
            </Badge>
            {designCase.area && (
              <span className="text-xs text-muted-foreground flex items-center">
                <Home className="h-3 w-3 mr-1" />
                {designCase.area}m²
              </span>
            )}
          </div>

          {/* 商品用途 */}
          {productUsage && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              用途: {productUsage}
            </p>
          )}

          {/* 统计信息 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {designCase.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {designCase.like_count || 0}
              </span>
            </div>
            <Link to={`/cases/${designCase.id}`}>
              <Button variant="ghost" size="sm" onClick={handleView}>
                查看详情
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton: React.FC<{ layout: 'grid' | 'list' }> = ({ layout }) => {
  if (layout === 'list') {
    return (
      <Card>
        <div className="flex p-4 gap-4">
          <Skeleton className="w-24 h-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductRelatedCases: React.FC<ProductRelatedCasesProps> = ({
  productId,
  productCategory,
  maxCases = 6,
  showTitle = true,
  layout = 'grid'
}) => {
  const [cases, setCases] = useState<DesignCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 延迟加载，避免影响主要内容的加载
    const timer = setTimeout(() => {
      loadRelatedCases();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [productId, productCategory]);

  const loadRelatedCases = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      // 根据商品类别查找相关案例
      // 这里简化处理，实际应该通过 integrationApiService 查找真正关联的案例
      const { data: relatedCases } = await designCaseService.fetchCases(
        {
          category: productCategory,
          // 可以添加更多筛选条件
        },
        maxCases
      );

      setCases(relatedCases);
    } catch (err) {
      console.error('Failed to load related cases:', err);
      setError('加载相关案例失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCaseView = (caseId: number) => {
    // 记录用户查看行为，用于推荐算法优化
    console.log('User viewed case:', caseId, 'from product:', productId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">应用案例</h3>
            <Skeleton className="h-6 w-16" />
          </div>
        )}
        
        <div className={
          layout === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }>
          {Array.from({ length: Math.min(maxCases, 6) }).map((_, index) => (
            <LoadingSkeleton key={index} layout={layout} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadRelatedCases}
          className="mt-2"
        >
          重新加载
        </Button>
      </Card>
    );
  }

  if (cases.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="space-y-2">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">暂无相关设计案例</p>
          <p className="text-sm text-muted-foreground">
            该商品还未在任何案例中使用
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            应用案例
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>共 {cases.length} 个案例</span>
            {cases.length >= maxCases && (
              <Link to={`/cases?product=${productId}`}>
                <Button variant="ghost" size="sm">
                  查看更多
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
      
      <div className={
        layout === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
      }>
        {cases.map(designCase => (
          <CaseCard
            key={designCase.id}
            case={designCase}
            layout={layout}
            productUsage={`在${designCase.style}风格设计中使用`}
            onView={() => handleCaseView(designCase.id)}
          />
        ))}
      </div>

      {cases.length > 0 && (
        <div className="text-center pt-4">
          <Link to={`/cases?product=${productId}`}>
            <Button variant="outline">
              查看该商品的所有应用案例
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProductRelatedCases;