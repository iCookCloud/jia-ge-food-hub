import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Package, 
  Search, 
  Filter,
  ArrowLeft,
  Loader2,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  History,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface ProductStock {
  id: string;
  sku: string;
  standard_chinese_name?: string;
  standard_english_name?: string;
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  safety_stock: number;
  max_stock?: number;
  reorder_point: number;
  last_stock_update: string;
  vendor?: string;
  category_chinese?: string;
  category_english?: string;
  alert_type: string;
  alert_level: 'high' | 'medium' | 'low' | 'none';
}

interface StockUpdate {
  product_id: string;
  quantity: number;
  stock_status?: string;
  safety_stock?: number;
  max_stock?: number;
  reorder_point?: number;
}

const ProductStockManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StockUpdate>({
    product_id: '',
    quantity: 0,
    safety_stock: 0,
    max_stock: undefined,
    reorder_point: 0
  });

  // 加载商品库存数据
  const loadProductStocks = async () => {
    setLoading(true);
    try {
      // 从库存预警视图获取数据
      let query = supabase
        .from('product_stock_alerts')
        .select('*')
        .order('alert_level', { ascending: false })
        .order('last_stock_update', { ascending: false });

      // 应用筛选条件
      if (searchQuery.trim()) {
        query = query.or(`sku.ilike.%${searchQuery}%,standard_chinese_name.ilike.%${searchQuery}%,standard_english_name.ilike.%${searchQuery}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('stock_status', statusFilter);
      }

      if (alertFilter && alertFilter !== 'all') {
        query = query.eq('alert_level', alertFilter);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error loading product stocks:', error);
      toast.error('加载商品库存数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑商品
  const startEdit = (product: ProductStock) => {
    setEditingProduct(product.id);
    setEditForm({
      product_id: product.id,
      quantity: product.stock_quantity,
      safety_stock: product.safety_stock,
      max_stock: product.max_stock,
      reorder_point: product.reorder_point
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      product_id: '',
      quantity: 0,
      safety_stock: 0,
      max_stock: undefined,
      reorder_point: 0
    });
  };

  // 保存库存更新
  const saveStockUpdate = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase.rpc('update_product_stock', {
        product_id: editForm.product_id,
        new_quantity: editForm.quantity,
        new_safety_stock: editForm.safety_stock,
        new_max_stock: editForm.max_stock,
        new_reorder_point: editForm.reorder_point
      });

      if (error) {
        throw error;
      }

      toast.success('库存信息已更新');
      cancelEdit();
      loadProductStocks(); // 重新加载数据
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('更新失败，请重试');
    }
  };

  // 获取库存状态标识
  const getStockStatusBadge = (status: string) => {
    const statusConfig = {
      in_stock: { label: '有库存', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      low_stock: { label: '库存不足', className: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      out_of_stock: { label: '缺货', className: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.out_of_stock;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // 获取预警级别标识
  const getAlertLevelBadge = (level: string) => {
    const levelConfig = {
      high: { label: '高', className: 'bg-red-100 text-red-800' },
      medium: { label: '中', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: '低', className: 'bg-blue-100 text-blue-800' },
      none: { label: '无', className: 'bg-gray-100 text-gray-800' }
    };

    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.none;

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // 获取商品名称
  const getProductName = (product: ProductStock) => {
    return product.standard_chinese_name || product.standard_english_name || product.sku;
  };

  useEffect(() => {
    loadProductStocks();
  }, [searchQuery, statusFilter, alertFilter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/management')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理中心
          </Button>
          <div>
            <h1 className="text-2xl font-bold">商品库存管理</h1>
            <p className="text-muted-foreground">管理商品库存数量、安全库存和预警设置</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选和搜索
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">搜索商品</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="搜索SKU或商品名称..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">库存状态</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="in_stock">有库存</SelectItem>
                    <SelectItem value="low_stock">库存不足</SelectItem>
                    <SelectItem value="out_of_stock">缺货</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="alert">预警级别</Label>
                <Select value={alertFilter} onValueChange={setAlertFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部级别</SelectItem>
                    <SelectItem value="high">高级别</SelectItem>
                    <SelectItem value="medium">中级别</SelectItem>
                    <SelectItem value="low">低级别</SelectItem>
                    <SelectItem value="none">无预警</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总商品数</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">缺货商品</p>
                  <p className="text-2xl font-bold text-red-600">
                    {products.filter(p => p.stock_status === 'out_of_stock').length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">库存不足</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {products.filter(p => p.stock_status === 'low_stock').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">正常库存</p>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.stock_status === 'in_stock').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 商品库存列表 */}
        <Card>
          <CardHeader>
            <CardTitle>商品库存列表</CardTitle>
            <CardDescription>
              管理商品库存数量、安全库存和预警设置
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">暂无商品库存数据</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{getProductName(product)}</h3>
                        {getStockStatusBadge(product.stock_status)}
                        {getAlertLevelBadge(product.alert_level)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-1">
                        SKU: {product.sku}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {product.vendor && (
                          <div>供应商: {product.vendor}</div>
                        )}
                        {product.category_chinese && (
                          <div>分类: {product.category_chinese}</div>
                        )}
                        <div>更新时间: {formatDateTime(product.last_stock_update)}</div>
                      </div>
                    </div>

                    {/* 库存信息 */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">当前库存</div>
                        <div className="text-xl font-bold">{product.stock_quantity}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">安全库存</div>
                        <div className="text-lg font-medium">{product.safety_stock}</div>
                      </div>
                      
                      {product.max_stock && (
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">最大库存</div>
                          <div className="text-lg font-medium">{product.max_stock}</div>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      {editingProduct === product.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={saveStockUpdate}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4 mr-1" />
                            保存
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(product)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 编辑表单对话框 */}
        {editingProduct && (
          <AlertDialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>编辑库存信息</AlertDialogTitle>
                <AlertDialogDescription>
                  修改商品库存数量和相关设置
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="quantity">当前库存数量 *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0
                    }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="safety_stock">安全库存数量</Label>
                  <Input
                    id="safety_stock"
                    type="number"
                    min="0"
                    value={editForm.safety_stock}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      safety_stock: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="max_stock">最大库存数量（可选）</Label>
                  <Input
                    id="max_stock"
                    type="number"
                    min="1"
                    value={editForm.max_stock || ''}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      max_stock: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="不限制"
                  />
                </div>

                <div>
                  <Label htmlFor="reorder_point">补货点数量</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    min="0"
                    value={editForm.reorder_point}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      reorder_point: parseInt(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelEdit}>取消</AlertDialogCancel>
                <AlertDialogAction onClick={saveStockUpdate}>
                  保存更改
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </Layout>
  );
};

export default ProductStockManagementPage;




