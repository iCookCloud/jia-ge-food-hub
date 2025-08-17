// 智能推荐算法服务
import { supabase } from '@/integrations/supabase/client';
import { designCaseService, DesignCase } from './designCaseService';
import { supplierService, SupplierProfile } from './supplierService';

export interface UserPreferences {
  id?: number;
  user_id: string;
  preferred_styles: string[];
  preferred_categories: string[];
  budget_range: {
    min: number;
    max: number;
  };
  quality_priority: number; // 1-10
  price_priority: number; // 1-10
  brand_preferences: string[];
  recent_views: string[]; // 最近浏览的商品ID
  recent_cases: number[]; // 最近浏览的案例ID
  updated_at?: string;
}

export interface RecommendationScore {
  product_id: string;
  score: number;
  reasons: string[];
  category: string;
  style_match: number;
  budget_match: number;
  preference_match: number;
  popularity_score: number;
}

export interface ProductRecommendation {
  product_id: string;
  product_info: {
    id: string;
    standard_chinese_name: string;
    price: number;
    category: string;
    supplier_id?: string;
    main_image_url?: string;
    [key: string]: unknown;
  };
  score: number;
  reasons: string[];
  category?: string;
  priority: number;
  usage_description?: string;
  quantity_suggestion: number;
  supplier_info?: SupplierProfile;
}

export interface RecommendationParams {
  user_id?: string;
  style?: string;
  category?: string;
  budget_range?: { min: number; max: number };
  case_id?: number;
  limit?: number;
  exclude_products?: string[];
}

export class RecommendationEngine {
  constructor() {}

  // 计算风格匹配度
  private calculateStyleMatch(productName: string, productSpec: string, targetStyle: string): number {
    const styleKeywords: Record<string, string[]> = {
      '现代简约': ['现代', '简约', '简洁', '极简', '纯色', '线条', '几何'],
      '工业风': ['工业', '复古', '铁艺', '金属', '仿旧', '做旧', '粗糙', '黑色'],
      '侘寂风': ['侘寂', '自然', '原木', '素雅', '禅意', '朴素', '天然', '手工'],
      '轻奢风': ['轻奢', '高端', '精品', '奢华', '品质', '质感', '精致', '优雅'],
      '中式风': ['中式', '古典', '传统', '红木', '古色', '雕花', '古韵', '典雅'],
      '北欧风': ['北欧', '白色', '清新', '简洁', 'Nordic', '自然', '木质', '明亮'],
      '地中海风': ['地中海', '蓝白', '海洋', '清爽', '条纹', '航海', '休闲'],
      '田园风': ['田园', '乡村', '花卉', '碎花', '温馨', '自然', '绿色', '清新']
    };

    const keywords = styleKeywords[targetStyle] || [targetStyle];
    const searchText = (productName + ' ' + (productSpec || '')).toLowerCase();
    
    let matchCount = 0;
    const totalKeywords = keywords.length;
    
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    return matchCount / totalKeywords;
  }

  // 计算预算匹配度
  private calculateBudgetMatch(price: number, budgetRange: { min: number; max: number }): number {
    if (!budgetRange.min && !budgetRange.max) return 1;
    
    const min = budgetRange.min || 0;
    const max = budgetRange.max || Infinity;
    
    if (price >= min && price <= max) {
      return 1;
    } else if (price < min) {
      return Math.max(0, 1 - (min - price) / min);
    } else {
      return Math.max(0, 1 - (price - max) / max);
    }
  }

  // 计算用户偏好匹配度
  private calculatePreferenceMatch(
    productCategory: string, 
    productName: string,
    userPreferences: UserPreferences
  ): number {
    let score = 0;
    let factors = 0;

    // 类别偏好匹配
    if (userPreferences.preferred_categories.includes(productCategory)) {
      score += 0.4;
    }
    factors += 0.4;

    // 品牌偏好匹配
    if (userPreferences.brand_preferences.length > 0) {
      const hasBrandMatch = userPreferences.brand_preferences.some(brand => 
        productName.toLowerCase().includes(brand.toLowerCase())
      );
      if (hasBrandMatch) {
        score += 0.3;
      }
      factors += 0.3;
    }

    // 最近浏览相关性
    if (userPreferences.recent_views.length > 0) {
      // 简化：如果类别与最近浏览的商品类别相关，给予额外分数
      score += 0.3;
      factors += 0.3;
    }

    return factors > 0 ? score / factors : 0;
  }

  // 计算商品流行度分数
  private calculatePopularityScore(productId: string): number {
    // 简化处理：根据商品ID的长度和字符特征计算一个伪流行度分数
    // 实际项目中应该基于真实的销量、浏览量、评价等数据
    const hash = Array.from(productId).reduce((hash, char) => {
      return hash * 31 + char.charCodeAt(0);
    }, 0);
    
    return Math.abs(hash % 100) / 100;
  }

  // 生成推荐分数
  async generateRecommendationScores(
    products: Array<{
      id: string;
      standard_chinese_name: string;
      price: number;
      category: string;
      specification?: string;
      [key: string]: unknown;
    }>,
    params: RecommendationParams,
    userPreferences?: UserPreferences
  ): Promise<RecommendationScore[]> {
    const scores: RecommendationScore[] = [];

    for (const product of products) {
      const reasons: string[] = [];
      let totalScore = 0;
      let weightSum = 0;

      // 1. 风格匹配度 (权重: 30%)
      let styleMatch = 0;
      if (params.style) {
        styleMatch = this.calculateStyleMatch(
          product.standard_chinese_name,
          product.specification || '',
          params.style
        );
        totalScore += styleMatch * 0.3;
        weightSum += 0.3;
        
        if (styleMatch > 0.6) {
          reasons.push(`高度匹配${params.style}风格`);
        } else if (styleMatch > 0.3) {
          reasons.push(`部分匹配${params.style}风格`);
        }
      }

      // 2. 预算匹配度 (权重: 25%)
      let budgetMatch = 0;
      if (params.budget_range) {
        budgetMatch = this.calculateBudgetMatch(product.price, params.budget_range);
        totalScore += budgetMatch * 0.25;
        weightSum += 0.25;
        
        if (budgetMatch > 0.8) {
          reasons.push('价格合适');
        } else if (budgetMatch > 0.5) {
          reasons.push('价格接近预算');
        }
      }

      // 3. 用户偏好匹配度 (权重: 25%)
      let preferenceMatch = 0;
      if (userPreferences) {
        preferenceMatch = this.calculatePreferenceMatch(
          product.category,
          product.standard_chinese_name,
          userPreferences
        );
        totalScore += preferenceMatch * 0.25;
        weightSum += 0.25;
        
        if (preferenceMatch > 0.7) {
          reasons.push('符合个人偏好');
        }
      }

      // 4. 商品流行度 (权重: 20%)
      const popularityScore = this.calculatePopularityScore(product.id);
      totalScore += popularityScore * 0.2;
      weightSum += 0.2;
      
      if (popularityScore > 0.7) {
        reasons.push('热门商品');
      }

      // 5. 类别匹配加分
      if (params.category && product.category === params.category) {
        totalScore += 0.1;
        reasons.push(`${params.category}类别匹配`);
      }

      // 标准化分数
      const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

      scores.push({
        product_id: product.id,
        score: Math.round(finalScore * 100) / 100,
        reasons: reasons.length > 0 ? reasons : ['基础推荐'],
        category: product.category,
        style_match: styleMatch,
        budget_match: budgetMatch,
        preference_match: preferenceMatch,
        popularity_score: popularityScore
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  // 多样性优化：确保推荐结果的类别多样性
  private diversifyRecommendations(scores: RecommendationScore[], limit: number): RecommendationScore[] {
    const categoryMap = new Map<string, RecommendationScore[]>();
    
    // 按类别分组
    scores.forEach(score => {
      if (!categoryMap.has(score.category)) {
        categoryMap.set(score.category, []);
      }
      categoryMap.get(score.category)!.push(score);
    });

    // 按类别轮询选择，保证多样性
    const result: RecommendationScore[] = [];
    const categories = Array.from(categoryMap.keys());
    let categoryIndex = 0;

    while (result.length < limit && categories.length > 0) {
      const currentCategory = categories[categoryIndex];
      const categoryScores = categoryMap.get(currentCategory);
      
      if (categoryScores && categoryScores.length > 0) {
        result.push(categoryScores.shift()!);
      }
      
      // 如果当前类别已经没有商品了，移除该类别
      if (!categoryScores || categoryScores.length === 0) {
        categories.splice(categoryIndex, 1);
        if (categoryIndex >= categories.length) {
          categoryIndex = 0;
        }
      } else {
        categoryIndex = (categoryIndex + 1) % categories.length;
      }
    }

    return result;
  }
}

export const recommendationService = {
  engine: new RecommendationEngine(),

  // 获取用户偏好
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_product_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 用户偏好不存在
      }
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      preferred_styles: Array.isArray(data.style_preference) ? data.style_preference : [data.style_preference].filter(Boolean),
      preferred_categories: Array.isArray(data.product_category) ? data.product_category : [data.product_category].filter(Boolean),
      budget_range: {
        min: data.price_range_min || 0,
        max: data.price_range_max || 10000
      },
      quality_priority: data.quality_priority || 5,
      price_priority: data.price_priority || 5,
      brand_preferences: data.brand_preferences || [],
      recent_views: [], // TODO: 从用户行为记录中获取
      recent_cases: [], // TODO: 从用户浏览记录中获取
      updated_at: data.updated_at
    };
  },

  // 创建或更新用户偏好
  async updateUserPreferences(preferences: Omit<UserPreferences, 'id' | 'updated_at'>): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_product_preferences')
      .upsert({
        user_id: preferences.user_id,
        style_preference: preferences.preferred_styles,
        product_category: preferences.preferred_categories,
        price_range_min: preferences.budget_range.min,
        price_range_max: preferences.budget_range.max,
        quality_priority: preferences.quality_priority,
        price_priority: preferences.price_priority,
        brand_preferences: preferences.brand_preferences
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }

    return {
      id: data.id,
      user_id: data.user_id,
      preferred_styles: Array.isArray(data.style_preference) ? data.style_preference : [data.style_preference].filter(Boolean),
      preferred_categories: Array.isArray(data.product_category) ? data.product_category : [data.product_category].filter(Boolean),
      budget_range: {
        min: data.price_range_min || 0,
        max: data.price_range_max || 10000
      },
      quality_priority: data.quality_priority || 5,
      price_priority: data.price_priority || 5,
      brand_preferences: data.brand_preferences || [],
      recent_views: preferences.recent_views,
      recent_cases: preferences.recent_cases,
      updated_at: data.updated_at
    };
  },

  // 基于案例的推荐
  async getRecommendationsForCase(caseId: number, params: RecommendationParams = {}): Promise<ProductRecommendation[]> {
    try {
      // 1. 获取案例信息
      const designCase = await designCaseService.fetchCaseById(caseId);
      if (!designCase) {
        throw new Error('设计案例不存在');
      }

      // 2. 获取用户偏好（如果提供了用户ID）
      let userPreferences: UserPreferences | null = null;
      if (params.user_id) {
        userPreferences = await this.getUserPreferences(params.user_id);
      }

      // 3. 基于案例风格获取候选商品
      const { data: products } = await supabase
        .from('products_with_categories')
        .select('*')
        .eq('is_active', true)
        .ilike('search_text', `%${designCase.style}%`)
        .limit(params.limit ? params.limit * 3 : 60); // 获取更多候选商品用于筛选

      // 4. 生成推荐分数
      const recommendationParams = {
        ...params,
        style: designCase.style,
        case_id: caseId
      };

      const scores = await this.engine.generateRecommendationScores(
        products,
        recommendationParams,
        userPreferences || undefined
      );

      // 5. 多样性优化
      const diversifiedScores = this.engine['diversifyRecommendations'](scores, params.limit || 20);

      // 6. 获取供应商信息并构建最终推荐结果
      const recommendations: ProductRecommendation[] = [];
      
      for (const score of diversifiedScores) {
        const product = products.find(p => p.id === score.product_id);
        if (!product) continue;

        let supplierInfo: SupplierProfile | undefined;
        if (product.supplier_id) {
          supplierInfo = await supplierService.fetchSupplierById(product.supplier_id) || undefined;
        }

        recommendations.push({
          product_id: score.product_id,
          product_info: product,
          score: score.score,
          reasons: score.reasons,
          category: score.category,
          priority: Math.round(score.score * 10),
          usage_description: `适用于${designCase.style}风格设计`,
          quantity_suggestion: 1,
          supplier_info: supplierInfo
        });
      }

      return recommendations;
    } catch (error) {
      throw new Error(`获取案例推荐失败: ${error.message}`);
    }
  },

  // 个性化推荐
  async getPersonalizedRecommendations(userId: string, params: RecommendationParams = {}): Promise<ProductRecommendation[]> {
    try {
      // 1. 获取用户偏好
      const userPreferences = await this.getUserPreferences(userId);
      if (!userPreferences) {
        // 如果没有偏好记录，返回通用推荐
        return this.getGeneralRecommendations(params);
      }

      // 2. 基于用户偏好获取候选商品
      const candidateProducts: Array<{
        id: string;
        standard_chinese_name: string;
        price: number;
        category: string;
        [key: string]: unknown;
      }> = [];

      // 2.1 基于偏好风格获取商品
      for (const style of userPreferences.preferred_styles) {
        const { data: styleProducts } = await supabase
          .from('products_with_categories')
          .select('*')
          .eq('is_active', true)
          .ilike('search_text', `%${style}%`)
          .limit(20);
        candidateProducts.push(...(styleProducts || []));
      }

      // 2.2 基于偏好类别获取商品
      for (const category of userPreferences.preferred_categories) {
        const { data: categoryProducts } = await supabase
          .from('products_with_categories')
          .select('*')
          .eq('is_active', true)
          .ilike('primary_category_name', `%${category}%`)
          .limit(20);
        candidateProducts.push(...(categoryProducts || []));
      }

      // 去重
      const uniqueProducts = candidateProducts.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );

      // 3. 生成推荐分数
      const recommendationParams = {
        ...params,
        budget_range: userPreferences.budget_range,
        user_id: userId
      };

      const scores = await this.engine.generateRecommendationScores(
        uniqueProducts,
        recommendationParams,
        userPreferences
      );

      // 4. 多样性优化
      const diversifiedScores = this.engine['diversifyRecommendations'](scores, params.limit || 20);

      // 5. 构建推荐结果
      const recommendations: ProductRecommendation[] = [];
      
      for (const score of diversifiedScores) {
        const product = uniqueProducts.find(p => p.id === score.product_id);
        if (!product) continue;

        let supplierInfo: SupplierProfile | undefined;
        if (product.supplier_id) {
          supplierInfo = await supplierService.fetchSupplierById(product.supplier_id) || undefined;
        }

        recommendations.push({
          product_id: score.product_id,
          product_info: product,
          score: score.score,
          reasons: score.reasons,
          category: score.category,
          priority: Math.round(score.score * 10),
          usage_description: this.generateUsageDescription(product, userPreferences),
          quantity_suggestion: 1,
          supplier_info: supplierInfo
        });
      }

      return recommendations;
    } catch (error) {
      throw new Error(`获取个性化推荐失败: ${error.message}`);
    }
  },

  // 通用推荐（无用户偏好时使用）
  async getGeneralRecommendations(params: RecommendationParams = {}): Promise<ProductRecommendation[]> {
    try {
      let query = supabase
        .from('products_with_categories')
        .select('*')
        .eq('is_active', true);
      
      if (params.category) {
        query = query.ilike('primary_category_name', `%${params.category}%`);
      }
      
      const { data: products } = await query
        .order('unit_price', { ascending: true })
        .limit(params.limit || 20);

      const scores = await this.engine.generateRecommendationScores(
        products,
        params
      );

      const recommendations: ProductRecommendation[] = [];
      
      for (const score of scores.slice(0, params.limit || 20)) {
        const product = products.find(p => p.id === score.product_id);
        if (!product) continue;

        let supplierInfo: SupplierProfile | undefined;
        if (product.supplier_id) {
          supplierInfo = await supplierService.fetchSupplierById(product.supplier_id) || undefined;
        }

        recommendations.push({
          product_id: score.product_id,
          product_info: product,
          score: score.score,
          reasons: score.reasons,
          category: score.category,
          priority: Math.round(score.score * 10),
          usage_description: '推荐商品',
          quantity_suggestion: 1,
          supplier_info: supplierInfo
        });
      }

      return recommendations;
    } catch (error) {
      throw new Error(`获取通用推荐失败: ${error.message}`);
    }
  },

