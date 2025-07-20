-- 创建用户消息表
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  quotation_id UUID NULL REFERENCES public.quotations(id),
  message_type TEXT NOT NULL DEFAULT 'text', -- text, quotation_reply, system
  content TEXT NOT NULL,
  attachments JSONB NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- 创建消息相关的RLS策略
CREATE POLICY "Users can view their own messages" 
ON public.user_messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.user_messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" 
ON public.user_messages 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- 创建报价对话表
CREATE TABLE IF NOT EXISTS public.quotation_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  participants JSONB NOT NULL, -- 存储参与者ID数组
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.quotation_conversations ENABLE ROW LEVEL SECURITY;

-- 创建对话的RLS策略
CREATE POLICY "Users can view conversations they participate in" 
ON public.quotation_conversations 
FOR SELECT 
USING (participants ? auth.uid()::text);

CREATE POLICY "System can manage conversations" 
ON public.quotation_conversations 
FOR ALL 
USING (true);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_receiver ON public.user_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_quotation ON public.user_messages(quotation_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON public.user_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_conversations_quotation ON public.quotation_conversations(quotation_id);

-- 创建更新时间戳的触发器
CREATE TRIGGER update_user_messages_updated_at
BEFORE UPDATE ON public.user_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 更新报价表，添加对话相关字段
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS has_messages BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE NULL;