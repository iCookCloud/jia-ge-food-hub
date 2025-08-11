import { supabase } from '@/integrations/supabase/client';
import { FilterParams, PaginationParams } from './api';

// 材料/视频内容服务
export const materialService = {
  async getAll(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    let query = supabase
      .from('product_videos')
      .select(`
        *,
        video_product_associations (
          product_id
        )
      `)
      .eq('is_active', true)
      .eq('status', 'ready'); // 只显示已就绪可播放的视频

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // 修复分页逻辑：确保offset计算正确
    if (pagination.page && pagination.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('product_videos')
      .select(`
        *,
        video_product_associations (
          product_id,
          products (
            standard_chinese_name,
            standard_english_name,
            unit_price
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .eq('status', 'ready') // 只允许查看已就绪的视频
      .single();
    
    return { data, error };
  },

  async getByProductId(productId: string) {
    const { data, error } = await supabase
      .from('video_product_associations')
      .select(`
        product_videos!inner (
          *
        )
      `)
      .eq('product_id', productId)
      .eq('product_videos.is_active', true)
      .eq('product_videos.status', 'ready'); // 只返回可播放的视频
    
    return { data, error };
  }
};

// 订单服务
export const orderService = {
  async getAll(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            standard_chinese_name,
            standard_english_name
          )
        )
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (pagination.page && pagination.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            standard_chinese_name,
            standard_english_name,
            unit_price,
            unit
          )
        )
      `)
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  async create(orderData: any) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    return { data, error };
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  }
};

// 通用数据统计服务
export const statisticsService = {
  async getDashboardStats() {
    const [
      productsCount,
      ordersCount,
      videosCount
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('status', 'ready')
    ]);

    return {
      data: {
        products: productsCount.count || 0,
        suppliers: 0, // 移除供应商功能
        orders: ordersCount.count || 0,
        videos: videosCount.count || 0
      },
      error: null
    };
  },

  async getRecentActivity(limit: number = 10) {
    // 获取最近的订单、报价等活动
    const [orders, quotations] = await Promise.all([
      supabase
        .from('orders')
        .select('id, status, created_at, total_amount')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('quotations')
        .select('id, status, created_at, total_amount')
        .order('created_at', { ascending: false })
        .limit(limit)
    ]);

    // 合并并排序活动
    const activities = [
      ...(orders.data || []).map(order => ({ ...order, type: 'order' })),
      ...(quotations.data || []).map(quote => ({ ...quote, type: 'quotation' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, limit);

    return { data: activities, error: orders.error || quotations.error };
  }
};