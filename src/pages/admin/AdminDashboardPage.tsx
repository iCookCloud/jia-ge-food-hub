import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Users,
  Building2,
  FileText,
  ShoppingCart,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  Filter,
  Eye,
  Shield
} from "lucide-react";

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock admin data
  const systemStats = {
    total_users: 1250,
    verified_suppliers: 89,
    active_sheets: 456,
    total_orders: 3420,
    total_revenue: 2580000,
    monthly_growth: 12.5
  };

  const pendingVerifications = [
    {
      id: "VER001",
      company_name: "新鲜食材供应链",
      contact_person: "李明",
      contact_email: "liming@fresh.com",
      business_license: "91110000123456789A",
      submitted_at: "2024-01-15",
      status: "pending"
    },
    {
      id: "VER002",
      company_name: "优质海鲜直供",
      contact_person: "王强",
      contact_email: "wangqiang@seafood.com", 
      business_license: "91110000987654321B",
      submitted_at: "2024-01-14",
      status: "pending"
    }
  ];

  const recentOrders = [
    {
      id: "ORD001",
      user_email: "user1@example.com",
      sheet_name: "精选海鲜拼盘",
      amount: 2580,
      rebate: 258,
      status: "completed",
      created_at: "2024-01-15"
    },
    {
      id: "ORD002",
      user_email: "user2@example.com", 
      sheet_name: "火锅食材套餐",
      amount: 1200,
      rebate: 120,
      status: "processing",
      created_at: "2024-01-14"
    }
  ];

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-warning text-warning-foreground",
      verified: "bg-success text-success-foreground",
      rejected: "bg-destructive text-destructive-foreground",
      completed: "bg-success text-success-foreground",
      processing: "bg-blue-500 text-white",
      cancelled: "bg-muted text-muted-foreground"
    };
    const labels = {
      pending: "待审核",
      verified: "已认证", 
      rejected: "已拒绝",
      completed: "已完成",
      processing: "处理中",
      cancelled: "已取消"
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const handleVerifySupplier = (id: string, action: 'approve' | 'reject') => {
    console.log(`${action} supplier ${id}`);
    // Here you would update the verification status
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">管理后台</h1>
            <p className="text-muted-foreground">平台用户、企业认证和订单管理</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              生成报告
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="verification">企业认证</TabsTrigger>
            <TabsTrigger value="monitoring">监控中心</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: "总用户", value: systemStats.total_users, icon: Users, color: "text-blue-500" },
                { label: "认证供应商", value: systemStats.verified_suppliers, icon: Building2, color: "text-green-500" },
                { label: "活跃货单", value: systemStats.active_sheets, icon: FileText, color: "text-purple-500" },
                { label: "总订单", value: systemStats.total_orders, icon: ShoppingCart, color: "text-orange-500" },
                { label: "平台收入", value: `¥${(systemStats.total_revenue / 10000).toFixed(1)}万`, icon: BarChart3, color: "text-red-500" },
                { label: "月增长", value: `${systemStats.monthly_growth}%`, icon: AlertTriangle, color: "text-indigo-500" }
              ].map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>待处理认证</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingVerifications.slice(0, 3).map((verification) => (
                      <div key={verification.id} className="flex items-center justify-between p-3 rounded border">
                        <div>
                          <p className="font-medium">{verification.company_name}</p>
                          <p className="text-sm text-muted-foreground">{verification.contact_person}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(verification.status)}
                          <Button size="sm" variant="outline">审核</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>最新订单</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded border">
                        <div>
                          <p className="font-medium">{order.sheet_name}</p>
                          <p className="text-sm text-muted-foreground">{order.user_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">¥{order.amount}</p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>用户管理</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="搜索用户..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      筛选
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { email: "zhangsan@example.com", nickname: "张三", role: "supplier", status: "verified", last_active: "2024-01-15" },
                    { email: "lisi@example.com", nickname: "李四", role: "buyer", status: "active", last_active: "2024-01-14" },
                    { email: "wangwu@example.com", nickname: "王五", role: "supplier", status: "pending", last_active: "2024-01-13" }
                  ].map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded border">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{user.nickname}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="outline">{user.role === 'supplier' ? '供应商' : '采购商'}</Badge>
                          {getStatusBadge(user.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">最后活跃: {user.last_active}</span>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          查看
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  企业认证管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingVerifications.map((verification) => (
                    <Card key={verification.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold text-lg mb-2">{verification.company_name}</h4>
                                <div className="space-y-1 text-sm">
                                  <p><span className="text-muted-foreground">联系人:</span> {verification.contact_person}</p>
                                  <p><span className="text-muted-foreground">邮箱:</span> {verification.contact_email}</p>
                                  <p><span className="text-muted-foreground">营业执照:</span> {verification.business_license}</p>
                                  <p><span className="text-muted-foreground">提交时间:</span> {verification.submitted_at}</p>
                                </div>
                              </div>
                              <div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(verification.status)}
                                  </div>
                                  <div className="space-y-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerifySupplier(verification.id, 'approve')}
                                      className="w-full"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      通过认证
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleVerifySupplier(verification.id, 'reject')}
                                      className="w-full"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      拒绝认证
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>订单监控</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded border">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.sheet_name}</p>
                          <p className="text-xs text-muted-foreground">{order.user_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">¥{order.amount}</p>
                          <p className="text-sm text-success">返利: ¥{order.rebate}</p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>风控预警</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded border border-warning bg-warning/10">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="font-medium">异常订单检测</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        发现3个可疑的高额订单，建议人工审核
                      </p>
                    </div>
                    
                    <div className="p-3 rounded border border-blue-200 bg-blue-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">系统运行正常</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        所有核心服务运行稳定
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;