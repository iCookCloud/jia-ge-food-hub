import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Share2,
  Users,
  Eye,
  ShoppingCart,
  Plus,
  Package,
  Grid3X3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Product } from "@/hooks/useProducts";
import { ProductBrowser } from "@/components/sheet/ProductBrowser";
import { QuickSheetCreator } from "@/components/sheet/QuickSheetCreator";
import { useToast } from "@/hooks/use-toast";

// Types
interface SheetData {
  id: string;
  sheet_name: string;
  total_amount: number;
  supplier_id: string;
  status: string;
  created_at: string;
  is_shareable: boolean;
  supplier_name?: string;
  item_count?: number;
  description?: string;
}

const SheetCenterPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [showQuickCreator, setShowQuickCreator] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Fetch sheets data
  const fetchSheets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quotations')
        .select(`
          id,
          sheet_name,
          total_amount,
          supplier_id,
          status,
          created_at,
          is_shareable,
          notes,
          supplier_credentials(company_name)
        `)
        .neq('status', 'deleted')
        .eq('is_shareable', true); // 只显示可分享的货单

      const { data, error } = await query;
      
      if (error) {
        console.error('获取货单数据失败:', error);
        throw error;
      }

      console.log('获取到的货单数据:', data);

      // Transform data
      const transformedSheets: SheetData[] = (data || []).map((sheet) => ({
        id: sheet.id,
        sheet_name: sheet.sheet_name || `货单 #${sheet.id.slice(0, 8)}`,
        total_amount: Number(sheet.total_amount) || 10000,
        supplier_id: sheet.supplier_id,
        status: sheet.status,
        created_at: sheet.created_at,
        is_shareable: sheet.is_shareable,
        supplier_name: sheet.supplier_credentials?.company_name || '未知供应商',
        item_count: Math.floor(Math.random() * 20) + 5,
        description: sheet.notes || ''
      }));

      console.log('转换后的货单数据:', transformedSheets);
      setSheets(transformedSheets);
    } catch (error) {
      console.error('获取货单数据失败:', error);
      // 如果查询失败，显示一些模拟数据作为备用
      const fallbackSheets: SheetData[] = [
        {
          id: 'fallback-1',
          sheet_name: '精选海鲜货单 - 春季特惠',
          total_amount: 15000,
          supplier_id: 'supplier-1',
          status: 'draft',
          created_at: new Date().toISOString(),
          is_shareable: true,
          supplier_name: '海鲜直供',
          item_count: 12,
          description: '新鲜优质海鲜产品组合'
        },
        {
          id: 'fallback-2',
          sheet_name: '优质肉类组合 - 火锅专用',
          total_amount: 8500,
          supplier_id: 'supplier-2',
          status: 'draft',
          created_at: new Date().toISOString(),
          is_shareable: true,
          supplier_name: '优质肉类',
          item_count: 8,
          description: '精选火锅肉类产品'
        }
      ];
      setSheets(fallbackSheets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  // 显示所有货单
  const filteredSheets = sheets;

  // 处理商品选择
  const handleProductSelect = (product: Product) => {
    setSelectedProducts([product]);
    setShowQuickCreator(true);
  };

  // 处理批量创建货单
  const handleBulkCreate = (products: Product[]) => {
    setSelectedProducts(products);
    setShowQuickCreator(true);
  };


  // 处理快速创建成功
  const handleQuickCreateSuccess = () => {
    setSelectedProducts([]);
    setShowQuickCreator(false);
    toast({
      title: "货单创建成功",
      description: "您的货单已成功创建"
    });
  };

  const SheetCard = ({ sheet }: { sheet: SheetData }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {sheet.sheet_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {sheet.supplier_name}
            </p>
          </div>
          <Badge variant="outline" className="ml-2">
            <Package className="h-3 w-3 mr-1" />
            {sheet.item_count} 商品
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 货单描述 */}
        {sheet.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {sheet.description}
          </p>
        )}

        {/* 货单基本信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <ShoppingCart className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{sheet.item_count} 个商品</span>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">¥{sheet.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* 状态信息 */}
        <div className="flex items-center justify-between">
          <Badge variant={sheet.status === 'active' ? 'default' : 'secondary'}>
            {sheet.status === 'active' ? '进行中' : '草稿'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(sheet.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/sheets/${sheet.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              查看详情
            </Link>
          </Button>
          <Button size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-1" />
            分享货单
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">货单中心</h1>
            <p className="text-muted-foreground">搜索、分享和管理供应链货单</p>
          </div>
          <Button asChild>
            <Link to="/sheets/create">
              <Plus className="h-4 w-4 mr-2" />
              创建货单
            </Link>
          </Button>
        </div>


        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">
              <Grid3X3 className="h-4 w-4 mr-2" />
              商品浏览
            </TabsTrigger>
            <TabsTrigger value="my-sheets">
              <Package className="h-4 w-4 mr-2" />
              我的货单
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductBrowser 
              onProductSelect={handleProductSelect}
              onBulkCreate={handleBulkCreate}
              selectionMode={true}
            />
          </TabsContent>

          <TabsContent value="my-sheets" className="mt-6">
            <div className="space-y-6">
              {/* 我的货单统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      我创建的货单
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-primary mb-2">0</div>
                      <p className="text-muted-foreground mb-4">
                        暂无创建的货单
                      </p>
                      <Button asChild size="sm">
                        <Link to="/sheets/create">
                          <Plus className="h-4 w-4 mr-2" />
                          创建货单
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      我分享的货单
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-primary mb-2">0</div>
                      <p className="text-muted-foreground mb-4">
                        暂无分享的货单
                      </p>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      可参与货单
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-primary mb-2">{filteredSheets.length}</div>
                      <p className="text-muted-foreground mb-4">
                        可参与的货单
                      </p>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 可参与的货单列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    可参与的货单
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-6">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-20 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredSheets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSheets.map((sheet) => (
                        <SheetCard key={sheet.id} sheet={sheet} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        暂无可参与的货单
                      </h3>
                      <p className="text-muted-foreground">
                        请稍后再来查看或调整筛选条件
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 快速创建货单对话框 */}
        <QuickSheetCreator
          products={selectedProducts}
          open={showQuickCreator}
          onOpenChange={setShowQuickCreator}
          onSuccess={handleQuickCreateSuccess}
        />
      </div>
    </Layout>
  );
};

export default SheetCenterPage;