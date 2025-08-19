import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Calculator,
  Package, 
  Calendar,
  MapPin,
  MessageSquare,
  Users,
  CheckCircle,
  Share,
  AlertCircle
} from 'lucide-react';
import { SupplierSelector } from '@/components/order-list/SupplierSelector';
import { productListService } from '@/services/productListService';
import { orderListShareService } from '@/services/orderListShareService';
import { orderListResponseService } from '@/services/orderListResponseService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrderListItem {
  id: string;
  quantity: number;
  unit_price: number;
  product_sku: string;
  product_name: string;
  product_snapshot: any;
}

interface OrderList {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'shared' | 'negotiating' | 'confirmed' | 'delivered';
  total_amount: number;
  expected_delivery_date?: string;
  delivery_location: string;
  special_requirements?: string;
  created_at: string;
  user_id: string;
  product_list_items: OrderListItem[];
}

interface PriceModification {
  itemId: string;
  originalPrice: number;
  newPrice: number;
  originalQuantity: number;
  newQuantity: number;
}

export const QuotationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orderList, setOrderList] = useState<OrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharedToMe, setIsSharedToMe] = useState(false);
  const [priceModifications, setPriceModifications] = useState<PriceModification[]>([]);
  const [shareMessage, setShareMessage] = useState('');
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [existingQuotation, setExistingQuotation] = useState<any>(null);
  const [isUpdatingQuotation, setIsUpdatingQuotation] = useState(false);

  // 加载货单详情
  const loadOrderList = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await productListService.getProductList(id);
      if (error) {
        toast.error('加载货单失败');
        return;
      }
      setOrderList(data);
      
      // 初始化价格修改数据
      if (data?.product_list_items) {
        const initialModifications = data.product_list_items.map(item => ({
          itemId: item.id,
          originalPrice: item.unit_price,
          newPrice: item.unit_price,
          originalQuantity: item.quantity,
          newQuantity: item.quantity
        }));
        setPriceModifications(initialModifications);
      }
      
      // 检查是否是分享给当前用户的货单
      if (user?.id) {
        try {
          const shareData = await orderListShareService.getOrderListShares(id);
          const sharedToCurrentUser = shareData?.some((share: any) => 
            share.supplier_info?.id === user.id
          );
          setIsSharedToMe(sharedToCurrentUser);

          // 检查是否已有待确认的报价
          const userQuotations = await orderListResponseService.getUserResponses(user.id);
          const existingQuote = userQuotations.find((q: any) => 
            q.order_list_id === id && q.quoted_by === user.id && q.status === 'pending'
          );
          
          if (existingQuote) {
            setExistingQuotation(existingQuote);
            setIsUpdatingQuotation(true);
            setShareMessage(existingQuote.message || '');
            
            // 从已有报价中恢复价格修改
            if (existingQuote.quoted_items && data?.product_list_items) {
              const quotedModifications = data.product_list_items.map(item => {
                const quotedItem = existingQuote.quoted_items.find((qi: any) => qi.item_id === item.id);
                return {
                  itemId: item.id,
                  originalPrice: item.unit_price,
                  newPrice: quotedItem?.modified_price || item.unit_price,
                  originalQuantity: item.quantity,
                  newQuantity: quotedItem?.modified_quantity || item.quantity
                };
              });
              setPriceModifications(quotedModifications);
            }
          }
        } catch (error) {
          console.error('Error checking share status:', error);
        }
      }
    } catch (error) {
      toast.error('加载货单失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新商品价格
  const updateItemPrice = (itemId: string, newPrice: number) => {
    setPriceModifications(prev => 
      prev.map(mod => 
        mod.itemId === itemId 
          ? { ...mod, newPrice: newPrice }
          : mod
      )
    );
  };

  // 更新商品数量
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    setPriceModifications(prev => 
      prev.map(mod => 
        mod.itemId === itemId 
          ? { ...mod, newQuantity: newQuantity }
          : mod
      )
    );
  };

  // 计算总金额
  const calculateTotalAmount = () => {
    return priceModifications.reduce((total, mod) => {
      return total + (mod.newPrice * mod.newQuantity);
    }, 0);
  };

  // 检查是否有修改
  const hasModifications = () => {
    return priceModifications.some(mod => 
      mod.newPrice !== mod.originalPrice || mod.newQuantity !== mod.originalQuantity
    );
  };

  // 生成报价订单
  const handleGenerateQuotation = async () => {
    if (!orderList || !user) return;

    setProcessing(true);
    try {
      // 准备修改数据
      const modifications = priceModifications.map(mod => ({
        item_id: mod.itemId,
        modified_price: mod.newPrice,
        modified_quantity: mod.newQuantity,
        original_price: mod.originalPrice,
        original_quantity: mod.originalQuantity
      }));

      // 调用确认订单服务
      const orderId = await orderListResponseService.confirmToSender(
        orderList.id,
        modifications,
        shareMessage || undefined
      );

      toast.success(isUpdatingQuotation ? '报价已更新成功！' : '报价已提交成功，等待买家确认');
      navigate('/quotations'); // 跳转到报价页面
    } catch (error) {
      console.error('Error generating quotation:', error);
      toast.error('生成报价失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 转发货单
  const handleForwardOrderList = () => {
    setShowSupplierSelector(true);
  };

  // 分享完成处理
  const handleShareComplete = async () => {
    // 转发逻辑将在SupplierSelector内部处理
    toast.success('货单转发功能已完成');
    setShowSupplierSelector(false);
    navigate('/order-lists'); // 跳转回货单列表
  };

  // 渲染商品项目（带价格编辑功能）
  const renderQuotationItem = (item: OrderListItem) => {
    const modification = priceModifications.find(mod => mod.itemId === item.id);
    if (!modification) return null;

    const hasChanged = modification.newPrice !== modification.originalPrice || 
                      modification.newQuantity !== modification.originalQuantity;
    const subtotal = modification.newPrice * modification.newQuantity;
    const originalSubtotal = modification.originalPrice * modification.originalQuantity;

    return (
      <div key={item.id} className="border rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <img
              src={item.product_snapshot?.main_image_url || '/placeholder-product.png'}
              alt={item.product_name}
              className="w-16 h-16 object-cover rounded"
            />
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold">{item.product_name}</h4>
                <p className="text-sm text-gray-500">{item.product_sku}</p>
                {item.product_snapshot?.specification && (
                  <p className="text-xs text-gray-400 mt-1">
                    {item.product_snapshot.specification}
                  </p>
                )}
              </div>
              {hasChanged && (
                <Badge variant="secondary" className="ml-2">已修改</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">原价</Label>
                <div className="text-sm text-gray-500">
                  ¥{modification.originalPrice.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`price-${item.id}`} className="text-xs">报价</Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={modification.newPrice}
                  onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`quantity-${item.id}`} className="text-xs">数量</Label>
                <Input
                  id={`quantity-${item.id}`}
                  type="number"
                  min="0"
                  value={modification.newQuantity}
                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">小计</Label>
                <div className="text-sm font-medium">
                  ¥{subtotal.toFixed(2)}
                  {hasChanged && (
                    <div className="text-xs text-gray-400">
                      原：¥{originalSubtotal.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadOrderList();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderList) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">货单不存在或已被删除</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSharedToMe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="text-gray-500">您没有权限对此货单进行报价</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = calculateTotalAmount();
  const originalTotal = orderList.total_amount;
  const priceDifference = totalAmount - originalTotal;

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isUpdatingQuotation ? '修改报价' : '新建报价'}：{orderList.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={isUpdatingQuotation ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}>
              {isUpdatingQuotation ? '修改中' : '报价中'}
            </Badge>
            <span className="text-sm text-gray-500">
              创建于 {new Date(orderList.created_at).toLocaleString()}
            </span>
            {isUpdatingQuotation && existingQuotation && (
              <span className="text-sm text-gray-500">
                • 上次报价：{new Date(existingQuotation.created_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：商品清单和报价 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 商品清单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                商品报价清单 ({orderList.product_list_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderList.product_list_items.map(renderQuotationItem)}
              </div>
              
              <Separator className="my-4" />
              
              {/* 总价对比 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">原始总价：</span>
                  <span>¥{originalTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>报价总金额：</span>
                  <span className={hasModifications() ? 'text-blue-600' : ''}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
                {hasModifications() && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">价格差异：</span>
                    <span className={priceDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                      {priceDifference > 0 ? '+' : ''}¥{priceDifference.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 备注信息 */}
          <Card>
            <CardHeader>
              <CardTitle>报价备注</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="请输入报价说明、交期承诺等备注信息..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* 右侧：操作面板 */}
        <div className="space-y-6">
          {/* 采购要求 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">采购要求</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orderList.expected_delivery_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">期望交货：</span>
                  <span className="text-sm">
                    {new Date(orderList.expected_delivery_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">交货地址：</span>
                <span className="text-sm">{orderList.delivery_location}</span>
              </div>
              
              {orderList.description && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">货单描述：</div>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {orderList.description}
                  </div>
                </div>
              )}
              
              {orderList.special_requirements && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">特殊要求：</div>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    {orderList.special_requirements}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">操作选项</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleGenerateQuotation}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    生成中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isUpdatingQuotation ? '更新报价' : '提交报价'}
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleForwardOrderList}
                disabled={processing}
                className="w-full"
              >
                <Share className="w-4 h-4 mr-2" />
                转发给其他用户
              </Button>
              
              <div className="text-xs text-gray-500 text-center">
                {isUpdatingQuotation 
                  ? '更新报价后，买家将收到修改通知'
                  : '提交报价后，买家将收到您的报价等待确认'
                }<br/>
                报价提交后将在买家的订单中创建订单
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 供应商选择器（用于转发） */}
      <SupplierSelector
        open={showSupplierSelector}
        onOpenChange={setShowSupplierSelector}
        orderListId={orderList.id}
        orderListName={orderList.name}
        onShareComplete={handleShareComplete}
      />
    </div>
  );
};