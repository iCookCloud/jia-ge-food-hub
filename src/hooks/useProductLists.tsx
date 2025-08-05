import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productListService } from '@/services/productListService';
import { useToast } from '@/hooks/use-toast';
import { CartItem } from '@/hooks/useCart';

export const useProductLists = () => {
  return useQuery({
    queryKey: ['productLists'],
    queryFn: async () => {
      const result = await productListService.getUserProductLists();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    staleTime: 3 * 60 * 1000, // 3分钟
  });
};

export const useProductList = (id: string) => {
  return useQuery({
    queryKey: ['productList', id],
    queryFn: async () => {
      const result = await productListService.getProductList(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreateProductListFromCart = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cartItems, name }: { cartItems: CartItem[]; name: string }) => {
      const result = await productListService.createFromCart(cartItems, name);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productLists'] });
      toast({ title: "货单创建成功" });
    },
    onError: (error: any) => {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProductListStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'draft' | 'shared' | 'expired' }) => {
      const result = await productListService.updateStatus(id, status);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productLists'] });
      toast({ title: "状态更新成功" });
    },
    onError: (error: any) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};