import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Clock, Bell, User, MessageSquare } from 'lucide-react';

/**
 * 实时更新测试面板
 * 用于测试各种实时更新功能
 */
export const RealtimeTestPanel: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [testNotification, setTestNotification] = useState({
    title: '测试通知',
    message: '这是一个测试通知消息',
    type: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  const [isLoading, setIsLoading] = useState(false);

  // 发送测试通知
  const sendTestNotification = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setIsLoading(true);
    try {
      await notificationService.createNotification({
        user_id: user.id,
        title: testNotification.title,
        message: testNotification.message,
        type: testNotification.type,
        action_url: '/products'
      });
      
      toast.success('测试通知已发送');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('发送测试通知失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟供应商申请通知（仅管理员可测试）
  const simulateSupplierApplication = async () => {
    if (!user || !isAdmin) {
      toast.error('只有管理员可以测试此功能');
      return;
    }

    setIsLoading(true);
    try {
      await notificationService.notifySupplierApplication(
        '测试用户',
        user.id,
        '测试公司'
      );
      
      toast.success('模拟供应商申请通知已发送');
    } catch (error) {
      console.error('Error simulating supplier application:', error);
      toast.error('模拟通知发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟货单分享通知
  const simulateOrderListShared = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setIsLoading(true);
    try {
      await notificationService.notifyOrderListShared(
        user.id,
        '当前用户',
        '测试货单',
        'test-order-list-id',
        '测试买家'
      );
      
      toast.success('模拟货单分享通知已发送');
    } catch (error) {
      console.error('Error simulating order list shared:', error);
      toast.error('模拟通知发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟商品咨询通知
  const simulateProductInquiry = async () => {
    if (!user) {
      toast.error('请先登录');
      return;
    }

    setIsLoading(true);
    try {
      await notificationService.notifyProductInquiry(
        user.id,
        '当前用户',
        '测试商品',
        'test-product-id',
        '测试咨询者'
      );
      
      toast.success('模拟商品咨询通知已发送');
    } catch (error) {
      console.error('Error simulating product inquiry:', error);
      toast.error('模拟通知发送失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">请先登录以使用实时更新测试功能</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            实时更新测试面板
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            用于测试通知系统和实时更新功能
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 用户信息 */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <User className="h-5 w-5" />
            <div>
              <div className="font-medium">{user.email}</div>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">管理员</Badge>
              )}
            </div>
          </div>

          {/* 自定义通知测试 */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              自定义通知测试
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">通知标题</Label>
                <Input
                  id="title"
                  value={testNotification.title}
                  onChange={(e) => setTestNotification(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">通知类型</Label>
                <select
                  id="type"
                  value={testNotification.type}
                  onChange={(e) => setTestNotification(prev => ({
                    ...prev,
                    type: e.target.value as any
                  }))}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="info">信息</option>
                  <option value="success">成功</option>
                  <option value="warning">警告</option>
                  <option value="error">错误</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">通知内容</Label>
              <Textarea
                id="message"
                value={testNotification.message}
                onChange={(e) => setTestNotification(prev => ({
                  ...prev,
                  message: e.target.value
                }))}
                rows={3}
              />
            </div>
            
            <Button 
              onClick={sendTestNotification}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '发送中...' : '发送测试通知'}
            </Button>
          </div>

          {/* 预设场景测试 */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              预设场景测试
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={simulateSupplierApplication}
                  disabled={isLoading}
                >
                  模拟供应商申请
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={simulateOrderListShared}
                disabled={isLoading}
              >
                模拟货单分享
              </Button>
              
              <Button
                variant="outline"
                onClick={simulateProductInquiry}
                disabled={isLoading}
              >
                模拟商品咨询
              </Button>
            </div>
          </div>

          {/* 实时更新状态 */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">
                实时更新已启用
              </span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              当有新通知时，系统会自动更新并显示提示
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};