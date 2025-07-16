import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { SupplierCard } from "@/components/supplier/SupplierCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Users, 
  Package, 
  Star,
  ArrowRight,
  Filter
} from "lucide-react";

// Import product images
import salmonImage from "@/assets/salmon-fillet.jpg";
import beefImage from "@/assets/beef-rolls.jpg";
import vegetableImage from "@/assets/vegetable-platter.jpg";
import spiceImage from "@/assets/spice-set.jpg";

// Mock data for demonstration
const mockProducts = [
  {
    id: "1",
    name: "新鲜三文鱼片 挪威进口",
    image: salmonImage,
    price: "128.00",
    unit: "kg",
    specifications: "500g/片 冷链配送",
    supplier: {
      name: "海鲜直供",
      verified: true
    },
    rating: 4.8,
    inStock: true
  },
  {
    id: "2", 
    name: "优质牛肉卷 火锅专用",
    image: beefImage,
    price: "89.00",
    unit: "kg",
    specifications: "200g/盒 冷冻保存",
    supplier: {
      name: "优质肉类",
      verified: true
    },
    rating: 4.6,
    inStock: true
  },
  {
    id: "3",
    name: "有机蔬菜拼盘",
    image: vegetableImage,
    price: "35.00", 
    unit: "份",
    specifications: "混合蔬菜 当日采摘",
    supplier: {
      name: "绿色农场",
      verified: false
    },
    rating: 4.5,
    inStock: true
  },
  {
    id: "4",
    name: "进口调味料套装",
    image: spiceImage,
    price: "156.00",
    unit: "套",
    specifications: "10种调料 餐厅专用",
    supplier: {
      name: "调味专家",
      verified: true
    },
    inStock: false
  }
];

const mockSuppliers = [
  {
    id: "1",
    name: "海鲜直供有限公司",
    description: "专业海鲜供应商，提供新鲜优质的海产品，覆盖全国主要城市冷链配送。",
    location: "广东深圳",
    categories: ["海鲜", "冷冻食品", "进口食材"],
    verified: true,
    rating: 4.8,
    productCount: 156,
    hasAiChat: true
  },
  {
    id: "2",
    name: "优质肉类批发",
    description: "优质肉类供应商，严格品质控制，为餐饮行业提供标准化肉类产品。",
    location: "山东青岛",
    categories: ["肉类", "冷冻食品", "火锅食材"],
    verified: true,
    rating: 4.7,
    productCount: 89,
    hasAiChat: true
  },
  {
    id: "3",
    name: "绿色农场合作社",
    description: "有机蔬菜种植基地，提供新鲜蔬菜和农产品直供服务。",
    location: "江苏南京",
    categories: ["蔬菜", "有机食品", "农产品"],
    verified: false,
    rating: 4.5,
    productCount: 234,
    hasAiChat: false
  }
];

const Index = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-8">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-primary text-white p-8 lg:p-12">
          <div className="relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                嘉哥优选B2B食材供应链平台
              </h1>
              <p className="text-lg opacity-90 mb-6">
                连接优质供应商与餐饮商户，打造高效透明的食材采购体验。AI赋能智能对话，让采购更简单。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" size="lg" className="font-semibold">
                  开始采购
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  成为供应商
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent" />
        </section>

        {/* Search Section */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索商品、供应商或品类..." 
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button variant="outline" size="lg" className="px-6">
              <Filter className="h-4 w-4" />
              筛选
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {["海鲜", "肉类", "蔬菜", "调料", "冷冻食品", "有机食品"].map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "商品数量", value: "10,000+", color: "text-primary" },
            { icon: Users, label: "认证供应商", value: "500+", color: "text-brand-orange" },
            { icon: TrendingUp, label: "月成交量", value: "¥2000万+", color: "text-success" },
            { icon: Star, label: "平台评分", value: "4.9分", color: "text-warning" }
          ].map((stat, index) => (
            <Card key={index} className="text-center p-4 hover:shadow-card transition-shadow">
              <CardContent className="pt-4 pb-2">
                <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Featured Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">精选商品</h2>
            <Button variant="ghost" className="text-primary">
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Featured Suppliers */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">优质供应商</h2>
            <Button variant="ghost" className="text-primary">
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-card rounded-2xl p-8 text-center border border-border">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            加入嘉哥优选，开启智能采购新体验
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            无论您是餐饮商户寻找优质食材，还是供应商希望拓展业务，我们都能为您提供专业的B2B服务。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="premium" size="lg">
              立即注册采购
            </Button>
            <Button variant="supplier" size="lg">
              申请成为供应商
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
