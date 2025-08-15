import { supabase } from '@/integrations/supabase/client';
import { globalErpService } from './globalErpService';
import { FilterParams, PaginationParams } from './api';

// 材料/素材内容服务（同时支持视频和图片）
export const materialService = {
  async getAll(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    // 并行获取视频和图片数据
    const [videosResult, imagesResult] = await Promise.all([
      this.getVideos(filters, pagination),
      this.getImages(filters, pagination)
    ]);

    // 合并数据并标记类型
    const videos = (videosResult.data || []).map(video => ({ ...video, type: 'video' }));
    const images = (imagesResult.data || []).map(image => ({ ...image, type: 'image' }));
    
    // 合并并按时间排序
    const allMaterials = [...videos, ...images]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 应用分页到合并后的结果
    const startIndex = pagination.page && pagination.limit ? (pagination.page - 1) * pagination.limit : 0;
    const endIndex = pagination.limit ? startIndex + pagination.limit : allMaterials.length;
    const paginatedData = allMaterials.slice(startIndex, endIndex);

    return { 
      data: paginatedData, 
      error: videosResult.error || imagesResult.error 
    };
  },

  async getVideos(filters: FilterParams = {}, pagination: PaginationParams = {}) {
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

    if (filters.user_only) {
      query = query.eq('uploaded_by', filters.user_only);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async getImages(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    let query = supabase
      .from('uploaded_images')
      .select(`
        *,
        image_product_associations (
          product_id: original_product_id
        )
      `)
      .eq('is_active', true);

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    if (filters.user_only) {
      query = query.eq('uploaded_by', filters.user_only);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
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
          product_sku,
          product_name,
          product_snapshot
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
          product_sku,
          product_name,
          product_snapshot
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
          product_sku,
          product_name,
          product_snapshot
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
      productsResult,
      ordersCount,
      videosCount
    ] = await Promise.all([
      globalErpService.fetchProducts({}, { limit: 1000 }).then(result => ({ 
        data: null, 
        error: null, 
        count: result.data?.length || 0 
      })),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('product_videos').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('status', 'ready')
    ]);

    return {
      data: {
        products: productsResult.count || 0,
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