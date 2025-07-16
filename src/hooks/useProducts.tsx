import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/api';

export interface Product {
  id: string;
  sku: string;
  standard_english_name: string | null;
  standard_chinese_name: string | null;
  category_english: string | null;
  category_chinese: string | null;
  unit_price: string | null;
  unit: string | null;
  specifications: string | null;
  product_image: string | null;
  is_active: boolean | null;
  user_id: string | null;
  vendor: string | null;
  created_at: string | null;
}

export const useProducts = (filters = {}, pagination = {}) => {
  return useQuery({
    queryKey: ['products', filters, pagination],
    queryFn: async () => {
      const result = await productService.getAll(filters, pagination);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const result = await productService.getById(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data as Product;
    },
    enabled: !!id,
  });
};