import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/api';
import { Product } from './useProducts';

interface ProductsWithPaginationParams {
  search?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface ProductsWithPaginationResult {
  data: Product[];
  count: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: Error | null;
}

export const useProductsWithPagination = (params: ProductsWithPaginationParams): ProductsWithPaginationResult => {
  const { page, limit, ...filters } = params;

  const result = useQuery({
    queryKey: ['products-paginated', { ...filters, page, limit }],
    queryFn: async () => {
      const response = await productService.getAll(filters, { page, limit });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return {
        data: response.data || [],
        count: response.count || 0,
        page,
        totalPages: Math.ceil((response.count || 0) / limit)
      };
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    gcTime: 10 * 60 * 1000, // 10分钟后清理内存
  });

  return {
    data: result.data?.data || [],
    count: result.data?.count || 0,
    page: result.data?.page || page,
    totalPages: result.data?.totalPages || 0,
    isLoading: result.isLoading,
    error: result.error
  };
};


