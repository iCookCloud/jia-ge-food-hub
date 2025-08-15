// 产品分类管理服务
import { supabase } from '@/integrations/supabase/client';

// 基础分类接口
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  is_active: boolean;
  icon?: string;
  color?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// 分类路径接口 (仅用于视图查询)
export interface CategoryPath {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  level: number;
  sort_order: number;
  is_active: boolean;
  path_names: string[];
  path_ids: number[];
  path_slugs: string[];
  full_path: string;
  full_slug_path: string;
}

// 分类统计接口
export interface CategoryStatistics {
  total_categories: number;
  level1_count: number;
  level2_count: number;
  level3_count: number;
}

// 分类树接口 (用于前端显示)
export interface CategoryTree extends ProductCategory {
  children?: CategoryTree[];
  product_count?: number;
}

export const categoryService = {
  // 1. 获取所有活跃分类
  async getAllCategories(includeStats: boolean = false): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('level')
      .order('sort_order')
      .order('name');
    
    if (error) {
      console.error('获取分类失败:', error);
      throw new Error('获取分类失败');
    }
    
    return data || [];
  },

  // 2. 获取分类路径 (包含层次信息) - 用于分类树构建
  async getCategoryPaths(): Promise<CategoryPath[]> {
    const { data, error } = await supabase
      .from('category_paths')
      .select('*')
      .order('level')
      .order('sort_order');
    
    if (error) {
      console.error('获取分类路径失败:', error);
      throw new Error('获取分类路径失败');
    }
    
    return data || [];
  },

  // 3. 根据层级获取分类
  async getCategoriesByLevel(level: number): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('level', level)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    
    if (error) {
      console.error('获取分类失败:', error);
      throw new Error('获取分类失败');
    }
    
    return data || [];
  },

  // 4. 根据ID获取分类
  async getCategoryById(id: number): Promise<ProductCategory | null> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      console.error('获取分类失败:', error);
      throw new Error('获取分类失败');
    }
    
    return data;
  },

  // 5. 根据slug获取分类
  async getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      console.error('获取分类失败:', error);
      throw new Error('获取分类失败');
    }
    
    return data;
  },

  // 6. 构建分类树结构
  async getCategoryTree(): Promise<CategoryTree[]> {
    const categories = await this.getAllCategories();
    const categoryMap = new Map<number, CategoryTree>();
    const rootCategories: CategoryTree[] = [];
    
    // 首先创建所有分类的映射
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });
    
    // 构建树结构
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)!;
      
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryNode);
          // 移除循环引用，避免序列化问题
          // categoryNode.parent = parent;
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });
    
    return rootCategories;
  },

  // 7. 获取分类统计信息
  async getCategoryStatistics(): Promise<CategoryStatistics> {
    const { data, error } = await supabase
      .from('category_statistics')
      .select('*')
      .single();
    
    if (error) {
      console.error('获取分类统计失败:', error);
      throw new Error('获取分类统计失败');
    }
    
    return data;
  },

  // 8. 获取产品的分类信息
  async getProductCategories(productId: string): Promise<CategoryPath[]> {
    const { data, error } = await supabase
      .from('product_category_info')
      .select('*')
      .eq('product_id', productId)
      .order('category_level')
      .order('is_primary', { ascending: false });
    
    if (error) {
      console.error('获取产品分类失败:', error);
      throw new Error('获取产品分类失败');
    }
    
    return data || [];
  },

  // 9. 批量操作产品分类（统一接口）
  async batchOperateProductCategories(
    operation: 'assign' | 'replace' | 'remove',
    productIds: string[],
    categoryIds: number[],
    isPrimaryFirst: boolean = true
  ): Promise<unknown[]> {
    // 由于相关表为空，这里提供一个空实现
    console.warn('批量操作产品分类功能暂未实现，因为相关数据库表为空');
    return [];
  },

  // 10. 创建新分类 (管理功能)
  async createCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    level: number;
    sort_order?: number;
    icon?: string;
    color?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .insert(categoryData)
      .select()
      .single();
    
    if (error) {
      console.error('创建分类失败:', error);
      throw new Error('创建分类失败');
    }
    
    return data;
  },

  // 11. 更新分类 (管理功能)
  async updateCategory(
    categoryId: number, 
    updates: Partial<ProductCategory>
  ): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
    
    if (error) {
      console.error('更新分类失败:', error);
      throw new Error('更新分类失败');
    }
    
    return data;
  },

  // 12. 删除分类 (软删除)
  async deleteCategory(categoryId: number): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: false })
      .eq('id', categoryId);
    
    if (error) {
      console.error('删除分类失败:', error);
      throw new Error('删除分类失败');
    }
  }
};

export default categoryService;