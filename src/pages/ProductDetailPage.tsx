import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SimpleSupplierPicker from "@/components/common/SimpleSupplierPicker";
import { notificationService } from "@/services/notificationService";
import { toast } from "sonner";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  MessageCircle, 
  Package, 
  Truck,
  Shield,
  Heart,
  Share2,
  ArrowLeft,
  Plus,
  Minus
} from "lucide-react";
import { ProductRelatedCases } from "@/components/product/ProductRelatedCases";
import { ProductSupplierInfo } from "@/components/product/ProductSupplierInfo";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

//

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  
  // 咨询对话框状态
  const [consultationDialog, setConsultationDialog] = useState({
    open: false,
    selectedSupplier: "",
    message: ""
  });
  
  const { data: product, isLoading, error } = useProduct(id || "");
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  
  const currentQuantity = getItemQuantity(id || "");

  const handleAddToCart = () => {
    if (!product) return;
    
    if (currentQuantity === 0) {
      addItem({
        id: product.id,
        name: product.standard_chinese_name || product.standard_english_name || product.sku,
        price: product.unit_price || "0",
        unit: product.unit || "件",
        image: product.product_image,
        specifications: product.specifications,
        supplier: {
          name: (product as any).user_profile?.company_name || 
                (product as any).user_profile?.nickname || 
                product.vendor || 
                "iCook",
          verified: true
        }
      }, 1);
    } else {
      updateQuantity(product.id, currentQuantity + 1);
    }
  };

  const handleDecreaseQuantity = () => {
    if (!product || currentQuantity === 0) return;
    updateQuantity(product.id, currentQuantity - 1);
  };

  const handleInquiry = async () => {
    if (!user || !product) {
      toast.error("请先登录后再咨询询价");
      return;
    }

    try {
      // 跳转到与商品上传者的聊天页面，携带商品上下文
      const uploaderId = product.user_id; // 商品上传者ID
      const productId = product.id;
      if (uploaderId) {
        navigate(`/quotations?to=${uploaderId}&product=${productId}`);
      } else {
        toast.error("该商品暂无上传者信息，无法咨询");
      }
    } catch (error) {
      console.error('启动聊天失败:', error);
      toast.error("启动聊天失败，请稍后重试");
    }
  };

  // 处理咨询提交
  const handleConsultationSubmit = async () => {
    if (!consultationDialog.selectedSupplier || !consultationDialog.message.trim()) {
      toast.error("请选择供应商并填写咨询内容");
      return;
    }

    if (!user || !product) {
      toast.error("请先登录");
      return;
    }

    try {
      // 这里应该调用实际的咨询API
      // await consultationApi.sendInquiry({
      //   productId: id,
      //   supplierId: consultationDialog.selectedSupplier,
      //   message: consultationDialog.message
      // });

      // 发送商品咨询通知给供应商
      try {
        await notificationService.notifyProductInquiry(
          consultationDialog.selectedSupplier,
          '供应商', // 可以通过API获取实际供应商姓名
          productName,
          product.id,
          user.email?.split('@')[0] || '用户'
        );
      } catch (notificationError) {
        console.error('Error sending product inquiry notification:', notificationError);
        // 通知发送失败不影响咨询流程
      }
      
      toast.success("咨询已发送，供应商会尽快回复您");
      setConsultationDialog({
        open: false,
        selectedSupplier: "",
        message: ""
      });
    } catch (error) {
      console.error("Error sending consultation:", error);
      toast.error("发送咨询失败，请重试");
    }
  };

  // 关闭咨询对话框
  const handleConsultationCancel = () => {
    setConsultationDialog({
      open: false,
      selectedSupplier: "",
      message: ""
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">商品未找到</h1>
          <p className="text-muted-foreground mb-4">
            {error ? "加载商品时出错" : "该商品可能已下架或不存在"}
          </p>
          <Link to="/products">
            <Button>返回商品列表</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // 使用真实数据结构
  const currentPrice = product.unit_price || "0";
  const productName = product.standard_chinese_name || product.standard_english_name || product.sku;
  const images = product.product_image ? [product.product_image] : ["/placeholder.svg"]; // 默认图片

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link to="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回商品列表
            </Button>
          </Link>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <span>商品中心</span>
          <span>/</span>
          <span>{product.category_chinese || product.category_english || "其他"}</span>
          <span>/</span>
          <span className="text-foreground">{productName}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {images[currentImageIndex] ? (
                <img 
                  src={images[currentImageIndex]}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {productName}
                </h1>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="text-sm text-muted-foreground">
                  SKU: {product.sku}
                </div>
                {product.is_active ? (
                  <Badge variant="outline" className="text-success border-success">
                    在售
                  </Badge>
                ) : (
                  <Badge variant="destructive">已下架</Badge>
                )}
                {product.requires_cold_chain && (
                  <Badge variant="secondary">冷链配送</Badge>
                )}
                {product.is_fragile && (
                  <Badge variant="secondary">易碎品</Badge>
                )}
              </div>

              {product.specifications && (
                <p className="text-muted-foreground mb-6">{product.specifications}</p>
              )}
            </div>

            {/* Price */}
            <Card className="p-4 bg-gradient-subtle">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-primary">
                  ¥{currentPrice}
                </span>
                {product.unit && product.unit !== "个" && (
                  <span className="text-muted-foreground">/{product.unit}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {product.vendor && (
                  <p>供应商: {product.vendor}</p>
                )}
                {product.storage_requirements && (
                  <p>存储要求: {product.storage_requirements}</p>
                )}
              </div>
            </Card>

            {/* Purchase Section */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button 
                    variant={product.is_active ? "default" : "secondary"} 
                    className="flex-1"
                    onClick={handleInquiry}
                    disabled={!product.is_active}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {product.is_active ? "咨询询价" : "已下架"}
                  </Button>
                  
                  {currentQuantity === 0 ? (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleAddToCart}
                      disabled={!product.is_active}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      加入货单
                    </Button>
                  ) : (
                    <div className="flex-1 flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDecreaseQuantity}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 text-center font-medium">
                        {currentQuantity}{product.unit && product.unit !== "个" ? ` ${product.unit}` : ""}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddToCart}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {currentQuantity > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    小计: ¥{(parseFloat(currentPrice) * currentQuantity).toFixed(2)}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Card className="mb-8">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="details" className="text-xs sm:text-sm">商品详情</TabsTrigger>
              <TabsTrigger value="specs" className="text-xs sm:text-sm">规格参数</TabsTrigger>
              <TabsTrigger value="cases" className="text-xs sm:text-sm">应用案例</TabsTrigger>
              <TabsTrigger value="supplier" className="text-xs sm:text-sm">供应商</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">基本信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">商品编码:</span>
                      <span>{product.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">商品类别:</span>
                      <span>{product.category_chinese || product.category_english || "未分类"}</span>
                    </div>
                    {product.subcategory && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">子类别:</span>
                        <span>{product.subcategory}</span>
                      </div>
                    )}
                    {product.unit && product.unit !== "个" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">计量单位:</span>
                        <span>{product.unit}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">物流信息</h3>
                  <div className="space-y-3">
                    {product.requires_cold_chain && (
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="text-sm">需要冷链配送</span>
                      </div>
                    )}
                    {product.is_fragile && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-warning" />
                        <span className="text-sm">易碎品，小心搬运</span>
                      </div>
                    )}
                    {product.outer_box_dimensions && (
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">外箱尺寸: {product.outer_box_dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold mb-3">规格参数</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    {product.specifications && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">规格描述:</span>
                        <span className="text-right">{product.specifications}</span>
                      </div>
                    )}
                    {product.storage_requirements && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">存储要求:</span>
                        <span className="text-right">{product.storage_requirements}</span>
                      </div>
                    )}
                    {product.vendor && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">供应商:</span>
                        <span className="text-right">{product.vendor}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">创建时间:</span>
                      <span className="text-right">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString('zh-CN') : "未知"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cases" className="p-6">
              {product.id ? (
                <ErrorBoundary fallback={
                  <div className="text-center py-8 text-muted-foreground">
                    案例信息加载失败，但不影响商品浏览
                  </div>
                }>
                  <ProductRelatedCases
                    productId={product.id}
                    productCategory={product.category_chinese || product.category_english}
                    maxCases={6}
                    showTitle={false}
                    layout="grid"
                  />
                </ErrorBoundary>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  商品信息加载中...
                </div>
              )}
            </TabsContent>

            <TabsContent value="supplier" className="p-6">
              {product.supplier_id ? (
                <ErrorBoundary fallback={
                  <div className="text-center py-8 text-muted-foreground">
                    供应商信息加载失败，但不影响商品浏览
                  </div>
                }>
                  <ProductSupplierInfo
                    supplierId={product.supplier_id}
                    productId={product.id}
                    showTitle={false}
                    compact={false}
                  />
                </ErrorBoundary>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  该商品暂无供应商信息
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* 供应商咨询对话框 */}
        <Dialog open={consultationDialog.open} onOpenChange={(open) => {
          if (!open) handleConsultationCancel();
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>供应商咨询</DialogTitle>
              <DialogDescription>
                向供应商咨询商品详情和报价信息
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* 商品信息 */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {product?.product_image ? (
                  <img 
                    src={product.product_image} 
                    alt={productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm">{productName}</div>
                  <div className="text-xs text-muted-foreground">SKU: {product?.sku}</div>
                </div>
              </div>

              {/* 供应商选择 */}
              <div className="space-y-2">
                <Label htmlFor="supplier">选择供应商</Label>
                <SimpleSupplierPicker
                  value={consultationDialog.selectedSupplier}
                  onChange={(value) => setConsultationDialog(prev => ({
                    ...prev,
                    selectedSupplier: value
                  }))}
                  placeholder="请选择要咨询的供应商"
                />
              </div>

              {/* 咨询内容 */}
              <div className="space-y-2">
                <Label htmlFor="message">咨询内容</Label>
                <Textarea
                  id="message"
                  value={consultationDialog.message}
                  onChange={(e) => setConsultationDialog(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  placeholder="请输入您想了解的问题..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleConsultationCancel}>
                取消
              </Button>
              <Button 
                onClick={handleConsultationSubmit}
                disabled={!consultationDialog.selectedSupplier || !consultationDialog.message.trim()}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                发送咨询
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;