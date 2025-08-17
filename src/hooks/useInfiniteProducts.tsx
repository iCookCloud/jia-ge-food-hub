import { useInfiniteQuery } from '@tanstack/react-query';
import { productService } from '@/services/api';
import { Product } from './useProducts';

export interface InfiniteProductsParams {
  search?: string;
  category?: string;
  categoryId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export const useInfiniteProducts = (params: InfiniteProductsParams = {}) => {
  const { limit = 12, ...filters } = params;

  return useInfiniteQuery({
    queryKey: ['products-infinite', { ...filters, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await productService.getAll(filters, { 
        page: pageParam, 
        limit 
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      return {
        data: result.data as Product[],
        count: result.count || 0,
        page: pageParam,
        hasNextPage: (result.data?.length || 0) === limit
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNextPage ? lastPage.page + 1 : undefined;
    },
    staleTime: 0, // 产品数据不缓存，每次都获取最新数据
    gcTime: 1 * 60 * 1000, // 1分钟后清理内存
    initialPageParam: 1,
    // 当搜索参数变化时，重置页面参数
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};