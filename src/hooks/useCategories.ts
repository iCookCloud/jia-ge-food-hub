// 分类相关的React Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, ProductCategory, CategoryTree, CategoryPath, CategoryStatistics } from '@/services/categoryService';
import { useToast } from '@/hooks/use-toast';

// 1. 获取所有分类的Hook
export const useCategories = (includeStats: boolean = false) => {
  return useQuery({
    queryKey: ['categories', includeStats],
    queryFn: () => categoryService.getAllCategories(includeStats),
    staleTime: 0, // 每次都重新请求
    gcTime: 0, // 不缓存
  });
};

// 2. 获取分类树结构的Hook
export const useCategoryTree = () => {
  return useQuery({
    queryKey: ['category-tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always', // 每次挂载都重新获取
    refetchOnWindowFocus: false, // 避免窗口聚焦时重复请求
  });
};

// 3. 获取分类路径的Hook
export const useCategoryPaths = () => {
  return useQuery({
    queryKey: ['category-paths'],
    queryFn: () => categoryService.getCategoryPaths(),
    staleTime: 0,
    gcTime: 0,
  });
};

// 4. 根据层级获取分类的Hook
export const useCategoriesByLevel = (level: number) => {
  return useQuery({
    queryKey: ['categories-by-level', level],
    queryFn: () => categoryService.getCategoriesByLevel(level),
    enabled: level > 0 && level <= 3,
    staleTime: 0,
    gcTime: 0,
  });
};

// 5. 获取子分类的Hook
export const useChildCategories = (parentId: number | null) => {
  return useQuery({
    queryKey: ['child-categories', parentId],
    queryFn: () => parentId ? categoryService.getChildCategories(parentId) : Promise.resolve([]),
    enabled: !!parentId,
    staleTime: 0,
    gcTime: 0,
  });
};

// 5.5. 根据ID获取分类的Hook
export const useCategoryById = (id: number | null) => {
  return useQuery({
    queryKey: ['category-by-id', id],
    queryFn: () => id ? categoryService.getCategoryById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });
};

// 6. 根据slug获取分类的Hook
export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['category-by-slug', slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 0,
    gcTime: 0,
  });
};

// 7. 获取分类统计信息的Hook
export const useCategoryStatistics = () => {
  return useQuery({
    queryKey: ['category-statistics'],
    queryFn: () => categoryService.getCategoryStatistics(),
    staleTime: 0,
    gcTime: 0,
  });
};

// 8. 获取产品分类的Hook
export const useProductCategories = (productId: string) => {
  return useQuery({
    queryKey: ['product-categories', productId],
    queryFn: () => categoryService.getProductCategories(productId),
    enabled: !!productId,
    staleTime: 0,
    gcTime: 0,
  });
};

// 9. 搜索分类的Hook
export const useSearchCategories = (query: string, level?: number) => {
  return useQuery({
    queryKey: ['search-categories', query, level],
    queryFn: () => categoryService.searchCategories(query, level),
    enabled: query.length > 2, // 至少输入2个字符才开始搜索
    staleTime: 0,
    gcTime: 0,
  });
};

// 10. 获取分类属性的Hook
export const useCategoryAttributes = (categoryId: number | null) => {
  return useQuery({
    queryKey: ['category-attributes', categoryId],
    queryFn: () => categoryId ? categoryService.getCategoryAttributes(categoryId) : Promise.resolve([]),
    enabled: !!categoryId,
    staleTime: 0,
    gcTime: 0,
  });
};

// 11. 根据分类获取产品列表的Hook
export const useProductsByCategory = (
  categoryId: number | null,
  includeChildren: boolean = true,
  limit: number = 50
) => {
  return useQuery({
    queryKey: ['products-by-category', categoryId, includeChildren, limit],
    queryFn: () => 
      categoryId 
        ? categoryService.getProductsByCategory(categoryId, includeChildren, limit)
        : Promise.resolve([]),
    enabled: !!categoryId,
    staleTime: 0,
    gcTime: 0,
  });
};

// 12. 分配产品分类的Mutation Hook
export const useAssignProductCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      productId, 
      categoryId, 
      isPrimary = false 
    }: { 
      productId: string; 
      categoryId: number; 
      isPrimary?: boolean; 
    }) => categoryService.assignProductToCategory(productId, categoryId, isPrimary),
    
    onSuccess: (data, variables) => {
      // 简化缓存失效，因为没有缓存
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      
      toast({
        title: "分类分配成功",
        description: "产品已成功分配到指定分类",
      });
    },
    
    onError: (error) => {
      toast({
        title: "分类分配失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 13. 移除产品分类的Mutation Hook
export const useRemoveProductCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      productId, 
      categoryId 
    }: { 
      productId: string; 
      categoryId: number; 
    }) => categoryService.removeProductFromCategory(productId, categoryId),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      
      toast({
        title: "移除成功",
        description: "已移除产品的分类关联",
      });
    },
    
    onError: (error) => {
      toast({
        title: "移除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 14. 批量分配产品分类的Mutation Hook
export const useBatchAssignProductCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (assignments: Array<{
      product_id: string;
      category_id: number;
      is_primary?: boolean;
    }>) => categoryService.batchAssignProductCategories(assignments),
    
    onSuccess: (data) => {
      // 简化缓存失效
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      
      toast({
        title: "批量分配成功",
        description: `已成功分配 ${data.length} 个产品分类关联`,
      });
    },
    
    onError: (error) => {
      toast({
        title: "批量分配失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 20. 批量操作产品分类的Mutation Hook（统一接口）
export const useBatchOperateProductCategories = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      operation, 
      productIds, 
      categoryIds, 
      isPrimaryFirst = true 
    }: { 
      operation: 'assign' | 'replace' | 'remove';
      productIds: string[];
      categoryIds: number[];
      isPrimaryFirst?: boolean;
    }) => categoryService.batchOperateProductCategories(operation, productIds, categoryIds, isPrimaryFirst),
    
    onSuccess: (data, variables) => {
      // 简化缓存失效
      queryClient.invalidateQueries({ queryKey: ['product-categories'] });
      queryClient.invalidateQueries({ queryKey: ['products-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
      
      const operationNames = {
        assign: '添加',
        replace: '替换',
        remove: '移除'
      };
      
      toast({
        title: "批量操作成功",
        description: `已成功${operationNames[variables.operation]} ${variables.productIds.length} 个产品的分类`,
      });
    },
    
    onError: (error, variables) => {
      const operationNames = {
        assign: '添加',
        replace: '替换',
        remove: '移除'
      };
      
      toast({
        title: `批量${operationNames[variables.operation]}失败`,
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 15. 创建分类的Mutation Hook (管理功能)
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (categoryData: {
      name: string;
      slug: string;
      description?: string;
      parent_id?: number;
      level: number;
      sort_order?: number;
      icon?: string;
      color?: string;
      metadata?: Record<string, any>;
    }) => categoryService.createCategory(categoryData),
    
    onSuccess: (data) => {
      // 强制重新获取所有分类相关数据
      queryClient.refetchQueries({ queryKey: ['categories'] });
      queryClient.refetchQueries({ queryKey: ['category-tree'] });
      queryClient.refetchQueries({ queryKey: ['category-paths'] });
      queryClient.refetchQueries({ queryKey: ['categories-by-level'] });
      queryClient.refetchQueries({ queryKey: ['child-categories'] });
      queryClient.refetchQueries({ queryKey: ['category-statistics'] });
      
      toast({
        title: "创建成功",
        description: `分类 "${data.name}" 已成功创建`,
      });
    },
    
    onError: (error) => {
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 16. 更新分类的Mutation Hook (管理功能)
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      categoryId, 
      updates 
    }: { 
      categoryId: number; 
      updates: Partial<ProductCategory>; 
    }) => categoryService.updateCategory(categoryId, updates),
    
    onSuccess: (data) => {
      // 强制重新获取所有分类相关数据
      queryClient.refetchQueries({ queryKey: ['categories'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['category-tree'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['category-paths'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['category-by-slug'], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['category-statistics'], type: 'active' });
      
      toast({
        title: "更新成功",
        description: `分类 "${data.name}" 已成功更新`,
      });
    },
    
    onError: (error) => {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 17. 删除分类的Mutation Hook (管理功能)
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (categoryId: number) => categoryService.deleteCategory(categoryId),
    
    onSuccess: () => {
      // 强制重新获取所有分类相关数据
      queryClient.refetchQueries({ queryKey: ['categories'] });
      queryClient.refetchQueries({ queryKey: ['category-tree'] });
      queryClient.refetchQueries({ queryKey: ['category-paths'] });
      queryClient.refetchQueries({ queryKey: ['category-statistics'] });
      
      toast({
        title: "删除成功",
        description: "分类已成功删除",
      });
    },
    
    onError: (error) => {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    },
  });
};

// 18. 自定义Hook：获取分类面包屑
export const useCategoryBreadcrumbs = (slug: string) => {
  const { data: categoryPaths } = useCategoryPaths();
  
  const breadcrumbs = categoryPaths
    ?.find(path => path.slug === slug)
    ?.path_names.map((name, index, array) => ({
      name,
      slug: array[index] === name ? slug : '', // 只有当前分类才有完整slug
      isLast: index === array.length - 1
    })) || [];
  
  return breadcrumbs;
};

// 19. 自定义Hook：分类筛选器
export const useCategoryFilter = () => {
  const { data: categoryTree } = useCategoryTree();
  
  // 将分类树转换为平面筛选选项
  const flattenCategories = (categories: CategoryTree[] = []): Array<{
    id: number;
    name: string;
    fullPath: string;
    level: number;
  }> => {
    const result: Array<{
      id: number;
      name: string;
      fullPath: string;
      level: number;
    }> = [];
    
    const traverse = (cats: CategoryTree[], path: string[] = []) => {
      cats.forEach(cat => {
        const currentPath = [...path, cat.name];
        result.push({
          id: cat.id,
          name: cat.name,
          fullPath: currentPath.join(' > '),
          level: cat.level
        });
        
        if (cat.children && cat.children.length > 0) {
          traverse(cat.children, currentPath);
        }
      });
    };
    
    traverse(categories);
    return result;
  };
  
  return {
    categoryTree,
    flatCategories: flattenCategories(categoryTree),
    isLoading: !categoryTree
  };
};