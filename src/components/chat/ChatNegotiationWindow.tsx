import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  DollarSign, 
  Check, 
  X, 
  MessageCircle,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  chatNegotiationService,
  ChatMessage,
  PriceProposal 
} from '@/services/chatNegotiationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatNegotiationWindowProps {
  quotationId: string;
  currentUserId: string;
  buyerId: string;
  supplierId: string;
  currentPrice: number;
  originalPrice: number;
  supplierConfirmed: boolean;
  buyerConfirmed: boolean;
  onPriceUpdate?: (newPrice: number) => void;
  onConfirmationUpdate?: (buyerConfirmed: boolean, supplierConfirmed: boolean) => void;
}

export const ChatNegotiationWindow: React.FC<ChatNegotiationWindowProps> = ({
  quotationId,
  currentUserId,
  buyerId,
  supplierId,
  currentPrice,
  originalPrice,
  supplierConfirmed,
  buyerConfirmed,
  onPriceUpdate,
  onConfirmationUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [showPriceProposal, setShowPriceProposal] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);

  const isCurrentUserBuyer = currentUserId === buyerId;
  const isCurrentUserSupplier = currentUserId === supplierId;
  const bothConfirmed = supplierConfirmed && buyerConfirmed;

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载聊天记录
  const loadMessages = async () => {
    const { data, error } = await chatNegotiationService.getChatMessages(quotationId);
    if (error) {
      toast.error('加载聊天记录失败');
      return;
    }
    setMessages(data || []);
    setTimeout(scrollToBottom, 100);
  };

  // 发送文本消息
  const sendTextMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    const { data, error } = await chatNegotiationService.sendTextMessage(
      quotationId,
      newMessage.trim()
    );
    
    if (error) {
      toast.error('发送消息失败');
    } else {
      setNewMessage('');
      // 立即添加消息到本地状态，不等待 Realtime
      if (data) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
        setTimeout(scrollToBottom, 100);
      }
    }
    setLoading(false);
  };

  // 发送价格提案
  const sendPriceProposal = async () => {
    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('请输入有效的价格');
      return;
    }

    setLoading(true);
    const proposal: PriceProposal = {
      quotation_id: quotationId,
      proposed_price: price,
      message: `我建议价格调整为 ¥${price.toLocaleString()}`
    };

    const { data, error } = await chatNegotiationService.sendPriceProposal(proposal);
    
    if (error) {
      toast.error('发送价格提案失败');
    } else {
      setProposedPrice('');
      setShowPriceProposal(false);
      toast.success('价格提案已发送');
      // 立即添加消息到本地状态
      if (data) {
        setMessages(prev => {
          const exists = prev.some(msg => msg.id === data.id);
          if (exists) return prev;
          return [...prev, data];
        });
        setTimeout(scrollToBottom, 100);
      }
    }
    setLoading(false);
  };

  // 接受价格提案
  const acceptPriceProposal = async (messageId: string, price: number) => {
    setLoading(true);
    const { error } = await chatNegotiationService.acceptPriceProposal(
      messageId,
      quotationId
    );
    
    if (error) {
      toast.error('接受价格提案失败');
    } else {
      toast.success('价格提案已接受');
      onPriceUpdate?.(price);
    }
    setLoading(false);
  };

  // 拒绝价格提案
  const declinePriceProposal = async (messageId: string) => {
    setLoading(true);
    const { error } = await chatNegotiationService.declinePriceProposal(
      messageId,
      '价格不合适'
    );
    
    if (error) {
      toast.error('拒绝价格提案失败');
    } else {
      toast.success('价格提案已拒绝');
    }
    setLoading(false);
  };

  // 确认最终价格
  const confirmFinalPrice = async () => {
    setLoading(true);
    const { error } = await chatNegotiationService.confirmFinalPrice(quotationId);
    
    if (error) {
      toast.error('确认价格失败');
    } else {
      toast.success('价格已确认');
      if (isCurrentUserBuyer) {
        onConfirmationUpdate?.(true, supplierConfirmed);
      } else {
        onConfirmationUpdate?.(buyerConfirmed, true);
      }
    }
    setLoading(false);
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage();
    }
  };

  // 渲染消息
  const renderMessage = (message: ChatMessage) => {
    const isFromCurrentUser = message.sender_id === currentUserId;
    const isSystemMessage = message.message_type === 'system';
    const isPriceProposal = message.message_type === 'price_proposal';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-4">
          <Badge variant="outline" className="bg-gray-50">
            <Clock className="w-3 h-3 mr-1" />
            {message.message_content}
          </Badge>
        </div>
      );
    }

    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 mb-4",
          isFromCurrentUser ? "justify-end" : "justify-start"
        )}
      >
        {!isFromCurrentUser && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.sender_profile?.avatar_url} />
            <AvatarFallback>
              {message.sender_profile?.nickname?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={cn(
            "max-w-[70%] rounded-lg px-3 py-2",
            isFromCurrentUser
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-900",
            isPriceProposal && "border-2 border-yellow-300"
          )}
        >
          {isPriceProposal && (
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="font-semibold">价格提案</span>
              <Badge variant={message.price_status === 'accepted' ? 'default' : 
                            message.price_status === 'declined' ? 'destructive' : 'secondary'}>
                {message.price_status === 'accepted' ? '已接受' :
                 message.price_status === 'declined' ? '已拒绝' : '等待回复'}
              </Badge>
            </div>
          )}
          
          <p className="text-sm">{message.message_content}</p>
          
          {isPriceProposal && message.proposed_price && (
            <div className="mt-2 pt-2 border-t border-current/20">
              <div className="font-semibold text-lg">
                ¥{message.proposed_price.toLocaleString()}
              </div>
              
              {message.price_status === 'pending' && !isFromCurrentUser && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => acceptPriceProposal(message.id, message.proposed_price!)}
                    disabled={loading}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    接受
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => declinePriceProposal(message.id)}
                    disabled={loading}
                  >
                    <X className="w-3 h-3 mr-1" />
                    拒绝
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
        
        {isFromCurrentUser && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.sender_profile?.avatar_url} />
            <AvatarFallback>
              {message.sender_profile?.nickname?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  // 组件初始化
  useEffect(() => {
    loadMessages();

    // 设置实时订阅
    const channel = chatNegotiationService.subscribeToChatMessages(
      quotationId,
      async (newMessage) => {
        // 获取发送者的个人信息
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', newMessage.sender_id)
          .single();

        // 添加发送者信息到消息
        const enrichedMessage = {
          ...newMessage,
          sender_profile: senderProfile || { nickname: '未知用户', avatar_url: null }
        };

        setMessages(prev => {
          // 检查是否已存在（处理竞态条件和重复）
          const exists = prev.some(msg => msg.id === enrichedMessage.id);
          if (exists) return prev;
          
          return [...prev, enrichedMessage];
        });
        setTimeout(scrollToBottom, 100);
      }
    );
    setRealtimeChannel(channel);

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [quotationId]);

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            协商聊天
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">
              当前价格: ¥{currentPrice.toLocaleString()}
            </Badge>
            {currentPrice !== originalPrice && (
              <Badge variant={currentPrice < originalPrice ? 'destructive' : 'default'}>
                {currentPrice < originalPrice ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1" />
                )}
                {((currentPrice - originalPrice) / originalPrice * 100).toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* 确认状态 */}
        <div className="flex gap-2">
          <Badge variant={buyerConfirmed ? 'default' : 'outline'}>
            买家 {buyerConfirmed ? '已确认' : '未确认'}
          </Badge>
          <Badge variant={supplierConfirmed ? 'default' : 'outline'}>
            供应商 {supplierConfirmed ? '已确认' : '未确认'}
          </Badge>
        </div>

        {/* 聊天区域 */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {!bothConfirmed && (
          <>
            <Separator />
            
            {/* 价格提案区域 */}
            {showPriceProposal && (
              <div className="space-y-3 p-3 bg-yellow-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">发送价格提案</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="输入建议价格"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  <Button onClick={sendPriceProposal} disabled={loading}>
                    发送
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPriceProposal(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 输入区域 */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex flex-col gap-2">
                  <Button onClick={sendTextMessage} disabled={loading || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowPriceProposal(true)}
                    disabled={showPriceProposal}
                  >
                    <DollarSign className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* 确认价格按钮 */}
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  按 Enter 发送，Shift + Enter 换行
                </div>
                <Button
                  onClick={confirmFinalPrice}
                  disabled={loading || bothConfirmed || 
                    (isCurrentUserBuyer && buyerConfirmed) ||
                    (isCurrentUserSupplier && supplierConfirmed)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isCurrentUserBuyer && buyerConfirmed ? '已确认价格' :
                   isCurrentUserSupplier && supplierConfirmed ? '已确认价格' :
                   '确认当前价格'}
                </Button>
              </div>
            </div>
          </>
        )}

        {bothConfirmed && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-semibold">双方已确认价格</p>
            <p className="text-green-600 text-sm">
              最终价格：¥{currentPrice.toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};