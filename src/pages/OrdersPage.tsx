import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Eye,
  ArrowUpRight,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("orders");

  // Mock data
  const orders = [
    {
      id: "ORD001",
      sheet_name: "优质海鲜拼盘",
      total_amount: 2580,
      rebate_earned: 258,
      status: "completed",
      created_at: "2024-01-15",
      share_chain: "供应商A → 分销商B → 我",
      items: [
        { name: "挪威三文鱼片", quantity: 2, price: 256 },
        { name: "澳洲龙虾", quantity: 1, price: 680 }
      ]
    },
    {
      id: "ORD002", 
      sheet_name: "火锅食材套餐",
      total_amount: 1200,
      rebate_earned: 120,
      status: "processing",
      created_at: "2024-01-12",
      share_chain: "供应商C → 我",
      items: [
        { name: "优质牛肉卷", quantity: 3, price: 180 },
        { name: "新鲜蔬菜拼盘", quantity: 2, price: 120 }
      ]
    }
  ];

  const rebateIncome = [
    {
      id: "REB001",
      source_order: "ORD003",
      referral_user: "张三",
      amount: 450,
      rate: 0.15,
      sheet_name: "精选调料套装",
      created_at: "2024-01-14",
      status: "paid"
    },
    {
      id: "REB002",
      source_order: "ORD004", 
      referral_user: "李四",
      amount: 680,
      rate: 0.12,
      sheet_name: "有机蔬菜专供",
      created_at: "2024-01-10",
      status: "pending"
    }
  ];

  const teamPerformance = [
    {
      user: "张三",
      orders_count: 15,
      total_sales: 28500,
      commission_earned: 3420,
      rank: 1
    },
    {
      user: "李四", 
      orders_count: 12,
      total_sales: 22800,
      commission_earned: 2736,
      rank: 2
    },
    {
      user: "王五",
      orders_count: 8,
      total_sales: 15600,
      commission_earned: 1872,
      rank: 3
    }
  ];

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: "bg-success text-success-foreground",
      processing: "bg-warning text-warning-foreground",
      pending: "bg-muted text-muted-foreground",
      paid: "bg-success text-success-foreground"
    };
    const labels = {
      completed: "已完成",
      processing: "处理中", 
      pending: "待结算",
      paid: "已结算"
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">订单与返利中心</h1>
          <p className="text-muted-foreground">管理我的采购订单、返利收入和团队业绩</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总订单", value: orders.length, icon: ShoppingCart },
            { label: "总返利", value: "¥3,420", icon: DollarSign },
            { label: "团队订单", value: 35, icon: Users },
            { label: "本月收益", value: "¥1,130", icon: TrendingUp }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <stat.icon className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">我的订单</TabsTrigger>
            <TabsTrigger value="rebates">返利收入</TabsTrigger>
            <TabsTrigger value="team">团队业绩</TabsTrigger>
          </TabsList>

          {/* My Orders */}
          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{order.sheet_name}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">订单号: {order.id}</p>
                        <p className="text-sm text-muted-foreground">分享链路: {order.share_chain}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">¥{order.total_amount}</p>
                        <p className="text-sm text-success">返利: ¥{order.rebate_earned}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">订单明细</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>¥{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {order.created_at}
                      </span>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Rebate Income */}
          <TabsContent value="rebates" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">返利明细</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    导出明细
                  </Button>
                  <Button size="sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    申请提现
                  </Button>
                </div>
              </div>

              {rebateIncome.map((rebate) => (
                <Card key={rebate.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{rebate.sheet_name}</h4>
                          {getStatusBadge(rebate.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">推荐用户: {rebate.referral_user}</p>
                        <p className="text-sm text-muted-foreground">返利比例: {(rebate.rate * 100).toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">订单号: {rebate.source_order}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-success">+¥{rebate.amount}</p>
                        <p className="text-sm text-muted-foreground">{rebate.created_at}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Team Performance */}
          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  团队贡献排行榜
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamPerformance.map((member) => (
                    <div key={member.user} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {member.rank}
                        </div>
                        <div>
                          <h4 className="font-medium">{member.user}</h4>
                          <p className="text-sm text-muted-foreground">{member.orders_count} 个订单</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">¥{member.total_sales.toLocaleString()}</p>
                        <p className="text-sm text-success">返利: ¥{member.commission_earned}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default OrdersPage;