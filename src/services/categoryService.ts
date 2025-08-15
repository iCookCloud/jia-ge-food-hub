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
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// 分类路径接口
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

// 产品分类关联接口
export interface ProductCategoryRelation {
  id: number;
  product_id: string;
  category_id: number;
  is_primary: boolean;
  created_at: string;
}

// 分类属性接口
export interface CategoryAttribute {
  id: number;
  category_id: number;
  attribute_name: string;
  attribute_type: 'text' | 'number' | 'select' | 'multi_select' | 'boolean';
  is_required: boolean;
  options: Record<string, any>;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 分类统计接口
export interface CategoryStatistics {
  id: number;
  name: string;
  slug: string;
  level: number;
  parent_id?: number;
  product_count: number;
  primary_product_count: number;
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

  // 2. 获取分类路径 (包含层次信息)
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

  // 4. 获取子分类
  async getChildCategories(parentId: number): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    
    if (error) {
      console.error('获取子分类失败:', error);
      throw new Error('获取子分类失败');
    }
    
    return data || [];
  },

  // 5. 根据ID获取分类
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

  // 6. 根据slug获取分类
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
  async getCategoryStatistics(): Promise<CategoryStatistics[]> {
    const { data, error } = await supabase
      .from('category_statistics')
      .select('*')
      .order('level')
      .order('product_count', { ascending: false });
    
    if (error) {
      console.error('获取分类统计失败:', error);
      throw new Error('获取分类统计失败');
    }
    
    return data || [];
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

  // 9. 为产品分配分类
  async assignProductToCategory(
    productId: string, 
    categoryId: number, 
    isPrimary: boolean = false
  ): Promise<ProductCategoryRelation> {
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
      console.error('分配产品分类失败:', error);
      throw new Error('分配产品分类失败');
    }
    
    return data;
  },

  // 10. 移除产品分类
  async removeProductFromCategory(productId: string, categoryId: number): Promise<void> {
    const { error } = await supabase
      .from('product_category_relations')
      .delete()
      .eq('product_id', productId)
      .eq('category_id', categoryId);
    
    if (error) {
      console.error('移除产品分类失败:', error);
      throw new Error('移除产品分类失败');
    }
  },

  // 11. 批量分配产品分类
  async batchAssignProductCategories(
    assignments: Array<{
      product_id: string;
      category_id: number;
      is_primary?: boolean;
    }>
  ): Promise<ProductCategoryRelation[]> {
    const { data, error } = await supabase
      .from('product_category_relations')
      .insert(assignments)
      .select();
    
    if (error) {
      console.error('批量分配产品分类失败:', error);
      throw new Error('批量分配产品分类失败');
    }
    
    return data || [];
  },

  // 21. 批量移除产品分类
  async batchRemoveProductCategories(
    productIds: string[],
    categoryIds: number[]
  ): Promise<void> {
    const { error } = await supabase
      .from('product_category_relations')
      .delete()
      .in('product_id', productIds)
      .in('category_id', categoryIds);
    
    if (error) {
      console.error('批量移除产品分类失败:', error);
      throw new Error('批量移除产品分类失败');
    }
  },

  // 22. 批量替换产品分类（先清除再添加）
  async batchReplaceProductCategories(
    productIds: string[],
    newAssignments: Array<{
      product_id: string;
      category_id: number;
      is_primary?: boolean;
    }>
  ): Promise<ProductCategoryRelation[]> {
    // 使用事务来确保操作的原子性
    const { data, error } = await supabase.rpc('batch_replace_product_categories', {
      p_product_ids: productIds,
      p_new_assignments: newAssignments
    });
    
    if (error) {
      // 如果RPC函数不存在，回退到手动处理
      console.warn('RPC函数不可用，使用手动处理:', error);
      
      // 先删除现有分类
      await supabase
        .from('product_category_relations')
        .delete()
        .in('product_id', productIds);
      
      // 再添加新分类
      const { data: insertData, error: insertError } = await supabase
        .from('product_category_relations')
        .insert(newAssignments)
        .select();
      
      if (insertError) {
        console.error('批量替换产品分类失败:', insertError);
        throw new Error('批量替换产品分类失败');
      }
      
      return insertData || [];
    }
    
    return data || [];
  },

