import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  DollarSign, 
  Clock, 
  TrendingDown, 
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  chatNegotiationService,
  NegotiationSession 
} from '@/services/chatNegotiationService';
import { toast } from 'sonner';

interface NegotiationSessionListProps {
  onSelectSession: (session: NegotiationSession) => void;
  selectedSessionId?: string;
}

export const NegotiationSessionList: React.FC<NegotiationSessionListProps> = ({
  onSelectSession,
  selectedSessionId
}) => {
  const [sessions, setSessions] = useState<NegotiationSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    const { data, error } = await chatNegotiationService.getNegotiationSessions();
    if (error) {
      toast.error('加载协商会话失败');
    } else {
      setSessions(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shared': return 'bg-blue-100 text-blue-800';
      case 'negotiating': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'shared': return '已分享';
      case 'negotiating': return '协商中';
      case 'confirmed': return '已确认';
      case 'delivered': return '已交付';
      default: return status;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString();
  };

  const renderSession = (session: NegotiationSession) => {
    const isSelected = selectedSessionId === session.quotation_id;
    const priceChange = session.current_amount - session.original_amount;
    const priceChangePercent = (priceChange / session.original_amount) * 100;
    const bothConfirmed = session.buyer_confirmed && session.supplier_confirmed;

    return (
      <Card
        key={session.quotation_id}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""
        )}
        onClick={() => onSelectSession(session)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-sm truncate mb-1">
                {session.order_name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{session.supplier_name}</span>
                <span>•</span>
                <span>{formatRelativeTime(session.last_message_at)}</span>
              </div>
            </div>
            <Badge className={getStatusColor(session.order_status)}>
              {getStatusText(session.order_status)}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">
                ¥{session.current_amount.toLocaleString()}
              </span>
              {priceChange !== 0 && (
                <Badge variant={priceChange < 0 ? 'destructive' : 'default'} className="text-xs">
                  {priceChange < 0 ? (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  )}
                  {priceChangePercent.toFixed(1)}%
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {bothConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {session.message_count}条消息
              </span>
              <span>协商{session.negotiation_count}轮</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={session.buyer_confirmed ? 'default' : 'outline'} className="text-xs">
                买家{session.buyer_confirmed ? '✓' : '○'}
              </Badge>
              <Badge variant={session.supplier_confirmed ? 'default' : 'outline'} className="text-xs">
                供应商{session.supplier_confirmed ? '✓' : '○'}
              </Badge>
            </div>
          </div>

          {session.order_status === 'confirmed' && bothConfirmed && (
            <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
              <CheckCircle2 className="w-3 h-3 inline mr-1" />
              协商完成，订单已确认
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无协商会话</p>
          <p className="text-sm text-gray-400 mt-1">
            当供应商提交报价后会显示在这里
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">协商会话</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSessions}
          disabled={loading}
        >
          刷新
        </Button>
      </div>
      
      {sessions.map(renderSession)}
    </div>
  );
};