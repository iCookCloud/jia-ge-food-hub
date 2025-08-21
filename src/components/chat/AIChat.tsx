import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Bot, 
  User, 
  MessageCircle, 
  X,
  Loader2,
  Building2,
  Package,
  TrendingUp,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  typing?: boolean;
}

interface AIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: {
    id: string;
    nickname: string;
    avatar_url?: string;
    company_name?: string;
    verification_status: string;
    main_categories?: string[];
    total_orders?: number;
    total_sales?: number;
    success_rate?: number;
  };
}

export const AIChat = ({ open, onOpenChange, supplier }: AIChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 初始化对话
  useEffect(() => {
    if (open && supplier && messages.length === 0) {
      const welcomeMessage: Message = {
        id: `ai-${Date.now()}`,
        content: `您好！我是${supplier.company_name || supplier.nickname}的AI助手。我可以帮您了解我们的产品、服务和合作方式。请问有什么可以为您服务的吗？`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [open, supplier]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 模拟AI回复
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('产品') || lowerMessage.includes('商品')) {
      return `我们主要经营${supplier?.main_categories?.join('、') || '优质商品'}。我们有丰富的产品线，已经完成了${supplier?.total_orders || 50}+订单，客户满意度达到${supplier?.success_rate?.toFixed(1) || '90.0'}%。请问您对哪类产品比较感兴趣？我可以为您推荐相关的货单。`;
    }
    
    if (lowerMessage.includes('价格') || lowerMessage.includes('报价')) {
      return `关于价格，我们会根据订单量、交期等因素提供最优惠的报价。我们的累计销售额已达到¥${supplier?.total_sales?.toLocaleString() || '500,000'}，拥有稳定的供应链优势。请您提供具体的需求，我会为您制定专属的报价方案。`;
    }
    
    if (lowerMessage.includes('合作') || lowerMessage.includes('供应')) {
      return `我们非常重视长期合作关系！作为${supplier?.verification_status === 'verified' ? '认证' : ''}供应商，我们可以提供稳定的供货能力和优质的服务。我们支持多种合作模式，包括批量采购、定期供货等。请问您的预期采购规模和周期是怎样的？`;
    }
    
    if (lowerMessage.includes('质量') || lowerMessage.includes('认证')) {
      return `质量是我们的核心竞争力！我们${supplier?.verification_status === 'verified' ? '已通过平台认证' : '正在申请平台认证'}，所有产品都严格按照行业标准生产。我们建立了完善的质量管控体系，确保每一批产品都符合质量要求。欢迎您到我们公司实地考察！`;
    }
    
    if (lowerMessage.includes('物流') || lowerMessage.includes('配送')) {
      return `我们与多家知名物流公司建立了合作关系，可以提供全国配送服务。根据产品特性，我们支持常温、冷链等不同运输方式。一般情况下，本地1-2天，外地3-5天可以送达。大宗订单我们还可以提供专车配送服务。`;
    }
    
    if (lowerMessage.includes('联系') || lowerMessage.includes('电话')) {
      return `您可以通过以下方式联系我们：\n\n📞 联系电话：请在供应商详情页查看\n📧 邮箱：请在供应商详情页查看\n🏢 公司：${supplier?.company_name || '我们公司'}\n\n我也可以帮您转接人工客服，或者您直接在平台上发起合作申请，我们会尽快与您联系！`;
    }
    
    // 默认回复
    const defaultResponses = [
      `感谢您的询问！我是${supplier?.company_name || supplier?.nickname}的AI助手，我会尽力为您提供帮助。请问您想了解我们的哪方面信息呢？`,
      `我们一直致力于为客户提供优质的产品和服务。如果您有任何具体问题，请随时告诉我，我会为您详细解答。`,
      `作为专业的供应商，我们在${supplier?.main_categories?.join('、') || '相关领域'}有丰富的经验。请问有什么我可以为您介绍的吗？`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(newMessage);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI回复失败:', error);
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        content: "抱歉，我暂时无法回复您的消息，请稍后再试。您也可以直接联系我们的人工客服。",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      {message.sender === 'ai' && (
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={supplier?.avatar_url} />
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {message.sender === 'user' && (
        <Avatar className="h-8 w-8 ml-2">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={supplier?.avatar_url} />
              <AvatarFallback>
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>AI助手 - {supplier?.nickname || '智能客服'}</span>
                {supplier?.verification_status === 'verified' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    认证
                  </Badge>
                )}
              </DialogTitle>
              {supplier?.company_name && (
                <p className="text-sm text-muted-foreground">{supplier.company_name}</p>
              )}
            </div>
          </div>
          <DialogDescription>
            与 {supplier?.company_name || supplier?.nickname || '供应商'} 的AI助手进行智能对话
          </DialogDescription>
        </DialogHeader>

        {/* 供应商信息卡片 */}
        {supplier && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">主营类目</div>
                    <div className="font-medium">
                      {supplier.main_categories?.join(', ') || '暂无信息'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">订单数</div>
                    <div className="font-medium">{supplier.total_orders || 0}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">销售额</div>
                    <div className="font-medium">¥{supplier.total_sales?.toLocaleString() || 0}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">成功率</div>
                    <div className="font-medium">{supplier.success_rate?.toFixed(1) || 0}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* 消息区域 */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={supplier?.avatar_url} />
                <AvatarFallback>
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center space-x-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isTyping}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            按Enter发送，Shift+Enter换行
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};