import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, MessageFilters } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/services/api';

export const useMessages = (filters: MessageFilters = {}, pagination = {}) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['messages', filters, pagination],
    queryFn: async () => {
      const result = await messageService.getMessages(filters, pagination);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30秒
  });
};

export const useConversation = (userId: string, quotationId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['conversation', userId, quotationId],
    queryFn: async () => {
      const result = await messageService.getConversation(userId, quotationId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || [];
    },
    enabled: !!user && !!userId,
    staleTime: 10 * 1000, // 10秒
    refetchInterval: 5000, // 5秒轮询
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: messageService.sendMessage,
    onSuccess: (data, variables) => {
      // 更新消息列表
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', variables.receiver_id, variables.quotation_id] 
      });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
      
      toast({ title: "消息发送成功" });
    },
    onError: (error: any) => {
      toast({
        title: "消息发送失败",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messageService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, quotationId }: { userId: string; quotationId?: string }) => 
      messageService.markConversationAsRead(userId, quotationId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ 
        queryKey: ['conversation', variables.userId, variables.quotationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] });
    },
  });
};

export const useUnreadMessagesCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      const result = await messageService.getUnreadCount();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data || 0;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30秒
    refetchInterval: 60 * 1000, // 1分钟轮询
  });
};