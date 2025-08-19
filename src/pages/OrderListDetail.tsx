import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Share2, 
  Package, 
  Calendar,
  MapPin,
  MessageSquare,
  Users,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react';
import { SupplierSelector } from '@/components/order-list/SupplierSelector';
import { productListService } from '@/services/productListService';
import { orderListShareService } from '@/services/orderListShareService';
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

export const OrderListDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSupplier } = useAuth();
  
  const [orderList, setOrderList] = useState<OrderList | null>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [shareStats, setShareStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSupplierSelector, setShowSupplierSelector] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSharedToMe, setIsSharedToMe] = useState(false);
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    deliveryLocation: '',
    specialRequirements: '',
    expectedDeliveryDate: ''
  });

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
      
      // 初始化编辑表单
      if (data) {
        setEditForm({
          name: data.name || '',
          description: data.description || '',
          deliveryLocation: data.delivery_location || '',
          specialRequirements: data.special_requirements || '',
          expectedDeliveryDate: data.expected_delivery_date || ''
        });
      }
      
      // 加载分享状态
      try {
        const shareData = await orderListShareService.getOrderListShares(id);
        setQuotations(shareData || []);
        
        // 检查当前用户是否是供应商且货单分享给了他
        if (isSupplier && user?.id) {
          const sharedToCurrentUser = shareData?.some((share: any) => 
            share.supplier_id === user.id
          );
          setIsSharedToMe(sharedToCurrentUser);
        }
        
        const stats = await orderListShareService.getShareStats(id);
        setShareStats(stats);
      } catch (error) {
        console.error('Error loading share data:', error);
      }
    } catch (error) {
      toast.error('加载货单失败');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (orderList) {
      setEditForm({
        name: orderList.name || '',
        description: orderList.description || '',
        deliveryLocation: orderList.delivery_location || '',
        specialRequirements: orderList.special_requirements || '',
        expectedDeliveryDate: orderList.expected_delivery_date || ''
      });
    }
    setIsEditing(false);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!orderList || !id) return;
    
    try {
      const { error } = await productListService.updateOrderList(id, {
        name: editForm.name,
        description: editForm.description,
        delivery_location: editForm.deliveryLocation,
        special_requirements: editForm.specialRequirements,
        expected_delivery_date: editForm.expectedDeliveryDate
      });
      
      if (error) {
        toast.error('保存失败');
        return;
      }
      
      toast.success('保存成功');
      setIsEditing(false);
      loadOrderList(); // 重新加载数据
    } catch (error) {
      toast.error('保存失败');
    }
  };

  // 分享完成处理
  const handleShareComplete = () => {
    // 重新加载数据
    loadOrderList();
  };


  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'shared': return 'bg-blue-100 text-blue-800';
      case 'negotiating': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'shared': return '已分享';
      case 'negotiating': return '协商中';
      case 'confirmed': return '已确认';
      case 'delivered': return '已交付';
      default: return status;
    }
  };

  // 渲染商品项
  const renderOrderItem = (item: OrderListItem) => (
    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex-shrink-0">
        <img
          src={item.product_snapshot?.main_image_url || '/placeholder-product.png'}
          alt={item.product_name}
          className="w-16 h-16 object-cover rounded"
        />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold">{item.product_name}</h4>
        <p className="text-sm text-gray-500">{item.product_sku}</p>
        {item.product_snapshot?.specification && (
          <p className="text-sm text-gray-500">{item.product_snapshot.specification}</p>
        )}
      </div>
      <div className="text-right">
        <div className="font-semibold">¥{item.unit_price.toFixed(2)}</div>
        <div className="text-sm text-gray-500">数量：{item.quantity}</div>
        <div className="text-sm font-medium">
          小计：¥{(item.unit_price * item.quantity).toFixed(2)}
        </div>
      </div>
    </div>
  );

  // 渲染分享状态
  const renderShareStatus = () => {
    if (quotations.length === 0) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂未分享货单</p>
            <p className="text-sm text-gray-400 mt-1">
              点击"分享货单"按钮开始询价
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            分享状态 ({quotations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shareStats && (
            <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-gray-50 rounded">
              <div className="text-center">
                <div className="font-semibold text-blue-600">{shareStats.viewed}</div>
                <div className="text-xs text-gray-500">已查看</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{shareStats.quoted}</div>
                <div className="text-xs text-gray-500">已报价</div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {quotations.map(share => (
              <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {share.supplier_info?.nickname?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {share.supplier_info?.company_name || '供应商'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(share.shared_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    "text-xs",
                    share.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    share.status === 'viewed' ? 'bg-blue-100 text-blue-800' :
                    share.status === 'quoted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    {share.status === 'pending' && '待查看'}
                    {share.status === 'viewed' && '已查看'}
                    {share.status === 'quoted' && '已报价'}
                    {share.status === 'declined' && '已拒绝'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          {quotations.some(q => q.status === 'quoted') && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => navigate(`/quotations`)}
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                查看报价
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
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
          <h1 className="text-2xl font-bold">{orderList.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getStatusColor(orderList.status)}>
              {getStatusText(orderList.status)}
            </Badge>
            <span className="text-sm text-gray-500">
              创建于 {new Date(orderList.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* 货单创建者的操作按钮 */}
          {orderList.status === 'draft' && orderList.user_id === user?.id && (
            <>
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit className="w-4 h-4 mr-2" />
                编辑
              </Button>
              <Button onClick={() => setShowSupplierSelector(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                分享货单
              </Button>
            </>
          )}
          
          {/* 被分享用户的操作按钮 */}
          {isSharedToMe && (orderList.status === 'shared' || orderList.status === 'draft') && (
            <Button onClick={() => navigate(`/customer-quotation/${orderList.id}`)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              立即报价
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：货单详情 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 商品列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                商品清单 ({orderList.product_list_items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderList.product_list_items.map(renderOrderItem)}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>总金额：</span>
                <span>¥{orderList.total_amount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* 采购要求 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>采购要求</span>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 mr-1" />
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="w-4 h-4 mr-1" />
                      保存
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                // 编辑模式
                <>
                  <div>
                    <Label htmlFor="edit-name">货单名称 *</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-description">货单描述</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-delivery-location">交付地点 *</Label>
                    <Input
                      id="edit-delivery-location"
                      value={editForm.deliveryLocation}
                      onChange={(e) => setEditForm(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-expected-delivery-date">期望交付日期</Label>
                    <Input
                      id="edit-expected-delivery-date"
                      type="date"
                      value={editForm.expectedDeliveryDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-special-requirements">特殊要求</Label>
                    <Textarea
                      id="edit-special-requirements"
                      value={editForm.specialRequirements}
                      onChange={(e) => setEditForm(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                // 查看模式
                <>
                  {orderList.expected_delivery_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">期望交货时间：</span>
                      <span>{new Date(orderList.expected_delivery_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">交货地址：</span>
                    <span>{orderList.delivery_location}</span>
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
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：分享状态 */}
        <div className="space-y-6">
          {renderShareStatus()}
        </div>
      </div>

      {/* 供应商选择器 */}
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