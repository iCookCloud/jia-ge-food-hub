import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Loader2
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderListSelector } from "@/components/order-list/OrderListSelector";
import { orderListShareService } from "@/services/orderListShareService";
import { supplierApi } from "@/services/api";

// 对话用户数据（基于真实供应商数据）
interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  company: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  online?: boolean;
  category: "supplier" | "customer";
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  verification_status?: string;
}

// 消息数据
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "quotation" | "order" | "file" | "order_list_reference";
  metadata?: any;
}

// 空的消息数据，按需加载
const initialMessages: { [userId: string]: Message[] } = {};

const QuotationsPage = () => {
  const isMobile = useIsMobile();
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [showChatView, setShowChatView] = useState(false);
  const [showOrderListSelector, setShowOrderListSelector] = useState(false);
  const [suppliers, setSuppliers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载供应商列表（集成统一供应商搜索功能）
  const loadSuppliers = async (query?: string) => {
    setLoading(true);
    try {
      // 使用统一的供应商API进行搜索
      const supplierData = await supplierApi.getAllSuppliers(query);
      const chatUsers: ChatUser[] = supplierData.map(supplier => ({
        id: supplier.id,
        name: supplier.display_name,
        company: supplier.company_name || '个人供应商',
        avatar: supplier.avatar_url || undefined,
        category: "supplier" as const,
        contact_person: supplier.contact_person,
        contact_phone: supplier.contact_phone,
        contact_email: supplier.contact_email,
        verification_status: supplier.is_verified ? 'verified' : 'unverified',
        online: Math.random() > 0.5, // 随机在线状态，实际应用中可从其他源获取
        lastMessage: "点击开始对话",
        lastMessageTime: "现在",
        unreadCount: 0
      }));
      setSuppliers(chatUsers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // 搜索过滤
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliers(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredUsers = suppliers;

  const currentMessages = selectedUser ? messages[selectedUser.id] || [] : [];

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
    if (isMobile) {
      setShowChatView(true);
    }
  };

  const handleBackToContacts = () => {
    setShowChatView(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      senderName: "我",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg]
    }));

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectOrderList = (orderList: any) => {
    if (!selectedUser) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      senderName: "我",
      content: `引用了货单: ${orderList.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "order_list_reference",
      metadata: {
        orderListId: orderList.id,
        orderListName: orderList.name,
        description: orderList.description,
        totalAmount: orderList.total_amount,
        deliveryLocation: orderList.delivery_location,
        expectedDeliveryDate: orderList.expected_delivery_date,
        specialRequirements: orderList.special_requirements,
        itemsCount: orderList.product_list_items?.length || 0
      }
    };

    setMessages(prev => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg]
    }));
  };

  const renderMessage = (message: Message) => {
    const isMyMessage = message.senderId === "me";
    
    if (message.type === "order_list_reference") {
      return (
        <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
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
                <p><strong>货单名称：</strong>{message.metadata.orderListName}</p>
                {message.metadata.description && (
                  <p><strong>描述：</strong>{message.metadata.description}</p>
                )}
                <p><strong>商品数量：</strong>{message.metadata.itemsCount} 种商品</p>
                <p><strong>总金额：</strong><span className="text-lg font-bold">¥{message.metadata.totalAmount?.toLocaleString()}</span></p>
                <p><strong>交付地点：</strong>{message.metadata.deliveryLocation}</p>
                {message.metadata.expectedDeliveryDate && (
                  <p><strong>期望交付：</strong>{new Date(message.metadata.expectedDeliveryDate).toLocaleDateString()}</p>
                )}
                {message.metadata.specialRequirements && (
                  <p><strong>特殊要求：</strong>{message.metadata.specialRequirements}</p>
                )}
              </div>
              <div className="flex space-x-2 mt-3">
                <Button size="sm" variant={isMyMessage ? "secondary" : "default"}>
                  查看详情
                </Button>
                {!isMyMessage && (
                  <Button size="sm" variant="outline">
                    立即报价
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs mt-2 opacity-70">
              {message.timestamp}
            </div>
          </div>
        </div>
      );
    }
    
    if (message.type === "quotation") {
      return (
        <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
            isMyMessage 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }`}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-medium">报价单</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>商品：</strong>{message.metadata.productName}</p>
                <p><strong>数量：</strong>{message.metadata.quantity}</p>
                <p><strong>单价：</strong>{message.metadata.unitPrice}</p>
                <p><strong>总价：</strong><span className="text-lg font-bold">{message.metadata.totalAmount}</span></p>
                <p><strong>有效期：</strong>{message.metadata.validUntil}</p>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button size="sm" variant={isMyMessage ? "secondary" : "default"}>
                  接受报价
                </Button>
                <Button size="sm" variant="outline">
                  还价
                </Button>
              </div>
            </div>
            <div className="text-xs mt-2 opacity-70">
              {message.timestamp}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isMyMessage 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          <p className="text-sm">{message.content}</p>
          <div className="text-xs mt-1 opacity-70">
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  };

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
                      onClick={() => setShowOrderListSelector(true)}
                      className="text-xs"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新建询价
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索供应商或公司"
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
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? '未找到匹配的供应商' : '暂无供应商'}
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user)}
                          className="flex items-center space-x-3 p-4 border-b cursor-pointer hover:bg-muted transition-colors active:bg-muted"
                        >
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name?.[0] || user.company?.[0] || 'S'}</AvatarFallback>
                            </Avatar>
                            {user.online && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate">{user.name || user.company}</h3>
                              {user.verification_status === 'verified' && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  已认证
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{user.company}</p>
                            {user.contact_phone && (
                              <p className="text-xs text-muted-foreground truncate">📞 {user.contact_phone}</p>
                            )}
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
                        <AvatarImage src={selectedUser.avatar} />
                        <AvatarFallback>{selectedUser.name?.[0] || selectedUser.company?.[0] || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="font-semibold">{selectedUser.name || selectedUser.company}</h2>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground truncate">{selectedUser.company}</p>
                          {selectedUser.verification_status === 'verified' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              已认证
                            </Badge>
                          )}
                          {selectedUser.online && (
                            <Badge variant="outline" className="text-xs">在线</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 消息区域 - 移动端 */}
                  <ScrollArea className="flex-1 p-4 bg-muted/20">
                    <div className="space-y-4">
                      {currentMessages.map((message) => renderMessage(message))}
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
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="mb-1">
                        <Send className="h-4 w-4" />
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
                    onClick={() => setShowOrderListSelector(true)}
                    className="text-xs"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    新建询价
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索供应商或公司"
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
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery ? '未找到匹配的供应商' : '暂无供应商'}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                          selectedUser?.id === user.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name?.[0] || user.company?.[0] || 'S'}</AvatarFallback>
                          </Avatar>
                          {user.online && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{user.name || user.company}</h3>
                            {user.verification_status === 'verified' && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                已认证
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.company}</p>
                          {user.contact_phone && (
                            <p className="text-xs text-muted-foreground truncate">📞 {user.contact_phone}</p>
                          )}
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
                        <AvatarImage src={selectedUser.avatar} />
                        <AvatarFallback>{selectedUser.name?.[0] || selectedUser.company?.[0] || 'S'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="font-semibold">{selectedUser.name || selectedUser.company}</h2>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{selectedUser.company}</p>
                          {selectedUser.verification_status === 'verified' && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              已认证
                            </Badge>
                          )}
                          {selectedUser.online && (
                            <Badge variant="outline" className="text-xs">在线</Badge>
                          )}
                        </div>
                        {selectedUser.contact_phone && (
                          <p className="text-xs text-muted-foreground">📞 {selectedUser.contact_phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 消息区域 */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {currentMessages.map((message) => renderMessage(message))}
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
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
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
    </Layout>
  );
};

export default QuotationsPage;