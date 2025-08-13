// 设计案例服务
import { supabase } from '@/integrations/supabase/client';
import { globalErpService } from './globalErpService';

export interface DesignCase {
  id: number;
  title: string;
  style: string;
  area?: string;
  location?: string;
  designer?: string;
  designer_id?: string;
  price?: string;
  image?: string;
  images?: string[];
  category?: string;
  tags?: string[];
  likes: number;
  description?: string;
  estimated_budget_min?: number;
  estimated_budget_max?: number;
  material_list?: string[];
  supplier_recommendations?: string[];
  created_at: string;
  updated_at: string;
}

export interface CaseProductAssociation {
  id: number;
  case_id: number;
  product_id: string;
  category?: string;
  priority: number;
  usage_description?: string;
  quantity_suggestion: number;
  created_at: string;
}

export interface ProductRecommendation {
  product_id: string;
  category?: string;
  priority: number;
  usage_description?: string;
  quantity_suggestion: number;
  product_info?: {
    id: string;
    standard_chinese_name: string;
    price: number;
    category: string;
    supplier_id?: string;
    [key: string]: unknown;
  }; // ERP商品信息
}

export interface CaseFilters {
  style?: string;
  category?: string;
  location?: string;
  search?: string;
  budget_min?: number;
  budget_max?: number;
}

export const designCaseService = {
  // 获取设计案例列表
  async fetchCases(filters: CaseFilters = {}, limit = 20, offset = 0) {
    let query = supabase
      .from('design_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 应用筛选条件
    if (filters.style) {
      query = query.eq('style', filters.style);
    }
    
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,designer.ilike.%${filters.search}%`);
    }
    
    if (filters.budget_min !== undefined) {
      query = query.gte('estimated_budget_min', filters.budget_min);
    }
    
    if (filters.budget_max !== undefined) {
      query = query.lte('estimated_budget_max', filters.budget_max);
    }

    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch design cases: ${error.message}`);
    }
    
    return { data: data || [], count: count || 0 };
  },

  // 获取单个设计案例详情
  async fetchCaseById(id: number): Promise<DesignCase | null> {
    const { data, error } = await supabase
      .from('design_cases')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      throw new Error(`Failed to fetch design case: ${error.message}`);
    }
    
    return data;
  },

  // 获取案例的推荐商品
  async getCaseRecommendations(caseId: number): Promise<ProductRecommendation[]> {
    // 1. 获取案例商品关联
    const { data: associations, error } = await supabase
      .from('case_product_associations')
      .select('*')
      .eq('case_id', caseId)
      .order('priority', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch case associations: ${error.message}`);
    }
    
    if (!associations || associations.length === 0) {
      return [];
    }
    
    // 2. 获取ERP商品信息
    const productIds = associations.map(assoc => assoc.product_id);
    const erpProducts = await globalErpService.fetchProductsByIds(productIds) as Array<{
      id: string;
      standard_chinese_name: string;
      price: number;
      category: string;
      supplier_id?: string;
      [key: string]: unknown;
    }>;
    
    // 3. 合并关联信息和商品信息
    const recommendations: ProductRecommendation[] = associations.map(assoc => {
      const productInfo = erpProducts.find(product => product.id === assoc.product_id);
      
      return {
        product_id: assoc.product_id,
        category: assoc.category,
        priority: assoc.priority,
        usage_description: assoc.usage_description,
        quantity_suggestion: assoc.quantity_suggestion,
        product_info: productInfo
      };
    });
    
    return recommendations;
  },

  // 获取案例完整信息（包含推荐商品）
  async getCaseWithRecommendations(caseId: number) {
    const [designCase, recommendations] = await Promise.all([
      this.fetchCaseById(caseId),
      this.getCaseRecommendations(caseId)
    ]);
    
    if (!designCase) {
      return null;
    }
    
    return {
      case: designCase,
      recommendations: recommendations
    };
  },

  // 基于案例风格获取相关商品
  async getStyleBasedRecommendations(style: string, limit = 12) {
    try {
      const { data: products } = await globalErpService.getProductsByDesignStyle(style, { limit });
      
      return products.map((product: {
        id: string;
        standard_chinese_name: string;
        category: string;
        [key: string]: unknown;
      }) => ({
        product_id: product.id,
        category: product.category,
        priority: 0,
        usage_description: `适用于${style}风格设计`,
        quantity_suggestion: 1,
        product_info: product
      }));
    } catch (error) {
      console.error('Failed to get style-based recommendations:', error);
      return [];
    }
  },

  // 创建案例商品关联
  async createCaseProductAssociation(association: Omit<CaseProductAssociation, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('case_product_associations')
      .insert(association)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create case product association: ${error.message}`);
    }
    
    return data;
  },

  // 更新案例商品关联
  async updateCaseProductAssociation(id: number, updates: Partial<CaseProductAssociation>) {
    const { data, error } = await supabase
      .from('case_product_associations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update case product association: ${error.message}`);
    }
    
    return data;
  },

  // 删除案例商品关联
  async deleteCaseProductAssociation(id: number) {
    const { error } = await supabase
      .from('case_product_associations')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete case product association: ${error.message}`);
    }
  },

  // 增加案例点赞数
  async likeCase(caseId: number) {
    const { data, error } = await supabase
      .from('design_cases')
      .update({ likes: supabase.sql`likes + 1` } as unknown as { likes: number })
      .eq('id', caseId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to like case: ${error.message}`);
    }
    
    return data;
  },

  // 创建设计案例
  async createCase(caseData: Omit<DesignCase, 'id' | 'likes' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('design_cases')
      .insert({
        ...caseData,
        likes: 0
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create design case: ${error.message}`);
    }
    
    return data;
  },

  // 更新设计案例
  async updateCase(id: number, updates: Partial<DesignCase>) {
    const { data, error } = await supabase
      .from('design_cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update design case: ${error.message}`);
    }
    
    return data;
  },

  // 删除设计案例
  async deleteCase(id: number) {
    const { error } = await supabase
      .from('design_cases')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete design case: ${error.message}`);
    }
  },

  // 获取热门案例
  async getPopularCases(limit = 10) {
    const { data, error } = await supabase
      .from('design_cases')
      .select('*')
      .order('likes', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch popular cases: ${error.message}`);
    }
    
    return data || [];
  },

  // 获取最新案例
  async getLatestCases(limit = 10) {
    const { data, error } = await supabase
      .from('design_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to fetch latest cases: ${error.message}`);
    }
    
    return data || [];
  },

  // 获取案例统计信息
  async getCaseStats() {
    const { data, error } = await supabase
      .from('design_cases')
      .select('style, category, location')
      .not('style', 'is', null);
    
    if (error) {
      throw new Error(`Failed to fetch case stats: ${error.message}`);
    }
    
    const stats = {
      total: data?.length || 0,
      byStyle: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byLocation: {} as Record<string, number>
    };
    
    data?.forEach(item => {
      if (item.style) {
        stats.byStyle[item.style] = (stats.byStyle[item.style] || 0) + 1;
      }
      if (item.category) {
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
      }
      if (item.location) {
        stats.byLocation[item.location] = (stats.byLocation[item.location] || 0) + 1;
      }
    });
    
    return stats;
  }
};