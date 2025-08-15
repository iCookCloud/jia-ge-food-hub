import React, { useState, useMemo, forwardRef, useImperativeHandle } from 'react';
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CategorySelector, CategoryTag } from '@/components/category/CategorySelector';
import { useProductCategories, useBatchOperateProductCategories, useCategories } from '@/hooks/useCategories';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
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
  Tags,
  RefreshCw,
  AlertCircle,
  Globe
} from 'lucide-react';

// 扩展的产品数据类型，包含新字段
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
  source_type?: string | null;
  source_id?: string | null;
  last_sync_at?: string | null;
  review_status?: string | null;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

// 编辑状态类型
interface EditingState {
  productId: string;
  price: string;
  categoryIds: number[];
}

export interface LocalProductManagementRef {
  refetch: () => void;
}

export const LocalProductManagement = forwardRef<LocalProductManagementRef>((props, ref) => {
  const { toast } = useToast();
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<EditingState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchAction, setBatchAction] = useState<'activate' | 'deactivate' | 'category' | 'review' | null>(null);
  const [batchCategoryIds, setBatchCategoryIds] = useState<number[]>([]);
  
  // 防抖搜索
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // 获取分类列表
  const { data: categories = [] } = useCategories();
  
  // 分页查询本地products表
  const {
    data: productsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['local-products', { search: debouncedSearch, categoryId: selectedCategoryId }],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      // 先查询产品列表
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + limit - 1);

      if (debouncedSearch) {
        query = query.or(`standard_chinese_name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`);
      }

      if (selectedCategoryId) {
        // 层次包含搜索：获取当前分类及其所有子分类的商品
        const categoryIds = await categoryService.getCategoryWithChildren(selectedCategoryId);
        
        const { data: categoryProducts } = await supabase
          .from('product_category_relations')
          .select('product_id')
          .in('category_id', categoryIds);
        
        if (categoryProducts && categoryProducts.length > 0) {
          const productIds = categoryProducts.map(cp => cp.product_id);
          query = query.in('id', productIds);
        } else {
          // 如果没有关联的商品，返回空结果
          return {
            data: [],
            count: 0,
            nextCursor: undefined
          };
        }
      }

      const { data: products, error, count } = await query;

      if (error) throw error;

      // 如果有产品，再查询它们的分类
      let productsWithCategories = products || [];
      if (products && products.length > 0) {
        const productIds = products.map(p => p.id);
        
        // 查询这些产品的分类关系
        const { data: categoryRelations } = await supabase
          .from('product_category_relations')
          .select('product_id, category_id, product_categories(id, name)')
          .in('product_id', productIds);

        // 将分类数据附加到产品上
        productsWithCategories = products.map(product => ({
          ...product,
          categories: categoryRelations
            ?.filter(rel => rel.product_id === product.id)
            .map(rel => rel.product_categories)
            .filter(Boolean) || []
        }));
      }

      return {
        data: productsWithCategories,
        count: count || 0,
        nextCursor: products && products.length === limit ? pageParam + limit : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5分钟
    initialPageParam: 0
  });
  
  // 展平产品数据
  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.pages.flatMap(page => page.data || []);
  }, [productsData]);
  
  // 暴露refetch方法给父组件
  useImperativeHandle(ref, () => ({
    refetch
  }), [refetch]);
  
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

  // 同步单个商品
  const handleSyncProduct = async (productId: string) => {
    // TODO: 实现商品同步逻辑
    toast({
      title: "同步功能",
      description: "商品同步功能正在开发中",
      variant: "default"
    });
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

  // 获取来源显示
  const getSourceDisplay = (product: ProductData) => {
    switch (product.source_type) {
      case 'global_erp':
        return (
          <Badge variant="outline" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            第三方
          </Badge>
        );
      case 'merchant':
        return (
          <Badge variant="outline" className="text-xs">
            <Package className="w-3 h-3 mr-1" />
            商家
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            本地
          </Badge>
        );
    }
  };

  // 获取审核状态显示
  const getReviewStatusDisplay = (product: ProductData) => {
    if (!product.review_status) return null;
    
    switch (product.review_status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            待审核
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="text-xs text-green-600 bg-green-50 border-green-200">
            已通过
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="text-xs">
            已拒绝
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // 产品行组件
  const ProductRow: React.FC<{ product: ProductData & { categories?: Array<{ id: number; name: string }> } }> = ({ product }) => {
    // 使用从查询中获取的分类数据，避免N+1查询
    const productCategories = product.categories || [];
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
            <div className="flex items-center gap-2 mt-2">
              {getSourceDisplay(product)}
              {getReviewStatusDisplay(product)}
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
                productCategories.map((category, index) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="text-xs"
                  >
                    {category.name}
                  </Badge>
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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditProduct(product)}
                disabled={isProcessing}
              >
                <Edit className="w-4 h-4" />
              </Button>
              {product.source_type === 'global_erp' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleSyncProduct(product.id)}
                  disabled={isProcessing}
                  title="同步第三方数据"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };
  
  return (
    <div>
      {/* 操作按钮栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {selectedProducts.size > 0 && (
            <>
              <Badge variant="outline">
                已选择 {selectedProducts.size} 个商品
              </Badge>
              <Button
                variant="outline"
                size="sm"
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
                size="sm"
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
                size="sm"
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
              本地商品列表
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
                    <TableHead className="w-32">操作</TableHead>
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
  );
});

LocalProductManagement.displayName = 'LocalProductManagement';