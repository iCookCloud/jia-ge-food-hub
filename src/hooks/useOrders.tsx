import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/coreDataService';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/services/api';

export const useOrders = (filters = {}, pagination = {}) => {
  return useQuery({
    queryKey: ['orders', filters, pagination],
    queryFn: async () => {
      const result = await orderService.getAll(filters, pagination);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    staleTime: 3 * 60 * 1000, // 3分钟
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const result = await orderService.getById(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await orderService.create(data);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "订单创建成功" });
    },
    onError: (error: any) => {
      toast({
        title: "创建失败",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const result = await orderService.updateStatus(id, status);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "订单状态更新成功" });
    },
    onError: (error: any) => {
      toast({
        title: "更新失败",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
  });
};