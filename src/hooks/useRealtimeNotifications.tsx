import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * 实时通知Hook - 监听用户通知的实时更新
 */
export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime notifications subscription for user:', user.id);

    // 订阅用户通知表的变化
    const notificationsSubscription = supabase
      .channel(`user_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload.new);
          
          // 更新通知缓存
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user.id] });

          // 显示新通知的toast消息
          const notification = payload.new as any;
          if (notification) {
            toast.info(notification.title, {
              description: notification.message,
              action: notification.action_url ? {
                label: '查看详情',
                onClick: () => {
                  if (notification.action_url) {
                    window.location.href = notification.action_url;
                  }
                }
              } : undefined
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Notification updated:', payload.new);
          
          // 更新通知缓存
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user.id] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime notifications subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error in realtime notifications subscription');
        } else if (status === 'TIMED_OUT') {
          console.warn('Realtime notifications subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('Realtime notifications subscription closed');
        }
      });

    // 清理函数
    return () => {
      console.log('Cleaning up realtime notifications subscription');
      notificationsSubscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    // 可以返回订阅状态等信息
    isSubscribed: !!user?.id
  };
};

/**
 * 实时用户资料更新Hook - 监听用户资料变化（特别是供应商状态）
 */
export const useRealtimeProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime profile subscription for user:', user.id);

    // 订阅用户资料表的变化
    const profileSubscription = supabase
      .channel(`profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          
          // 更新用户资料缓存
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
          
          // 如果供应商状态发生变化，显示通知
          const newProfile = payload.new as any;
          const oldProfile = payload.old as any;
          
          if (newProfile.supplier_status !== oldProfile.supplier_status) {
            if (newProfile.supplier_status === 'approved') {
              toast.success('供应商申请已通过', {
                description: '恭喜！您现在是认证供应商了。'
              });
            } else if (newProfile.supplier_status === 'rejected') {
              toast.error('供应商申请未通过', {
                description: '您的申请未通过审核，可以完善资料后重新申请。'
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime profile subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error in realtime profile subscription');
        }
      });

    return () => {
      console.log('Cleaning up realtime profile subscription');
      profileSubscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    isSubscribed: !!user?.id
  };
};

/**
 * 实时货单更新Hook - 监听货单状态变化
 */
export const useRealtimeOrderLists = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime order lists subscription for user:', user.id);

    // 订阅货单表的变化
    const orderListsSubscription = supabase
      .channel(`product_lists:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_lists',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Order list updated:', payload.new);
          
          // 更新货单缓存
          queryClient.invalidateQueries({ queryKey: ['product-lists', user.id] });
          queryClient.invalidateQueries({ queryKey: ['product-list', payload.new.id] });
          
          // 如果状态发生变化，显示通知
          const newOrderList = payload.new as any;
          const oldOrderList = payload.old as any;
          
          if (newOrderList.status !== oldOrderList.status) {
            if (newOrderList.status === 'confirmed') {
              toast.success('货单已确认', {
                description: `货单"${newOrderList.name}"已被供应商确认。`,
                action: {
                  label: '查看详情',
                  onClick: () => {
                    window.location.href = `/order-lists/${newOrderList.id}`;
                  }
                }
              });
            } else if (newOrderList.status === 'shared') {
              toast.info('货单已分享', {
                description: `货单"${newOrderList.name}"已分享给供应商。`
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime order lists subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error in realtime order lists subscription');
        }
      });

    return () => {
      console.log('Cleaning up realtime order lists subscription');
      orderListsSubscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    isSubscribed: !!user?.id
  };
};