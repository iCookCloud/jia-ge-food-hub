import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Plus,
  Minus,
  Loader2,
  ShoppingCart,
  Image as ImageIcon,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProductAssociation {
  id: string;
  original_product_id: string;
  product_sku: string;
  product_name: string;
  recommended_quantity?: number;
  quantity_note?: string;
  product_snapshot: {
    id: string;
    sku: string;
    price: string;
    specification: string;
    standard_chinese_name: string;
    main_image_url?: string;
  };
}

interface ProductRecommendationListProps {
  materialId: string;
  materialType: 'video' | 'image';
  products: ProductAssociation[];
  onUpdate: (updatedProducts: ProductAssociation[]) => void;
}

export const ProductRecommendationList: React.FC<ProductRecommendationListProps> = ({
  materialId,
  materialType,
  products,
  onUpdate
}) => {
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 更新推荐数量（仅更新本地状态，不保存到数据库）
  const updateQuantity = (product: ProductAssociation, newQuantity: number) => {
    if (newQuantity < 1) {
      toast.error('推荐数量不能少于1');
      return;
    }

    // 只更新本地状态
    const updatedProducts = products.map(p => 
      p.id === product.id 
        ? { ...p, recommended_quantity: newQuantity }
        : p
    );
    
    onUpdate(updatedProducts);
  };

  // 增加数量
  const increaseQuantity = (product: ProductAssociation) => {
    const currentQuantity = product.recommended_quantity || 1;
    updateQuantity(product, currentQuantity + 1);
  };

  // 减少数量
  const decreaseQuantity = (product: ProductAssociation) => {
    const currentQuantity = product.recommended_quantity || 1;
    if (currentQuantity > 1) {
      updateQuantity(product, currentQuantity - 1);
    }
  };

  // 保存所有推荐数量更改到数据库
  const saveAllChanges = async () => {
    setSaving(true);
    try {
      const tableName = materialType === 'video' ? 'video_product_associations' : 'image_product_associations';
      
      // 批量更新所有商品的推荐数量
      const updatePromises = products.map(product => 
        supabase
          .from(tableName)
          .update({
            recommended_quantity: product.recommended_quantity || 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
      );

      const results = await Promise.all(updatePromises);
      
      // 检查是否有错误
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error('部分更新失败');
      }

      toast.success('所有推荐数量已保存');
    } catch (error) {
      console.error('保存推荐数量失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: string) => {
    return `¥${parseInt(price).toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            关联商品推荐数量设置
            <Badge variant="secondary">{products.length} 个商品</Badge>
          </CardTitle>
          {products.length > 0 && (
            <Button
              onClick={saveAllChanges}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? '保存中...' : '保存更改'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>该展示案例暂未关联任何商品</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* 商品图片 */}
                <div className="flex-shrink-0">
                  {product.product_snapshot.main_image_url ? (
                    <img
                      src={product.product_snapshot.main_image_url}
                      alt={product.product_name}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 商品信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{product.product_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.product_sku}
                        </Badge>
                        <span className="text-sm font-medium text-green-600">
                          {formatPrice(product.product_snapshot.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {product.product_snapshot.specification && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {product.product_snapshot.specification}
                    </p>
                  )}

                  {/* 推荐数量设置 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3 text-blue-600" />
                        <span className="text-sm font-medium">推荐数量:</span>
                      </div>
                      {product.quantity_note && (
                        <span className="text-xs text-muted-foreground">
                          ({product.quantity_note})
                        </span>
                      )}
                    </div>
                    
                    {/* 数量控制器 */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-lg">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => decreaseQuantity(product)}
                          disabled={loadingProductId === product.id || (product.recommended_quantity || 1) <= 1}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <div className="flex items-center justify-center min-w-[40px] h-8 px-2 text-sm font-medium bg-gray-50">
                          {loadingProductId === product.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            product.recommended_quantity || 1
                          )}
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => increaseQuantity(product)}
                          disabled={loadingProductId === product.id}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {products.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 space-y-1">
              <p className="font-medium">💡 推荐数量设置说明：</p>
              <p>• 为每个关联商品设置合理的推荐购买数量</p>
              <p>• 客户查看该展示案例时，会看到每个商品的推荐数量</p>
              <p>• 可以添加数量说明来解释推荐理由（如：整套装修需要、单个房间用量等）</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductRecommendationList;