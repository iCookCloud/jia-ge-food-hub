import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Package, X, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { productService } from '@/services/api';
import { Product } from '@/hooks/useProducts';

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

const PRODUCTS_PER_PAGE = 10;

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductIds,
  onSelectionChange,
  maxSelection = 20,
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
      const result = await productService.getAll({}, { page: 1, limit: 100 });
      if (result.data) {
        const selected = result.data.filter(product => productIds.includes(product.id));
        setSelectedProducts(selected);
      }
    } catch (error) {
      console.warn('Failed to load selected products:', error);
    }
  }, []);

  // 搜索产品
  const searchProducts = useCallback(async (query: string, page: number) => {
    setLoading(true);
    try {
      const filters = query.trim() 
        ? { 
            search: query.trim() 
          }
        : {};

      const result = await productService.getAll(filters, { 
        page, 
        limit: PRODUCTS_PER_PAGE 
      });

      if (result.data) {
        const totalPages = Math.ceil((result.total || 0) / PRODUCTS_PER_PAGE);
        setProductData({
          products: result.data,
          total: result.total || 0,
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
      if (tempSelectedIds.length >= maxSelection) {
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
                <span className="text-xs">
                  {product.standard_chinese_name || product.standard_english_name || product.sku}
                </span>
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
                <DialogTitle>选择产品</DialogTitle>
                <DialogDescription>
                  搜索并选择要关联的产品（最多选择 {maxSelection} 个）
                </DialogDescription>
              </DialogHeader>

              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索产品名称或SKU..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
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
                    {searchQuery ? '未找到匹配的产品' : '暂无产品数据'}
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
                            <div className="text-xs text-muted-foreground">
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
                    ))}
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

              <DialogFooter>
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-muted-foreground">
                    已选择 {tempSelectedIds.length} / {maxSelection} 个产品
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
              {selectedProductIds.length}/{maxSelection} 已选择
            </span>
          )}
        </div>
      </div>
    </div>
  );
};