  // 生成使用说明
  generateUsageDescription(
    product: { category: string; standard_chinese_name: string },
    userPreferences: UserPreferences
  ): string {
    const primaryStyle = userPreferences.preferred_styles[0];
    const category = product.category;
    
    const usageTemplates: Record<string, Record<string, string>> = {
      '家具': {
        '现代简约': '简洁线条设计，适合现代简约空间',
        '工业风': '粗犷质感，营造工业风氛围',
        '北欧风': '自然材质，打造北欧清新感',
        'default': '实用美观，提升空间品质'
      },
      '照明': {
        '现代简约': '简约灯具，提供充足照明',
        '工业风': '复古灯饰，增添个性氛围',
        '轻奢风': '精致灯具，彰显品质生活',
        'default': '优质照明，美化空间环境'
      },
      'default': {
        'default': '优质商品推荐'
      }
    };

    const categoryTemplates = usageTemplates[category] || usageTemplates['default'];
    return categoryTemplates[primaryStyle] || categoryTemplates['default'];
  },

  // 相似商品推荐
  async getSimilarProducts(productId: string, limit = 10): Promise<ProductRecommendation[]> {
    try {
      // 1. 获取基础商品信息
      const { data: baseProduct } = await supabase
        .from('products_with_categories')
        .select('*')
        .eq('id', productId)
        .single();
        
      if (!baseProduct) {
        throw new Error('商品不存在');
      }

      // 2. 基于同类别获取候选商品
      const { data: similarProducts } = await supabase
        .from('products_with_categories')
        .select('*')
        .eq('is_active', true)
        .eq('primary_category_name', baseProduct.primary_category_name)
        .neq('id', productId)
        .limit(limit * 2); // 获取更多候选商品用于筛选

      // 过滤掉自身
      const candidates = similarProducts.filter(p => p.id !== productId);

      // 3. 基于相似度排序
      const recommendations: ProductRecommendation[] = [];
      
      for (const product of candidates.slice(0, limit)) {
        let supplierInfo: SupplierProfile | undefined;
        if (product.supplier_id) {
          supplierInfo = await supplierService.fetchSupplierById(product.supplier_id) || undefined;
        }

        recommendations.push({
          product_id: product.id,
          product_info: product,
          score: 0.8, // 基础相似度分数
          reasons: ['同类别商品'],
          category: product.category,
          priority: 5,
          usage_description: '相似商品推荐',
          quantity_suggestion: 1,
          supplier_info: supplierInfo
        });
      }

      return recommendations;
    } catch (error) {
      throw new Error(`获取相似商品推荐失败: ${error.message}`);
    }
  }
};