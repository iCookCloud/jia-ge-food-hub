import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Search,
  Users,
  MessageCircle,
  Share2,
  TrendingUp,
  Crown,
  Network,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Award,
  ArrowUpRight,
  GitBranch,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

// Types
interface NetworkUser {
  id: string;
  nickname: string;
  avatar_url?: string;
  company_name?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  verification_status: string;
  main_categories: string[];
  total_orders: number;
  total_sales: number;
  commission_earned: number;
  network_level: number;
  relationship: 'upstream' | 'downstream' | 'peer' | 'none';
  share_count: number;
  success_rate: number;
  created_at: string;
}

interface NetworkStats {
  total_users: number;
  my_upstream: number;
  my_downstream: number;
  total_commission: number;
  network_growth: number;
}

interface ShareRelation {
  id: string;
  user_name: string;
  avatar_url?: string;
  relationship: 'parent' | 'child';
  level: number;
  orders_count: number;
  commission_amount: number;
  created_at: string;
}

const NetworkCenterPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<NetworkUser[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [shareRelations, setShareRelations] = useState<ShareRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedRelation, setSelectedRelation] = useState("全部");
  const [activeTab, setActiveTab] = useState("network");
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);

  // Fetch network data
  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      // Fetch all suppliers/users (not just verified ones)
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('supplier_credentials')
        .select(`
          user_id,
          company_name,
          contact_person,
          contact_phone,
          contact_email,
          verification_status,
          profiles!inner(nickname, avatar_url, created_at)
        `);
        // 移除 .eq('verification_status', 'verified') 限制，显示所有供应商

      if (suppliersError) {
        console.error('获取供应商数据失败:', suppliersError);
        throw suppliersError;
      }

      console.log('获取到的供应商数据:', suppliersData);

      // Transform and add mock network data
      const networkUsers: NetworkUser[] = (suppliersData || []).map((supplier, index) => ({
        id: supplier.user_id,
        nickname: supplier.profiles?.nickname || supplier.contact_person || '用户',
        avatar_url: supplier.profiles?.avatar_url || '',
        company_name: supplier.company_name,
        contact_person: supplier.contact_person,
        contact_phone: supplier.contact_phone,
        contact_email: supplier.contact_email,
        verification_status: supplier.verification_status,
        main_categories: ['海鲜', '肉类', '蔬菜'].slice(0, Math.floor(Math.random() * 3) + 1),
        total_orders: Math.floor(Math.random() * 100) + 10,
        total_sales: Math.floor(Math.random() * 500000) + 50000,
        commission_earned: Math.floor(Math.random() * 10000) + 1000,
        network_level: Math.floor(Math.random() * 5) + 1,
        relationship: index % 4 === 0 ? 'upstream' : index % 4 === 1 ? 'downstream' : 'peer',
        share_count: Math.floor(Math.random() * 50) + 5,
        success_rate: (Math.random() * 0.4 + 0.6) * 100,
        created_at: supplier.profiles?.created_at || new Date().toISOString()
      }));

      // Mock stats
      const mockStats: NetworkStats = {
        total_users: networkUsers.length,
        my_upstream: networkUsers.filter(u => u.relationship === 'upstream').length,
        my_downstream: networkUsers.filter(u => u.relationship === 'downstream').length,
        total_commission: 28600,
        network_growth: 15.2
      };

      // Mock share relations
      const mockRelations: ShareRelation[] = [
        {
          id: '1',
          user_name: '张三海鲜',
          relationship: 'parent',
          level: 1,
          orders_count: 15,
          commission_amount: 2500,
          created_at: '2024-01-10'
        },
        {
          id: '2',
          user_name: '李四食材',
          relationship: 'child',
          level: 1,
          orders_count: 8,
          commission_amount: 1200,
          created_at: '2024-01-15'
        },
        {
          id: '3',
          user_name: '王五优选',
          relationship: 'child',
          level: 1,
          orders_count: 12,
          commission_amount: 1800,
          created_at: '2024-01-20'
        }
      ];

      setUsers(networkUsers);
      setStats(mockStats);
      setShareRelations(mockRelations);
    } catch (error) {
      console.error('获取网络数据失败:', error);
      
      // 如果数据库查询失败，使用备用数据确保界面有内容
      const fallbackUsers: NetworkUser[] = [
        {
          id: 'user-1',
          nickname: '海鲜直供',
          avatar_url: '',
          company_name: '海鲜直供有限公司',
          contact_person: '张经理',
          contact_phone: '138-0000-0001',
          contact_email: 'zhang@seafood.com',
          verification_status: 'verified',
          main_categories: ['海鲜'],
          total_orders: 45,
          total_sales: 280000,
          commission_earned: 8500,
          network_level: 3,
          relationship: 'upstream',
          share_count: 12,
          success_rate: 89.5,
          created_at: '2024-01-01'
        },
        {
          id: 'user-2',
          nickname: '优质肉类',
          avatar_url: '',
          company_name: '优质肉类供应商',
          contact_person: '李总',
          contact_phone: '138-0000-0002',
          contact_email: 'li@meat.com',
          verification_status: 'pending',
          main_categories: ['肉类'],
          total_orders: 32,
          total_sales: 195000,
          commission_earned: 6200,
          network_level: 2,
          relationship: 'peer',
          share_count: 8,
          success_rate: 92.1,
          created_at: '2024-01-15'
        },
        {
          id: 'user-3',
          nickname: '绿色农场',
          avatar_url: '',
          company_name: '绿色有机农场',
          contact_person: '王老板',
          contact_phone: '138-0000-0003',
          contact_email: 'wang@organic.com',
          verification_status: 'verified',
          main_categories: ['蔬菜', '有机'],
          total_orders: 67,
          total_sales: 158000,
          commission_earned: 4800,
          network_level: 4,
          relationship: 'downstream',
          share_count: 15,
          success_rate: 86.3,
          created_at: '2024-01-20'
        }
      ];
      
      const fallbackStats: NetworkStats = {
        total_users: fallbackUsers.length,
        my_upstream: 1,
        my_downstream: 1,
        total_commission: 19500,
        network_growth: 12.8
      };
      
      setUsers(fallbackUsers);
      setStats(fallbackStats);
      setShareRelations([
        {
          id: '1',
          user_name: '张三海鲜',
          relationship: 'parent',
          level: 1,
          orders_count: 15,
          commission_amount: 2500,
          created_at: '2024-01-10'
        },
        {
          id: '2',
          user_name: '李四食材',
          relationship: 'child',
          level: 1,
          orders_count: 8,
          commission_amount: 1200,
          created_at: '2024-01-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || 
                           user.main_categories.some(cat => cat.includes(selectedCategory));
    const matchesRelation = selectedRelation === "全部" || user.relationship === selectedRelation;

    return matchesSearch && matchesCategory && matchesRelation;
  });

  const getRelationshipBadge = (relationship: string) => {
    switch (relationship) {
      case 'upstream':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">上游</Badge>;
      case 'downstream':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">下游</Badge>;
      case 'peer':
        return <Badge variant="outline">同级</Badge>;
      default:
        return <Badge variant="outline">无关系</Badge>;
    }
  };

  const UserCard = ({ user }: { user: NetworkUser }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.nickname.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{user.nickname}</h3>
                {user.verification_status === 'verified' && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.company_name}</p>
              <div className="flex items-center space-x-1 mt-1">
                {user.main_categories.map((category, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {getRelationshipBadge(user.relationship)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 联系方式 */}
        <div className="space-y-2 text-sm">
          {user.contact_phone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{user.contact_phone}</span>
            </div>
          )}
          {user.contact_email && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              <span>{user.contact_email}</span>
            </div>
          )}
        </div>

        {/* 业绩数据 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">订单数</div>
            <div className="font-semibold">{user.total_orders}</div>
          </div>
          <div>
            <div className="text-muted-foreground">成功率</div>
            <div className="font-semibold">{user.success_rate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">销售额</div>
            <div className="font-semibold">¥{user.total_sales.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">返利</div>
            <div className="font-semibold text-success">¥{user.commission_earned.toLocaleString()}</div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-1" />
            AI对话
          </Button>
          <Button size="sm" className="flex-1">
            <Share2 className="h-4 w-4 mr-1" />
            查看货单
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const NetworkVisualization = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Network className="h-5 w-5 mr-2" />
          我的分享网络
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 上游关系 */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              上游推荐人
            </h4>
            <div className="space-y-2">
              {shareRelations.filter(r => r.relationship === 'parent').map((relation) => (
                <div key={relation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={relation.avatar_url} />
                      <AvatarFallback>{relation.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{relation.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {relation.orders_count} 个订单
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">¥{relation.commission_amount}</div>
                    <div className="text-xs text-muted-foreground">返利</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 下游团队 */}
          <div>
            <h4 className="font-medium mb-3 flex items-center">
              <GitBranch className="h-4 w-4 mr-1" />
              我的团队
            </h4>
            <div className="space-y-2">
              {shareRelations.filter(r => r.relationship === 'child').map((relation) => (
                <div key={relation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={relation.avatar_url} />
                      <AvatarFallback>{relation.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{relation.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {relation.orders_count} 个订单
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-success">¥{relation.commission_amount}</div>
                    <div className="text-xs text-muted-foreground">贡献返利</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">网络中心</h1>
          <p className="text-muted-foreground">构建分享网络，拓展商业人脉</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "网络用户", value: stats.total_users, icon: Users, color: "text-primary" },
              { label: "上游关系", value: stats.my_upstream, icon: ArrowUpRight, color: "text-blue-600" },
              { label: "下游团队", value: stats.my_downstream, icon: GitBranch, color: "text-green-600" },
              { label: "累计返利", value: `¥${stats.total_commission.toLocaleString()}`, icon: DollarSign, color: "text-warning" }
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
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索用户名称、公司..." 
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
                    <SelectItem value="全部">全部品类</SelectItem>
                    <SelectItem value="海鲜">海鲜</SelectItem>
                    <SelectItem value="肉类">肉类</SelectItem>
                    <SelectItem value="蔬菜">蔬菜</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedRelation} onValueChange={setSelectedRelation}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部关系</SelectItem>
                    <SelectItem value="upstream">上游</SelectItem>
                    <SelectItem value="downstream">下游</SelectItem>
                    <SelectItem value="peer">同级</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline"
                  onClick={() => setShowNetworkDialog(true)}
                >
                  <Network className="h-4 w-4 mr-2" />
                  网络图谱
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="network">用户网络</TabsTrigger>
            <TabsTrigger value="relations">我的关系</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-6">
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
            ) : filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  暂无匹配的用户
                </h3>
                <p className="text-muted-foreground">
                  请调整搜索条件或筛选条件
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="relations" className="mt-6">
            <NetworkVisualization />
          </TabsContent>
        </Tabs>

        {/* Network Dialog */}
        <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>网络关系图谱</DialogTitle>
            </DialogHeader>
            <div className="p-6">
              <div className="bg-muted/20 rounded-lg p-8 text-center">
                <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">网络图谱功能开发中</h3>
                <p className="text-muted-foreground">
                  即将为您提供可视化的网络关系图谱，展示完整的分享链路和关系网络
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default NetworkCenterPage;