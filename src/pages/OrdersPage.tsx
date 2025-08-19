import { useState, useMemo } from "react";
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
  Package,
  FileText,
  CheckCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useProductLists } from "@/hooks/useProductLists";
import { useOrders } from "@/hooks/useOrders";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { orderListShareService } from "@/services/orderListShareService";
import { orderListResponseService } from "@/services/orderListResponseService";
import { useCart } from "@/hooks/useCart";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState("order-lists");
  const [orderFilter, setOrderFilter] = useState("all"); // "all", "pending", "confirmed"
  const { data: productLists, isLoading } = useProductLists();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { isSupplier } = useAuth();
  const [sharedOrderLists, setSharedOrderLists] = useState([]);
  const [loadingShared, setLoadingShared] = useState(false);
  const navigate = useNavigate();
  const { items: cartItems, getTotalItems, getTotalAmount, clearCart } = useCart();
  const { toast } = useToast();
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  // 分离货单和订单
  const { orderLists, filteredOrders } = useMemo(() => {
    const allLists = productLists || [];
    const allOrders = orders || [];
    
    // 货单：草稿、已分享、协商中状态
    const orderLists = allLists.filter(list => 
      ['draft', 'shared', 'negotiating'].includes(list.status)
    );
    
    // 真正的订单：从 orders 表查询，按状态筛选
    let filteredOrders = allOrders;
    if (orderFilter === "pending") {
      filteredOrders = allOrders.filter(order => order.is_confirmed === false);
    } else if (orderFilter === "confirmed") {
      filteredOrders = allOrders.filter(order => order.is_confirmed === true);
    }
    
    return { orderLists, filteredOrders };
  }, [productLists, orders, orderFilter]);

  // 加载分享给我的货单（供应商视图）
  const loadSharedOrderLists = async () => {
    if (!isSupplier) return;
    
    setLoadingShared(true);
    try {
      const data = await orderListShareService.getSharedOrderLists();
      setSharedOrderLists(data);
    } catch (error) {
      console.error('Error loading shared order lists:', error);
    } finally {
      setLoadingShared(false);
    }
  };

  useEffect(() => {
    if (isSupplier) {
      loadSharedOrderLists();
    }
  }, [isSupplier]);

  // 确认订单
  const handleConfirmOrder = async (orderId: string) => {
    try {
      setConfirmingOrderId(orderId);
      
      // 调用数据库函数确认订单
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('用户未登录');
      
      const { error } = await supabase.rpc('confirm_order', { order_id: orderId });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "订单确认成功",
        description: "订单已确认，供应商将开始准备商品",
      });
      
      // 刷新订单数据
      window.location.reload();
      
    } catch (error) {
      console.error('确认订单失败:', error);
      toast({
        title: "确认失败",
        description: error instanceof Error ? error.message : "确认订单时发生错误",
        variant: "destructive",
      });
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-muted text-muted-foreground",
      shared: "bg-blue-100 text-blue-800",
      negotiating: "bg-orange-100 text-orange-800", 
      confirmed: "bg-green-100 text-green-800",
      delivered: "bg-success text-success-foreground",
      expired: "bg-destructive text-destructive-foreground",
      pending: "bg-gray-100 text-gray-800",
      viewed: "bg-blue-100 text-blue-800",
      quoted: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
    };
    const labels = {
      draft: "草稿",
      shared: "已分享", 
      negotiating: "协商中",
      confirmed: "已确认",
      delivered: "已交付",
      expired: "已过期",
      pending: "待查看",
      viewed: "已查看",
      quoted: "已报价",
      declined: "已拒绝"
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">订单管理中心</h1>
          <p className="text-muted-foreground">管理我的货单和订单</p>
        </div>

        {/* 购物车摘要 */}
        {getTotalItems() > 0 && (
          <Card className="bg-primary/5 border-primary/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                    {getTotalItems() > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {getTotalItems()}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      已选 {getTotalItems()} 件商品
                    </div>
                    <div className="text-xs text-muted-foreground">
                      合计：¥{getTotalAmount().toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => navigate('/create-order-list')}
                  >
                    生成货单
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearCart}>
                    清空
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "货单总数", value: orderLists.length, icon: FileText },
            { label: "订单总数", value: (orders || []).length, icon: CheckCircle },
            { label: "协商中", value: orderLists.filter(list => list.status === 'negotiating').length, icon: Users },
            { label: "草稿", value: orderLists.filter(list => list.status === 'draft').length, icon: TrendingUp }
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
          <TabsList className={`grid w-full ${isSupplier ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="order-lists" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              我的货单 ({orderLists.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed-orders" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              我的订单 ({filteredOrders.length})
            </TabsTrigger>
            {isSupplier && (
              <TabsTrigger value="shared-to-me" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                收到的货单 ({sharedOrderLists.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* 货单列表 */}
          <TabsContent value="order-lists" className="mt-6">
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
            ) : orderLists.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
                {orderLists.map((list) => (
                <Card key={list.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{list.name}</h3>
                          {getStatusBadge(list.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">货单号: {list.id.slice(0, 8)}</p>
                        {list.share_code && (
                          <p className="text-sm text-muted-foreground">分享码: {list.share_code}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">¥{list.total_amount?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">货单明细</h4>
                      <div className="space-y-2">
                        {list.items?.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>¥{item.price?.toLocaleString()}</span>
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
                        <Button variant="outline" size="sm" className="text-sm px-3" asChild>
                          <Link to={`/order-lists/${list.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            查看详情
                          </Link>
                        </Button>
                        {list.status === "draft" && (
                          <Button size="sm" className="text-sm px-3" asChild>
                            <Link to={`/order-lists/${list.id}`}>
                              <ArrowUpRight className="w-4 h-4 mr-1" />
                              分享货单
                            </Link>
                          </Button>
                        )}
                        {list.status === "negotiating" && (
                          <Button size="sm" className="text-sm px-3" asChild>
                            <Link to={`/negotiations`}>
                              <Users className="w-4 h-4 mr-1" />
                              查看协商
                            </Link>
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

          {/* 订单列表 */}
          <TabsContent value="confirmed-orders" className="mt-6">
            {/* 订单状态筛选 */}
            <div className="flex gap-2 mb-6">
              <Button 
                variant={orderFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderFilter("all")}
              >
                全部订单
              </Button>
              <Button 
                variant={orderFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderFilter("pending")}
              >
                待确认 ({orders?.filter(o => o.is_confirmed === false).length || 0})
              </Button>
              <Button 
                variant={orderFilter === "confirmed" ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderFilter("confirmed")}
              >
                已确认 ({orders?.filter(o => o.is_confirmed === true).length || 0})
              </Button>
            </div>

            {ordersLoading ? (
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
            ) : filteredOrders.length === 0 ? (
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {orderFilter === "pending" ? "没有待确认的订单" : 
                   orderFilter === "confirmed" ? "没有已确认的订单" : "还没有订单"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {orderFilter === "pending" ? "当供应商提交报价后，会生成待确认订单" : 
                   "当供应商提交报价并确认后，会生成订单"}
                </p>
                <Button asChild variant="outline">
                  <Link to="/quotations">
                    <Users className="h-4 w-4 mr-2" />
                    查看报价
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">订单 #{order.id.slice(0, 8)}</h3>
                          <Badge variant={order.is_confirmed ? "default" : "secondary"}>
                            {order.is_confirmed ? "已确认" : "待确认"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          创建时间: {formatDateTime(order.created_at)}
                        </p>
                        {order.confirmed_at && (
                          <p className="text-sm text-muted-foreground">
                            确认时间: {formatDateTime(order.confirmed_at)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">¥{order.total_amount?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">总金额</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          状态: {order.status || "pending"}
                        </div>
                        <div className="flex gap-2">
                          {!order.is_confirmed && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                查看详情
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleConfirmOrder(order.id)}
                                disabled={confirmingOrderId === order.id}
                              >
                                {confirmingOrderId === order.id ? "确认中..." : "确认订单"}
                              </Button>
                            </>
                          )}
                          {order.is_confirmed && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              查看详情
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 收到的货单列表（供应商视图） */}
          {isSupplier && (
            <TabsContent value="shared-to-me" className="mt-6">
              {loadingShared ? (
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
              ) : sharedOrderLists.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    还没有收到货单分享
                  </h3>
                  <p className="text-muted-foreground">
                    等待买家向您分享货单，然后您可以查看并报价
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sharedOrderLists.map((share) => (
                    <Card key={share.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {share.order_list_info?.name || '未命名货单'}
                              </h3>
                              {getStatusBadge(share.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              分享人: {share.sharer_info?.nickname || '未知用户'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              分享时间: {formatDateTime(share.shared_at)}
                            </p>
                            {share.share_message && (
                              <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                "{share.share_message}"
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              ¥{share.order_list_info?.total_amount?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">
                          <span className="text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            货单创建时间: {share.order_list_info?.created_at ? formatDateTime(share.order_list_info.created_at) : '未知'}
                          </span>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-sm px-3" 
                              asChild
                              onClick={() => {
                                // 标记为已查看
                                if (share.status === 'pending') {
                                  orderListShareService.updateShareStatus(share.id, 'viewed');
                                  loadSharedOrderLists(); // 重新加载
                                }
                              }}
                            >
                              <Link to={`/order-lists/${share.order_list_id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                查看详情
                              </Link>
                            </Button>
                            {share.status !== 'declined' && (
                              <Button 
                                size="sm" 
                                className="text-sm px-3" 
                                asChild
                              >
                                <Link to={`/customer-quotation/${share.order_list_id}`}>
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  立即报价
                                </Link>
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
          )}

        </Tabs>
      </div>
    </Layout>
  );
};

export default OrdersPage;