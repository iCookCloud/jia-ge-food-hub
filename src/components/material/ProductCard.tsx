import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink,
  ShoppingCart,
  Heart,
  Star,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Loader2
} from 'lucide-react';

// 产品关联数据类型
interface ProductAssociation {
  id: string;
  product_id?: string;
  original_product_id: string;
  product_sku: string;
  product_name: string;
  recommended_quantity?: number;
  quantity_note?: string;
  product_snapshot: {
    id?: string;
    sku?: string;
    standard_chinese_name?: string;
    standard_english_name?: string;
    price?: number;
    main_image_url?: string;
    specification?: string;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    rating?: number;
    review_count?: number;
    promotional_tags?: string[];
    source?: string;
    snapshot_time?: string;
  };
}

interface ProductCardProps {
  association: ProductAssociation;
  onProductClick?: (association: ProductAssociation) => void;
  onAddToCart?: (association: ProductAssociation, quantity: number) => void;
  onToggleFavorite?: (association: ProductAssociation) => void;
  onUpdateQuantity?: (association: ProductAssociation, newQuantity: number) => void;
  loading?: boolean;
  isFavorite?: boolean;
  showQuantityControls?: boolean;
  isAdminMode?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  association,
  onProductClick,
  onAddToCart,
  onToggleFavorite,
  onUpdateQuantity,
  loading = false,
  isFavorite = false,
  showQuantityControls = false,
  isAdminMode = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const product = association.product_snapshot;
  const productName = association.product_name || product?.standard_chinese_name || product?.standard_english_name || '未知商品';
  const productPrice = typeof product?.price === 'number' ? product.price : (typeof product?.price === 'string' ? parseFloat(product.price) || 0 : 0);
  const productImage = product?.main_image_url;
  const productSpec = product?.specification;
  const stockStatus = product?.stock_status || 'in_stock';
  const rating = typeof product?.rating === 'number' ? product.rating : (typeof product?.rating === 'string' ? parseFloat(product.rating) || 0 : 0);
  const reviewCount = typeof product?.review_count === 'number' ? product.review_count : (typeof product?.review_count === 'string' ? parseInt(product.review_count) || 0 : 0);
  const promotionalTags = product?.promotional_tags || [];

  // 获取库存状态显示
  const getStockStatusInfo = () => {
    switch (stockStatus) {
      case 'in_stock':
        return {
          icon: CheckCircle,
          text: '有库存',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'low_stock':
        return {
          icon: AlertTriangle,
          text: '库存紧张',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50'
        };
      case 'out_of_stock':
        return {
          icon: XCircle,
          text: '缺货',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: Minus,
          text: '未知',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const stockInfo = getStockStatusInfo();

  // 处理商品点击
  const handleProductClick = () => {
    if (loading) return;
    onProductClick?.(association);
  };

  // 处理添加购物车
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片的查看详情
    if (loading || stockStatus === 'out_of_stock') {
      toast({
        title: "无法添加",
        description: stockStatus === 'out_of_stock' ? "商品暂时缺货" : "请稍候再试",
        variant: "destructive"
      });
      return;
    }
    // 使用当前显示的数量
    const quantity = association.recommended_quantity || 1;
    onAddToCart?.(association, quantity);
  };

  // 处理收藏切换
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片的查看详情
    onToggleFavorite?.(association);
  };

  // 处理数量增加
  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentQuantity = association.recommended_quantity || 1;
    onUpdateQuantity?.(association, currentQuantity + 1);
  };

  // 处理数量减少
  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentQuantity = association.recommended_quantity || 1;
    if (currentQuantity > 1) {
      onUpdateQuantity?.(association, currentQuantity - 1);
    }
  };

  // 渲染星级评分
  const renderRating = () => {
    if (!rating || rating === 0) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star}
            className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {Number(rating).toFixed(1)}
          {reviewCount > 0 && ` (${reviewCount})`}
        </span>
      </div>
    );
  };

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-300 cursor-pointer ${
        loading ? 'opacity-60 cursor-wait' : 'hover:-translate-y-1'
      } ${className}`}
      onClick={handleProductClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col p-4">
          {/* 商品图片 */}
          <div className="relative flex-shrink-0 mb-3">
            <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
              {productImage && !imageError ? (
                <img
                  src={productImage}
                  alt={productName}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* 收藏按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-1 -right-1 w-7 h-7 p-0 bg-white/90 hover:bg-white shadow-sm"
              onClick={handleToggleFavorite}
            >
              <Heart className={`w-3 h-3 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </Button>
          </div>

          {/* 商品信息 */}
          <div className="flex-1 min-w-0 space-y-2 text-center">
            {/* 商品名称和促销标签 */}
            <div className="space-y-1">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors text-center">
                {productName}
              </h4>
              
              {/* 促销标签 */}
              {promotionalTags.length > 0 && (
                <div className="flex gap-1 flex-wrap justify-center">
                  {promotionalTags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 价格和规格 */}
            <div className="space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-lg font-bold text-primary">
                  ¥{productPrice.toFixed(2)}
                </span>
                {/* 这里可以添加原价对比 */}
              </div>
              
              {productSpec && (
                <p className="text-xs text-muted-foreground line-clamp-1 text-center">
                  {productSpec}
                </p>
              )}
            </div>

            {/* 数量控制 */}
            {showQuantityControls && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isAdminMode ? '推荐数量:' : '购买数量:'}
                </span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDecreaseQuantity}
                    disabled={loading || (association.recommended_quantity || 1) <= 1}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  
                  <div className="flex items-center justify-center min-w-[30px] h-6 px-2 text-xs font-medium bg-gray-50">
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      association.recommended_quantity || 1
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleIncreaseQuantity}
                    disabled={loading}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* 评分 */}
            <div className="flex items-center justify-center">
              {renderRating()}
            </div>

            {/* SKU信息 */}
            {association.product_sku && (
              <p className="text-xs text-muted-foreground text-center">
                SKU: {association.product_sku}
              </p>
            )}
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="px-4 pb-4 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs border-gray-300 hover:bg-gray-50"
            onClick={handleAddToCart}
            disabled={loading || stockStatus === 'out_of_stock'}
          >
            <Package className="w-3 h-3 mr-1" />
            {stockStatus === 'out_of_stock' ? '缺货' : '加入货单'}
          </Button>
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 商品列表容器组件
interface ProductListProps {
  associations: ProductAssociation[];
  onProductClick?: (association: ProductAssociation) => void;
  onAddToCart?: (association: ProductAssociation, quantity: number) => void;
  onAddAllToCart?: (associations: ProductAssociation[]) => void;
  onUpdateQuantity?: (association: ProductAssociation, newQuantity: number) => void;
  loadingProductId?: string | null;
  showQuantityControls?: boolean;
  isAdminMode?: boolean;
  className?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  associations,
  onProductClick,
  onAddToCart,
  onAddAllToCart,
  onUpdateQuantity,
  loadingProductId,
  showQuantityControls = false,
  isAdminMode = false,
  className = ""
}) => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // 管理每个商品的当前数量状态（非管理模式下使用）
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>(() => {
    const initialQuantities: Record<string, number> = {};
    associations.forEach(association => {
      initialQuantities[association.id] = association.recommended_quantity || 1;
    });
    return initialQuantities;
  });

  const handleToggleFavorite = (association: ProductAssociation) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(association.id)) {
        newFavorites.delete(association.id);
      } else {
        newFavorites.add(association.id);
      }
      return newFavorites;
    });
  };

  // 处理商品数量变化
  const handleQuantityChange = (association: ProductAssociation, newQuantity: number) => {
    if (!isAdminMode) {
      // 非管理模式：更新本地数量状态
      setProductQuantities(prev => ({
        ...prev,
        [association.id]: newQuantity
      }));
    }
    // 管理模式：调用原有的更新函数
    if (isAdminMode && onUpdateQuantity) {
      onUpdateQuantity(association, newQuantity);
    }
  };

  // 一键加入所有货品到货单
  const handleAddAllToOrderList = () => {
    if (associations.length === 0) return;
    
    // 逐个添加，使用当前的数量设置
    associations.forEach(association => {
      const currentQuantity = isAdminMode 
        ? (association.recommended_quantity || 1)
        : (productQuantities[association.id] || 1);
      onAddToCart?.(association, currentQuantity);
    });
  };

  if (associations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无关联商品</p>
      </div>
    );
  }

  // 计算总的当前数量
  const getTotalCurrentQuantity = () => {
    return associations.reduce((total, association) => {
      if (isAdminMode) {
        return total + (association.recommended_quantity || 1);
      } else {
        return total + (productQuantities[association.id] || 1);
      }
    }, 0);
  };

  const totalQuantity = getTotalCurrentQuantity();

  return (
    <div className={className}>
      {/* 一键加入所有货品按钮 */}
      {associations.length > 1 && (
        <div className="mb-4 flex justify-center">
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2 px-6"
            onClick={handleAddAllToOrderList}
          >
            <Package className="w-4 h-4" />
            一键加入所有货品到货单 ({associations.length}种商品，共{totalQuantity}件)
          </Button>
        </div>
      )}
      
      {/* 商品网格 */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
        {associations.map((association) => (
          <ProductCard
            key={association.id}
            association={{
              ...association,
              // 在非管理模式下，使用本地数量状态覆盖推荐数量用于显示
              ...(isAdminMode ? {} : { recommended_quantity: productQuantities[association.id] || 1 })
            }}
            onProductClick={onProductClick}
            onAddToCart={onAddToCart}
            onToggleFavorite={handleToggleFavorite}
            onUpdateQuantity={handleQuantityChange}
            loading={loadingProductId === association.id}
            isFavorite={favorites.has(association.id)}
            showQuantityControls={showQuantityControls}
            isAdminMode={isAdminMode}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCard;