import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export interface RealtimeOptions {
  table: string;
  event?: RealtimeEventType | '*';
  filter?: string;
  callback: (payload: any) => void;
}

export const realtimeService = {
  /**
   * 订阅数据库实时变更
   */
  subscribe(options: RealtimeOptions): RealtimeSubscription {
    const channelName = `realtime-${options.table}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        },
        options.callback
      )
      .subscribe();

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  },

  /**
   * 订阅产品数据变更
   */
  subscribeToProducts(callback: (payload: any) => void): RealtimeSubscription {
    return this.subscribe({
      table: 'products',
      callback: (payload) => {
        console.log('Product realtime update:', payload);
        callback(payload);
      }
    });
  },

  /**
   * 订阅订单状态变更
   */
  subscribeToOrders(callback: (payload: any) => void, userId?: string): RealtimeSubscription {
    return this.subscribe({
      table: 'orders',
      filter: userId ? `user_id=eq.${userId}` : undefined,
      callback: (payload) => {
        console.log('Order realtime update:', payload);
        callback(payload);
      }
    });
  },

  /**
   * 订阅报价变更
   */
  subscribeToQuotations(callback: (payload: any) => void, userId?: string): RealtimeSubscription {
    return this.subscribe({
      table: 'quotations',
      filter: userId ? `supplier_id=eq.${userId}` : undefined,
      callback: (payload) => {
        console.log('Quotation realtime update:', payload);
        callback(payload);
      }
    });
  },

  /**
   * 订阅用户通知
   */
  subscribeToNotifications(callback: (payload: any) => void, userId: string): RealtimeSubscription {
    return this.subscribe({
      table: 'user_notifications',
      filter: `user_id=eq.${userId}`,
      event: 'INSERT',
      callback: (payload) => {
        console.log('New notification:', payload);
        callback(payload);
      }
    });
  },

  // Note: Supplier verification subscription has been removed

  /**
   * 用户在线状态管理
   */
  trackUserPresence(userId: string, metadata: Record<string, any> = {}) {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: userId
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Online users:', Object.keys(state));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            ...metadata
          });
        }
      });

    return {
      channel,
      updatePresence: (newMetadata: Record<string, any>) => {
        return channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          ...newMetadata
        });
      },
      unsubscribe: () => {
        supabase.removeChannel(channel);
      }
    };
  }
};