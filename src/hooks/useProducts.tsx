import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Product[];
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Product;
    },
    enabled: !!id,
  });
};