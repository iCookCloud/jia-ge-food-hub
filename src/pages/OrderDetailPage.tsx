import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  User
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useOrder } from '@/hooks/useOrders';
import { formatDateTime } from '@/lib/utils';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, error } = useOrder(id!);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              订单不存在
            </h3>
            <p className="text-muted-foreground mb-4">
              请检查订单编号是否正确
            </p>
            <Button onClick={() => navigate('/orders')} variant="outline">
              返回订单列表
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回订单列表
          </Button>
          <div>
            <h1 className="text-2xl font-bold">订单详情</h1>
            <p className="text-muted-foreground">订单号: {order.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 订单基本信息 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  订单信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">订单状态:</span>
                  <Badge variant={order.is_confirmed ? "default" : "secondary"}>
                    {order.is_confirmed ? "已确认" : "待确认"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">总金额:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ¥{order.total_amount?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">创建时间:</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(order.created_at)}
                  </span>
                </div>

                {order.confirmed_at && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">确认时间:</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {formatDateTime(order.confirmed_at)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">订单状态:</span>
                  <span>{order.status || 'pending'}</span>
                </div>
              </CardContent>
            </Card>

            {/* 订单商品明细 */}
            {order.order_items && order.order_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>商品明细</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item: any, index: number) => (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product_name || item.product_sku}</h4>
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.product_sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              ¥{item.unit_price?.toLocaleString()} × {item.quantity}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              小计: ¥{((item.unit_price || 0) * (item.quantity || 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {index < order.order_items.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧操作区域 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  订单操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!order.is_confirmed ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      此订单正在等待您的确认
                    </p>
                    <Button className="w-full" size="lg">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      确认订单
                    </Button>
                    <Button variant="outline" className="w-full">
                      联系供应商
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-green-600 mb-4">
                      ✓ 订单已确认，供应商正在准备商品
                    </p>
                    <Button variant="outline" className="w-full">
                      联系供应商
                    </Button>
                    <Button variant="outline" className="w-full">
                      查看物流
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 相关信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  相关信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.quotation_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">报价编号:</span>
                    <span className="text-sm font-mono">
                      {order.quotation_id.slice(0, 8)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm">订单编号:</span>
                  <span className="text-sm font-mono">
                    {order.id.slice(0, 8)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;