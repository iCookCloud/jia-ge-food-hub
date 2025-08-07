import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialService } from '@/services/coreDataService';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/services/api';

export const useMaterials = (filters = {}, pagination = {}) => {
  return useQuery({
    queryKey: ['materials', filters, pagination],
    queryFn: async () => {
      const result = await materialService.getAll(filters, pagination);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    staleTime: 30 * 1000, // 30秒 - 减少缓存时间以便快速看到新上传的视频
  });
};

export const useMaterial = (id: string) => {
  return useQuery({
    queryKey: ['material', id],
    queryFn: async () => {
      const result = await materialService.getById(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

export const useProductVideos = (productId: string) => {
  return useQuery({
    queryKey: ['product-videos', productId],
    queryFn: async () => {
      const result = await materialService.getByProductId(productId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    enabled: !!productId,
  });
};