  // 23. 批量操作产品分类（统一接口）
  async batchOperateProductCategories(
    operation: 'assign' | 'replace' | 'remove',
    productIds: string[],
    categoryIds: number[],
    isPrimaryFirst: boolean = true
  ): Promise<ProductCategoryRelation[]> {
    const assignments = productIds.flatMap(productId =>
      categoryIds.map((categoryId, index) => ({
        product_id: productId,
        category_id: categoryId,
        is_primary: isPrimaryFirst && index === 0
      }))
    );
    
    switch (operation) {
      case 'assign':
        return this.batchAssignProductCategories(assignments);
      
      case 'replace':
        return this.batchReplaceProductCategories(productIds, assignments);
      
      case 'remove':
        await this.batchRemoveProductCategories(productIds, categoryIds);
        return [];
      
      default:
        throw new Error('不支持的操作类型');
    }
  },

  // 12. 搜索分类
  async searchCategories(
    query: string, 
    level?: number
  ): Promise<CategoryPath[]> {
    let searchQuery = supabase
      .from('category_paths')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,full_path.ilike.%${query}%`);
    
    if (level) {
      searchQuery = searchQuery.eq('level', level);
    }
    
    const { data, error } = await searchQuery
      .order('level')
      .order('sort_order')
      .limit(20);
    
    if (error) {
      console.error('搜索分类失败:', error);
      throw new Error('搜索分类失败');
    }
    
    return data || [];
  },

  // 13. 获取分类属性
  async getCategoryAttributes(categoryId: number): Promise<CategoryAttribute[]> {
    const { data, error } = await supabase
      .from('category_attributes')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order')
      .order('attribute_name');
    
    if (error) {
      console.error('获取分类属性失败:', error);
      throw new Error('获取分类属性失败');
    }
    
    return data || [];
  },

  // 14. 根据分类获取产品列表 (需要结合GlobalERP数据)
  async getProductsByCategory(
    categoryId: number, 
    includeChildren: boolean = true,
    limit: number = 50
  ): Promise<string[]> {
    let query = supabase
      .from('product_category_relations')
      .select('product_id')
      .eq('category_id', categoryId);
    
    // 如果需要包含子分类的产品
    if (includeChildren) {
      const childCategories = await this.getChildCategories(categoryId);
      const categoryIds = [categoryId, ...childCategories.map(c => c.id)];
      
      query = supabase
        .from('product_category_relations')
        .select('product_id')
        .in('category_id', categoryIds);
    }
    
    const { data, error } = await query.limit(limit);
    
    if (error) {
      console.error('获取分类产品失败:', error);
      throw new Error('获取分类产品失败');
    }
    
    return data?.map(item => item.product_id) || [];
  },

  // 15. 创建新分类 (管理功能)
  async createCategory(categoryData: {
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    level: number;
    sort_order?: number;
    icon?: string;
    color?: string;
    metadata?: Record<string, any>;
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

  // 16. 更新分类 (管理功能)
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

  // 17. 删除分类 (软删除)
  async deleteCategory(categoryId: number): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: false })
      .eq('id', categoryId);
    
    if (error) {
      console.error('删除分类失败:', error);
      throw new Error('删除分类失败');
    }
  },

  // 18. 获取面包屑导航
  getBreadcrumbs(categoryPath: CategoryPath): Array<{ name: string; slug: string }> {
    return categoryPath.path_names.map((name, index) => ({
      name,
      slug: categoryPath.path_slugs[index]
    }));
  },

  // 19. 验证分类层次结构
  validateCategoryHierarchy(parentId: number | null, level: number): boolean {
    if (!parentId && level !== 1) {
      return false; // 根分类必须是level 1
    }
    if (parentId && level <= 1) {
      return false; // 子分类level必须大于1
    }
    if (level > 3) {
      return false; // 最多3级分类
    }
    return true;
  },

  // 20. 生成分类slug
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]/g, '-') // 保留中文字符
      .replace(/-+/g, '-')
      .trim();
  }
};

export default categoryService;