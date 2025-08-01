import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService, RealtimeSubscription } from '@/services/realtimeService';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useRealtime = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionsRef = useRef<RealtimeSubscription[]>([]);

  useEffect(() => {
    if (!user) return;

    const subscriptions: RealtimeSubscription[] = [];

    // 订阅产品变更
    const productsSub = realtimeService.subscribeToProducts((payload) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      if (payload.eventType === 'INSERT') {
        toast({
          title: '新商品上架',
          description: `${payload.new.standard_chinese_name || '新商品'} 已上架`
        });
      }
    });
    subscriptions.push(productsSub);

    // 订阅个人订单变更
    const ordersSub = realtimeService.subscribeToOrders((payload) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (payload.eventType === 'UPDATE' && payload.old.status !== payload.new.status) {
        toast({
          title: '订单状态更新',
          description: `订单 #${payload.new.id.slice(-8)} 状态已更新为 ${payload.new.status}`
        });
      }
    }, user.id);
    subscriptions.push(ordersSub);

    // 订阅报价变更
    const quotationsSub = realtimeService.subscribeToQuotations((payload) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      
      if (payload.eventType === 'INSERT') {
        toast({
          title: '新报价',
          description: '您收到了新的报价请求'
        });
      }
    }, user.id);
    subscriptions.push(quotationsSub);

    // 订阅通知
    const notificationsSub = realtimeService.subscribeToNotifications((payload) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: payload.new.title,
        description: payload.new.message
      });
    }, user.id);
    subscriptions.push(notificationsSub);

    // Note: Supplier verification subscription has been removed

    subscriptionsRef.current = subscriptions;

    // 清理函数
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [user, queryClient, toast]);

  // 手动刷新特定数据
  const refreshData = (type: string) => {
    switch (type) {
      case 'products':
        queryClient.invalidateQueries({ queryKey: ['products'] });
        break;
      case 'orders':
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        break;
      case 'quotations':
        queryClient.invalidateQueries({ queryKey: ['quotations'] });
        break;
      case 'notifications':
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        break;
      default:
        queryClient.invalidateQueries();
    }
  };

  return {
    refreshData
  };
};

// 用户在线状态Hook
export const useUserPresence = (metadata?: Record<string, any>) => {
  const { user } = useAuth();
  const presenceRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const presence = realtimeService.trackUserPresence(user.id, {
      name: user.email,
      ...metadata
    });

    presenceRef.current = presence;

    return () => {
      presence.unsubscribe();
      presenceRef.current = null;
    };
  }, [user, metadata]);

  const updatePresence = (newMetadata: Record<string, any>) => {
    if (presenceRef.current) {
      presenceRef.current.updatePresence(newMetadata);
    }
  };

  return {
    updatePresence
  };
};