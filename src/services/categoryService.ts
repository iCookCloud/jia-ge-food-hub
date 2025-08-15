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

  // 8. 获取分类及其所有子分类ID（用于层次搜索）
  async getCategoryWithChildren(categoryId: number): Promise<number[]> {
    // 一次性获取所有活跃分类，避免N+1查询
    const { data: allCategories, error } = await supabase
      .from('product_categories')
      .select('id, parent_id')
      .eq('is_active', true);
    
    if (error) {
      console.error('获取分类失败:', error);
      return [categoryId];
    }
    
    if (!allCategories) return [categoryId];
    
    // 构建父子关系映射
    const categoryMap = new Map<number, number[]>();
    allCategories.forEach(cat => {
      if (cat.parent_id) {
        if (!categoryMap.has(cat.parent_id)) {
          categoryMap.set(cat.parent_id, []);
        }
        categoryMap.get(cat.parent_id)!.push(cat.id);
      }
    });
    
    // 递归收集所有子分类ID（内存操作，无网络请求）
    const collectChildren = (parentId: number): number[] => {
      const result = [parentId];
      const children = categoryMap.get(parentId) || [];
      
      for (const childId of children) {
        result.push(...collectChildren(childId));
      }
      
      return result;
    };
    
    return collectChildren(categoryId);
  },

  // 9. 获取产品的分类信息
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

  // 10. 为产品分配单个分类
  async assignProductToCategory(
    productId: string, 
    categoryId: number, 
    isPrimary: boolean = false
  ): Promise<unknown> {
    const { data, error } = await supabase
      .from('product_category_relations')
      .insert({
        product_id: productId,
        category_id: categoryId,
        is_primary: isPrimary
      })
      .select()
      .single();
    
    if (error) {
      // 处理唯一约束错误
      if (error.code === '23505') {
        console.warn('产品分类关联已存在，跳过重复添加:', { productId, categoryId });
        return null; // 静默处理，不抛出错误
      }
      console.error('分配产品分类失败:', error);
      throw new Error('分配产品分类失败');
    }
    
    return data;
  },

  // 11. 为产品分配多个分类（先清除后添加）
  async assignProductToCategories(
    productId: string, 
    categoryIds: number[]
  ): Promise<void> {
    // 先清除现有的分类关联
    await supabase
      .from('product_category_relations')
      .delete()
      .eq('product_id', productId);
    
    // 添加新的分类关联
    if (categoryIds.length > 0) {
      const assignments = categoryIds.map((categoryId, index) => ({
        product_id: productId,
        category_id: categoryId,
        is_primary: index === 0 // 第一个分类设为主分类
      }));
      
      const { error } = await supabase
        .from('product_category_relations')
        .insert(assignments);
      
      if (error) {
        console.error('分配产品分类失败:', error);
        throw new Error('分配产品分类失败');
      }
    }
  },

  // 12. 批量操作产品分类（统一接口）
  async batchOperateProductCategories(
    operation: 'assign' | 'replace' | 'remove',
    productIds: string[],
    categoryIds: number[],
    isPrimaryFirst: boolean = true
  ): Promise<unknown[]> {
    const assignments = productIds.flatMap(productId =>
      categoryIds.map((categoryId, index) => ({
        product_id: productId,
        category_id: categoryId,
        is_primary: isPrimaryFirst && index === 0
      }))
    );
    
    switch (operation) {
      case 'assign': {
        const { data, error } = await supabase
          .from('product_category_relations')
          .insert(assignments)
          .select();
        
        if (error) {
          // 处理唯一约束错误
          if (error.code === '23505') {
            console.warn('批量分配中存在重复关联，部分记录已跳过');
            // 对于批量操作，我们可以尝试逐一插入来处理重复
            const results = [];
            for (const assignment of assignments) {
              try {
                const { data: singleData } = await supabase
                  .from('product_category_relations')
                  .insert(assignment)
                  .select()
                  .single();
                if (singleData) results.push(singleData);
              } catch (singleError: any) {
                if (singleError.code !== '23505') {
                  console.error('单个分配失败:', singleError);
                }
              }
            }
            return results;
          }
          console.error('批量分配产品分类失败:', error);
          throw new Error('批量分配产品分类失败');
        }
        
        return data || [];
      }
      
      case 'replace': {
        // 先删除现有关联
        await supabase
          .from('product_category_relations')
          .delete()
          .in('product_id', productIds);
        
        // 再添加新关联
        const { data, error } = await supabase
          .from('product_category_relations')
          .insert(assignments)
          .select();
        
        if (error) {
          console.error('批量替换产品分类失败:', error);
          throw new Error('批量替换产品分类失败');
        }
        
        return data || [];
      }
      
      case 'remove': {
        await supabase
          .from('product_category_relations')
          .delete()
          .in('product_id', productIds)
          .in('category_id', categoryIds);
        
        return [];
      }
      
      default:
        throw new Error('不支持的操作类型');
    }
  },

  // 13. 创建新分类 (管理功能)
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

  // 14. 更新分类 (管理功能)
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

  // 15. 删除分类 (软删除)
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