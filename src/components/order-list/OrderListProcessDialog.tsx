import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Share, 
  CheckCircle, 
  Package, 
  Calculator,
  User,
  Building2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import SimpleSupplierPicker from '@/components/common/SimpleSupplierPicker';
import { orderListResponseApi } from '@/services/api';
import { ItemModification } from '@/services/orderListResponseService';

// 货单项目接口
interface OrderListItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  unit?: string;
  total?: number;
}

// 货单信息接口
interface OrderListInfo {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  items: OrderListItem[];
  total_amount: number;
  shared_by?: {
    nickname: string;
    company_name?: string;
    avatar_url?: string;
  };
}

interface OrderListProcessDialogProps {
  // 是否显示对话框
  open: boolean;
  // 关闭对话框回调
  onClose: () => void;
  // 货单信息
  orderList: OrderListInfo | null;
  // 处理完成回调
  onProcessComplete?: (responseId: string, responseType: 'forward' | 'confirm') => void;
}

const OrderListProcessDialog: React.FC<OrderListProcessDialogProps> = ({
  open,
  onClose,
  orderList,
  onProcessComplete
}) => {
  const [processing, setProcessing] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const [modifications, setModifications] = useState<ItemModification[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  // 初始化修改列表
  useEffect(() => {
    if (orderList?.items) {
      const initialModifications = orderList.items.map(item => ({
        item_id: item.id,
        product_name: item.product_name,
        original_price: item.price,
        original_quantity: item.quantity,
        modified_price: item.price,
        modified_quantity: item.quantity
      }));
      setModifications(initialModifications);
      calculateTotalAmount(initialModifications);
    }
  }, [orderList]);

  // 计算总金额
  const calculateTotalAmount = (mods: ItemModification[]) => {
    const total = mods.reduce((sum, mod) => {
      return sum + ((mod.modified_price || 0) * (mod.modified_quantity || 0));
    }, 0);
    setTotalAmount(total);
  };

  // 处理商品价格修改
  const handlePriceChange = (itemId: string, newPrice: number) => {
    const updatedModifications = modifications.map(mod => 
      mod.item_id === itemId 
        ? { ...mod, modified_price: newPrice }
        : mod
    );
    setModifications(updatedModifications);
    calculateTotalAmount(updatedModifications);
  };

  // 处理商品数量修改
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const updatedModifications = modifications.map(mod => 
      mod.item_id === itemId 
        ? { ...mod, modified_quantity: newQuantity }
        : mod
    );
    setModifications(updatedModifications);
    calculateTotalAmount(updatedModifications);
  };

  // 转发货单
  const handleForward = async () => {
    if (!orderList || !selectedSupplierId) {
      toast.error('请选择要转发的供应商');
      return;
    }

    setProcessing(true);
    try {
      const responseId = await orderListResponseApi.processOrderList(
        orderList.id,
        modifications,
        'forward',
        selectedSupplierId,
        message || undefined
      );

      toast.success('货单已成功转发');
      onProcessComplete?.(responseId, 'forward');
      onClose();
    } catch (error) {
      console.error('Error forwarding order list:', error);
      toast.error('转发失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 确认货单
  const handleConfirm = async () => {
    if (!orderList) return;

    setProcessing(true);
    try {
      const responseId = await orderListResponseApi.processOrderList(
        orderList.id,
        modifications,
        'confirm',
        undefined,
        message || undefined
      );

      toast.success('货单已确认，订单已生成');
      onProcessComplete?.(responseId, 'confirm');
      onClose();
    } catch (error) {
      console.error('Error confirming order list:', error);
      toast.error('确认失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 重置对话框状态
  const handleClose = () => {
    setSelectedSupplierId(undefined);
    setMessage('');
    setModifications([]);
    setTotalAmount(0);
    onClose();
  };

  if (!orderList) return null;

  const originalAmount = orderList.total_amount;
  const hasModifications = modifications.some(mod => 
    mod.modified_price !== mod.original_price || 
    mod.modified_quantity !== mod.original_quantity
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            报价货单：{orderList.name}
          </DialogTitle>
          <DialogDescription>
            您可以修改商品价格和数量，然后选择生成订单报价或转发给其他用户
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 货单基本信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                货单信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderList.shared_by && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>来自：{orderList.shared_by.company_name || orderList.shared_by.nickname}</span>
                </div>
              )}
              {orderList.description && (
                <p className="text-sm text-muted-foreground">{orderList.description}</p>
              )}
              <div className="text-xs text-muted-foreground">
                创建时间：{new Date(orderList.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* 商品列表和修改 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                商品清单和价格调整
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modifications.map((modification, index) => (
                  <div key={modification.item_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-sm">{modification.product_name}</h4>
                        <div className="text-xs text-muted-foreground">
                          原价：¥{modification.original_price?.toFixed(2)} × {modification.original_quantity} 
                          = ¥{((modification.original_price || 0) * (modification.original_quantity || 0)).toFixed(2)}
                        </div>
                      </div>
                      {(modification.modified_price !== modification.original_price || 
                        modification.modified_quantity !== modification.original_quantity) && (
                        <Badge variant="secondary" className="text-xs">已修改</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`} className="text-xs">调整价格</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={modification.modified_price}
                          onChange={(e) => handlePriceChange(modification.item_id, parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`quantity-${index}`} className="text-xs">调整数量</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="0"
                          value={modification.modified_quantity}
                          onChange={(e) => handleQuantityChange(modification.item_id, parseInt(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">调整后小计</Label>
                        <div className="h-8 px-3 border rounded-md bg-muted flex items-center text-sm font-medium">
                          ¥{((modification.modified_price || 0) * (modification.modified_quantity || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* 总价对比 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">原始总价：</span>
                  <span>¥{originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>调整后总价：</span>
                  <span className={hasModifications ? 'text-primary' : ''}>
                    ¥{totalAmount.toFixed(2)}
                  </span>
                </div>
                {hasModifications && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">价格差异：</span>
                    <span className={totalAmount > originalAmount ? 'text-red-600' : 'text-green-600'}>
                      {totalAmount > originalAmount ? '+' : ''}¥{(totalAmount - originalAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 留言 */}
          <div className="space-y-2">
            <Label htmlFor="message">备注留言（可选）</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="请输入给对方的留言..."
              rows={3}
            />
          </div>

          {/* 转发用户选择 */}
          <div className="space-y-2">
            <Label>转发给其他用户（可选）</Label>
            <SimpleSupplierPicker
              selectedSupplierId={selectedSupplierId}
              onSelectionChange={setSelectedSupplierId}
              placeholder="选择要转发的用户"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              如果选择用户，将转发修改后的货单到他们的收件箱；否则直接报价给发起人生成待确认订单
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={processing}>
            取消
          </Button>
          
          {selectedSupplierId ? (
            <Button 
              onClick={handleForward} 
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  转发中...
                </>
              ) : (
                <>
                  <Share className="w-4 h-4 mr-2" />
                  转发货单
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleConfirm} 
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  确认中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  生成报价订单
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderListProcessDialog;