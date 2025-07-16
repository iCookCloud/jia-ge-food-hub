import { useState } from "react";
import { useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  MessageCircle, 
  Star, 
  MapPin, 
  Phone,
  Mail,
  Globe,
  Shield,
  Package,
  Eye,
  TrendingUp,
  FileText
} from "lucide-react";

// Import product images
import salmonImage from "@/assets/salmon-fillet.jpg";
import beefImage from "@/assets/beef-rolls.jpg";

const mockSupplierDetail = {
  "1": {
    id: "1",
    name: "海鲜直供有限公司",
    description: "专业海鲜供应商，提供新鲜优质的海产品，覆盖全国主要城市冷链配送。",
    location: "广东深圳",
    address: "深圳市南山区科技园南区",
    phone: "400-888-9999",
    email: "contact@seafood.com",
    website: "www.seafooddirect.com",
    categories: ["海鲜", "冷冻食品", "进口食材"],
    verified: true,
    rating: 4.8,
    reviewCount: 156,
    productCount: 156,
    hasAiChat: true,
    businessLicense: "91440300123456789X",
    yearsInBusiness: 8,
    monthlyOrders: 1200,
    responseTime: "30分钟内",
    products: [
      {
        id: "1",
        name: "新鲜三文鱼片 挪威进口",
        image: salmonImage,
        price: "128.00",
        unit: "kg",
        specifications: "500g/片 冷链配送",
        supplier: { name: "海鲜直供", verified: true },
        rating: 4.8,
        inStock: true
      },
      {
        id: "5",
        name: "精选大虾 南美白虾",
        image: salmonImage,
        price: "78.00",
        unit: "kg",
        specifications: "30-40只/kg 冷冻",
        supplier: { name: "海鲜直供", verified: true },
        rating: 4.6,
        inStock: true
      }
    ]
  }
};

const SupplierDetailPage = () => {
  const { id } = useParams();
  const [showAiChat, setShowAiChat] = useState(false);

  const supplier = mockSupplierDetail[id as keyof typeof mockSupplierDetail];

  if (!supplier) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">供应商未找到</h1>
          <p className="text-muted-foreground">该供应商可能不存在或已停止服务</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
                    {supplier.verified && (
                      <Badge variant="default">认证供应商</Badge>
                    )}
                    {supplier.hasAiChat && (
                      <Badge variant="secondary" className="bg-brand-orange text-white">AI客服</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <span>{supplier.rating}分 ({supplier.reviewCount}评价)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4" />
                      <span>{supplier.productCount}个产品</span>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{supplier.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {supplier.categories.map((category, index) => (
                      <Badge key={index} variant="outline">{category}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">联系方式</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.website}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{supplier.address}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => setShowAiChat(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                联系供应商
              </Button>
              <Button variant="outline" className="w-full">
                查看所有产品
              </Button>
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                获取报价
              </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">商品展示</TabsTrigger>
            <TabsTrigger value="company">企业信息</TabsTrigger>
            <TabsTrigger value="reviews">客户评价</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {supplier.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="company" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  企业资质
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">营业执照:</span>
                    <span>{supplier.businessLicense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">经营年限:</span>
                    <span>{supplier.yearsInBusiness}年</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">认证状态:</span>
                    <Badge variant="secondary" className="bg-success text-success-foreground">已认证</Badge>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  经营数据
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">月均订单:</span>
                    <span>{supplier.monthlyOrders}单</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">响应时间:</span>
                    <span>{supplier.responseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">客户评分:</span>
                    <span>{supplier.rating}/5.0</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">暂无客户评价</h3>
              <p className="text-muted-foreground">成为第一个评价此供应商的客户</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Chat Modal Placeholder */}
        {showAiChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 max-h-[80vh]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>AI智能客服</CardTitle>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowAiChat(false)}>
                  ×
                </Button>
              </CardHeader>
              <CardContent className="h-96 flex items-center justify-center">
                <p className="text-muted-foreground">AI客服功能开发中...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SupplierDetailPage;