import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  ShoppingCart,
  Calendar,
  MapPin,
  FileText
} from "lucide-react";
import { useCreateProductListFromCart } from "@/hooks/useProductLists";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const CreateOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { items: cartItems, clearCart } = useCart();
  const createMutation = useCreateProductListFromCart();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deliveryLocation: "",
    specialRequirements: "",
    expectedDeliveryDate: ""
  });

  // 如果没有购物车商品，跳转回商品页面
  if (cartItems.length === 0) {
    navigate('/products');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.deliveryLocation.trim()) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({ 
        cartItems, 
        name: formData.name.trim(),
        description: formData.description.trim(),
        deliveryLocation: formData.deliveryLocation.trim(),
        specialRequirements: formData.specialRequirements.trim(),
        expectedDeliveryDate: formData.expectedDeliveryDate || undefined
      });
      
      if (result) {
        toast.success('货单创建成功！');
        clearCart(); // 清空购物车
        // 跳转到货单详情页面
        navigate(`/order-lists/${result.id}`);
      }
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  };

  const totalAmount = cartItems.reduce((sum, item) => 
    sum + (parseFloat(item.price) * item.quantity), 0
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回商品页面
          </Button>
          <div>
            <h1 className="text-2xl font-bold">创建货单</h1>
            <p className="text-muted-foreground">填写货单信息，生成采购清单</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：货单创建表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  货单信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">货单名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="请输入货单名称"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">货单描述</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="请描述您的采购需求（可选）"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryLocation">交付地点 *</Label>
                    <Input
                      id="deliveryLocation"
                      value={formData.deliveryLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      placeholder="请输入交付地点"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedDeliveryDate">期望交付日期</Label>
                    <Input
                      id="expectedDeliveryDate"
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequirements">特殊要求</Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      placeholder="请说明特殊要求（可选）"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/products')}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      disabled={!formData.name.trim() || !formData.deliveryLocation.trim() || createMutation.isPending}
                      className="flex-1"
                    >
                      {createMutation.isPending ? "创建中..." : "创建货单"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：购物车摘要 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  购物车摘要
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex flex-col p-3 border rounded-lg">
                      {/* 商品图片 */}
                      <div className="flex-shrink-0 mb-2">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-20 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-medium text-sm line-clamp-2">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          ¥{item.price}/{item.unit}
                        </div>
                        <div className="text-xs text-gray-400">
                          数量: {item.quantity}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          ¥{(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>商品种类：</span>
                    <span>{cartItems.length} 种</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>总数量：</span>
                    <span>{totalItems} 件</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                    <span>总金额：</span>
                    <span className="text-primary">¥{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate('/products')}
                  className="w-full"
                >
                  返回商品页面
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

