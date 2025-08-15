// 产品批量分类管理页面
import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BatchCategoryForm } from '@/components/category/BatchCategoryForm';
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
import { useBatchOperateProductCategories, useProductCategories } from '@/hooks/useCategories';
import { useInfiniteProducts } from '@/hooks/useInfiniteProducts';
import { useDebounce } from '@/hooks/useDebounce';
import { globalErpService } from '@/services/globalErpService';
import { 
  Search, 
  Filter, 
  Package,
  CheckSquare,
  Square,
  Tags,
  Upload,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

// 产品数据类型（来自API映射）
interface ProductData {
  id: string;
  sku: string;
  standard_chinese_name: string;
  standard_english_name?: string;
  unit_price?: string;
  category_chinese?: string;
  specifications?: string;
  product_image?: string;
  is_active: boolean;
}

// 批量操作状态
interface BatchOperationStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{ productId: string; error: string }>;
}

const ProductCategoryBatchPage: React.FC = () => {
  const { toast } = useToast();
  
  // 添加错误边界
  if (!toast) {
    return <div>Loading...</div>;
  }
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchCategoryIds, setBatchCategoryIds] = useState<number[]>([]);
  const [batchOperation, setBatchOperation] = useState<'assign' | 'replace' | 'remove'>('assign');
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationStatus, setOperationStatus] = useState<BatchOperationStatus | null>(null);
  
  // 防抖搜索
  const debouncedSearch = useDebounce(searchQuery, 500);
  
  // 查询参数
  const queryParams = useMemo(() => ({
    search: debouncedSearch,
    category: selectedCategory === '全部' ? undefined : selectedCategory,
    limit: 20
  }), [debouncedSearch, selectedCategory]);
  
  // 获取产品数据
  const {
    data: productsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProducts(queryParams);
  
  // 展平产品数据
  const products = useMemo(() => {
    if (!productsData) return [];
    return productsData.pages.flatMap(page => page.data || []);
  }, [productsData]);
  
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
  
  // 执行批量分类操作
  const handleBatchAssign = async () => {
    if (selectedProducts.size === 0 || batchCategoryIds.length === 0) {
      toast({
        title: "操作失败",
        description: "请选择要操作的产品和分类",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setOperationStatus({
      total: selectedProducts.size,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    });
    
    try {
      // 使用真实的批量操作API
      await batchOperateCategories.mutateAsync({
        operation: batchOperation,
        productIds: Array.from(selectedProducts),
        categoryIds: batchCategoryIds,
        isPrimaryFirst: true
      });
      
      // 更新操作状态
      setOperationStatus(prev => prev ? {
        ...prev,
        processed: prev.total,
        successful: prev.total,
      } : null);
      
      // 清空选择
      setSelectedProducts(new Set());
      setBatchCategoryIds([]);
      setShowBatchForm(false);
      
    } catch (error) {
      console.error('批量分类操作失败:', error);
      setOperationStatus(prev => prev ? {
        ...prev,
        processed: prev.total,
        failed: prev.total,
        errors: [{ productId: 'batch', error: error instanceof Error ? error.message : '未知错误' }]
      } : null);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 产品行组件
  const ProductRow: React.FC<{ product: ProductData }> = ({ product }) => {
    const { data: productCategories = [] } = useProductCategories(product.id);
    const isSelected = selectedProducts.has(product.id);
    
    return (
      <TableRow className={isSelected ? 'bg-muted/50' : ''}>
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
          />
        </TableCell>
        <TableCell className="w-24">
          <div className="relative group">
            {product.product_image ? (
              <div className="relative">
                <img
                  src={product.product_image}
                  alt={product.standard_chinese_name}
                  className="w-16 h-16 object-cover rounded-md border shadow-sm transition-all duration-200 group-hover:shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLDivElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                  loading="lazy"
                />
                <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center hidden">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                {/* 悬停时显示放大图标 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-md transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="w-6 h-6 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center">
                <Package className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium line-clamp-2">{product.standard_chinese_name}</div>
            {product.standard_english_name && (
              <div className="text-sm text-muted-foreground line-clamp-1">
                {product.standard_english_name}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              SKU: {product.sku}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="text-right">
            <div className="font-medium">¥{parseFloat(product.unit_price || '0').toFixed(2)}</div>
            {product.specifications && (
              <div className="text-sm text-muted-foreground">{product.specifications}</div>
            )}
          </div>
        </TableCell>
        <TableCell>
          {product.category_chinese ? (
            <Badge variant="outline">{product.category_chinese}</Badge>
          ) : (
            <Badge variant="secondary">未分类</Badge>
          )}
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {productCategories && productCategories.length > 0 ? (
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
        </TableCell>
      </TableRow>
    );
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 标题和统计 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">产品批量分类管理</h1>
            <p className="text-muted-foreground mt-1">
              批量为产品分配分类，提高分类管理效率
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              已选择 {selectedProducts.size} 个产品
            </Badge>
            {selectedProducts.size > 0 && (
              <Button 
                onClick={() => setShowBatchForm(true)}
                disabled={isProcessing}
              >
                <Tags className="w-4 h-4 mr-2" />
                批量分类
              </Button>
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
                    placeholder="搜索产品名称、SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="选择分类筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部分类</SelectItem>
                  <SelectItem value="未分类">未分类商品</SelectItem>
                  <SelectItem value="海鲜">海鲜</SelectItem>
                  <SelectItem value="肉类">肉类</SelectItem>
                  <SelectItem value="蔬菜">蔬菜</SelectItem>
                  <SelectItem value="调料">调料</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* 产品列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                产品列表
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
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-muted rounded"></div>
                      <div className="w-16 h-16 bg-muted rounded-md"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-4 bg-muted rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {error ? '加载产品时出错' : '没有找到匹配的产品'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-24">图片</TableHead>
                      <TableHead>产品信息</TableHead>
                      <TableHead className="w-24">价格</TableHead>
                      <TableHead className="w-32">原始分类</TableHead>
                      <TableHead>当前分类</TableHead>
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
        
        {/* 批量分类表单 */}
        {showBatchForm && (
          <div className="mt-6">
            <BatchCategoryForm
              selectedCount={selectedProducts.size}
              categoryIds={batchCategoryIds}
              operation={batchOperation}
              onCategoryChange={setBatchCategoryIds}
              onOperationChange={setBatchOperation}
              onSubmit={handleBatchAssign}
              onCancel={() => setShowBatchForm(false)}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductCategoryBatchPage;