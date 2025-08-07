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
  Target,
  Package
} from "lucide-react";
import { Link } from "react-router-dom";
import { useProductLists } from "@/hooks/useProductLists";
import { formatDateTime } from "@/lib/utils";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("lists");
  const { data: productLists, isLoading } = useProductLists();

  // 使用真实数据，如果没有数据则显示空数组
  const displayLists = productLists || [];

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
            { label: "总货单", value: displayLists.length, icon: ShoppingCart },
            { label: "总金额", value: `¥${displayLists.reduce((sum, list) => sum + list.total_amount, 0).toLocaleString()}`, icon: DollarSign },
            { label: "已分享", value: displayLists.filter(list => list.status === 'shared').length, icon: Users },
            { label: "草稿", value: displayLists.filter(list => list.status === 'draft').length, icon: TrendingUp }
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
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : displayLists.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  还没有创建任何货单
                </h3>
                <p className="text-muted-foreground mb-4">
                  去商品页面添加商品到购物车，然后生成货单吧
                </p>
                <Button asChild>
                  <Link to="/products">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    去选购商品
                  </Link>
                </Button>
              </Card>
            ) : (
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

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDateTime(list.created_at)}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-sm px-3">
                          <Eye className="w-4 h-4 mr-1" />
                          查看详情
                        </Button>
                        {list.status === "draft" && (
                          <Button size="sm" className="text-sm px-3">
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                            分享货单
                          </Button>
                        )}
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
};

export default OrdersPage;