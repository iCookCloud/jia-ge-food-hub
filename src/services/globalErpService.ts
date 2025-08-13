// Global ERP 连接服务
const GLOBAL_ERP_BASE_URL = 'https://bugntldehbdyfipzykdd.supabase.co/rest/v1';
const PRODUCT_FIELDS = 'id,sku,standard_chinese_name,price,category,specification,main_image_url,is_active,weight,variants,image_urls';

const getHeaders = (includeCount = false) => {
  const headers: Record<string, string> = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z250bGRlaGJkeWZpcHp5a2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTI0NzcsImV4cCI6MjA2MDg4ODQ3N30.M6-BjX6Km_B7ZP5WQWDiMGTSVLW2_sVyQty6QXy9ocw',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z250bGRlaGJkeWZpcHp5a2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTI0NzcsImV4cCI6MjA2MDg4ODQ3N30.M6-BjX6Km_B7ZP5WQWDiMGTSVLW2_sVyQty6QXy9ocw',
    'Content-Type': 'application/json'
  };
  
  if (includeCount) {
    headers['Prefer'] = 'count=exact';
  }
  
  return headers;
};

interface FilterParams {
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface PaginationParams {
  limit?: number;
  offset?: number;
}

// 扩展接口定义
interface DesignStyleFilters extends FilterParams {
  style?: string;
  compatible_styles?: string[];
}

interface RecommendationFilters {
  style?: string;
  category?: string;
  budget_range?: {
    min: number;
    max: number;
  };
}

export const globalErpService = {
  async fetchProducts(filters: FilterParams = {}, pagination: PaginationParams = {}) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('is_active', 'eq.true');
    
    if (pagination.limit) {
      url.searchParams.append('limit', pagination.limit.toString());
    }
    if (pagination.offset) {
      url.searchParams.append('offset', pagination.offset.toString());
    }
    if (filters.search) {
      url.searchParams.append('or', `(standard_chinese_name.ilike.*${filters.search}*,specification.ilike.*${filters.search}*)`);
    }
    if (filters.category && filters.category !== '全部') {
      url.searchParams.append('category', `eq.${filters.category}`);
    }
    
    const sortBy = filters.sortBy || 'created_at';
    const ascending = filters.sortOrder === 'asc';
    
    if (sortBy === 'price') {
      url.searchParams.append('order', `price.${ascending ? 'asc' : 'desc'}.nullslast`);
    } else if (sortBy === 'name') {
      url.searchParams.append('order', `standard_chinese_name.${ascending ? 'asc' : 'desc'}.nullslast`);
    } else {
      url.searchParams.append('order', 'created_at.desc.nullslast');
    }
    
    const response = await fetch(url.toString(), { headers: getHeaders(true) });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    const count = response.headers.get('Content-Range')?.split('/')[1] || '0';
    
    return { data, count: parseInt(count) };
  },

  async fetchProductById(id: string) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('id', `eq.${id}`);
    url.searchParams.append('limit', '1');
    
    const response = await fetch(url.toString(), { headers: getHeaders() });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  },

  async fetchProductBySku(sku: string) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('sku', `eq.${sku}`);
    url.searchParams.append('is_active', 'eq.true');
    url.searchParams.append('limit', '1');
    
    const response = await fetch(url.toString(), { headers: getHeaders() });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  },

  // 根据设计风格获取推荐商品
  async getProductsByDesignStyle(style: string, pagination: PaginationParams = {}) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('is_active', 'eq.true');
    
    // 基于类别和名称包含风格关键词进行筛选
    const styleKeywords: Record<string, string[]> = {
      '现代简约': ['现代', '简约', '简洁', '极简'],
      '工业风': ['工业', '复古', '铁艺', '金属', '仿旧'],
      '侘寂风': ['侘寂', '自然', '原木', '素雅', '禅意'],
      '轻奢风': ['轻奢', '高端', '精品', '奢华', '品质'],
      '中式风': ['中式', '古典', '传统', '红木', '古色'],
      '北欧风': ['北欧', '白色', '清新', '简洁', 'Nordic'],
      '地中海风': ['地中海', '蓝白', '海洋', '清爽'],
      '田园风': ['田园', '乡村', '花卉', '碎花', '温馨']
    };
    
    const keywords = styleKeywords[style] || [style];
    const searchTerms = keywords.join('|');
    
    // 使用 OR 条件匹配商品名称或规格中包含风格关键词
    url.searchParams.append('or', `(standard_chinese_name.ilike.*${searchTerms}*,specification.ilike.*${searchTerms}*)`);
    
    if (pagination.limit) {
      url.searchParams.append('limit', pagination.limit.toString());
    }
    if (pagination.offset) {
      url.searchParams.append('offset', pagination.offset.toString());
    }
    
    // 按价格排序，推荐中等价位的商品
    url.searchParams.append('order', 'price.asc.nullslast');
    
    const response = await fetch(url.toString(), { headers: getHeaders(true) });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    const count = response.headers.get('Content-Range')?.split('/')[1] || '0';
    
    return { data, count: parseInt(count) };
  },

  // 获取推荐商品（基于多个条件）
  async getRecommendedProducts(filters: RecommendationFilters, pagination: PaginationParams = {}) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('is_active', 'eq.true');
    
    // 根据预算范围筛选
    if (filters.budget_range) {
      if (filters.budget_range.min > 0) {
        url.searchParams.append('price', `gte.${filters.budget_range.min}`);
      }
      if (filters.budget_range.max > 0) {
        url.searchParams.append('price', `lte.${filters.budget_range.max}`);
      }
    }
    
    // 根据类别筛选
    if (filters.category) {
      url.searchParams.append('category', `eq.${filters.category}`);
    }
    
    // 根据风格匹配
    if (filters.style) {
      const styleKeywords: Record<string, string[]> = {
        '现代简约': ['现代', '简约', '简洁', '极简'],
        '工业风': ['工业', '复古', '铁艺', '金属', '仿旧'],
        '侘寂风': ['侘寂', '自然', '原木', '素雅', '禅意'],
        '轻奢风': ['轻奢', '高端', '精品', '奢华', '品质'],
        '中式风': ['中式', '古典', '传统', '红木', '古色'],
        '北欧风': ['北欧', '白色', '清新', '简洁', 'Nordic'],
        '地中海风': ['地中海', '蓝白', '海洋', '清爽'],
        '田园风': ['田园', '乡村', '花卉', '碎花', '温馨']
      };
      
      const keywords = styleKeywords[filters.style] || [filters.style];
      const searchTerms = keywords.join('|');
      url.searchParams.append('or', `(standard_chinese_name.ilike.*${searchTerms}*,specification.ilike.*${searchTerms}*)`);
    }
    
    if (pagination.limit) {
      url.searchParams.append('limit', pagination.limit.toString());
    }
    if (pagination.offset) {
      url.searchParams.append('offset', pagination.offset.toString());
    }
    
    // 按评分和价格综合排序
    url.searchParams.append('order', 'price.asc.nullslast');
    
    const response = await fetch(url.toString(), { headers: getHeaders(true) });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    const count = response.headers.get('Content-Range')?.split('/')[1] || '0';
    
    return { data, count: parseInt(count) };
  },

  // 批量获取商品信息
  async fetchProductsByIds(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }
    
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('id', `in.(${ids.join(',')})`);
    url.searchParams.append('is_active', 'eq.true');
    
    const response = await fetch(url.toString(), { headers: getHeaders() });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  }
};