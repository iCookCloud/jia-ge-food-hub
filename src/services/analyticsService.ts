import { supabase } from '@/integrations/supabase/client';
import { globalErpService } from './globalErpService';
import { handleApiError } from './api';

export interface AnalyticsData {
  totalProducts: number;
  totalSuppliers: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  topProducts: any[];
  supplierStats: any[];
  orderTrends: any[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export const analyticsService = {
  /**
   * 获取总体统计数据
   */
  async getDashboardStats(dateRange?: DateRange) {
    try {
      const promises = [
        // 商品总数 - 从Global ERP获取
        globalErpService.fetchProducts({}, { limit: 1000 }).then(result => ({ 
          data: null, 
          error: null, 
          count: result.data?.length || 0 
        })),


        // 订单总数
        supabase
          .from('orders')
          .select('id, total_amount', { count: 'exact' })
          .gte('created_at', dateRange?.startDate || '2024-01-01')
          .lte('created_at', dateRange?.endDate || new Date().toISOString()),

        // 最近订单
        supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            status,
            created_at,
            order_items (
              quantity,
              unit_price,
              product_id
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10)
      ];

      const [productsResult, ordersResult, recentOrdersResult] = 
        await Promise.all(promises);

      if (productsResult.error) throw productsResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (recentOrdersResult.error) throw recentOrdersResult.error;

      // 计算总收入
      const totalRevenue = (ordersResult.data || []).reduce((sum: number, order: any) => 
        sum + parseFloat(String(order.total_amount) || '0'), 0);

      return {
        data: {
          totalProducts: productsResult.count || 0,
          totalSuppliers: 0, // 移除供应商功能
          totalOrders: ordersResult.count || 0,
          totalRevenue,
          recentOrders: recentOrdersResult.data || []
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: handleApiError(error as Error)
      };
    }
  },

  /**
   * 获取热门商品统计
   */
  async getTopProducts(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          product_sku,
          product_name,
          product_snapshot
        `)
        .limit(100); // 先获取较多数据用于统计

      if (error) throw error;

      // 按产品SKU统计销量和收入
      const productStats = data?.reduce((acc, item) => {
        const productSku = item.product_sku;
        if (!productSku) return acc;

        if (!acc[productSku]) {
          acc[productSku] = {
            product_sku: productSku,
            product_name: item.product_name,
            totalQuantity: 0,
            totalRevenue: 0,
            product_snapshot: item.product_snapshot
          };
        }

        acc[productSku].totalQuantity += item.quantity;
        acc[productSku].totalRevenue += item.quantity * parseFloat(String(item.unit_price) || '0');

        return acc;
      }, {} as Record<string, any>) || {};

      // 转换为数组并排序
      const topProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return {
        data: topProducts,
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: handleApiError(error as Error)
      };
    }
  },

  /**
   * 获取供应商业绩统计 - 已移除供应商功能
   */
  async getSupplierStats() {
    return {
      data: [],
      error: null
    };
  },

  /**
   * 获取订单趋势数据
   */
  async getOrderTrends(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 按日期分组统计
      const trends = data?.reduce((acc, order) => {
        const date = order.created_at.split('T')[0]; // 获取日期部分
        
        if (!acc[date]) {
          acc[date] = {
            date,
            orderCount: 0,
            revenue: 0,
            completedOrders: 0
          };
        }

        acc[date].orderCount += 1;
        acc[date].revenue += parseFloat(String(order.total_amount) || '0');
        if (order.status === 'completed') {
          acc[date].completedOrders += 1;
        }

        return acc;
      }, {} as Record<string, any>) || {};

      return {
        data: Object.values(trends),
        error: null
      };
    } catch (error) {
      return {
        data: [],
        error: handleApiError(error as Error)
      };
    }
  },

  /**
   * 获取用户活动统计
   */
  async getUserActivityStats() {
    try {
      // 这里可以根据需要扩展更多用户活动统计
      const { data, error } = await supabase
        .from('user_footprints')
        .select('user_id, visited_at, product_id')
        .gte('visited_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 最近24小时
        .order('visited_at', { ascending: false });

      if (error) throw error;

      const activeUsers = new Set(data?.map(fp => fp.user_id)).size;
      const pageViews = data?.length || 0;

      return {
        data: {
          activeUsers,
          pageViews,
          details: data || []
        },
        error: null
      };
    } catch (error) {
      return {
        data: { activeUsers: 0, pageViews: 0, details: [] },
        error: handleApiError(error as Error)
      };
    }
  }
};