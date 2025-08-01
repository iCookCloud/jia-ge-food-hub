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
      status: "completed",
      created_at: "2024-01-15",
      supplier_name: "海鲜供应商A",
      items: [
        { name: "挪威三文鱼片", quantity: 2, price: 256 },
        { name: "澳洲龙虾", quantity: 1, price: 680 }
      ]
    },
    {
      id: "ORD002", 
      sheet_name: "火锅食材套餐",
      total_amount: 1200,
      status: "processing",
      created_at: "2024-01-12",
      supplier_name: "火锅食材供应商C",
      items: [
        { name: "优质牛肉卷", quantity: 3, price: 180 },
        { name: "新鲜蔬菜拼盘", quantity: 2, price: 120 }
      ]
    }
  ];

  const orderStats = [
    {
      period: "本月",
      orders_count: 15,
      total_amount: 28500,
      avg_order: 1900
    },
    {
      period: "上月",
      orders_count: 12,
      total_amount: 22800,
      avg_order: 1900
    },
    {
      period: "本年",
      orders_count: 156,
      total_amount: 285000,
      avg_order: 1827
    }
  ];

  const recentSuppliers = [
    {
      name: "海鲜供应商A",
      orders_count: 15,
      total_purchases: 28500,
      last_order: "2024-01-15",
      rating: 4.8
    },
    {
      name: "火锅食材供应商C", 
      orders_count: 12,
      total_purchases: 22800,
      last_order: "2024-01-12",
      rating: 4.6
    },
    {
      name: "调料供应商B",
      orders_count: 8,
      total_purchases: 15600,
      last_order: "2024-01-10",
      rating: 4.7
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
          <h1 className="text-3xl font-bold text-foreground mb-2">订单管理中心</h1>
          <p className="text-muted-foreground">管理我的采购订单和供应商关系</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总订单", value: orders.length, icon: ShoppingCart },
            { label: "总金额", value: "¥3,780", icon: DollarSign },
            { label: "供应商", value: 3, icon: Users },
            { label: "本月采购", value: "¥2,580", icon: TrendingUp }
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
            <TabsTrigger value="stats">订单统计</TabsTrigger>
            <TabsTrigger value="suppliers">供应商关系</TabsTrigger>
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
                        <p className="text-sm text-muted-foreground">供应商: {order.supplier_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">¥{order.total_amount}</p>
                        <p className="text-sm text-muted-foreground">{order.created_at}</p>
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

          {/* Order Statistics */}
          <TabsContent value="stats" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">订单统计</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  导出报表
                </Button>
              </div>

              {orderStats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{stat.period}</h4>
                        <p className="text-sm text-muted-foreground">共 {stat.orders_count} 个订单</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">¥{stat.total_amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">平均每单: ¥{stat.avg_order}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Supplier Relationships */}
          <TabsContent value="suppliers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  常用供应商
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSuppliers.map((supplier, index) => (
                    <div key={supplier.name} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{supplier.name}</h4>
                          <p className="text-sm text-muted-foreground">{supplier.orders_count} 个订单 • 最近订单: {supplier.last_order}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">¥{supplier.total_purchases.toLocaleString()}</p>
                        <div className="flex items-center text-sm text-warning">
                          <span className="mr-1">⭐</span>
                          <span>{supplier.rating}</span>
                        </div>
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