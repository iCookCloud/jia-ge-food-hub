import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
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

//

const ProductDetailPage = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
          name: product.vendor || "未知供应商",
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

  const handleInquiry = () => {
    console.log("咨询询价功能 - 待实现");
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
                <span className="text-muted-foreground">/{product.unit || "件"}</span>
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
                        {currentQuantity} {product.unit || "件"}
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">商品详情</TabsTrigger>
              <TabsTrigger value="specs">规格参数</TabsTrigger>
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
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">计量单位:</span>
                      <span>{product.unit || "件"}</span>
                    </div>
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
          </Tabs>
        </Card>

//
      </div>
    </Layout>
  );
};

export default ProductDetailPage;