import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Package, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import { useToast } from '@/hooks/use-toast';

interface StatsData {
  totalProducts: number;
  totalSuppliers: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
}

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await analyticsService.getDashboardStats();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setStats(result.data);
    } catch (error) {
      toast({
        title: '数据加载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-muted-foreground">暂无数据</p>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      title: '商品总数',
      value: formatNumber(stats.totalProducts),
      icon: Package,
      description: '活跃商品数量',
      trend: '+12%',
      trendUp: true
    },
    {
      title: '认证供应商',
      value: formatNumber(stats.totalSuppliers),
      icon: Users,
      description: '已认证供应商',
      trend: '+5%',
      trendUp: true
    },
    {
      title: '订单总数',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      description: '历史订单总量',
      trend: '+23%',
      trendUp: true
    },
    {
      title: '总收入',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: '累计交易金额',
      trend: '+18%',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={item.trendUp ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {item.trend}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 最近订单 */}
      {stats.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">最近订单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order, index) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">订单 #{order.id.slice(-8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">
                      {formatCurrency(parseFloat(order.total_amount || '0'))}
                    </p>
                    <Badge 
                      variant={
                        order.status === 'completed' ? 'default' :
                        order.status === 'pending' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {order.status === 'completed' ? '已完成' :
                       order.status === 'pending' ? '处理中' : order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};