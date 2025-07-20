import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Search,
  FileText,
  Bell,
  Clock,
  Send,
  User
} from "lucide-react";
import { useMessages, useUnreadMessagesCount } from "@/hooks/useMessages";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface MessageCenterProps {
  className?: string;
}

export const MessageCenter = ({ className }: MessageCenterProps) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: allMessages = [], isLoading } = useMessages();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();

  // 按类型筛选消息
  const filteredMessages = allMessages.filter(message => {
    const matchesSearch = searchQuery === "" || 
      message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (message.sender_profile?.nickname || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === "all" || 
      (activeTab === "quotation" && message.quotation_id) ||
      (activeTab === "system" && message.message_type === "system") ||
      (activeTab === "unread" && !message.is_read);
    
    return matchesSearch && matchesTab;
  });

  // 按对话分组消息
  const groupedMessages = filteredMessages.reduce((acc, message) => {
    const key = message.quotation_id || message.sender_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(message);
    return acc;
  }, {} as Record<string, typeof allMessages>);

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'quotation_reply':
        return <FileText className="h-4 w-4" />;
      case 'system':
        return <Bell className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'quotation_reply':
        return '报价回复';
      case 'system':
        return '系统消息';
      default:
        return '普通消息';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>消息中心</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </CardTitle>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索消息..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 py-2 border-b">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="quotation">
                报价相关
                {allMessages.filter(m => m.quotation_id).length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {allMessages.filter(m => m.quotation_id).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="system">系统消息</TabsTrigger>
              <TabsTrigger value="unread">
                未读
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[600px]">
            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>加载消息中...</p>
                </div>
              ) : Object.keys(groupedMessages).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">暂无消息</h3>
                  <p>您目前没有任何{activeTab === 'all' ? '' : getMessageTypeLabel(activeTab)}消息</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {Object.entries(groupedMessages).map(([key, messages]) => {
                    const latestMessage = messages[0];
                    const unreadInGroup = messages.filter(m => !m.is_read).length;
                    
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                          unreadInGroup > 0 ? 'border-primary/50 bg-primary/5' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={latestMessage.sender_profile?.avatar_url} />
                              <AvatarFallback>
                                {latestMessage.message_type === 'system' ? (
                                  <Bell className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {latestMessage.sender_profile?.nickname || '系统消息'}
                                  </h4>
                                  {getMessageTypeIcon(latestMessage.message_type)}
                                  {latestMessage.quotation && (
                                    <Badge variant="outline" className="text-xs">
                                      {latestMessage.quotation.sheet_name || '询价单'}
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(latestMessage.created_at), {
                                      addSuffix: true,
                                      locale: zhCN
                                    })}
                                  </span>
                                  {unreadInGroup > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {unreadInGroup}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {latestMessage.content}
                              </p>
                              
                              {messages.length > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  共 {messages.length} 条消息
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};