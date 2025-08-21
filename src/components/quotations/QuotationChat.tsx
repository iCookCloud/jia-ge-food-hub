import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  Clock,
  User,
  FileText,
  X
} from "lucide-react";
import { useConversation, useSendMessage, useMarkConversationAsRead } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface QuotationChatProps {
  quotationId: string;
  supplierId: string;
  supplierName: string;
  quotationTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuotationChat = ({
  quotationId,
  supplierId,
  supplierName,
  quotationTitle,
  open,
  onOpenChange
}: QuotationChatProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const { data: messages = [], isLoading } = useConversation(supplierId, quotationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkConversationAsRead();

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 标记对话为已读
  useEffect(() => {
    if (open && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.sender_id === supplierId && !m.is_read);
      if (unreadMessages.length > 0) {
        markAsRead.mutate({ userId: supplierId, quotationId });
      }
    }
  }, [open, messages, supplierId, quotationId, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await sendMessage.mutateAsync({
        receiver_id: supplierId,
        quotation_id: quotationId,
        message_type: 'quotation_reply',
        content: newMessage.trim()
      });
      setNewMessage("");
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageBubble = ({ message }: { message: any }) => {
    const isSentByMe = message.sender_id === user?.id;
    
    return (
      <div className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isSentByMe && (
          <Avatar className="h-8 w-8 mr-2">
            <AvatarImage src={message.sender_profile?.avatar_url} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${
          isSentByMe 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        } rounded-lg p-3`}>
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          <div className={`text-xs mt-1 ${
            isSentByMe 
              ? 'text-primary-foreground/70' 
              : 'text-muted-foreground'
          }`}>
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: zhCN
            })}
          </div>
        </div>
        
        {isSentByMe && (
          <Avatar className="h-8 w-8 ml-2">
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>询价沟通</span>
            </DialogTitle>
          </div>
          <DialogDescription>
            与供应商 {supplierName} 就报价 "{quotationTitle}" 进行沟通
          </DialogDescription>
          <div className="flex items-center justify-end">
            <span className="text-sm text-muted-foreground">
              供应商: {supplierName}
            </span>
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 询价信息卡片 */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm">
                  {quotationTitle || '询价单'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  与 {supplierName} 的沟通
                </p>
              </div>
              <Badge variant="outline">询价中</Badge>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 消息区域 */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Clock className="h-6 w-6 mr-2 animate-spin" />
              <span className="text-muted-foreground">加载对话中...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>还没有消息，开始沟通吧！</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </ScrollArea>

        <Separator />

        {/* 输入区域 */}
        <div className="p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="输入消息..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessage.isPending}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sendMessage.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            按 Enter 发送消息
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};