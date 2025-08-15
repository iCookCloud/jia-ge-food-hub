import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CategorySelector, CategoryTag } from '@/components/category/CategorySelector';
import { SimpleCategorySelector } from '@/components/category/SimpleCategorySelector';
import { useProductCategories, useBatchOperateProductCategories, useCategories } from '@/hooks/useCategories';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { categoryService } from '@/services/categoryService';
import { 
  Search, 
  Package,
  Edit,
  Power,
  PowerOff,
  Save,
  X,
  Loader2,
  DollarSign,
  Tags
} from 'lucide-react';

// 产品数据类型
interface ProductData {
  id: string;
  sku: string;
  standard_chinese_name: string;
  standard_english_name?: string | null;
  unit_price?: string | null;
  category_chinese?: string | null;
  specifications?: string | null;
  product_image?: string | null;
  is_active: boolean | null;
}

// 编辑状态类型
interface EditingState {
  productId: string;
  price: string;
  categoryIds: number[];
}

const ProductManagementPage: React.FC = () => {
  const { toast } = useToast();
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<EditingState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchAction, setBatchAction] = useState<'activate' | 'deactivate' | 'category' | null>(null);
  const [batchCategoryIds, setBatchCategoryIds] = useState<number[]>([]);
  
  // 防抖搜索
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // 获取分类列表
  const { data: categories = [] } = useCategories();
  
  // 查询参数
  const queryParams = useMemo(() => ({
    search: debouncedSearch,
    limit: 20
  }), [debouncedSearch]);
  
  // 获取产品数据
  const {
    data: productsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteProducts(queryParams);
  
  // 展平产品数据
  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.pages.flatMap(page => page.data || []);
  }, [productsData]);
  
  // 批量操作mutations
  const batchOperateCategories = useBatchOperateProductCategories();
  
  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };
  
  // 单个产品选择
  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };
  
  // 开始编辑产品
  const handleEditProduct = async (product: ProductData) => {
    // 获取产品当前的分类
    const productCategories = await categoryService.getProductCategories(product.id);
    
    setEditingProduct({
      productId: product.id,
      price: product.unit_price || '0',
      categoryIds: productCategories.map(cat => cat.id)
    });
  };
  
  // 取消编辑
  const handleCancelEdit = () => {
    setEditingProduct(null);
  };
  
  // 保存产品编辑
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    
    setIsProcessing(true);
    try {
      // 更新产品价格
      const { error } = await supabase
        .from('products')
        .update({
          unit_price: editingProduct.price,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.productId);
      
      if (error) throw error;
      
      // 更新产品分类
      if (editingProduct.categoryIds.length > 0) {
        await categoryService.assignProductToCategories(
          editingProduct.productId, 
          editingProduct.categoryIds
        );
      }
      
      toast({
        title: "保存成功",
        description: "产品信息已更新"
      });
      
      setEditingProduct(null);
      refetch();
    } catch (error) {
      console.error('保存产品失败:', error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 切换单个产品状态
  const handleToggleProductStatus = async (productId: string, isActive: boolean) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
      
      if (error) throw error;
      
      toast({
        title: "状态更新成功",
        description: `产品已${!isActive ? '上架' : '下架'}`
      });
      
      refetch();
    } catch (error) {
      console.error('更新产品状态失败:', error);
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 批量更新产品状态
  const handleBatchStatusUpdate = async () => {
    if (selectedProducts.size === 0 || !batchAction) return;
    
    setIsProcessing(true);
    try {
      if (batchAction === 'category') {
        // 批量修改分类
        if (batchCategoryIds.length === 0) {
          toast({
            title: "请选择分类",
            description: "请至少选择一个分类",
            variant: "destructive"
          });
          return;
        }
        
        await batchOperateCategories.mutateAsync({
          operation: 'replace',
          productIds: Array.from(selectedProducts),
          categoryIds: batchCategoryIds,
          isPrimaryFirst: true
        });
        
        toast({
          title: "批量更新成功",
          description: `${selectedProducts.size} 个产品的分类已更新`
        });
      } else {
        // 批量上下架
        const { error } = await supabase
          .from('products')
          .update({
            is_active: batchAction === 'activate',
            updated_at: new Date().toISOString()
          })
          .in('id', Array.from(selectedProducts));
        
        if (error) throw error;
        
        toast({
          title: "批量更新成功",
          description: `${selectedProducts.size} 个产品已${batchAction === 'activate' ? '上架' : '下架'}`
        });
      }
      
      setSelectedProducts(new Set());
      setShowBatchDialog(false);
      setBatchAction(null);
      setBatchCategoryIds([]);
      refetch();
    } catch (error) {
      console.error('批量更新失败:', error);
      toast({
        title: "批量更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 产品行组件
  const ProductRow: React.FC<{ product: ProductData }> = ({ product }) => {
    const { data: productCategories = [] } = useProductCategories(product.id);
    const isSelected = selectedProducts.has(product.id);
    const isEditing = editingProduct?.productId === product.id;
    
    return (
      <TableRow className={isSelected ? 'bg-muted/50' : ''}>
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
            disabled={isEditing}
          />
        </TableCell>
        <TableCell className="w-24">
          <div className="relative">
            {product.product_image ? (
              <img
                src={product.product_image}
                alt={product.standard_chinese_name}
                className="w-16 h-16 object-cover rounded-md border"
                loading="lazy"
              />
            ) : (
              <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{product.standard_chinese_name}</div>
            {product.standard_english_name && (
              <div className="text-sm text-muted-foreground">
                {product.standard_english_name}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              SKU: {product.sku}
            </div>
          </div>
        </TableCell>
        <TableCell>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({
                  ...editingProduct,
                  price: e.target.value
                })}
                className="w-24 h-8"
                step="0.01"
                min="0"
              />
            </div>
          ) : (
            <div className="font-medium">
              ¥{parseFloat(product.unit_price || '0').toFixed(2)}
            </div>
          )}
        </TableCell>
        <TableCell>
          <Switch
            checked={product.is_active === true}
            onCheckedChange={() => handleToggleProductStatus(product.id, product.is_active === true)}
            disabled={isProcessing || isEditing}
            className="data-[state=checked]:bg-green-500"
          />
        </TableCell>
        <TableCell>
          {isEditing ? (
            <div className="w-64">
              <CategorySelector
                value={editingProduct.categoryIds}
                onValueChange={(value) => setEditingProduct({
                  ...editingProduct,
                  categoryIds: Array.isArray(value) ? value : []
                })}
                multiple={true}
                placeholder="选择分类"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {productCategories.length > 0 ? (
                productCategories.map(category => (
                  <CategoryTag
                    key={category.id}
                    categoryId={category.id}
                    variant="outline"
                    className="text-xs"
                  />
                ))
              ) : (
                <span className="text-xs text-muted-foreground">暂无分类</span>
              )}
            </div>
          )}
        </TableCell>
        <TableCell>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveProduct}
                disabled={isProcessing}
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditProduct(product)}
              disabled={isProcessing}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 标题和操作按钮 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">商品管理</h1>
            <p className="text-muted-foreground mt-1">
              管理商品价格、上下架状态和分类
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedProducts.size > 0 && (
              <>
                <Badge variant="outline">
                  已选择 {selectedProducts.size} 个商品
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchAction('activate');
                    setShowBatchDialog(true);
                  }}
                  disabled={isProcessing}
                >
                  <Power className="w-4 h-4 mr-2" />
                  批量上架
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchAction('deactivate');
                    setShowBatchDialog(true);
                  }}
                  disabled={isProcessing}
                >
                  <PowerOff className="w-4 h-4 mr-2" />
                  批量下架
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchAction('category');
                    setShowBatchDialog(true);
                  }}
                  disabled={isProcessing}
                >
                  <Tags className="w-4 h-4 mr-2" />
                  批量分类
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索商品名称、SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-64">
                  <CategorySelector
                    value={selectedCategoryId || undefined}
                    onValueChange={(value) => setSelectedCategoryId(typeof value === 'number' ? value : null)}
                    multiple={false}
                    placeholder="筛选分类"
                  />
                </div>
                {selectedCategoryId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* 产品列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                商品列表
              </CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={products.length > 0 && selectedProducts.size === products.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">全选</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground ml-2">加载商品中...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">加载商品时出错</p>
                <p className="text-sm text-red-500 mt-2">{error instanceof Error ? error.message : '未知错误'}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">没有找到商品</p>
                <p className="text-sm text-muted-foreground mt-2">请尝试调整搜索条件或清除筛选</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-24">图片</TableHead>
                      <TableHead>商品信息</TableHead>
                      <TableHead className="w-32">价格</TableHead>
                      <TableHead className="w-24">状态</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead className="w-24">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(product => (
                      <ProductRow key={product.id} product={product} />
                    ))}
                  </TableBody>
                </Table>
                
                {/* 加载更多 */}
                {hasNextPage && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        '加载更多'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* 批量操作确认对话框 */}
        <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {batchAction === 'category' ? '批量修改分类' : 
                 `确认批量${batchAction === 'activate' ? '上架' : '下架'}`}
              </DialogTitle>
              <DialogDescription>
                {batchAction === 'category' ? 
                  `为 ${selectedProducts.size} 个商品设置分类` :
                  `您确定要${batchAction === 'activate' ? '上架' : '下架'} ${selectedProducts.size} 个商品吗？`}
              </DialogDescription>
            </DialogHeader>
            {batchAction === 'category' && (
              <div className="py-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  选择要设置的分类（将替换现有分类）
                </Label>
                <CategorySelector
                  value={batchCategoryIds}
                  onValueChange={(value) => setBatchCategoryIds(Array.isArray(value) ? value : [])}
                  multiple={true}
                  placeholder="选择分类"
                />
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowBatchDialog(false);
                  setBatchCategoryIds([]);
                }}
                disabled={isProcessing}
              >
                取消
              </Button>
              <Button
                onClick={handleBatchStatusUpdate}
                disabled={isProcessing || (batchAction === 'category' && batchCategoryIds.length === 0)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '确认'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProductManagementPage;