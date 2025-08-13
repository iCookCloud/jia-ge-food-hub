// 供应商信息管理服务
import { supabase } from '@/integrations/supabase/client';

export interface SupplierProfile {
  id: string;
  name: string;
  business_license?: string;
  service_areas?: string[];
  product_categories?: string[];
  quality_certifications?: string[];
  contact_info?: ContactInfo;
  delivery_info?: DeliveryInfo;
  rating_info?: RatingInfo;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  wechat?: string;
  address?: string;
  contact_person?: string;
  business_hours?: string;
  website?: string;
}

export interface DeliveryInfo {
  regions: string[];
  lead_time: number; // 交货期（天）
  minimum_order: number; // 最小起订量
  shipping_cost: number;
  bulk_discount: BulkDiscountRule[];
  free_shipping_threshold?: number; // 包邮门槛
}

export interface BulkDiscountRule {
  min_quantity: number;
  discount_percentage: number;
}

export interface RatingInfo {
  overall_rating: number;
  delivery_rating: number;
  quality_rating: number;
  service_rating: number;
  total_reviews: number;
  recent_orders: number;
}

export interface SupplierRating {
  id: number;
  supplier_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  review?: string;
  delivery_rating: number;
  quality_rating: number;
  service_rating: number;
  images?: string[];
  created_at: string;
}

export interface SupplierFilters {
  service_area?: string;
  product_category?: string;
  min_rating?: number;
  has_certifications?: boolean;
  search?: string;
}

export const supplierService = {
  // 获取供应商列表
  async fetchSuppliers(filters: SupplierFilters = {}, limit = 20, offset = 0) {
    let query = supabase
      .from('supplier_profiles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 应用筛选条件
    if (filters.service_area) {
      query = query.contains('service_areas', [filters.service_area]);
    }
    
    if (filters.product_category) {
      query = query.contains('product_categories', [filters.product_category]);
    }
    
    if (filters.min_rating) {
      query = query.gte('rating_info->overall_rating', filters.min_rating);
    }
    
    if (filters.has_certifications) {
      query = query.not('quality_certifications', 'is', null);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,business_license.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch suppliers: ${error.message}`);
    }
    
    return { data: data || [], count: count || 0 };
  },

  // 获取单个供应商详情
  async fetchSupplierById(id: string): Promise<SupplierProfile | null> {
    const { data, error } = await supabase
      .from('supplier_profiles')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      throw new Error(`Failed to fetch supplier: ${error.message}`);
    }
    
    return data;
  },

  // 创建或更新供应商信息
  async upsertSupplier(supplier: Omit<SupplierProfile, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('supplier_profiles')
      .upsert(supplier)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to upsert supplier: ${error.message}`);
    }
    
    return data;
  },

  // 获取供应商评价
  async getSupplierRatings(supplierId: string, limit = 10, offset = 0) {
    const { data, error, count } = await supabase
      .from('supplier_ratings')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to fetch supplier ratings: ${error.message}`);
    }
    
    return { data: data || [], count: count || 0 };
  },

  // 创建供应商评价
  async createSupplierRating(rating: Omit<SupplierRating, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('supplier_ratings')
      .insert(rating)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create supplier rating: ${error.message}`);
    }
    
    // 更新供应商评分信息
    await this.updateSupplierRatingInfo(rating.supplier_id);
    
    return data;
  },

  // 更新供应商评分信息
  async updateSupplierRatingInfo(supplierId: string) {
    // 获取所有评价
    const { data: ratings } = await supabase
      .from('supplier_ratings')
      .select('rating, delivery_rating, quality_rating, service_rating')
      .eq('supplier_id', supplierId);
    
    if (!ratings || ratings.length === 0) {
      return;
    }
    
    // 计算平均评分
    const totalRatings = ratings.length;
    const avgOverallRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
    const avgDeliveryRating = ratings.reduce((sum, r) => sum + r.delivery_rating, 0) / totalRatings;
    const avgQualityRating = ratings.reduce((sum, r) => sum + r.quality_rating, 0) / totalRatings;
    const avgServiceRating = ratings.reduce((sum, r) => sum + r.service_rating, 0) / totalRatings;
    
    const ratingInfo: RatingInfo = {
      overall_rating: Math.round(avgOverallRating * 10) / 10,
      delivery_rating: Math.round(avgDeliveryRating * 10) / 10,
      quality_rating: Math.round(avgQualityRating * 10) / 10,
      service_rating: Math.round(avgServiceRating * 10) / 10,
      total_reviews: totalRatings,
      recent_orders: totalRatings // 简化处理，实际应该统计最近的订单数
    };
    
    // 更新供应商评分信息
    await supabase
      .from('supplier_profiles')
      .update({ rating_info: ratingInfo })
      .eq('id', supplierId);
  },

  // 获取推荐供应商
  async getRecommendedSuppliers(criteria: {
    product_category?: string;
    service_area?: string;
    min_rating?: number;
  }, limit = 5) {
    let query = supabase
      .from('supplier_profiles')
      .select('*')
      .eq('is_active', true)
      .order('rating_info->overall_rating', { ascending: false })
      .limit(limit);
    
    if (criteria.product_category) {
      query = query.contains('product_categories', [criteria.product_category]);
    }
    
    if (criteria.service_area) {
      query = query.contains('service_areas', [criteria.service_area]);
    }
    
    if (criteria.min_rating) {
      query = query.gte('rating_info->overall_rating', criteria.min_rating);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch recommended suppliers: ${error.message}`);
    }
    
    return data || [];
  },

  // 计算配送费用
  calculateShippingCost(
    deliveryInfo: DeliveryInfo, 
    orderValue: number, 
    quantity: number,
    targetRegion: string
  ): number {
    // 检查是否在配送范围内
    if (!deliveryInfo.regions.includes(targetRegion)) {
      throw new Error('不在配送范围内');
    }
    
    // 检查最小起订量
    if (quantity < deliveryInfo.minimum_order) {
      throw new Error(`最小起订量为${deliveryInfo.minimum_order}件`);
    }
    
    // 检查包邮门槛
    if (deliveryInfo.free_shipping_threshold && orderValue >= deliveryInfo.free_shipping_threshold) {
      return 0;
    }
    
    // 计算批量折扣
    let shippingCost = deliveryInfo.shipping_cost;
    const applicableDiscount = deliveryInfo.bulk_discount
      .filter(rule => quantity >= rule.min_quantity)
      .sort((a, b) => b.discount_percentage - a.discount_percentage)[0];
    
    if (applicableDiscount) {
      shippingCost *= (1 - applicableDiscount.discount_percentage / 100);
    }
    
    return Math.round(shippingCost * 100) / 100;
  },

  // 检查供应商服务能力
  async checkSupplierCapability(
    supplierId: string, 
    requirements: {
      region: string;
      quantity: number;
      expected_delivery_date: Date;
    }
  ) {
    const supplier = await this.fetchSupplierById(supplierId);
    
    if (!supplier || !supplier.delivery_info) {
      throw new Error('供应商信息不完整');
    }
    
    const deliveryInfo = supplier.delivery_info as DeliveryInfo;
    
    // 检查服务区域
    if (!deliveryInfo.regions.includes(requirements.region)) {
      return {
        canServe: false,
        reason: '不在服务区域内'
      };
    }
    
    // 检查最小起订量
    if (requirements.quantity < deliveryInfo.minimum_order) {
      return {
        canServe: false,
        reason: `最小起订量为${deliveryInfo.minimum_order}件`
      };
    }
    
    // 检查交货期
    const leadTimeDays = deliveryInfo.lead_time;
    const earliestDeliveryDate = new Date();
    earliestDeliveryDate.setDate(earliestDeliveryDate.getDate() + leadTimeDays);
    
    if (requirements.expected_delivery_date < earliestDeliveryDate) {
      return {
        canServe: false,
        reason: `最快交货时间为${leadTimeDays}天后`
      };
    }
    
    return {
      canServe: true,
      leadTime: leadTimeDays,
      estimatedDeliveryDate: earliestDeliveryDate
    };
  },

  // 获取供应商统计信息
  async getSupplierStats() {
    const { data, error } = await supabase
      .from('supplier_profiles')
      .select('product_categories, service_areas, rating_info')
      .eq('is_active', true);
    
    if (error) {
      throw new Error(`Failed to fetch supplier stats: ${error.message}`);
    }
    
    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      averageRating: 0
    };
    
    let totalRating = 0;
    let ratedSuppliers = 0;
    
    data?.forEach(supplier => {
      // 统计产品类别
      supplier.product_categories?.forEach(category => {
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });
      
      // 统计服务区域
      supplier.service_areas?.forEach(area => {
        stats.byRegion[area] = (stats.byRegion[area] || 0) + 1;
      });
      
      // 计算平均评分
      if (supplier.rating_info?.overall_rating) {
        totalRating += supplier.rating_info.overall_rating;
        ratedSuppliers++;
      }
    });
    
    if (ratedSuppliers > 0) {
      stats.averageRating = Math.round((totalRating / ratedSuppliers) * 10) / 10;
    }
    
    return stats;
  },

  // 搜索供应商
  async searchSuppliers(query: string, limit = 10) {
    const { data, error } = await supabase
      .from('supplier_profiles')
      .select('id, name, product_categories, service_areas, rating_info')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,business_license.ilike.%${query}%`)
      .order('rating_info->overall_rating', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to search suppliers: ${error.message}`);
    }
    
    return data || [];
  },

  // 获取热门供应商
  async getPopularSuppliers(limit = 10) {
    const { data, error } = await supabase
      .from('supplier_profiles')
      .select('*')
      .eq('is_active', true)
      .order('rating_info->total_reviews', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch popular suppliers: ${error.message}`);
    }
    
    return data || [];
  }
};