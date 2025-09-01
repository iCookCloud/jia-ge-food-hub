import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Plus,
  Minus,
  Loader2,
  ShoppingCart,
  Image as ImageIcon,
  Save,
  X,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ProductSelectorWithQuantity, ProductWithQuantity } from '@/components/product/ProductSelectorWithQuantity';

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
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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

  // 删除关联商品
  const removeProductAssociation = async (product: ProductAssociation) => {
    setDeletingProductId(product.id);
    try {
      const tableName = materialType === 'video' ? 'video_product_associations' : 'image_product_associations';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      // 更新本地状态
      const updatedProducts = products.filter(p => p.id !== product.id);
      onUpdate(updatedProducts);
      
      toast.success('关联商品已删除');
    } catch (error) {
      console.error('删除关联商品失败:', error);
      toast.error('删除失败，请重试');
    } finally {
      setDeletingProductId(null);
    }
  };

  // 添加新的关联商品
  const addProductAssociations = async (newProducts: ProductWithQuantity[]) => {
    if (newProducts.length === 0) return;

    try {
      const tableName = materialType === 'video' ? 'video_product_associations' : 'image_product_associations';
      const materialIdField = materialType === 'video' ? 'video_id' : 'image_id';
      
      // 检查是否已存在关联
      const existingProductIds = products.map(p => p.original_product_id);
      const filteredProducts = newProducts.filter(p => !existingProductIds.includes(p.id));
      
      if (filteredProducts.length === 0) {
        toast.error('所选商品已经关联过了');
        return;
      }

      const associations = [];
      
      for (const product of filteredProducts) {
        associations.push({
          [materialIdField]: materialId,
          original_product_id: product.id,
          product_snapshot: {
            id: product.id,
            sku: product.sku,
            standard_chinese_name: product.name,
            price: product.price,
            main_image_url: product.image,
            specification: product.specifications,
            source: 'local_products',
            snapshot_time: new Date().toISOString()
          },
          product_sku: product.sku,
          product_name: product.name,
          snapshot_source: 'local_products',
          recommended_quantity: product.recommendedQuantity,
          quantity_note: product.quantityNote
        });
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert(associations)
        .select('*');

      if (error) throw error;

      // 转换为 ProductAssociation 格式并更新本地状态
      const newAssociations: ProductAssociation[] = data.map(item => ({
        id: item.id,
        original_product_id: item.original_product_id,
        product_sku: item.product_sku,
        product_name: item.product_name,
        recommended_quantity: item.recommended_quantity,
        quantity_note: item.quantity_note,
        product_snapshot: item.product_snapshot
      }));

      onUpdate([...products, ...newAssociations]);
      toast.success(`已添加 ${filteredProducts.length} 个关联商品`);
    } catch (error) {
      console.error('添加关联商品失败:', error);
      toast.error('添加失败，请重试');
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
          <div className="flex items-center gap-2">
            <ProductSelectorWithQuantity
              selectedProducts={[]}
              onSelectionChange={addProductAssociations}
              maxSelection={999}
              trigger={
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  添加商品
                </Button>
              }
            />
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">该展示案例暂未关联任何商品</p>
              <ProductSelectorWithQuantity
                selectedProducts={[]}
                onSelectionChange={addProductAssociations}
                maxSelection={999}
                trigger={
                  <Button variant="outline" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    添加关联商品
                  </Button>
                }
              />
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
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/20"
                      onClick={() => removeProductAssociation(product)}
                      disabled={deletingProductId === product.id}
                    >
                      {deletingProductId === product.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                    </Button>
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
                        
                        {loadingProductId === product.id ? (
                          <div className="flex items-center justify-center min-w-[40px] h-8 px-2 text-sm font-medium bg-gray-50">
                            <Loader2 className="w-3 h-3 animate-spin" />
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min="1"
                            max="99999"
                            value={product.recommended_quantity || 1}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              updateQuantity(product, Math.max(1, Math.min(99999, value)));
                            }}
                            className="w-20 h-8 text-center text-sm border-0 bg-gray-50"
                          />
                        )}
                        
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