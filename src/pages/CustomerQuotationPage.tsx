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
  AlertCircle,
  DollarSign,
  Edit3
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
  remarks?: string;
}

export const CustomerQuotationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orderList, setOrderList] = useState<OrderList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharedToMe, setIsSharedToMe] = useState(false);
  const [priceModifications, setPriceModifications] = useState<PriceModification[]>([]);
  const [quotationRemarks, setQuotationRemarks] = useState('');
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [processing, setProcessing] = useState(false);

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
          newQuantity: item.quantity,
          remarks: ''
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

  // 更新商品备注
  const updateItemRemarks = (itemId: string, remarks: string) => {
    setPriceModifications(prev => 
      prev.map(mod => 
        mod.itemId === itemId 
          ? { ...mod, remarks: remarks }
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
      mod.newPrice !== mod.originalPrice || 
      mod.newQuantity !== mod.originalQuantity ||
      mod.remarks?.trim()
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
        original_quantity: mod.originalQuantity,
        remarks: mod.remarks || ''
      }));

      // 调用确认订单服务
      const orderId = await orderListResponseService.confirmToSender(
        orderList.id,
        modifications,
        quotationRemarks || undefined
      );

      toast.success('报价订单已生成，等待买家确认');
      navigate('/orders'); // 跳转到订单页面
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
    toast.success('货单转发成功');
    setShowSupplierSelector(false);
    navigate('/orders'); // 跳转回订单页面
  };

  // 渲染商品项目（带价格编辑功能）
  const renderQuotationItem = (item: OrderListItem) => {
    const modification = priceModifications.find(mod => mod.itemId === item.id);
    if (!modification) return null;

    const hasChanged = modification.newPrice !== modification.originalPrice || 
                      modification.newQuantity !== modification.originalQuantity ||
                      modification.remarks?.trim();
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

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-3">
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

              <div className="space-y-2">
                <Label htmlFor={`remarks-${item.id}`} className="text-xs">备注</Label>
                <Input
                  id={`remarks-${item.id}`}
                  type="text"
                  value={modification.remarks || ''}
                  onChange={(e) => updateItemRemarks(item.id, e.target.value)}
                  placeholder="商品备注"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 商品备注 */}
            {modification.remarks && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                <strong>备注：</strong>{modification.remarks}
              </div>
            )}
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            客户报价：{orderList.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-green-100 text-green-800">
              报价编辑
            </Badge>
            <span className="text-sm text-gray-500">
              创建于 {new Date(orderList.created_at).toLocaleString()}
            </span>
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
                <Edit3 className="w-5 h-5 text-blue-600" />
                商品报价编辑 ({orderList.product_list_items.length})
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                您可以修改每个商品的价格、数量和添加备注信息
              </p>
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
                  <span className={hasModifications() ? 'text-green-600' : ''}>
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

          {/* 整体报价备注 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                整体报价备注
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={quotationRemarks}
                onChange={(e) => setQuotationRemarks(e.target.value)}
                placeholder="请输入整体报价说明、交期承诺、付款条件等备注信息..."
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
                    生成报价订单
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
              
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• 生成报价订单：直接向买家发送您的报价</p>
                <p>• 转发货单：将货单转发给其他供应商</p>
              </div>
            </CardContent>
          </Card>

          {/* 修改统计 */}
          {hasModifications() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">修改统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>价格修改：</span>
                    <span className="text-blue-600">
                      {priceModifications.filter(mod => mod.newPrice !== mod.originalPrice).length} 项
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>数量修改：</span>
                    <span className="text-blue-600">
                      {priceModifications.filter(mod => mod.newQuantity !== mod.originalQuantity).length} 项
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>添加备注：</span>
                    <span className="text-blue-600">
                      {priceModifications.filter(mod => mod.remarks?.trim()).length} 项
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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




