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
import { useProductLists } from "@/hooks/useProductLists";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("lists");
  const { data: realProductLists } = useProductLists();

  // Mock data
  const productLists = [
    {
      id: "LIST001",
      name: "优质海鲜拼盘",
      total_amount: 2580,
      status: "shared",
      created_at: "2024-01-15",
      share_code: "HXP001",
      items: [
        { name: "挪威三文鱼片", quantity: 2, price: 256 },
        { name: "澳洲龙虾", quantity: 1, price: 680 }
      ]
    },
    {
      id: "LIST002", 
      name: "火锅食材套餐",
      total_amount: 1200,
      status: "draft",
      created_at: "2024-01-12",
      share_code: "",
      items: [
        { name: "优质牛肉卷", quantity: 3, price: 180 },
        { name: "新鲜蔬菜拼盘", quantity: 2, price: 120 }
      ]
    }
  ];

  // Use real data if available, otherwise use mock data
  const displayLists = realProductLists && realProductLists.length > 0 ? realProductLists : productLists;

  const getStatusBadge = (status: string) => {
    const colors = {
      shared: "bg-success text-success-foreground",
      draft: "bg-muted text-muted-foreground",
      expired: "bg-destructive text-destructive-foreground"
    };
    const labels = {
      shared: "已分享",
      draft: "草稿",
      expired: "已过期"
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">货单管理中心</h1>
          <p className="text-muted-foreground">管理我的货单和分享链接</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "总货单", value: productLists.length, icon: ShoppingCart },
            { label: "总金额", value: "¥3,780", icon: DollarSign },
            { label: "已分享", value: 1, icon: Users },
            { label: "本月创建", value: "¥2,580", icon: TrendingUp }
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
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="lists">我的货单</TabsTrigger>
          </TabsList>

          {/* My Product Lists */}
          <TabsContent value="lists" className="mt-6">
            <div className="space-y-4">
              {displayLists.map((list) => (
                <Card key={list.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{list.name}</h3>
                          {getStatusBadge(list.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">货单号: {list.id}</p>
                        {list.share_code && (
                          <p className="text-sm text-muted-foreground">分享码: {list.share_code}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">¥{list.total_amount}</p>
                        <p className="text-sm text-muted-foreground">{list.created_at}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">货单明细</h4>
                      <div className="space-y-2">
                        {list.items.map((item, index) => (
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
                        {list.created_at}
                      </span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          查看详情
                        </Button>
                        {list.status === "draft" && (
                          <Button size="sm">
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            分享货单
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
};

export default OrdersPage;