import { supabase } from '@/integrations/supabase/client';
import { FilterParams, PaginationParams, ApiResponse } from './api';

export interface UserMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  quotation_id?: string | null;
  message_type: string;
  content: string;
  attachments?: any;
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

export interface MessageFilters extends FilterParams {
  sender_id?: string;
  receiver_id?: string;
  quotation_id?: string;
  message_type?: string;
  is_read?: boolean;
}

export const messageService = {
  // 获取用户消息列表
  getMessages: async (
    filters: MessageFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<UserMessage[]>> => {
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
    return { data: data as UserMessage[], error };
  },

  // 获取与特定用户的对话
  getConversation: async (
    userId: string,
    quotationId?: string
  ): Promise<ApiResponse<UserMessage[]>> => {
    let query = supabase
      .from('user_messages')
      .select(`
        *,
        sender_profile:profiles!sender_id(nickname, avatar_url),
        quotation:quotations(id, sheet_name, status)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (quotationId) {
      query = query.eq('quotation_id', quotationId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    return { data: data as UserMessage[], error };
  },

  // 发送消息
  sendMessage: async (messageData: {
    receiver_id: string;
    quotation_id?: string;
    message_type?: string;
    content: string;
    attachments?: any;
  }): Promise<ApiResponse<UserMessage>> => {
    const { data, error } = await supabase
      .from('user_messages')
      .insert([{
        sender_id: (await supabase.auth.getUser()).data.user?.id,
        receiver_id: messageData.receiver_id,
        quotation_id: messageData.quotation_id,
        message_type: messageData.message_type || 'text',
        content: messageData.content,
        attachments: messageData.attachments
      }])
      .select(`
        *,
        sender_profile:profiles!sender_id(nickname, avatar_url),
        quotation:quotations(id, sheet_name, status)
      `)
      .single();

    return { data: data as UserMessage, error };
  },

  // 标记消息为已读
  markAsRead: async (messageId: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase
      .from('user_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    return { data: null, error };
  },

  // 标记对话为已读
  markConversationAsRead: async (
    otherUserId: string,
    quotationId?: string
  ): Promise<ApiResponse<void>> => {
    let query = supabase
      .from('user_messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (quotationId) {
      query = query.eq('quotation_id', quotationId);
    }

    const { error } = await query;
    return { data: null, error };
  },

  // 获取未读消息数量
  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    const { count, error } = await supabase
      .from('user_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    return { data: count || 0, error };
  }
};