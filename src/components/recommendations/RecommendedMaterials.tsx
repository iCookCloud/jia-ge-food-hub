// 推荐材料组件
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Phone, Heart, Eye, Package } from 'lucide-react';
import { ProductRecommendation } from '@/services/recommendationService';
import { SupplierProfile } from '@/services/supplierService';
import { useSmartRecommendations } from '@/hooks/useRecommendations';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { toast } from '@/hooks/use-toast';

interface RecommendedMaterialsProps {
  recommendations: ProductRecommendation[];
  suppliers: SupplierProfile[];
  onProductSelect?: (product: ProductRecommendation) => void;
  onAddToCart?: (product: ProductRecommendation, quantity?: number) => void;
  onContactSupplier?: (supplierId: string) => void;
  showBulkActions?: boolean;
  maxItems?: number;
  layout?: 'grid' | 'list';
}

interface MaterialCardProps {
  recommendation: ProductRecommendation;
  supplier?: SupplierProfile;
  onSelect?: () => void;
  onAddToCart?: (quantity?: number) => void;
  onContactSupplier?: () => void;
  onLike?: () => void;
  layout?: 'grid' | 'list';
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  recommendation,
  supplier,
  onSelect,
  onAddToCart,
  onContactSupplier,
  onLike,
  layout = 'grid'
}) => {
  const [quantity, setQuantity] = useState(recommendation.quantity_suggestion || 1);
  const [isLiked, setIsLiked] = useState(false);
  const { recordFeedback } = useSmartRecommendations();
  const { recordProductView } = useUserPreferences();

  const handleView = () => {
    recordProductView(recommendation.product_id);
    recordFeedback(
      `rec_${recommendation.product_id}_${Date.now()}`,
      recommendation.product_id,
      'view'
    );
    onSelect?.();
  };

  const handleAddToCart = () => {
    recordFeedback(
      `rec_${recommendation.product_id}_${Date.now()}`,
      recommendation.product_id,
      'add_to_cart'
    );
    onAddToCart?.(quantity);
    toast({
      title: "已添加到购物车",
      description: `${recommendation.product_info.standard_chinese_name} x${quantity}`,
    });
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    
    recordFeedback(
      `rec_${recommendation.product_id}_${Date.now()}`,
      recommendation.product_id,
      newLikedState ? 'like' : 'dislike'
    );
    
    onLike?.();
    
    toast({
      title: newLikedState ? "已添加到收藏" : "已取消收藏",
      description: recommendation.product_info.standard_chinese_name,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const cardClassName = layout === 'list' 
    ? "flex flex-row items-center space-x-4 p-4" 
    : "flex flex-col h-full";

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${cardClassName}`}>
      {/* 商品图片 */}
      <div className={layout === 'list' ? "w-24 h-24 flex-shrink-0" : "w-full h-48"}>
        <img
          src={recommendation.product_info.main_image_url || '/placeholder-product.jpg'}
          alt={recommendation.product_info.standard_chinese_name}
          className="w-full h-full object-cover rounded-md cursor-pointer"
          onClick={handleView}
        />
      </div>

      <div className={layout === 'list' ? "flex-1" : "flex-1 p-4"}>
        <CardHeader className={layout === 'list' ? "p-0 pb-2" : undefined}>
          <CardTitle 
            className="text-lg font-medium cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleView}
          >
            {recommendation.product_info.standard_chinese_name}
          </CardTitle>
          
          {/* 推荐原因标签 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {recommendation.reasons.slice(0, 2).map((reason, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {reason}
              </Badge>
            ))}
            <Badge variant="outline" className="text-xs">
              评分: {recommendation.score.toFixed(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className={layout === 'list' ? "p-0" : "pt-0"}>
          {/* 价格和类别 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-red-600">
                {formatPrice(recommendation.product_info.price)}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {recommendation.category}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-red-500" : "text-gray-400"}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* 用途说明 */}
          {recommendation.usage_description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {recommendation.usage_description}
            </p>
          )}

          {/* 供应商信息 */}
          {supplier && (
            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
              <span>供应商: {supplier.name}</span>
              {supplier.rating_info && (
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="ml-1">{supplier.rating_info.overall_rating}</span>
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className={`flex gap-2 ${layout === 'list' ? 'flex-col' : ''}`}>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 border rounded text-center text-sm"
              />
              <Button 
                onClick={handleAddToCart}
                size="sm"
                className="flex-1"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                加入购物车
              </Button>
            </div>
            
            {supplier && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContactSupplier?.()}
              >
                <Phone className="h-4 w-4 mr-1" />
                联系
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleView}
            >
              <Eye className="h-4 w-4 mr-1" />
              详情
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export const RecommendedMaterials: React.FC<RecommendedMaterialsProps> = ({
  recommendations,
  suppliers,
  onProductSelect,
  onAddToCart,
  onContactSupplier,
  showBulkActions = true,
  maxItems,
  layout = 'grid'
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { recordFeedback } = useSmartRecommendations();

  const displayRecommendations = maxItems 
    ? recommendations.slice(0, maxItems)
    : recommendations;

  const handleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
  };

  const handleAddAllToCart = () => {
    const itemsToAdd = selectedItems.size > 0 
      ? displayRecommendations.filter(rec => selectedItems.has(rec.product_id))
      : displayRecommendations;

    itemsToAdd.forEach(rec => {
      onAddToCart?.(rec, rec.quantity_suggestion);
      recordFeedback(
        `rec_${rec.product_id}_${Date.now()}`,
        rec.product_id,
        'add_to_cart'
      );
    });

    toast({
      title: "批量添加成功",
      description: `已添加 ${itemsToAdd.length} 个商品到购物车`,
    });

    setSelectedItems(new Set());
  };

  const handleGetQuote = () => {
    const itemsForQuote = selectedItems.size > 0 
      ? displayRecommendations.filter(rec => selectedItems.has(rec.product_id))
      : displayRecommendations;

    // TODO: 实现报价请求功能
    toast({
      title: "报价请求已发送",
      description: `为 ${itemsForQuote.length} 个商品请求报价`,
    });
  };

  if (!displayRecommendations.length) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">暂无推荐商品</p>
      </div>
    );
  }

  return (
    <section className="recommended-materials">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">推荐材料</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>共 {recommendations.length} 个推荐</span>
          {maxItems && recommendations.length > maxItems && (
            <span>，显示前 {maxItems} 个</span>
          )}
        </div>
      </div>

      {/* 批量选择提示 */}
      {showBulkActions && selectedItems.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            已选择 {selectedItems.size} 个商品
          </p>
        </div>
      )}

      {/* 商品网格/列表 */}
      <div className={
        layout === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-4"
      }>
        {displayRecommendations.map(recommendation => {
          const supplier = suppliers.find(s => s.id === recommendation.product_info.supplier_id);
          const isSelected = selectedItems.has(recommendation.product_id);

          return (
            <div 
              key={recommendation.product_id}
              className={`relative ${isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
            >
              {/* 选择框 */}
              {showBulkActions && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectItem(recommendation.product_id)}
                  className="absolute top-2 left-2 z-10"
                />
              )}

              <MaterialCard
                recommendation={recommendation}
                supplier={supplier}
                onSelect={() => onProductSelect?.(recommendation)}
                onAddToCart={(quantity) => onAddToCart?.(recommendation, quantity)}
                onContactSupplier={() => supplier && onContactSupplier?.(supplier.id)}
                layout={layout}
              />
            </div>
          );
        })}
      </div>

      {/* 批量操作按钮 */}
      {showBulkActions && (
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button 
            onClick={handleAddAllToCart}
            disabled={displayRecommendations.length === 0}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {selectedItems.size > 0 ? `添加选中商品 (${selectedItems.size})` : '一键添加全部'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleGetQuote}
            disabled={displayRecommendations.length === 0}
            className="flex-1"
          >
            <Package className="h-4 w-4 mr-2" />
            获取整体报价
          </Button>
        </div>
      )}
    </section>
  );
};