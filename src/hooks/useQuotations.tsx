import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '@/services/quotationService';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/services/api';

export const useQuotations = (filters = {}, pagination = {}) => {
  return useQuery({
    queryKey: ['quotations', filters, pagination],
    queryFn: () => quotationService.getQuotations(filters, pagination),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};

export const useQuotation = (id: string) => {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationService.getQuotation(id),
    enabled: !!id,
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: quotationService.createQuotation,
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