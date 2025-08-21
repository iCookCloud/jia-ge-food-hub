import { supabase } from '@/integrations/supabase/client';
import { FilterParams, PaginationParams, ApiResponse } from './api';

// 货单卡片信息结构
export interface ProductListSummary {
  name: string;
  total_amount: number;
  status: string;
  created_at: string;
  description?: string;
  delivery_location?: string;
  item_count?: number;
  special_requirements?: string;
}

// 聊天消息接口
export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'product_list_reference';
  referenced_order_list_id?: string | null;
  referenced_list_summary?: ProductListSummary | null;
  quotation_id?: string | null;
  attachments?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    nickname?: string;
    avatar_url?: string;
  } | null;
  quotation?: {
    id: string;
    sheet_name?: string;
    status: string;
  } | null;
}

// 聊天会话接口
export interface ChatSession {
  user_id: string;
  user_nickname?: string;
  user_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface MessageFilters extends FilterParams {
  sender_id?: string;
  receiver_id?: string;
  quotation_id?: string;
  message_type?: string;
  is_read?: boolean;
}

export const chatService = {
  // 获取与特定用户的聊天记录
  getChatMessages: async (
    receiverId: string,
    quotationId?: string
  ): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: [], error: { message: '用户未登录' } };
      }

      let query = supabase
        .from('user_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.user.id})`);

      if (quotationId) {
        query = query.eq('quotation_id', quotationId);
      }

      const { data: messages, error } = await query.order('created_at', { ascending: true });
      
      if (error) {
        return { data: [], error };
      }

      if (!messages || messages.length === 0) {
        return { data: [], error: null };
      }

      // 获取发送者资料信息
      const senderIds = [...new Set(messages.map(msg => msg.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', senderIds);

      // 创建用户资料映射
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // 为消息添加发送者资料信息
      const messagesWithProfiles = messages.map(msg => ({
        ...msg,
        sender_profile: profileMap.get(msg.sender_id)
      })) as ChatMessage[];

      return { data: messagesWithProfiles, error: null };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  },

  // 发送文本消息
  sendTextMessage: async (
    receiverId: string,
    content: string,
    quotationId?: string
  ): Promise<ApiResponse<ChatMessage>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: { message: '用户未登录' } };
      }

      const { data, error } = await supabase
        .from('user_messages')
        .insert([{
          sender_id: user.user.id,
          receiver_id: receiverId,
          quotation_id: quotationId,
          message_type: 'text',
          content: content,
          is_read: false
        }])
        .select('*')
        .single();

      if (error) {
        return { data: null, error };
      }

      // 获取发送者资料
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', user.user.id)
        .single();

      // 添加发送者资料到消息
      const messageWithProfile = {
        ...data,
        sender_profile: senderProfile
      } as ChatMessage;

      return { data: messageWithProfile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // 发送货单引用消息（包含卡片信息）
  sendProductListReference: async (
    receiverId: string,
    productListId: string,
    listSummary: ProductListSummary,
    message?: string
  ): Promise<ApiResponse<ChatMessage>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: { message: '用户未登录' } };
      }

      const content = message || `引用了货单：${listSummary.name}`;

      const { data, error } = await supabase
        .from('user_messages')
        .insert([{
          sender_id: user.user.id,
          receiver_id: receiverId,
          message_type: 'product_list_reference',
          content: content,
          referenced_order_list_id: productListId,
          referenced_list_summary: listSummary,
          is_read: false
        }])
        .select('*')
        .single();

      if (error) {
        return { data: null, error };
      }

      // 获取发送者资料
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', user.user.id)
        .single();

      // 添加发送者资料到消息
      const messageWithProfile = {
        ...data,
        sender_profile: senderProfile
      } as ChatMessage;

      return { data: messageWithProfile, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // 获取用户的聊天会话列表
  getChatSessions: async (): Promise<ApiResponse<ChatSession[]>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: [], error: { message: '用户未登录' } };
      }

      // 获取最近的聊天记录（简化查询，不使用连接）
      const { data: messages, error } = await supabase
        .from('user_messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
        .or(`sender_id.eq.${user.user.id},receiver_id.eq.${user.user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }

      if (!messages || messages.length === 0) {
        return { data: [], error: null };
      }

      // 收集所有用户ID
      const userIds = new Set<string>();
      messages.forEach(msg => {
        userIds.add(msg.sender_id);
        userIds.add(msg.receiver_id);
      });
      userIds.delete(user.user.id); // 移除当前用户ID

      // 获取用户资料信息
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', Array.from(userIds));

      if (profileError) {
        console.error('Error loading profiles:', profileError);
      }

      // 创建用户资料映射
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // 按对话方分组并计算未读数量
      const sessionMap = new Map<string, ChatSession>();
      
      messages.forEach((msg) => {
        // 跳过自己和自己聊天的消息
        if (msg.sender_id === msg.receiver_id) {
          return;
        }
        
        const otherUserId = msg.sender_id === user.user.id ? msg.receiver_id : msg.sender_id;
        const otherUserProfile = profileMap.get(otherUserId);
        
        if (!sessionMap.has(otherUserId)) {
          sessionMap.set(otherUserId, {
            user_id: otherUserId,
            user_nickname: otherUserProfile?.nickname,
            user_avatar: otherUserProfile?.avatar_url,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0
          });
        }

        // 计算未读消息数（对方发送给我的未读消息）
        if (msg.receiver_id === user.user.id && !msg.is_read) {
          const session = sessionMap.get(otherUserId)!;
          session.unread_count += 1;
        }
      });

      return { data: Array.from(sessionMap.values()), error: null };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  },

  // 标记对话为已读
  markConversationAsRead: async (
    otherUserId: string,
    quotationId?: string
  ): Promise<ApiResponse<void>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: { message: '用户未登录' } };
      }

      let query = supabase
        .from('user_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.user.id)
        .eq('is_read', false);

      if (quotationId) {
        query = query.eq('quotation_id', quotationId);
      }

      const { error } = await query;
      return { data: null, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  // 获取未读消息数量
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: 0, error: null };
      }

      const { count, error } = await supabase
        .from('user_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.user.id)
        .eq('is_read', false);

      return { data: count || 0, error };
    } catch (error) {
      return { data: 0, error: error as Error };
    }
  },

  // 订阅实时消息
  subscribeToChatMessages: (
    receiverId: string,
    callback: (message: ChatMessage) => void,
    profileCache?: Map<string, { nickname?: string; avatar_url?: string }>
  ) => {
    const cache = profileCache || new Map();
    
    return supabase
      .channel(`chat_${receiverId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_messages'
        },
        async (payload) => {
          const newMessage = payload.new;
          // 只处理与当前对话相关的消息
          const { data: user } = await supabase.auth.getUser();
          if (user.user && (
            (newMessage.sender_id === receiverId && newMessage.receiver_id === user.user.id) ||
            (newMessage.sender_id === user.user.id && newMessage.receiver_id === receiverId)
          )) {
            // 获取完整消息信息（包含用户资料）
            const { data: messageData } = await supabase
              .from('user_messages')
              .select('*')
              .eq('id', newMessage.id)
              .single();
            
            if (messageData) {
              // 检查缓存中是否有发送者资料
              let senderProfile = cache.get(messageData.sender_id);
              if (!senderProfile) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('nickname, avatar_url')
                  .eq('id', messageData.sender_id)
                  .single();
                senderProfile = profile;
                if (profile) {
                  cache.set(messageData.sender_id, profile);
                }
              }

              // 添加发送者资料到消息
              const messageWithProfile = {
                ...messageData,
                sender_profile: senderProfile
              } as ChatMessage;

              callback(messageWithProfile);
            }
          }
        }
      )
      .subscribe();
  }
};

