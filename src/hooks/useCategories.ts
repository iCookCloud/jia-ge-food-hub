// 分类相关的React Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, ProductCategory, CategoryTree, CategoryStatistics, CategoryPath } from '@/services/categoryService';
import { useToast } from '@/hooks/use-toast';

// 统一的分类缓存失效函数
const invalidateAllCategoryQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['category-tree'] });
  queryClient.invalidateQueries({ queryKey: ['category-statistics'] });
  queryClient.invalidateQueries({ queryKey: ['categories-by-level'] });
  queryClient.invalidateQueries({ queryKey: ['category-paths'] });
  queryClient.invalidateQueries({ queryKey: ['categories'] });
  queryClient.invalidateQueries({ queryKey: ['category-by-slug'] });
};

// 1. 获取所有分类的Hook
export const useCategories = (includeStats: boolean = false) => {
  return useQuery({
    queryKey: ['categories', includeStats],
    queryFn: () => categoryService.getAllCategories(includeStats),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 30 * 60 * 1000,   // 30分钟后清理
  });
};

// 2. 获取分类树结构的Hook
export const useCategoryTree = () => {
  return useQuery({
    queryKey: ['category-tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 5 * 60 * 1000,  // 5分钟缓存
    gcTime: 30 * 60 * 1000,    // 30分钟后清理缓存
    refetchOnMount: false,     // 不每次挂载都重新获取
    refetchOnWindowFocus: false, // 避免窗口聚焦时重复请求
  });
};

// 3. 获取分类路径的Hook (用于CategorySelector)
export const useCategoryPaths = () => {
  return useQuery({
    queryKey: ['category-paths'],
    queryFn: () => categoryService.getCategoryPaths(),
    staleTime: 10 * 60 * 1000, // 10分钟缓存
    gcTime: 30 * 60 * 1000,    // 30分钟后清理
  });
};

// 4. 根据层级获取分类的Hook
export const useCategoriesByLevel = (level: number) => {
  return useQuery({
    queryKey: ['categories-by-level', level],
    queryFn: () => categoryService.getCategoriesByLevel(level),
    enabled: level > 0 && level <= 3,
    staleTime: 5 * 60 * 1000,  // 5分钟缓存，与其他保持一致
    gcTime: 30 * 60 * 1000,    // 30分钟后清理
  });
};

// 5. 根据slug获取分类的Hook
export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['category-by-slug', slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,  // 5分钟缓存
    gcTime: 30 * 60 * 1000,    // 30分钟后清理
  });
};

// 6. 获取分类统计信息的Hook
export const useCategoryStatistics = () => {
  return useQuery({
    queryKey: ['category-statistics'],
    queryFn: () => categoryService.getCategoryStatistics(),
    staleTime: 2 * 60 * 1000,  // 2分钟缓存（统计数据更新频率较高）
    gcTime: 10 * 60 * 1000,    // 10分钟后清理
  });
};

// 7. 获取产品分类的Hook
export const useProductCategories = (productId: string) => {
  return useQuery({
    queryKey: ['product-categories', productId],
    queryFn: () => categoryService.getProductCategories(productId),
    enabled: !!productId,
    staleTime: 3 * 60 * 1000,  // 3分钟缓存（产品分类可能会变化）
    gcTime: 15 * 60 * 1000,    // 15分钟后清理
  });
};

// 8. 批量操作产品分类的Mutation Hook（统一接口）
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

// 9. 创建分类的Mutation Hook (管理功能)
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
      metadata?: Record<string, unknown>;
    }) => categoryService.createCategory(categoryData),
    
    onSuccess: (data) => {
      // 让相关缓存失效，触发重新获取
      invalidateAllCategoryQueries(queryClient);
      
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

// 10. 更新分类的Mutation Hook (管理功能)
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
      // 让相关缓存失效，触发重新获取
      invalidateAllCategoryQueries(queryClient);
      
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

// 11. 删除分类的Mutation Hook (管理功能)
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (categoryId: number) => categoryService.deleteCategory(categoryId),
    
    onSuccess: () => {
      // 让相关缓存失效，触发重新获取
      invalidateAllCategoryQueries(queryClient);
      
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