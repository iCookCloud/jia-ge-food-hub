import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Send,
  Plus,
  Paperclip,
  Smile,
  ArrowLeft,
  FileText,
  Loader2,
  Package,
  Calendar,
  MapPin,
  X
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderListSelector } from "@/components/order-list/OrderListSelector";
import { chatService, ChatMessage, ChatSession, ProductListSummary } from "@/services/chatService";
import { useAuth } from "@/hooks/useAuth";
import { useProduct } from "@/hooks/useProducts";
import { productListService } from "@/services/productListService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

// 用户资料信息
interface UserProfile {
  id: string;
  nickname?: string;
  avatar_url?: string;
  company_name?: string;
}

const QuotationsPage = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // URL 参数
  const toUserId = searchParams.get('to');
  const productId = searchParams.get('product');
  
  // 组件状态
  const [selectedUserId, setSelectedUserId] = useState<string | null>(toUserId);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [showChatView, setShowChatView] = useState(false);
  const [showOrderListSelector, setShowOrderListSelector] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [temporaryUserSession, setTemporaryUserSession] = useState<ChatSession | null>(null);
  const hasPrefilledMessage = useRef(false);
  const [showOrderListDetail, setShowOrderListDetail] = useState(false);
  const [selectedOrderListId, setSelectedOrderListId] = useState<string | null>(null);
  const [orderListDetail, setOrderListDetail] = useState<any>(null);
  const [loadingOrderListDetail, setLoadingOrderListDetail] = useState(false);
  
  // 获取商品信息（用于预填充询价消息）
  const { data: product } = useProduct(productId || "");

  // 加载聊天会话列表
  const loadChatSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await chatService.getChatSessions();
      if (error) {
        console.error('Error loading chat sessions:', error);
        toast.error('加载聊天列表失败');
        return;
      }
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('加载聊天列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载聊天消息
  const loadMessages = async (userId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await chatService.getChatMessages(userId);
      if (error) {
        console.error('Error loading messages:', error);
        toast.error('加载消息失败');
        return;
      }
      setMessages(data || []);
      
      // 标记消息为已读
      await chatService.markConversationAsRead(userId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('加载消息失败');
    }
  };

  // 加载可用用户列表
  const loadAvailableUsers = async () => {
    if (!user) return;
    
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, company_name')
        .neq('id', user.id) // 排除当前用户
        .limit(50);

      if (error) {
        console.error('Error loading users:', error);
        toast.error('加载用户列表失败');
        return;
      }
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('加载用户列表失败');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 加载货单详情
  const loadOrderListDetail = async (orderListId: string) => {
    setLoadingOrderListDetail(true);
    try {
      const { data, error } = await productListService.getProductList(orderListId);
      if (error) {
        console.error('Error loading order list detail:', error);
        toast.error('加载货单详情失败');
        return;
      }
      setOrderListDetail(data);
    } catch (error) {
      console.error('Error loading order list detail:', error);
      toast.error('加载货单详情失败');
    } finally {
      setLoadingOrderListDetail(false);
    }
  };

  // 处理选择用户开始对话
  const handleSelectNewUser = async (selectedUser: UserProfile) => {
    setSelectedUserId(selectedUser.id);
    setShowUserSelector(false);
    
    if (isMobile) {
      setShowChatView(true);
    }
    
    // 加载与该用户的消息记录
    await loadMessages(selectedUser.id);
    
    // 如果还没有聊天记录，添加到会话列表
    const existingSession = chatSessions.find(s => s.user_id === selectedUser.id);
    if (!existingSession) {
      const newSession: ChatSession = {
        user_id: selectedUser.id,
        user_nickname: selectedUser.nickname,
        user_avatar: selectedUser.avatar_url,
        last_message: "开始对话...",
        last_message_time: new Date().toISOString(),
        unread_count: 0
      };
      setChatSessions(prev => [newSession, ...prev]);
    }
  };

  // 初始化
  useEffect(() => {
    if (user) {
      loadChatSessions();
    }
  }, [user]);
  
  // 在聊天会话加载完成后，如果没有选中用户但有会话，自动选择第一个
  useEffect(() => {
    if (chatSessions.length > 0 && !selectedUserId && !toUserId) {
      // 自动选择第一个聊天会话（最近的对话）
      const firstSession = chatSessions[0];
      setSelectedUserId(firstSession.user_id);
      loadMessages(firstSession.user_id);
    }
  }, [chatSessions, selectedUserId, toUserId]);
  
  // 处理 URL 参数
  useEffect(() => {
    const handleUrlParams = async () => {
      if (toUserId && user) {
        setSelectedUserId(toUserId);
        if (isMobile) {
          setShowChatView(true);
        }
        loadMessages(toUserId);
        
        // 检查用户是否在现有会话中，如果不在，获取用户信息创建临时会话
        const existingSession = chatSessions.find(s => s.user_id === toUserId);
        if (!existingSession) {
          try {
            const { data: targetUserProfile } = await supabase
              .from('profiles')
              .select('id, nickname, avatar_url')
              .eq('id', toUserId)
              .single();

            if (targetUserProfile) {
              const tempSession: ChatSession = {
                user_id: toUserId,
                user_nickname: targetUserProfile.nickname,
                user_avatar: targetUserProfile.avatar_url,
                last_message: "开始对话...",
                last_message_time: new Date().toISOString(),
                unread_count: 0
              };
              setTemporaryUserSession(tempSession);
            }
          } catch (error) {
            console.error('Error fetching target user profile:', error);
          }
        }
        
        // 如果有商品ID，预填充询价消息（只执行一次）
        if (product && !hasPrefilledMessage.current) {
          hasPrefilledMessage.current = true;
          const inquiryMessage = `您好，我对您的 ${product.standard_chinese_name || product.standard_english_name || product.sku} 感兴趣，请问详细的规格和价格如何？`;
          setNewMessage(inquiryMessage);
        }
      }
    };

    handleUrlParams();
  }, [toUserId, productId, product, user, isMobile, chatSessions]);

  // 过滤聊天会话（包含临时用户会话）
  const allSessions = [...chatSessions];
  
  // 如果有临时用户会话且不在正式会话列表中，添加到列表头部
  if (temporaryUserSession && !chatSessions.find(s => s.user_id === temporaryUserSession.user_id)) {
    allSessions.unshift(temporaryUserSession);
  }
  
  const filteredSessions = allSessions.filter(session => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (session.user_nickname?.toLowerCase().includes(query));
  });
  
  const selectedUser = chatSessions.find(session => session.user_id === selectedUserId) || 
                      (temporaryUserSession?.user_id === selectedUserId ? temporaryUserSession : null);

  const handleSelectUser = (session: ChatSession) => {
    setSelectedUserId(session.user_id);
    if (isMobile) {
      setShowChatView(true);
    }
    loadMessages(session.user_id);
    
    // 更新URL参数以保持状态，便于页面刷新或切换后恢复
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set('to', session.user_id);
    navigate(`/quotations?${currentParams.toString()}`, { replace: true });
  };

  const handleBackToContacts = () => {
    setShowChatView(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !user) return;

    setSendingMessage(true);
    try {
      const { data, error } = await chatService.sendTextMessage(selectedUserId, newMessage);
      if (error) {
        console.error('Error sending message:', error);
        toast.error('发送消息失败');
        return;
      }
      
      if (data) {
        setMessages(prev => [...prev, data]);
        setNewMessage("");
        
        // 更新聊天会话列表
        setChatSessions(prev => {
          const existingIndex = prev.findIndex(s => s.user_id === selectedUserId);
          const updatedSession: ChatSession = {
            user_id: selectedUserId,
            user_nickname: selectedUser?.user_nickname,
            user_avatar: selectedUser?.user_avatar,
            last_message: newMessage,
            last_message_time: data.created_at,
            unread_count: 0
          };
          
          if (existingIndex >= 0) {
            const newSessions = [...prev];
            newSessions[existingIndex] = updatedSession;
            return newSessions;
          } else {
            return [updatedSession, ...prev];
          }
        });
        
        // 清理临时用户会话，因为现在已经有正式的会话记录了
        if (temporaryUserSession?.user_id === selectedUserId) {
          setTemporaryUserSession(null);
        }
        
        // 确保URL状态保持更新
        if (!toUserId || toUserId !== selectedUserId) {
          const currentParams = new URLSearchParams(searchParams);
          currentParams.set('to', selectedUserId);
          navigate(`/quotations?${currentParams.toString()}`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('发送消息失败');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectOrderList = async (orderList: any) => {
    if (!selectedUserId || !user) return;

    setSendingMessage(true);
    try {
      const listSummary: ProductListSummary = {
        name: orderList.name,
        total_amount: orderList.total_amount || 0,
        status: orderList.status || 'shared',
        created_at: orderList.created_at || new Date().toISOString(),
        description: orderList.description,
        delivery_location: orderList.delivery_location,
        item_count: orderList.product_list_items?.length || 0,
        special_requirements: orderList.special_requirements
      };
      
      const { data, error } = await chatService.sendProductListReference(
        selectedUserId,
        orderList.id,
        listSummary,
        `我想与您分享这个货单：${orderList.name}`
      );
      
      if (error) {
        console.error('Error sending product list reference:', error);
        toast.error('发送货单引用失败');
        return;
      }
      
      if (data) {
        setMessages(prev => [...prev, data]);
        
        // 更新聊天会话列表
        setChatSessions(prev => {
          const existingIndex = prev.findIndex(s => s.user_id === selectedUserId);
          const updatedSession: ChatSession = {
            user_id: selectedUserId,
            user_nickname: selectedUser?.user_nickname,
            user_avatar: selectedUser?.user_avatar,
            last_message: `引用了货单：${orderList.name}`,
            last_message_time: data.created_at,
            unread_count: 0
          };
          
          if (existingIndex >= 0) {
            const newSessions = [...prev];
            newSessions[existingIndex] = updatedSession;
            return newSessions;
          } else {
            return [updatedSession, ...prev];
          }
        });
        
        // 清理临时用户会话，因为现在已经有正式的会话记录了
        if (temporaryUserSession?.user_id === selectedUserId) {
          setTemporaryUserSession(null);
        }
        
        // 确保URL状态保持更新
        if (!toUserId || toUserId !== selectedUserId) {
          const currentParams = new URLSearchParams(searchParams);
          currentParams.set('to', selectedUserId);
          navigate(`/quotations?${currentParams.toString()}`, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error sending product list reference:', error);
      toast.error('发送货单引用失败');
    } finally {
      setSendingMessage(false);
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isMyMessage = message.sender_id === user?.id;
    
    if (message.message_type === "product_list_reference" && message.referenced_list_summary) {
      return (
        <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-md px-4 py-3 rounded-lg ${
            isMyMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">货单引用</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>货单名称：</strong>{message.referenced_list_summary.name}</p>
                {message.referenced_list_summary.description && (
                  <p><strong>描述：</strong>{message.referenced_list_summary.description}</p>
                )}
                {message.referenced_list_summary.item_count && (
                  <p><strong>商品数量：</strong>{message.referenced_list_summary.item_count} 种商品</p>
                )}
                <p><strong>总金额：</strong><span className="text-lg font-bold">¥{message.referenced_list_summary.total_amount?.toLocaleString()}</span></p>
                {message.referenced_list_summary.delivery_location && (
                  <p><strong>交付地点：</strong>{message.referenced_list_summary.delivery_location}</p>
                )}
                {message.referenced_list_summary.special_requirements && (
                  <p><strong>特殊要求：</strong>{message.referenced_list_summary.special_requirements}</p>
                )}
              </div>
              <div className="flex space-x-2 mt-3">
                <Button 
                  size="sm" 
                  variant={isMyMessage ? "secondary" : "default"}
                  onClick={() => {
                    setSelectedOrderListId(message.referenced_order_list_id);
                    setShowOrderListDetail(true);
                    if (message.referenced_order_list_id) {
                      loadOrderListDetail(message.referenced_order_list_id);
                    }
                  }}
                >
                  预览
                </Button>
                {!isMyMessage && (
                  <Button size="sm" variant="outline">
                    立即报价
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs mt-2 opacity-70">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      );
    }
    
    // 文本消息
    return (
      <div key={message.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isMyMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <p className="text-sm">{message.content}</p>
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  // 如果用户未登录，显示登录提示
  if (!user) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">请先登录</h3>
            <p className="text-muted-foreground mb-4">登录后即可开始与供应商进行询价对话</p>
            <Button onClick={() => navigate('/login')}>
              前往登录
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* 移动端：根据状态显示联系人列表或聊天窗口 */}
        {isMobile ? (
          <>
            {!showChatView ? (
              /* 联系人列表 - 移动端全屏 */
              <div className="w-full bg-card flex flex-col">
                <div className="p-4 border-b bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold">询价对话</h1>
                    <Button 
                      size="sm" 
                      onClick={() => setShowUserSelector(true)}
                      className="text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      开始新对话
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索联系人"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">加载中...</span>
                      </div>
                    ) : filteredSessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? '未找到匹配的联系人' : '暂无聊天记录'}
                      </div>
                    ) : (
                      filteredSessions.map((session) => (
                        <div
                          key={session.user_id}
                          onClick={() => handleSelectUser(session)}
                          className="flex items-center space-x-3 p-4 border-b cursor-pointer hover:bg-muted transition-colors active:bg-muted"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={session.user_avatar} />
                            <AvatarFallback>{session.user_nickname?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate">{session.user_nickname || '未知用户'}</h3>
                              {session.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {session.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{session.last_message}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.last_message_time).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              /* 聊天窗口 - 移动端全屏 */
              selectedUser && (
                <div className="w-full flex flex-col">
                  {/* 聊天头部 - 移动端 */}
                  <div className="p-4 border-b bg-card">
                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={handleBackToContacts}
                        className="mr-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.user_avatar} />
                        <AvatarFallback>{selectedUser.user_nickname?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="font-semibold">{selectedUser.user_nickname || '未知用户'}</h2>
                      </div>
                    </div>
                  </div>

                  {/* 消息区域 - 移动端 */}
                  <ScrollArea className="flex-1 p-4 bg-muted/20">
                    <div className="space-y-4">
                      {messages.map((message) => renderMessage(message))}
                    </div>
                  </ScrollArea>

                  {/* 输入区域 - 移动端 */}
                  <div className="p-4 border-t bg-card">
                    <div className="flex items-end space-x-2">
                      <Button variant="ghost" size="icon" className="mb-1">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mb-1"
                        onClick={() => setShowOrderListSelector(true)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Input
                          placeholder="输入消息..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="resize-none"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="mb-1">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || sendingMessage} 
                        className="mb-1"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            )}
          </>
        ) : (
          /* 桌面端：左右分栏布局 */
          <>
            {/* 左侧对话列表 */}
            <div className="w-80 border-r bg-card flex flex-col">
              {/* 搜索栏和新建询价 */}
              <div className="p-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">询价对话</h2>
                  <Button 
                    size="sm" 
                    onClick={() => setShowUserSelector(true)}
                    className="text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    开始新对话
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索联系人"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 对话列表 */}
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">加载中...</span>
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? '未找到匹配的联系人' : '暂无聊天记录'}
                    </div>
                  ) : (
                    filteredSessions.map((session) => (
                      <div
                        key={session.user_id}
                        onClick={() => handleSelectUser(session)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                          selectedUserId === session.user_id ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={session.user_avatar} />
                          <AvatarFallback>{session.user_nickname?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{session.user_nickname || '未知用户'}</h3>
                            {session.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {session.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{session.last_message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.last_message_time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧对话窗口 */}
            <div className="flex-1 flex flex-col">
              {selectedUser ? (
                <>
                  {/* 对话头部 */}
                  <div className="p-4 border-b bg-card">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.user_avatar} />
                        <AvatarFallback>{selectedUser.user_nickname?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="font-semibold">{selectedUser.user_nickname || '未知用户'}</h2>
                      </div>
                    </div>
                  </div>

                  {/* 消息区域 */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => renderMessage(message))}
                    </div>
                  </ScrollArea>

                  {/* 输入区域 */}
                  <div className="p-4 border-t bg-card">
                    <div className="flex items-end space-x-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setShowOrderListSelector(true)}
                        title="引用货单"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Input
                          placeholder="输入消息..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="resize-none"
                        />
                      </div>
                      <Button variant="ghost" size="icon">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || sendingMessage}
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">选择一个对话</h3>
                    <p className="text-muted-foreground">从左侧列表中选择联系人开始对话</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 货单选择器 */}
      <OrderListSelector
        open={showOrderListSelector}
        onOpenChange={setShowOrderListSelector}
        onSelectOrderList={handleSelectOrderList}
        title="引用货单到对话"
        description="选择一个货单分享给对方，用于询价或协商"
      />

      {/* 用户选择器 */}
      <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>开始新对话</DialogTitle>
            <DialogDescription>
              选择一个用户开始聊天
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户..."
                className="pl-10"
                onFocus={() => {
                  if (availableUsers.length === 0) {
                    loadAvailableUsers();
                  }
                }}
              />
            </div>

            <ScrollArea className="h-[400px]">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无可联系的用户
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((userItem) => (
                    <div
                      key={userItem.id}
                      onClick={() => handleSelectNewUser(userItem)}
                      className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userItem.avatar_url} />
                        <AvatarFallback>{userItem.nickname?.[0] || userItem.company_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {userItem.nickname || userItem.company_name || '未知用户'}
                        </h3>
                        {userItem.company_name && userItem.nickname && (
                          <p className="text-sm text-muted-foreground truncate">
                            {userItem.company_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* 货单详情弹框 */}
      <Dialog open={showOrderListDetail} onOpenChange={setShowOrderListDetail}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              货单详情
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            {loadingOrderListDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-3">加载货单详情...</span>
              </div>
            ) : orderListDetail ? (
              <div className="space-y-6 p-1">
                {/* 基本信息 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{orderListDetail.name}</span>
                      <Badge variant={orderListDetail.status === 'shared' ? 'default' : 'secondary'}>
                        {orderListDetail.status === 'shared' ? '已分享' : orderListDetail.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orderListDetail.description && (
                      <div>
                        <Label className="text-sm font-medium">描述</Label>
                        <p className="text-sm text-muted-foreground mt-1">{orderListDetail.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-xs text-muted-foreground">创建时间</Label>
                          <p className="text-sm">{new Date(orderListDetail.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-xs text-muted-foreground">交付地点</Label>
                          <p className="text-sm">{orderListDetail.delivery_location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <Label className="text-xs text-muted-foreground">总金额</Label>
                          <p className="text-sm font-bold text-primary">¥{orderListDetail.total_amount?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {orderListDetail.special_requirements && (
                      <div>
                        <Label className="text-sm font-medium">特殊要求</Label>
                        <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded">
                          {orderListDetail.special_requirements}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 商品列表 */}
                {orderListDetail.product_list_items && orderListDetail.product_list_items.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        商品清单 ({orderListDetail.product_list_items.length} 个商品)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {orderListDetail.product_list_items.map((item: any, index: number) => (
                          <div key={item.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product_name || item.product_sku}</h4>
                              {item.product_sku && <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>}
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-sm">数量: {item.quantity}</p>
                              {item.unit_price && (
                                <p className="text-sm font-medium">¥{item.unit_price.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                货单详情加载失败
              </div>
            )}
          </ScrollArea>
          
          {/* 弹框底部操作按钮 */}
          {orderListDetail && (
            <div className="flex justify-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrderListDetail(false);
                  navigate(`/order-lists/${orderListDetail.id}`);
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                跳转完整详情
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default QuotationsPage;