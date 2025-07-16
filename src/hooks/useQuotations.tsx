import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/services/api';

export const useQuotations = (filters = {}, pagination = {}) => {
  return useQuery({
    queryKey: ['quotations', filters, pagination],
    queryFn: async () => {
      const result = await quotationService.getQuotations(filters, pagination);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

export const useQuotation = (id: string) => {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: async () => {
      const result = await quotationService.getQuotation(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const result = await quotationService.createQuotation(data);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast({ title: "报价创建成功" });
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