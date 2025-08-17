import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  productCount: number;
  supplierCount: number;
  // 其他统计数据可以保持静态
  monthlyVolume: string;
  rating: string;
}

export const useStats = () => {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: async (): Promise<PlatformStats> => {
      // 并行获取统计数据
      const [productResult] = await Promise.all([
        // 活跃商品数量
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
      ]);

      // 供应商数量使用静态值（保持原有设计）
      const uniqueSuppliers = 500; // 与首页原始设计一致

      return {
        productCount: productResult.count || 0,
        supplierCount: uniqueSuppliers,
        monthlyVolume: "¥2000万+", // 静态数据
        rating: "4.9分" // 静态数据
      };
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
};