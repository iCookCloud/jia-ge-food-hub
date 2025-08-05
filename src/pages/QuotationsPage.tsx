import { useState } from "react";
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
  MoreHorizontal,
  Phone,
  Video,
  Plus,
  Paperclip,
  Smile
} from "lucide-react";

// 对话用户数据
interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  company: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  category: "supplier" | "customer";
}

// 消息数据
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "quotation" | "order" | "file";
  metadata?: any;
}

// Mock 对话用户数据
const mockChatUsers: ChatUser[] = [
  {
    id: "user1",
    name: "张经理",
    company: "海鲜直供有限公司",
    lastMessage: "三文鱼的最新报价已发送，请查收",
    lastMessageTime: "12:30",
    unreadCount: 2,
    online: true,
    category: "supplier"
  },
  {
    id: "user2", 
    name: "李总",
    company: "优质肉类供应商",
    lastMessage: "牛肉卷的价格可以再商议",
    lastMessageTime: "11:45",
    unreadCount: 0,
    online: true,
    category: "supplier"
  },
  {
    id: "user3",
    name: "王采购",
    company: "绿色农场",
    lastMessage: "有机蔬菜的质量标准需要确认",
    lastMessageTime: "昨天",
    unreadCount: 1,
    online: false,
    category: "supplier"
  },
  {
    id: "user4",
    name: "陈老板",
    company: "川味小厨",
    lastMessage: "这批食材什么时候能到货？",
    lastMessageTime: "昨天",
    unreadCount: 0,
    online: false,
    category: "customer"
  }
];

// Mock 消息数据
const mockMessages: { [userId: string]: Message[] } = {
  user1: [
    {
      id: "msg1",
      senderId: "user1",
      senderName: "张经理",
      content: "您好，关于您咨询的挪威三文鱼，我们有最新的报价",
      timestamp: "10:30",
      type: "text"
    },
    {
      id: "msg2", 
      senderId: "me",
      senderName: "我",
      content: "请发送详细报价单，包括不同规格的价格",
      timestamp: "10:35",
      type: "text"
    },
    {
      id: "msg3",
      senderId: "user1", 
      senderName: "张经理",
      content: "三文鱼报价单",
      timestamp: "12:30",
      type: "quotation",
      metadata: {
        productName: "挪威三文鱼片",
        quantity: "50kg",
        unitPrice: "128元/kg",
        totalAmount: "6400元",
        validUntil: "2024-01-25"
      }
    }
  ],
  user2: [
    {
      id: "msg4",
      senderId: "user2",
      senderName: "李总", 
      content: "牛肉卷现在的价格是89元/kg，量大可以优惠",
      timestamp: "11:30",
      type: "text"
    },
    {
      id: "msg5",
      senderId: "me",
      senderName: "我",
      content: "我们需要30kg，能给到什么价格？",
      timestamp: "11:40",
      type: "text"
    },
    {
      id: "msg6",
      senderId: "user2",
      senderName: "李总",
      content: "30kg的话可以给到85元/kg，总价2550元",
      timestamp: "11:45", 
      type: "text"
    }
  ]
};

const QuotationsPage = () => {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(mockChatUsers[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const filteredUsers = mockChatUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedUser ? messages[selectedUser.id] || [] : [];

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

  const renderMessage = (message: Message) => {
    const isMyMessage = message.senderId === "me";
    
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
        {/* 左侧对话列表 */}
        <div className="w-80 border-r bg-card flex flex-col">
          {/* 搜索栏 */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索联系人或公司"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 对话列表 */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                    selectedUser?.id === user.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{user.name}</h3>
                      <span className="text-xs text-muted-foreground">{user.lastMessageTime}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.company}</p>
                    <p className="text-sm text-muted-foreground truncate">{user.lastMessage}</p>
                  </div>

                  {user.unreadCount > 0 && (
                    <Badge variant="destructive" className="min-w-[1.25rem] h-5 text-xs flex items-center justify-center">
                      {user.unreadCount}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧对话窗口 */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* 对话头部 */}
              <div className="p-4 border-b bg-card flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">{selectedUser.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedUser.company}</p>
                  </div>
                  {selectedUser.online && (
                    <Badge variant="outline" className="text-xs">在线</Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
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
      </div>
    </Layout>
  );
};

export default QuotationsPage;