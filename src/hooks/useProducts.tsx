import { useQuery } from '@tanstack/react-query';
import { productService } from '@/services/api';

export interface Product {
  id: string;
  sku: string;
  standard_english_name: string | null;
  standard_chinese_name: string | null;
  category_english: string | null;
  category_chinese: string | null;
  subcategory: string | null;
  unit_price: string | null;
  unit: string | null;
  quantity: string | null;
  specifications: string | null;
  product_image: string | null;
  outer_box_dimensions: string | null;
  storage_requirements: string | null;
  requires_cold_chain: boolean | null;
  is_fragile: boolean | null;
  is_active: boolean | null;
  user_id: string | null;
  vendor: string | null;
  created_at: string | null;
  updated_at: string | null;
}


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
    staleTime: 0, // 产品详情不缓存，每次都获取最新数据
    gcTime: 1 * 60 * 1000, // 1分钟后清理内存
  });
};