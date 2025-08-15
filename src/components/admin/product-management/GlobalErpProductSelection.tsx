import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteQuery } from '@tanstack/react-query';
import { globalErpService } from '@/services/globalErpService';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Package,
  Download,
  Loader2,
  Globe,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Global ERP 商品数据类型
interface GlobalErpProduct {
  id: string;
  sku: string;
  standard_chinese_name: string;
  standard_english_name?: string | null;
  price?: number | null;
  specifications?: string | null;
  main_image_url?: string | null;
  is_active: boolean;
  category_name?: string | null;
  supplier_name?: string | null;
  updated_at: string;
}

// 导入状态类型
interface ImportStatus {
  productId: string;
  status: 'pending' | 'importing' | 'success' | 'error';
  message?: string;
}

export const GlobalErpProductSelection: React.FC = () => {
  const { toast } = useToast();
  
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importStatuses, setImportStatuses] = useState<Map<string, ImportStatus>>(new Map());
  const [isImporting, setIsImporting] = useState(false);
  
  // 防抖搜索
  const debouncedSearch = useDebounce(searchQuery, 800);
  
  // 使用无限查询获取Global ERP商品
  const {
    data: productsData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['global-erp-products', { search: debouncedSearch }],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 20;
      const result = await globalErpService.fetchProducts(
        debouncedSearch ? { search: debouncedSearch } : {},
        { limit, offset: pageParam }
      );
      
      // 转换数据格式以匹配接口
      const products: GlobalErpProduct[] = result.data.map(item => ({
        id: item.id,
        sku: item.sku,
        standard_chinese_name: item.standard_chinese_name,
        standard_english_name: null,
        price: item.price,
        specifications: item.specification,
        main_image_url: item.main_image_url,
        is_active: item.is_active,
        category_name: item.category,
        supplier_name: '供应商',
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      return {
        data: products,
        count: result.count,
        nextCursor: products.length === limit ? pageParam + limit : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5分钟
    initialPageParam: 0
  });
  
  // 展平产品数据
  const globalProducts = useMemo(() => {
    if (!productsData) return [];
    return productsData.pages.flatMap(page => page.data || []);
  }, [productsData]);
  
  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(globalProducts.map(p => p.id)));
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
  
  // 执行导入
  const handleImportProducts = async () => {
    if (selectedProducts.size === 0) return;
    
    const selectedProductList = globalProducts.filter(p => selectedProducts.has(p.id));
    
    // 初始化导入状态
    setImportStatuses(new Map());
    selectedProductList.forEach(product => {
      setImportStatuses(prev => new Map(prev).set(product.id, {
        productId: product.id,
        status: 'pending'
      }));
    });
    
    setIsImporting(true);
    
    // 用于跟踪导入结果的本地变量
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // 逐个导入商品
      for (const product of selectedProductList) {
        // 更新状态为导入中
        setImportStatuses(prev => new Map(prev).set(product.id, {
          productId: product.id,
          status: 'importing'
        }));
        
        try {
          // 转换为本地商品格式并导入
          const localProduct = {
            id: product.id, // Global ERP商品复用原ID
            sku: product.sku,
            standard_chinese_name: product.standard_chinese_name,
            standard_english_name: product.standard_english_name,
            unit_price: product.price?.toString() || null,
            product_image: product.main_image_url,
            specifications: product.specifications,
            source_type: 'global_erp',
            source_id: product.id,
            last_sync_at: new Date().toISOString(),
            review_status: 'approved',
            is_active: true,
            is_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 检查是否已存在 - 不使用.single()避免错误
          const { data: existingProducts, error: checkError } = await supabase
            .from('products')
            .select('id')
            .eq('source_type', 'global_erp')
            .eq('source_id', product.id);
          
          if (checkError) {
            throw new Error(`检查商品是否存在时出错: ${checkError.message}`);
          }
          
          if (existingProducts && existingProducts.length > 0) {
            throw new Error('该商品已存在于本地库中');
          }
          
          // 插入到本地products表
          const { error } = await supabase
            .from('products')
            .insert(localProduct);
          
          if (error) throw error;
          
          // 更新成功状态
          setImportStatuses(prev => new Map(prev).set(product.id, {
            productId: product.id,
            status: 'success',
            message: '导入成功'
          }));
          
          successCount++; // 直接在此处计数
        } catch (error) {
          // 更新失败状态
          setImportStatuses(prev => new Map(prev).set(product.id, {
            productId: product.id,
            status: 'error',
            message: error instanceof Error ? error.message : '未知错误'
          }));
          
          errorCount++; // 直接在此处计数
        }
        
        // 添加延迟避免过快请求
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      toast({
        title: "导入完成",
        description: `成功导入 ${successCount} 个商品${errorCount > 0 ? `，${errorCount} 个失败` : ''}`,
        variant: successCount > 0 ? "default" : "destructive"
      });
      
      // 导入完成后的用户体验优化
      if (successCount > 0) {
        // 清空选中状态
        setSelectedProducts(new Set());
        // 自动关闭对话框
        setShowImportDialog(false);
        // 刷新商品列表数据
        refetch();
      }
      
    } catch (error) {
      console.error('批量导入失败:', error);
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      // 清空导入状态，为下次导入做准备
      setImportStatuses(new Map());
    }
  };
  
  // 获取导入状态显示
  const getImportStatusDisplay = (productId: string) => {
    const status = importStatuses.get(productId);
    if (!status) return null;
    
    switch (status.status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="text-xs">
            等待中
          </Badge>
        );
      case 'importing':
        return (
          <Badge variant="secondary" className="text-xs">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            导入中
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="text-xs text-green-600 bg-green-50 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            成功
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            失败
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // 产品行组件
  const GlobalProductRow: React.FC<{ product: GlobalErpProduct }> = ({ product }) => {
    const isSelected = selectedProducts.has(product.id);
    const importStatus = importStatuses.get(product.id);
    
    return (
      <TableRow className={isSelected ? 'bg-muted/50' : ''}>
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
            disabled={isImporting}
          />
        </TableCell>
        <TableCell className="w-24">
          <div className="relative">
            {product.main_image_url ? (
              <img
                src={product.main_image_url}
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
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Global ERP
              </Badge>
              {getImportStatusDisplay(product.id)}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="font-medium">
            ¥{product.price?.toFixed(2) || '0.00'}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
            {product.is_active ? '在售' : '停售'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="text-sm">
            {product.category_name && (
              <div className="text-muted-foreground">{product.category_name}</div>
            )}
            {product.supplier_name && (
              <div className="text-xs text-muted-foreground mt-1">
                供应商: {product.supplier_name}
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="text-xs text-muted-foreground">
            {new Date(product.updated_at).toLocaleDateString()}
          </div>
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
                variant="default"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                disabled={isImporting}
              >
                <Download className="w-4 h-4 mr-2" />
                导入到本地
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          Global ERP 商品库
        </div>
      </div>
      
      {/* 搜索栏 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索Global ERP商品名称、SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            提示: 默认分页显示商品，每页20条，可输入商品名称或SKU进行搜索。商品可多选进行导入。
          </div>
        </CardContent>
      </Card>
      
      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Global ERP 商品列表
            </CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={globalProducts.length > 0 && selectedProducts.size === globalProducts.length}
                onCheckedChange={handleSelectAll}
                disabled={isImporting}
              />
              <Label className="text-sm">全选</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground ml-2">加载Global ERP商品中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">加载商品时出错</p>
              <p className="text-sm text-red-500 mt-2">{error instanceof Error ? error.message : '未知错误'}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="mt-4"
              >
                重新加载
              </Button>
            </div>
          ) : globalProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {debouncedSearch ? '未找到匹配的商品' : '暂无商品数据'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {debouncedSearch ? '请尝试其他搜索关键词' : '请联系管理员检查Global ERP连接'}
              </p>
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
                    <TableHead>分类/供应商</TableHead>
                    <TableHead className="w-32">更新时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {globalProducts.map(product => (
                    <GlobalProductRow key={product.id} product={product} />
                  ))}
                </TableBody>
              </Table>
              
              {/* 加载更多按钮 */}
              {hasNextPage && (
                <div className="flex justify-center mt-6">
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
                      '加载更多商品'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* 导入确认对话框 */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open);
        // 关闭对话框时清理导入状态
        if (!open) {
          setImportStatuses(new Map());
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入商品</DialogTitle>
            <DialogDescription>
              您确定要导入 {selectedProducts.size} 个商品到本地商品库吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• 商品将复制到本地products表中</p>
              <p>• 保留Global ERP的来源信息，支持后续同步</p>
              <p>• 导入后可以在"本地商品管理"中进行编辑</p>
              <p>• 商品默认状态为已审核并上架</p>
            </div>
            
            {isImporting && importStatuses.size > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">导入进度:</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {Array.from(importStatuses.values()).map(status => {
                    const product = globalProducts.find(p => p.id === status.productId);
                    return (
                      <div key={status.productId} className="flex items-center justify-between text-sm">
                        <span className="truncate">{product?.standard_chinese_name}</span>
                        {getImportStatusDisplay(status.productId)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportStatuses(new Map());
              }}
              disabled={isImporting}
            >
              取消
            </Button>
            <Button
              onClick={handleImportProducts}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  确认导入
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};