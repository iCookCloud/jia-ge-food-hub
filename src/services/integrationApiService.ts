// 供应链设计一体化 API 服务
import { designCaseService, DesignCase, CaseFilters } from './designCaseService';
import { supplierService, SupplierProfile, SupplierFilters } from './supplierService';
import { globalErpService } from './globalErpService';

export interface IntegratedCaseResponse {
  case: DesignCase;
  recommendations: ProductRecommendation[];
  suppliers: SupplierProfile[];
  cost_estimation: CostEstimation;
}

export interface ProductRecommendation {
  product_id: string;
  category?: string;
  priority: number;
  usage_description?: string;
  quantity_suggestion: number;
  product_info: {
    id: string;
    standard_chinese_name: string;
    price: number;
    category: string;
    supplier_id?: string;
    [key: string]: unknown;
  };
  supplier_info?: SupplierProfile;
}

export interface CostEstimation {
  total_min: number;
  total_max: number;
  breakdown: CostBreakdown[];
  budget_level: 'low' | 'medium' | 'high';
}

export interface CostBreakdown {
  category: string;
  items: CostItem[];
  subtotal_min: number;
  subtotal_max: number;
}

export interface CostItem {
  name: string;
  quantity: number;
  unit_price_min: number;
  unit_price_max: number;
  total_min: number;
  total_max: number;
}

export interface SearchResult {
  cases: DesignCase[];
  products: Array<{
    id: string;
    standard_chinese_name: string;
    price: number;
    category: string;
    [key: string]: unknown;
  }>;
  suppliers: SupplierProfile[];
  total_results: number;
}

export const integrationApiService = {
  // 获取案例完整信息（包含推荐商品和供应商）
  async getCaseComplete(caseId: number): Promise<IntegratedCaseResponse> {
    try {
      // 1. 获取案例和推荐商品
      const caseWithRecommendations = await designCaseService.getCaseWithRecommendations(caseId);
      
      if (!caseWithRecommendations) {
        throw new Error('案例不存在');
      }
      
      const { case: designCase, recommendations } = caseWithRecommendations;
      
      // 2. 获取供应商信息
      const supplierIds = new Set<string>();
      recommendations.forEach(rec => {
        if (rec.product_info?.supplier_id) {
          supplierIds.add(rec.product_info.supplier_id);
        }
      });
      
      const suppliers: SupplierProfile[] = [];
      for (const supplierId of supplierIds) {
        const supplier = await supplierService.fetchSupplierById(supplierId);
        if (supplier) {
          suppliers.push(supplier);
        }
      }
      
      // 3. 生成成本预估
      const costEstimation = this.generateCostEstimation(recommendations, designCase);
      
      // 4. 合并供应商信息到推荐商品
      const enhancedRecommendations = recommendations.map(rec => ({
        ...rec,
        supplier_info: suppliers.find(s => s.id === rec.product_info?.supplier_id)
      }));
      
      return {
        case: designCase,
        recommendations: enhancedRecommendations,
        suppliers: suppliers,
        cost_estimation: costEstimation
      };
    } catch (error) {
      throw new Error(`获取案例完整信息失败: ${error.message}`);
    }
  },

  // 根据案例获取成本预估
  async getCasesCostEstimation(
    caseId: number, 
    budgetLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<CostEstimation> {
    try {
      const recommendations = await designCaseService.getCaseRecommendations(caseId);
      const designCase = await designCaseService.fetchCaseById(caseId);
      
      if (!designCase) {
        throw new Error('案例不存在');
      }
      
      return this.generateCostEstimation(recommendations, designCase, budgetLevel);
    } catch (error) {
      throw new Error(`获取成本预估失败: ${error.message}`);
    }
  },

  // 生成成本预估
  generateCostEstimation(
    recommendations: Array<{
      category?: string;
      quantity_suggestion?: number;
      product_info?: {
        standard_chinese_name?: string;
        price?: number;
        [key: string]: unknown;
      };
    }>, 
    designCase: DesignCase, 
    budgetLevel: 'low' | 'medium' | 'high' = 'medium'
  ): CostEstimation {
    const multipliers = {
      low: { min: 0.8, max: 1.0 },
      medium: { min: 1.0, max: 1.3 },
      high: { min: 1.3, max: 1.8 }
    };
    
    const multiplier = multipliers[budgetLevel];
    
    // 按类别分组
    const categoryGroups: Record<string, typeof recommendations> = {};
    recommendations.forEach(rec => {
      const category = rec.category || '其他';
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(rec);
    });
    
    // 计算每个类别的成本
    const breakdown: CostBreakdown[] = [];
    let totalMin = 0;
    let totalMax = 0;
    
    Object.entries(categoryGroups).forEach(([category, items]) => {
      const categoryItems: CostItem[] = items.map(rec => {
        const basePrice = rec.product_info?.price || 100;
        const quantity = rec.quantity_suggestion || 1;
        
        const unitPriceMin = basePrice * multiplier.min;
        const unitPriceMax = basePrice * multiplier.max;
        const totalItemMin = unitPriceMin * quantity;
        const totalItemMax = unitPriceMax * quantity;
        
        return {
          name: rec.product_info?.standard_chinese_name || '未知商品',
          quantity: quantity,
          unit_price_min: Math.round(unitPriceMin * 100) / 100,
          unit_price_max: Math.round(unitPriceMax * 100) / 100,
          total_min: Math.round(totalItemMin * 100) / 100,
          total_max: Math.round(totalItemMax * 100) / 100
        };
      });
      
      const subtotalMin = categoryItems.reduce((sum, item) => sum + item.total_min, 0);
      const subtotalMax = categoryItems.reduce((sum, item) => sum + item.total_max, 0);
      
      breakdown.push({
        category,
        items: categoryItems,
        subtotal_min: Math.round(subtotalMin * 100) / 100,
        subtotal_max: Math.round(subtotalMax * 100) / 100
      });
      
      totalMin += subtotalMin;
      totalMax += subtotalMax;
    });
    
    return {
      total_min: Math.round(totalMin * 100) / 100,
      total_max: Math.round(totalMax * 100) / 100,
      breakdown,
      budget_level: budgetLevel
    };
  },

  // 根据风格和预算推荐商品
  async getRecommendationsByStyle(
    style: string,
    budget?: { min?: number; max?: number },
    limit = 20
  ) {
    try {
      const filters = {
        style,
        budget_range: budget
      };
      
      const { data: products } = await globalErpService.getRecommendedProducts(filters, { limit });
      
      // 获取相关供应商信息
      const supplierIds = new Set(products.map(p => p.supplier_id).filter(Boolean));
      const suppliers: SupplierProfile[] = [];
      
      for (const supplierId of supplierIds) {
        const supplier = await supplierService.fetchSupplierById(supplierId);
        if (supplier) {
          suppliers.push(supplier);
        }
      }
      
      const recommendations = products.map(product => ({
        product_id: product.id,
        category: product.category,
        priority: 0,
        usage_description: `适用于${style}风格设计`,
        quantity_suggestion: 1,
        product_info: product,
        supplier_info: suppliers.find(s => s.id === product.supplier_id)
      }));
      
      return {
        recommendations,
        suppliers: suppliers.filter((supplier, index, self) => 
          index === self.findIndex(s => s.id === supplier.id)
        )
      };
    } catch (error) {
      throw new Error(`获取风格推荐失败: ${error.message}`);
    }
  },

  // 综合搜索（案例、商品、供应商）
  async globalSearch(query: string, filters?: {
    type?: 'cases' | 'products' | 'suppliers' | 'all';
    style?: string;
    category?: string;
    location?: string;
  }): Promise<SearchResult> {
    const searchType = filters?.type || 'all';
    const results: SearchResult = {
      cases: [],
      products: [],
      suppliers: [],
      total_results: 0
    };
    
    try {
      if (searchType === 'all' || searchType === 'cases') {
        const caseFilters: CaseFilters = {
          search: query,
          style: filters?.style,
          category: filters?.category,
          location: filters?.location
        };
        const { data: cases } = await designCaseService.fetchCases(caseFilters, 10);
        results.cases = cases;
      }
      
      if (searchType === 'all' || searchType === 'products') {
        const { data: products } = await globalErpService.fetchProducts({
          search: query,
          category: filters?.category
        }, { limit: 10 });
        results.products = products;
      }
      
      if (searchType === 'all' || searchType === 'suppliers') {
        const supplierFilters: SupplierFilters = {
          search: query,
          product_category: filters?.category
        };
        const { data: suppliers } = await supplierService.fetchSuppliers(supplierFilters, 10);
        results.suppliers = suppliers;
      }
      
      results.total_results = results.cases.length + results.products.length + results.suppliers.length;
      
      return results;
    } catch (error) {
      throw new Error(`搜索失败: ${error.message}`);
    }
  },

  // 获取个性化推荐
  async getPersonalizedRecommendations(userId: string, limit = 20) {
    try {
      // 1. 获取用户偏好（这里简化处理，实际应该查询用户偏好表）
      const userPreferences = {
        preferred_styles: ['现代简约', '北欧风'],
        budget_range: { min: 100, max: 1000 },
        preferred_categories: ['家具', '照明']
      };
      
      // 2. 基于偏好推荐商品
      const recommendations = [];
      
      for (const style of userPreferences.preferred_styles) {
        const styleRecs = await this.getRecommendationsByStyle(
          style, 
          userPreferences.budget_range, 
          Math.ceil(limit / userPreferences.preferred_styles.length)
        );
        recommendations.push(...styleRecs.recommendations);
      }
      
      // 3. 去重并按优先级排序
      const uniqueRecommendations = recommendations
        .filter((rec, index, self) => 
          index === self.findIndex(r => r.product_id === rec.product_id)
        )
        .slice(0, limit);
      
      return uniqueRecommendations;
    } catch (error) {
      throw new Error(`获取个性化推荐失败: ${error.message}`);
    }
  },

  // 批量获取商品详细信息
  async getBatchProductDetails(productIds: string[]) {
    try {
      const products = await globalErpService.fetchProductsByIds(productIds);
      
      // 获取供应商信息
      const supplierIds = new Set(products.map(p => p.supplier_id).filter(Boolean));
      const suppliers: SupplierProfile[] = [];
      
      for (const supplierId of supplierIds) {
        const supplier = await supplierService.fetchSupplierById(supplierId);
        if (supplier) {
          suppliers.push(supplier);
        }
      }
      
      // 合并商品和供应商信息
      const enhancedProducts = products.map(product => ({
        ...product,
        supplier_info: suppliers.find(s => s.id === product.supplier_id)
      }));
      
      return enhancedProducts;
    } catch (error) {
      throw new Error(`获取商品详细信息失败: ${error.message}`);
    }
  },

  // 检查供应商服务能力
  async checkSupplyChainCapability(
    productIds: string[],
    requirements: {
      region: string;
      quantities: Record<string, number>;
      expected_delivery_date: Date;
    }
  ) {
    try {
      const products = await globalErpService.fetchProductsByIds(productIds);
      const results = [];
      
      for (const product of products) {
        if (product.supplier_id) {
          const quantity = requirements.quantities[product.id] || 1;
          const capability = await supplierService.checkSupplierCapability(
            product.supplier_id,
            {
              region: requirements.region,
              quantity: quantity,
              expected_delivery_date: requirements.expected_delivery_date
            }
          );
          
          results.push({
            product_id: product.id,
            product_name: product.standard_chinese_name,
            supplier_id: product.supplier_id,
            capability: capability
          });
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`检查供应链能力失败: ${error.message}`);
    }
  }
};