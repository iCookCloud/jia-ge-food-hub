import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, X, ChevronLeft, ChevronRight, Loader2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';
import { productService } from '@/services/api';

export interface ProductWithQuantity {
  id: string;
  sku: string;
  name: string;
  price: string;
  image?: string;
  specifications?: string;
  vendor?: string;
  recommendedQuantity: number;
  quantityNote?: string;
}

interface ProductSelectorWithQuantityProps {
  selectedProducts: ProductWithQuantity[];
  onSelectionChange: (products: ProductWithQuantity[]) => void;
  maxSelection?: number;
  trigger?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

interface ProductPageData {
  products: Product[];
  total: number;
  hasMore: boolean;
}

const PRODUCTS_PER_PAGE = 50;

export const ProductSelectorWithQuantity: React.FC<ProductSelectorWithQuantityProps> = ({
  selectedProducts,
  onSelectionChange,
  maxSelection = 999,
  trigger,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductPageData>({ products: [], total: 0, hasMore: false });
  const [tempSelectedProducts, setTempSelectedProducts] = useState<ProductWithQuantity[]>([]);
  const { toast } = useToast();

  // 防抖搜索
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // 搜索产品
  const searchProducts = useCallback(async (query: string, page: number) => {
    setLoading(true);
    try {
      let filters = {};
      
      if (query.trim()) {
        const trimmedQuery = query.trim();
        
        if (/^[A-Za-z0-9-_]+$/.test(trimmedQuery)) {
          filters = { 
            search: trimmedQuery,
            sku_search: trimmedQuery
          };
        } else {
          filters = { 
            search: trimmedQuery 
          };
        }
      }

      const result = await productService.getAll(filters, { 
        page, 
        limit: PRODUCTS_PER_PAGE 
      });

      if (result.data) {
        const totalCount = typeof result.count === 'number' ? result.count : 0;
        const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);
        setProductData({
          products: result.data,
          total: totalCount,
          hasMore: page < totalPages
        });
      }
    } catch (error) {
      toast({
        title: "搜索失败",
        description: "无法加载产品列表",
        variant: "destructive",
      });
      setProductData({ products: [], total: 0, hasMore: false });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 处理搜索输入
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);

    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const newDebounce = setTimeout(() => {
      searchProducts(value, 1);
    }, 300);

    setSearchDebounce(newDebounce);
  }, [searchProducts, searchDebounce]);

  // 切换产品选择状态
  const toggleProduct = (product: Product) => {
    const productId = product.id;
    const existingIndex = tempSelectedProducts.findIndex(p => p.id === productId);
    
    if (existingIndex >= 0) {
      // 移除产品
      setTempSelectedProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      // 添加产品
      if (maxSelection < 999 && tempSelectedProducts.length >= maxSelection) {
        toast({
          title: "选择数量已达上限",
          description: `最多只能选择 ${maxSelection} 个产品`,
          variant: "destructive",
        });
        return;
      }
      
      const newProduct: ProductWithQuantity = {
        id: productId,
        sku: product.sku,
        name: product.standard_chinese_name || product.standard_english_name || product.sku,
        price: product.unit_price || '0',
        image: product.product_image,
        specifications: product.specifications,
        vendor: product.vendor,
        recommendedQuantity: 1, // 默认推荐数量为1
        quantityNote: ''
      };
      
      setTempSelectedProducts(prev => [...prev, newProduct]);
    }
  };

  // 更新产品推荐数量
  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setTempSelectedProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, recommendedQuantity: quantity }
          : p
      )
    );
  };

  // 更新产品数量备注
  const updateProductNote = (productId: string, note: string) => {
    setTempSelectedProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, quantityNote: note }
          : p
      )
    );
  };

  // 移除已选产品
  const removeSelectedProduct = (productId: string) => {
    const newSelection = selectedProducts.filter(p => p.id !== productId);
    onSelectionChange(newSelection);
  };

  // 移除临时选择的产品
  const removeTempProduct = (productId: string) => {
    setTempSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  // 确认选择
  const handleConfirm = () => {
    onSelectionChange(tempSelectedProducts);
    setIsOpen(false);
  };

  // 取消选择
  const handleCancel = () => {
    setTempSelectedProducts(selectedProducts);
    setIsOpen(false);
  };

  // 翻页
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    searchProducts(searchQuery, newPage);
  };

  // 打开弹窗时初始化
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempSelectedProducts([...selectedProducts]);
      setSearchQuery('');
      setCurrentPage(1);
      searchProducts('', 1);
    }
  };

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  const totalPages = Math.ceil(productData.total / PRODUCTS_PER_PAGE);

  return (
    <div className={className}>
      {/* 已选产品展示区域 */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          关联产品及推荐数量
        </Label>
        
        <p className="text-xs text-muted-foreground">
          选择与此内容相关的产品，并设置推荐购买数量
        </p>

        {/* 已选产品列表 */}
        {selectedProducts.length > 0 && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            {selectedProducts.map((product) => (
              <div 
                key={product.id}
                className="flex items-start gap-3 p-3 bg-white rounded border"
              >
                {/* 产品图片 */}
                <div className="flex-shrink-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 产品信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                        <span className="text-sm font-medium text-green-600">
                          ¥{parseInt(product.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-destructive/20"
                      onClick={() => removeSelectedProduct(product.id)}
                      disabled={disabled}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {product.specifications && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {product.specifications}
                    </p>
                  )}

                  {/* 推荐数量显示 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3 text-blue-600" />
                      <span className="text-sm font-medium">推荐数量:</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {product.recommendedQuantity} 个
                    </Badge>
                    {product.quantityNote && (
                      <span className="text-xs text-muted-foreground">
                        ({product.quantityNote})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 添加产品按钮 */}
        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              {trigger || (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  disabled={disabled}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加产品
                </Button>
              )}
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>选择关联产品并设置推荐数量</DialogTitle>
                <DialogDescription>
                  搜索并选择要关联的产品，同时设置推荐购买数量。{maxSelection >= 999 ? '无选择数量限制' : `最多选择 ${maxSelection} 个产品`}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 space-y-4">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索产品名称、SKU或规格..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
                  {/* 左侧：产品列表 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        每页显示: {PRODUCTS_PER_PAGE} 个产品
                      </span>
                      {searchQuery && (
                        <span className="text-primary">
                          搜索结果: {productData.total} 个产品
                        </span>
                      )}
                    </div>

                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2 text-muted-foreground">搜索中...</span>
                        </div>
                      ) : productData.products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          {searchQuery ? (
                            <div className="space-y-2">
                              <div>未找到匹配的产品</div>
                              <div className="text-xs">提示：可以尝试搜索产品名称、SKU或规格信息</div>
                            </div>
                          ) : (
                            '暂无产品数据'
                          )}
                        </div>
                      ) : (
                        <div className="p-3 space-y-3">
                          {productData.products.map((product) => {
                            const isSelected = tempSelectedProducts.some(p => p.id === product.id);
                            return (
                              <div 
                                key={product.id} 
                                className={`flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                                  isSelected ? 'bg-blue-50 border border-blue-200' : ''
                                }`}
                                onClick={() => toggleProduct(product)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => toggleProduct(product)}
                                />
                                <div className="flex items-center gap-3 flex-1">
                                  {product.product_image && (
                                    <img 
                                      src={product.product_image} 
                                      alt={product.standard_chinese_name || product.sku}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {product.standard_chinese_name || product.standard_english_name || product.sku}
                                    </div>
                                    <div className="text-xs text-primary font-medium">
                                      SKU: {product.sku}
                                    </div>
                                    {product.specifications && (
                                      <div className="text-xs text-muted-foreground">
                                        规格: {product.specifications}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 分页控件 */}
                    {!loading && productData.total > PRODUCTS_PER_PAGE && (
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="text-sm text-muted-foreground">
                          共 {productData.total} 个产品
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">
                            {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!productData.hasMore}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 右侧：已选产品和数量设置 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">已选产品</span>
                      <Badge variant="secondary">{tempSelectedProducts.length}</Badge>
                    </div>

                    <div className="border rounded-lg max-h-96 overflow-y-auto">
                      {tempSelectedProducts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">暂未选择产品</p>
                        </div>
                      ) : (
                        <div className="p-3 space-y-3">
                          {tempSelectedProducts.map((product) => (
                            <div key={product.id} className="p-3 border rounded bg-white">
                              {/* 产品基本信息 */}
                              <div className="flex items-start gap-3 mb-3">
                                {product.image && (
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{product.name}</div>
                                  <div className="text-xs text-primary">SKU: {product.sku}</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-destructive/20"
                                  onClick={() => removeTempProduct(product.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* 推荐数量设置 */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium">推荐数量</Label>
                                  <div className="flex items-center border rounded">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateProductQuantity(product.id, product.recommendedQuantity - 1)}
                                      disabled={product.recommendedQuantity <= 1}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <div className="flex items-center justify-center min-w-[30px] h-6 px-2 text-xs font-medium">
                                      {product.recommendedQuantity}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => updateProductQuantity(product.id, product.recommendedQuantity + 1)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* 数量备注 */}
                                <div>
                                  <Label className="text-xs font-medium">数量说明（可选）</Label>
                                  <Input
                                    placeholder="如：整套装修需要、单个房间用量等"
                                    value={product.quantityNote || ''}
                                    onChange={(e) => updateProductNote(product.id, e.target.value)}
                                    className="h-7 text-xs mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    已选择 {tempSelectedProducts.length} {maxSelection >= 999 ? '个产品' : `/ ${maxSelection} 个产品`}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      取消
                    </Button>
                    <Button onClick={handleConfirm}>
                      确定 ({tempSelectedProducts.length})
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedProducts.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedProducts.length} {maxSelection >= 999 ? '个产品已选择' : `/${maxSelection} 已选择`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};