// 为了向后兼容，继续导出原有的 messageService
export const messageService = {
  getMessages: async (
    filters: MessageFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<ChatMessage[]>> => {
    let query = supabase
      .from('user_messages')
      .select(`
        *,
        sender_profile:profiles!sender_id(nickname, avatar_url),
        quotation:quotations(id, sheet_name, status)
      `);

    // 应用过滤器
    if (filters.sender_id) {
      query = query.eq('sender_id', filters.sender_id);
    }
    if (filters.receiver_id) {
      query = query.eq('receiver_id', filters.receiver_id);
    }
    if (filters.quotation_id) {
      query = query.eq('quotation_id', filters.quotation_id);
    }
    if (filters.message_type) {
      query = query.eq('message_type', filters.message_type);
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }

    // 应用分页
    if (pagination.page && pagination.limit) {
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data: data as ChatMessage[], error };
  },

  getConversation: async (
    userId: string,
    quotationId?: string
  ): Promise<ApiResponse<ChatMessage[]>> => {
    return chatService.getChatMessages(userId, quotationId);
  },

  sendMessage: async (messageData: {
    receiver_id: string;
    quotation_id?: string;
    message_type?: string;
    content: string;
    attachments?: Record<string, unknown>;
  }): Promise<ApiResponse<ChatMessage>> => {
    return chatService.sendTextMessage(
      messageData.receiver_id,
      messageData.content,
      messageData.quotation_id
    );
  },

  markAsRead: async (messageId: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase
      .from('user_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    return { data: null, error };
  },

  markConversationAsRead: chatService.markConversationAsRead,
  getUnreadCount: chatService.getUnreadCount
};