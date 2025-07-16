import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Search, 
  Filter,
  Share2,
  Users,
  TrendingUp,
  Gift,
  Eye,
  ShoppingCart,
  ArrowRight,
  Crown,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

// Types
interface SheetData {
  id: string;
  sheet_name: string;
  rebate_total: number;
  total_amount: number;
  supplier_id: string;
  status: string;
  created_at: string;
  is_shareable: boolean;
  supplier_name?: string;
  item_count?: number;
  share_chain?: {
    share_depth: number;
    parent_name?: string;
    children_count: number;
    total_commission: number;
    contribution_rank?: number;
  };
}

const SheetCenterPage = () => {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedStatus, setSelectedStatus] = useState("全部");
  const [activeTab, setActiveTab] = useState("available");

  // Fetch sheets data
  const fetchSheets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quotations')
        .select(`
          id,
          sheet_name,
          rebate_total,
          total_amount,
          supplier_id,
          status,
          created_at,
          is_shareable,
          notes,
          supplier_credentials!inner(company_name)
        `)
        .eq('is_shareable', true);

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform data and add mock share chain info
      const transformedSheets: SheetData[] = (data || []).map((sheet, index) => ({
        id: sheet.id,
        sheet_name: sheet.sheet_name || `货单 #${sheet.id.slice(0, 8)}`,
        rebate_total: Number(sheet.rebate_total) || 500,
        total_amount: Number(sheet.total_amount) || 10000,
        supplier_id: sheet.supplier_id,
        status: sheet.status,
        created_at: sheet.created_at,
        is_shareable: sheet.is_shareable,
        supplier_name: sheet.supplier_credentials?.company_name || '未知供应商',
        item_count: Math.floor(Math.random() * 20) + 5,
        share_chain: {
          share_depth: Math.floor(Math.random() * 4),
          parent_name: index % 3 === 0 ? '张三的分享' : undefined,
          children_count: Math.floor(Math.random() * 10),
          total_commission: Math.floor(Math.random() * 200) + 50,
          contribution_rank: Math.floor(Math.random() * 10) + 1
        }
      }));

      setSheets(transformedSheets);
    } catch (error) {
      console.error('获取货单数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, []);

  // Filter sheets
  const filteredSheets = sheets.filter(sheet => {
    const matchesSearch = sheet.sheet_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sheet.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || true; // 暂时不筛选分类
    const matchesStatus = selectedStatus === "全部" || sheet.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
            <Gift className="h-3 w-3 mr-1" />
            ¥{sheet.rebate_total}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 分享链路信息 */}
        {sheet.share_chain?.parent_name && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>分享链路: {sheet.share_chain.parent_name} → 我</span>
          </div>
        )}

        {/* 货单基本信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <ShoppingCart className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>{sheet.item_count} 个商品</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>¥{sheet.total_amount.toLocaleString()}</span>
          </div>
        </div>

        {/* 返利信息 */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">返利总额:</span>
            <span className="font-semibold text-primary">¥{sheet.rebate_total}</span>
          </div>
          {sheet.share_chain && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">我的贡献度排名:</span>
                <div className="flex items-center">
                  {sheet.share_chain.contribution_rank <= 3 && (
                    <Crown className="h-3 w-3 mr-1 text-yellow-500" />
                  )}
                  <span className="font-medium">#{sheet.share_chain.contribution_rank}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">已获得返利:</span>
                <span className="font-semibold text-success">¥{sheet.share_chain.total_commission}</span>
              </div>
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            查看详情
          </Button>
          <Button size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-1" />
            转发分享
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">货单中心</h1>
          <p className="text-muted-foreground">发现货单机会，参与分享返利</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "可参与货单", value: filteredSheets.length, icon: ShoppingCart, color: "text-primary" },
            { label: "我的分享", value: 12, icon: Share2, color: "text-success" },
            { label: "累计返利", value: "¥2,860", icon: Gift, color: "text-warning" },
            { label: "团队成员", value: 45, icon: Users, color: "text-info" }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索货单名称、供应商..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部分类</SelectItem>
                    <SelectItem value="海鲜">海鲜</SelectItem>
                    <SelectItem value="肉类">肉类</SelectItem>
                    <SelectItem value="蔬菜">蔬菜</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部状态</SelectItem>
                    <SelectItem value="active">进行中</SelectItem>
                    <SelectItem value="ended">已结束</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">可参与货单</TabsTrigger>
            <TabsTrigger value="my-shares">我的分享</TabsTrigger>
            <TabsTrigger value="my-created">我创建的</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-6">
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
              <Card className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  暂无可参与的货单
                </h3>
                <p className="text-muted-foreground">
                  请稍后再来查看或调整筛选条件
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-shares" className="mt-6">
            <Card className="p-12 text-center">
              <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                我的分享管理
              </h3>
              <p className="text-muted-foreground mb-4">
                查看和管理您参与分享的所有货单
              </p>
              <Button>
                <ArrowRight className="h-4 w-4 mr-2" />
                查看分享详情
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="my-created" className="mt-6">
            <Card className="p-12 text-center">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                我创建的货单
              </h3>
              <p className="text-muted-foreground mb-4">
                管理您创建的货单和返利设置
              </p>
              <Button>
                <ArrowRight className="h-4 w-4 mr-2" />
                创建新货单
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SheetCenterPage;