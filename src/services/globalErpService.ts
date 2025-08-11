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
  }
};