import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';
import { ChatNegotiationWindow } from '@/components/chat/ChatNegotiationWindow';
import { NegotiationSessionList } from '@/components/chat/NegotiationSessionList';
import { NegotiationSession } from '@/services/chatNegotiationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const NegotiationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<NegotiationSession | null>(null);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [buyerConfirmed, setBuyerConfirmed] = useState(false);
  const [supplierConfirmed, setSupplierConfirmed] = useState(false);

  const handleSelectSession = (session: NegotiationSession) => {
    setSelectedSession(session);
    setCurrentPrice(session.current_amount);
    setBuyerConfirmed(session.buyer_confirmed);
    setSupplierConfirmed(session.supplier_confirmed);
  };

  const handlePriceUpdate = (newPrice: number) => {
    setCurrentPrice(newPrice);
  };

  const handleConfirmationUpdate = (buyerConf: boolean, supplierConf: boolean) => {
    setBuyerConfirmed(buyerConf);
    setSupplierConfirmed(supplierConf);
    
    if (buyerConf && supplierConf) {
      toast.success('协商完成！订单将自动生成');
      // 可以添加跳转到订单页面的逻辑
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">请先登录后查看协商信息</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/auth/login')}
            >
              去登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">价格协商</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：协商会话列表 */}
        <div className="lg:col-span-4">
          <NegotiationSessionList
            onSelectSession={handleSelectSession}
            selectedSessionId={selectedSession?.quotation_id}
          />
        </div>

        {/* 右侧：聊天区域和订单详情 */}
        <div className="lg:col-span-8">
          {selectedSession ? (
            <div className="space-y-6">
              {/* 订单信息卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {selectedSession.order_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-gray-500">供应商</div>
                        <div className="font-semibold">{selectedSession.supplier_name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-gray-500">状态</div>
                        <Badge className="mt-1">
                          {selectedSession.order_status === 'shared' && '已分享'}
                          {selectedSession.order_status === 'negotiating' && '协商中'}
                          {selectedSession.order_status === 'confirmed' && '已确认'}
                          {selectedSession.order_status === 'delivered' && '已交付'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-gray-400">¥</div>
                      <div>
                        <div className="text-gray-500">当前价格</div>
                        <div className="font-semibold text-lg">
                          ¥{currentPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-gray-400">📊</div>
                      <div>
                        <div className="text-gray-500">协商轮次</div>
                        <div className="font-semibold">
                          {selectedSession.negotiation_count}轮
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      原价格: ¥{selectedSession.original_amount.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={buyerConfirmed ? 'default' : 'outline'}>
                        买家 {buyerConfirmed ? '已确认' : '未确认'}
                      </Badge>
                      <Badge variant={supplierConfirmed ? 'default' : 'outline'}>
                        供应商 {supplierConfirmed ? '已确认' : '未确认'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 聊天协商窗口 */}
              <ChatNegotiationWindow
                quotationId={selectedSession.quotation_id}
                currentUserId={user.id}
                buyerId={selectedSession.buyer_id}
                supplierId={selectedSession.supplier_id}
                currentPrice={currentPrice}
                originalPrice={selectedSession.original_amount}
                supplierConfirmed={supplierConfirmed}
                buyerConfirmed={buyerConfirmed}
                onPriceUpdate={handlePriceUpdate}
                onConfirmationUpdate={handleConfirmationUpdate}
              />
            </div>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">选择协商会话</h3>
                <p className="text-gray-500">
                  从左侧选择一个协商会话开始聊天
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};