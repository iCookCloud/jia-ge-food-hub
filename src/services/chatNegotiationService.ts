import { supabase } from '@/integrations/supabase/client';

// 类型定义
export interface ChatMessage {
  id: string;
  order_list_id: string;
  quotation_id: string;
  buyer_id: string;
  supplier_id: string;
  message_type: 'text' | 'price_proposal' | 'system';
  message_content: string;
  sender_id: string;
  proposed_price?: number;
  price_status?: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender_profile?: {
    nickname: string;
    avatar_url?: string;
  };
}

export interface PriceProposal {
  quotation_id: string;
  proposed_price: number;
  message: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: any;
}

export const chatNegotiationService = {
  // 获取协商会话的聊天记录
  getChatMessages: async (
    quotationId: string
  ): Promise<ApiResponse<ChatMessage[]>> => {
    try {
      const { data, error } = await supabase
        .from('chat_negotiations')
        .select(`
          *,
          sender_profile:profiles!sender_id(nickname, avatar_url)
        `)
        .eq('quotation_id', quotationId)
        .order('created_at', { ascending: true });

      if (error) {
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 发送文本消息
  sendTextMessage: async (
    quotationId: string,
    message: string
  ): Promise<ApiResponse<ChatMessage>> => {
    try {
      // 获取报价信息
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('product_list_id as order_list_id, customer_id as supplier_id')
        .eq('id', quotationId)
        .single();

      if (quotationError) {
        return { data: null, error: quotationError };
      }

      // 获取订单买家信息
      const { data: orderList, error: orderError } = await supabase
        .from('product_lists')
        .select('user_id as buyer_id')
        .eq('id', quotation.order_list_id)
        .single();

      if (orderError) {
        return { data: null, error: orderError };
      }

      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('chat_negotiations')
        .insert({
          order_list_id: quotation.order_list_id,
          quotation_id: quotationId,
          buyer_id: orderList.buyer_id,
          supplier_id: quotation.supplier_id,
          message_type: 'text',
          message_content: message,
          sender_id: user.user?.id
        })
        .select(`
          *,
          sender_profile:profiles!sender_id(nickname, avatar_url)
        `)
        .single();

      return { data: data as ChatMessage, error };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 发送价格提案
  sendPriceProposal: async (
    proposal: PriceProposal
  ): Promise<ApiResponse<ChatMessage>> => {
    // 获取报价信息
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('product_list_id as order_list_id, customer_id as supplier_id')
      .eq('id', proposal.quotation_id)
      .single();

    if (quotationError) {
      return { data: null, error: quotationError };
    }

    // 获取订单买家信息
    const { data: orderList, error: orderError } = await supabase
      .from('product_lists')
      .select('user_id as buyer_id')
      .eq('id', quotation.order_list_id)
      .single();

    if (orderError) {
      return { data: null, error: orderError };
    }

    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('chat_negotiations')
      .insert({
        order_list_id: quotation.order_list_id,
        quotation_id: proposal.quotation_id,
        buyer_id: orderList.buyer_id,
        supplier_id: quotation.supplier_id,
        message_type: 'price_proposal',
        message_content: proposal.message,
        sender_id: user.user?.id,
        proposed_price: proposal.proposed_price,
        price_status: 'pending'
      })
      .select(`
        *,
        sender_profile:profiles!sender_id(nickname, avatar_url)
      `)
      .single();

    return { data: data as ChatMessage, error };
  },

  // 接受价格提案
  acceptPriceProposal: async (
    messageId: string,
    quotationId: string
  ): Promise<ApiResponse<void>> => {
    const { data: user } = await supabase.auth.getUser();
    
    // 获取价格提案
    const { data: proposal, error: proposalError } = await supabase
      .from('chat_negotiations')
      .select('*')
      .eq('id', messageId)
      .single();

    if (proposalError) {
      return { data: null, error: proposalError };
    }

    // 获取报价信息
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('product_list_id as order_list_id, customer_id as supplier_id')
      .eq('id', quotationId)
      .single();

    if (quotationError) {
      return { data: null, error: quotationError };
    }

    // 获取订单买家信息
    const { data: orderList, error: orderError } = await supabase
      .from('product_lists')
      .select('user_id as buyer_id')
      .eq('id', quotation.order_list_id)
      .single();

    if (orderError) {
      return { data: null, error: orderError };
    }

    // 判断是买家还是供应商
    const isBuyer = user.user?.id === orderList.buyer_id;
    const isSupplier = user.user?.id === quotation.supplier_id;

    if (!isBuyer && !isSupplier) {
      return { data: null, error: { message: '无权限操作' } };
    }

    // 更新确认状态
    const updateData = isBuyer 
      ? { buyer_confirmed: true }
      : { supplier_confirmed: true };

    const { error } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('id', quotationId);

    if (!error) {
      // 发送确认消息
      const role = isBuyer ? '买家' : '供应商';
      await this.sendSystemMessage(
        quotationId,
        `${role}已确认最终价格`
      );
    }

    return { data: null, error };
  },

  // 拒绝价格提案
  declinePriceProposal: async (
    messageId: string,
    reason?: string
  ): Promise<ApiResponse<void>> => {
    const { error } = await supabase
      .from('chat_negotiations')
      .update({ price_status: 'declined' })
      .eq('id', messageId);

    if (reason) {
      // 获取消息信息以发送拒绝原因
      const { data: message } = await supabase
        .from('chat_negotiations')
        .select('quotation_id')
        .eq('id', messageId)
        .single();

      if (message) {
        await this.sendSystemMessage(
          message.quotation_id,
          `价格提案被拒绝：${reason}`
        );
      }
    }

    return { data: null, error };
  },

  // 确认最终价格（买家或供应商）
  confirmFinalPrice: async (quotationId: string): Promise<ApiResponse<void>> => {
    const { data: user } = await supabase.auth.getUser();
    
    // 获取报价信息
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('order_list_id, supplier_id')
      .eq('id', quotationId)
      .single();

    if (quotationError) {
      return { data: null, error: quotationError };
    }

    // 获取订单买家信息
    const { data: orderList, error: orderError } = await supabase
      .from('product_lists')
      .select('user_id as buyer_id')
      .eq('id', quotation.order_list_id)
      .single();

    if (orderError) {
      return { data: null, error: orderError };
    }

    // 判断是买家还是供应商
    const isBuyer = user.user?.id === orderList.buyer_id;
    const isSupplier = user.user?.id === quotation.supplier_id;

    if (!isBuyer && !isSupplier) {
      return { data: null, error: { message: '无权限操作' } };
    }

    // 更新确认状态
    const updateData = isBuyer 
      ? { buyer_confirmed: true }
      : { supplier_confirmed: true };

    const { error } = await supabase
      .from('quotations')
      .update(updateData)
      .eq('id', quotationId);

    if (!error) {
      // 发送确认消息
      const role = isBuyer ? '买家' : '供应商';
      await this.sendSystemMessage(
        quotationId,
        `${role}已确认最终价格`
      );
    }

    return { data: null, error };
  },

  // 发送系统消息
  sendSystemMessage: async (
    quotationId: string,
    message: string
  ): Promise<ApiResponse<ChatMessage>> => {
    // 获取报价信息
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('product_list_id as order_list_id, customer_id as supplier_id')
      .eq('id', quotationId)
      .single();

    if (quotationError) {
      return { data: null, error: quotationError };
    }

    // 获取订单买家信息
    const { data: orderList, error: orderError } = await supabase
      .from('product_lists')
      .select('user_id as buyer_id')
      .eq('id', quotation.order_list_id)
      .single();

    if (orderError) {
      return { data: null, error: orderError };
    }

    const { data, error } = await supabase
      .from('chat_negotiations')
      .insert({
        order_list_id: quotation.order_list_id,
        quotation_id: quotationId,
        buyer_id: orderList.buyer_id,
        supplier_id: quotation.supplier_id,
        message_type: 'system',
        message_content: message,
        sender_id: orderList.buyer_id // 系统消息发送者设为买家
      })
      .select(`
        *,
        sender_profile:profiles!sender_id(nickname, avatar_url)
      `)
      .single();

    return { data: data as ChatMessage, error };
  },

  // 订阅聊天消息实时更新
  subscribeToChatMessages: (
    quotationId: string,
    callback: (message: ChatMessage) => void
  ) => {
    return supabase
      .channel(`chat_${quotationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_negotiations',
          filter: `quotation_id=eq.${quotationId}`
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
  },

  // 获取协商状态
  getNegotiationStatus: async (
    quotationId: string
  ): Promise<ApiResponse<any>> => {
    try {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          product_list:product_lists(name, status)
        `)
        .eq('id', quotationId)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // 获取用户的协商列表
  getUserNegotiations: async (): Promise<ApiResponse<any[]>> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: [], error: null };
      }

      // 获取用户参与的协商
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          product_list:product_lists(name, status),
          chat_negotiations(
            id,
            message_content,
            created_at,
            sender_profile:profiles!sender_id(nickname)
          )
        `)
        .or(`customer_id.eq.${user.user.id},product_list.user_id.eq.${user.user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { data: [], error: error as any };
    }
  }
};