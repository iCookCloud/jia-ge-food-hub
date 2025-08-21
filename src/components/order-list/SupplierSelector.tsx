import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Building2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { orderListShareService, ShareSupplier } from '@/services/orderListShareService';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SupplierSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderListId: string;
  orderListName?: string;
  onShareComplete?: () => void;
}

export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  open,
  onOpenChange,
  orderListId,
  orderListName,
  onShareComplete
}) => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<ShareSupplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // 加载用户列表
  const loadSuppliers = async (query?: string) => {
    setLoading(true);
    try {
      const data = await orderListShareService.getAvailableSuppliers(query);
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    if (open) {
      loadSuppliers();
      setSelectedSuppliers([]);
      setShareMessage('');
      setSearchQuery('');
    }
  }, [open]);

  // 搜索处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadSuppliers(searchQuery);
      } else {
        loadSuppliers();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 切换用户选择
  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  // 执行分享
  const handleShare = async () => {
    if (selectedSuppliers.length === 0) {
      toast.error('请至少选择一个用户');
      return;
    }

    setSharing(true);
    try {
      await orderListShareService.shareOrderListToSuppliers(
        orderListId,
        selectedSuppliers,
        shareMessage
      );

      // 发送通知给选中的供应商
      if (user && orderListName) {
        try {
          for (const supplierId of selectedSuppliers) {
            const supplier = suppliers.find(s => s.id === supplierId);
            if (supplier) {
              await notificationService.notifyOrderListShared(
                supplierId,
                supplier.contact_person || supplier.profile_nickname || '供应商',
                orderListName,
                orderListId,
                user.email?.split('@')[0] || '买家'
              );
            }
          }
        } catch (notificationError) {
          console.error('Error sending order list shared notifications:', notificationError);
          // 通知发送失败不影响分享流程
        }
      }
      
      toast.success(`成功分享给 ${selectedSuppliers.length} 个用户`);
      onOpenChange(false);
      onShareComplete?.();
    } catch (error) {
      console.error('Error sharing order list:', error);
      toast.error('分享失败，请重试');
    } finally {
      setSharing(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>分享货单 - 选择用户/供应商</DialogTitle>
          <DialogDescription>
            选择您想要分享货单的用户或供应商，可以添加分享消息来说明您的需求
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名称或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 用户列表 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? '未找到匹配的用户' : '暂无可分享用户'}
              </div>
            ) : (
              <div className="space-y-2">
                {suppliers.map((supplier) => (
                  <Card 
                    key={supplier.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedSuppliers.includes(supplier.id) 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => toggleSupplier(supplier.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          checked={selectedSuppliers.includes(supplier.id)}
                          onChange={() => toggleSupplier(supplier.id)}
                        />
                        
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={supplier.avatar_url || undefined} />
                          <AvatarFallback>
                            <Building2 className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {supplier.company_name || supplier.nickname || '用户'}
                            </h4>
                            <Badge variant="outline" className={`text-xs ${
                              supplier.is_supplier 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {supplier.is_supplier ? '供应商' : '用户'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {supplier.nickname}
                          </p>
                          {supplier.company_email && (
                            <p className="text-xs text-muted-foreground truncate">
                              📧 {supplier.company_email}
                            </p>
                          )}
                          {supplier.company_phone && (
                            <p className="text-xs text-muted-foreground truncate">
                              📞 {supplier.company_phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 分享消息 */}
          <div>
            <Label htmlFor="share-message" className="text-sm font-medium">
              分享消息（可选）
            </Label>
            <Textarea
              id="share-message"
              placeholder="向用户说明您的需求..."
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedSuppliers.length} 个用户
            </span>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button 
                onClick={handleShare}
                disabled={selectedSuppliers.length === 0 || sharing}
              >
                {sharing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                分享货单
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};