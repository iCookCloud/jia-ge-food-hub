import { useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  MessageCircle, 
  Star, 
  MapPin, 
  Package, 
  Truck,
  Shield,
  Clock,
  Heart,
  Share2,
  Play,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calculator
} from "lucide-react";

// Import product images
import salmonImage from "@/assets/salmon-fillet.jpg";
import beefImage from "@/assets/beef-rolls.jpg";
import vegetableImage from "@/assets/vegetable-platter.jpg";
import spiceImage from "@/assets/spice-set.jpg";

// Mock product detail data
const mockProductDetails = {
  "1": {
    id: "1",
    name: "新鲜三文鱼片 挪威进口",
    images: [salmonImage, salmonImage, salmonImage], // Multiple images for gallery
    price: "128.00",
    originalPrice: "156.00", 
    unit: "kg",
    specifications: "500g/片 冷链配送",
    category: "海鲜",
    origin: "挪威",
    description: "来自挪威深海的优质三文鱼，肉质鲜美，富含omega-3脂肪酸。严格的冷链运输保证新鲜度，是制作刺身和烤鱼的首选食材。",
    features: ["冷链配送", "当日新鲜", "营养丰富", "无添加剂"],
    stock: 150,
    minOrder: 5,
    packaging: "真空包装，每片约500g",
    shelfLife: "冷藏保存3-5天",
    supplier: {
      name: "海鲜直供有限公司",
      verified: true,
      location: "广东深圳",
      rating: 4.8,
      responseTime: "30分钟内",
      hasAiChat: true,
      logo: "",
      description: "专业海鲜供应商，提供新鲜优质的海产品，覆盖全国主要城市冷链配送。",
      businessLicense: "91440300123456789X",
      yearsInBusiness: 8
    },
    rating: 4.8,
    reviewCount: 126,
    inStock: true,
    priceBreaks: [
      { min: 5, max: 19, price: "128.00" },
      { min: 20, max: 49, price: "125.00" },
      { min: 50, max: 99, price: "122.00" },
      { min: 100, max: 999, price: "118.00" }
    ],
    relatedVideos: [
      { id: "1", title: "三文鱼处理技巧", thumbnail: salmonImage, duration: "5:30" },
      { id: "2", title: "专业切片示范", thumbnail: salmonImage, duration: "3:45" }
    ]
  }
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(5);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [showAiChat, setShowAiChat] = useState(false);

  const product = mockProductDetails[id as keyof typeof mockProductDetails];

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">商品未找到</h1>
          <p className="text-muted-foreground">该商品可能已下架或不存在</p>
        </div>
      </Layout>
    );
  }

  const currentPrice = product.priceBreaks.find(
    bp => quantity >= bp.min && quantity <= bp.max
  )?.price || product.price;

  const nextImageIndex = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImageIndex = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <span>商品中心</span>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <img 
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {product.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={prevImageIndex}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                    onClick={nextImageIndex}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {product.name}
                </h1>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon-sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-warning fill-current" />
                  <span className="font-medium">{product.rating}</span>
                  <span className="text-muted-foreground">({product.reviewCount}评价)</span>
                </div>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" />
                  {product.origin}
                </Badge>
                {product.inStock ? (
                  <Badge variant="outline" className="text-success border-success">
                    现货充足
                  </Badge>
                ) : (
                  <Badge variant="destructive">缺货</Badge>
                )}
              </div>

              <p className="text-muted-foreground mb-6">{product.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.features.map((feature, index) => (
                  <Badge key={index} variant="secondary">{feature}</Badge>
                ))}
              </div>
            </div>

            {/* Price */}
            <Card className="p-4 bg-gradient-subtle">
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-primary">
                  ¥{currentPrice}
                </span>
                <span className="text-muted-foreground">/{product.unit}</span>
                {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(currentPrice) && (
                  <span className="text-sm text-muted-foreground line-through">
                    ¥{product.originalPrice}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                起订量: {product.minOrder}{product.unit} | 库存: {product.stock}{product.unit}
              </p>
            </Card>

            {/* Price Breaks */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                阶梯价格
              </h3>
              <div className="space-y-2">
                {product.priceBreaks.map((priceBreak, index) => (
                  <div 
                    key={index}
                    className={`flex justify-between p-2 rounded ${
                      quantity >= priceBreak.min && quantity <= priceBreak.max
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted'
                    }`}
                  >
                    <span className="text-sm">
                      {priceBreak.min}-{priceBreak.max === 999 ? '999+' : priceBreak.max}{product.unit}
                    </span>
                    <span className="font-semibold">¥{priceBreak.price}/{product.unit}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Purchase Section */}
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">采购数量</label>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(product.minOrder, quantity - 1))}
                      disabled={quantity <= product.minOrder}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))}
                      className="w-24 text-center"
                      min={product.minOrder}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </Button>
                    <span className="text-sm text-muted-foreground">{product.unit}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    小计: ¥{(parseFloat(currentPrice) * quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    加入购物车
                  </Button>
                  <Button variant="default" className="flex-1">
                    立即询价
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <Card className="mb-8">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">商品详情</TabsTrigger>
              <TabsTrigger value="supplier">供应商信息</TabsTrigger>
              <TabsTrigger value="videos">相关视频</TabsTrigger>
              <TabsTrigger value="reviews">客户评价</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">基本信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">商品规格:</span>
                      <span>{product.specifications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">包装方式:</span>
                      <span>{product.packaging}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">保质期:</span>
                      <span>{product.shelfLife}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">起订量:</span>
                      <span>{product.minOrder}{product.unit}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">物流信息</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <span className="text-sm">冷链配送，当日发货</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-success" />
                      <span className="text-sm">质量保证，可退换货</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm">24-48小时送达</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="supplier" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-foreground">{product.supplier.name}</h3>
                        {product.supplier.verified && (
                          <Badge variant="default" className="text-xs">认证</Badge>
                        )}
                        {product.supplier.hasAiChat && (
                          <Badge variant="secondary" className="text-xs bg-brand-orange text-white">AI客服</Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{product.supplier.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-warning fill-current" />
                          <span>{product.supplier.rating}分</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>响应时间: {product.supplier.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {product.supplier.description}
                  </p>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      查看店铺
                    </Button>
                    <Button 
                      variant={product.supplier.hasAiChat ? "supplier" : "default"} 
                      size="sm" 
                      className="flex-1"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      {product.supplier.hasAiChat ? "AI咨询" : "联系供应商"}
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-3">企业资质</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">营业执照:</span>
                      <span>{product.supplier.businessLicense}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">经营年限:</span>
                      <span>{product.supplier.yearsInBusiness}年</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">认证状态:</span>
                      <Badge variant="secondary" className="text-xs bg-success text-success-foreground">已认证</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="videos" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.relatedVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-card transition-shadow cursor-pointer">
                    <div className="relative aspect-video bg-muted">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-sm">{video.title}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="p-6">
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">暂无客户评价</h3>
                <p className="text-muted-foreground">成为第一个评价此商品的客户</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Quick Inquiry */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">快速询价</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">询价信息</label>
              <Textarea
                placeholder="请描述您的采购需求，如数量、交期、特殊要求等..."
                className="min-h-24"
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
              />
            </div>
            <div className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品:</span>
                  <span>{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">数量:</span>
                  <span>{quantity}{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预估金额:</span>
                  <span className="font-semibold text-primary">¥{(parseFloat(currentPrice) * quantity).toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full" size="lg">
                提交询价
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductDetailPage;