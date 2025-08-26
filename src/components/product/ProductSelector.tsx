import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, X, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';
import { productService } from '@/services/api';

interface ProductSelectorProps {
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
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

const PRODUCTS_PER_PAGE = 50; // 增加每页显示数量，从10改为50

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductIds,
  onSelectionChange,
  maxSelection = 999, // 默认不限制选择数量
  trigger,
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductPageData>({ products: [], total: 0, hasMore: false });
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const { toast } = useToast();

  // 防抖搜索
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // 加载选中的产品详情
  const loadSelectedProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) {
      setSelectedProducts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products_with_categories')
        .select('*')
        .in('id', productIds);
      
      if (error) {
        console.warn('Failed to load selected products:', error);
        return;
      }
      
      setSelectedProducts(data || []);
    } catch (error) {
      console.warn('Failed to load selected products:', error);
    }
  }, []);

  // 搜索产品
  const searchProducts = useCallback(async (query: string, page: number) => {
    setLoading(true);
    try {
      let filters = {};
      
      if (query.trim()) {
        // 支持SKU精确搜索和名称模糊搜索
        const trimmedQuery = query.trim();
        
        // 如果查询看起来像SKU（包含字母数字组合），优先进行SKU搜索
        if (/^[A-Za-z0-9-_]+$/.test(trimmedQuery)) {
          // SKU搜索：先尝试精确匹配，再尝试模糊匹配
          filters = { 
            search: trimmedQuery,
            sku_search: trimmedQuery // 添加SKU搜索标识
          };
        } else {
          // 普通文本搜索
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

    // 清除之前的防抖定时器
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // 设置新的防抖定时器
    const newDebounce = setTimeout(() => {
      searchProducts(value, 1);
    }, 300);

    setSearchDebounce(newDebounce);
  }, [searchProducts, searchDebounce]);

  // 切换产品选择状态
  const toggleProduct = (productId: string) => {
    if (tempSelectedIds.includes(productId)) {
      setTempSelectedIds(prev => prev.filter(id => id !== productId));
    } else {
      if (maxSelection < 999 && tempSelectedIds.length >= maxSelection) {
        toast({
          title: "选择数量已达上限",
          description: `最多只能选择 ${maxSelection} 个产品`,
          variant: "destructive",
        });
        return;
      }
      setTempSelectedIds(prev => [...prev, productId]);
    }
  };

  // 移除已选产品
  const removeSelectedProduct = (productId: string) => {
    const newSelection = selectedProductIds.filter(id => id !== productId);
    onSelectionChange(newSelection);
  };

  // 确认选择
  const handleConfirm = () => {
    onSelectionChange(tempSelectedIds);
    setIsOpen(false);
  };

  // 取消选择
  const handleCancel = () => {
    setTempSelectedIds(selectedProductIds);
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
      setTempSelectedIds(selectedProductIds);
      setSearchQuery('');
      setCurrentPage(1);
      // 默认加载第一页产品，让用户看到可用的产品
      searchProducts('', 1);
    }
  };

  // 组件挂载时加载已选产品
  useEffect(() => {
    loadSelectedProducts(selectedProductIds);
  }, [selectedProductIds, loadSelectedProducts]);

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
          关联产品
        </Label>
        
        <p className="text-xs text-muted-foreground">
          选择与此内容相关的产品，方便用户查找和了解
        </p>

        {/* 已选产品标签 */}
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            {selectedProducts.map((product) => (
              <Badge 
                key={product.id} 
                variant="secondary" 
                className="flex items-center gap-2 pr-1"
              >
                {product.product_image && (
                  <img 
                    src={product.product_image} 
                    alt={product.standard_chinese_name || product.sku}
                    className="w-4 h-4 object-cover rounded"
                  />
                )}
                <div className="text-xs">
                  <div className="font-medium">
                    {product.standard_chinese_name || product.standard_english_name || product.sku}
                  </div>
                  <div className="text-primary text-xs">
                    SKU: {product.sku}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive/20"
                  onClick={() => removeSelectedProduct(product.id)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
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
            
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>选择关联产品</DialogTitle>
                <DialogDescription>
                  搜索并选择要关联的产品。支持按产品名称、SKU或规格搜索，{maxSelection >= 999 ? '无选择数量限制' : `最多选择 ${maxSelection} 个产品`}
                </DialogDescription>
              </DialogHeader>

              {/* 搜索框和显示选项 */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索产品名称、SKU或规格..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* 显示选项 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      每页显示: {PRODUCTS_PER_PAGE} 个产品
                    </span>
                    {searchQuery && (
                      <span className="text-primary">
                        搜索结果: {productData.total} 个产品
                      </span>
                    )}
                  </div>
                  {!searchQuery && (
                    <span className="text-muted-foreground">
                      共 {productData.total} 个产品
                    </span>
                  )}
                </div>
              </div>

              {/* 产品列表 */}
              <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
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
                    {productData.products.map((product) => (
                      <div 
                        key={product.id} 
                        className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleProduct(product.id)}
                      >
                        <Checkbox
                          checked={tempSelectedIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
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
                            {product.vendor && (
                              <div className="text-xs text-muted-foreground">
                                供应商: {product.vendor}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 分页控件 */}
              {!loading && productData.total > PRODUCTS_PER_PAGE && (
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="text-sm text-muted-foreground">
                    {searchQuery ? `搜索结果: ${productData.total} 个产品` : `共 ${productData.total} 个产品`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
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
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* 当没有搜索且还有更多产品时，显示"显示更多"提示 */}
              {!loading && !searchQuery && productData.hasMore && (
                <div className="text-center py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    还有更多产品，请使用搜索功能快速找到您需要的产品
                  </p>
                </div>
              )}

              <DialogFooter>
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    已选择 {tempSelectedIds.length} {maxSelection >= 999 ? '个产品' : `/ ${maxSelection} 个产品`}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      取消
                    </Button>
                    <Button onClick={handleConfirm}>
                      确定 ({tempSelectedIds.length})
                    </Button>
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedProductIds.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedProductIds.length} {maxSelection >= 999 ? '个产品已选择' : `/${maxSelection} 已选择`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};