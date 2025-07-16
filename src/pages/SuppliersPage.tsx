import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SupplierCard } from "@/components/supplier/SupplierCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, MapPin, Building2 } from "lucide-react";

// Extended mock suppliers data
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
  },
  {
    id: "4",
    name: "调味专家食品",
    description: "专业调味料供应商，进口与国产调料齐全，服务全国餐饮企业。",
    location: "上海浦东",
    categories: ["调料", "进口食品", "香料"],
    verified: true,
    rating: 4.6,
    productCount: 67,
    hasAiChat: true
  }
];

const locations = ["全部地区", "广东深圳", "山东青岛", "江苏南京", "上海浦东"];
const categories = ["全部分类", "海鲜", "肉类", "蔬菜", "调料", "冷冻食品", "有机食品"];

const SuppliersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("全部地区");
  const [selectedCategory, setSelectedCategory] = useState("全部分类");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showAiOnly, setShowAiOnly] = useState(false);

  const filteredSuppliers = mockSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "全部地区" || supplier.location === selectedLocation;
    const matchesCategory = selectedCategory === "全部分类" || 
                           supplier.categories.includes(selectedCategory);
    const matchesVerified = !showVerifiedOnly || supplier.verified;
    const matchesAi = !showAiOnly || supplier.hasAiChat;

    return matchesSearch && matchesLocation && matchesCategory && matchesVerified && matchesAi;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">供应商中心</h1>
          <p className="text-muted-foreground">寻找优质供应商，建立长期合作关系</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索供应商名称、业务描述..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={showVerifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
              >
                仅认证供应商
              </Button>
              <Button
                variant={showAiOnly ? "supplier" : "outline"}
                size="sm"
                onClick={() => setShowAiOnly(!showAiOnly)}
              >
                AI客服支持
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            共找到 {filteredSuppliers.length} 家供应商
          </p>
        </div>

        {/* Suppliers Grid */}
        {filteredSuppliers.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              未找到匹配的供应商
            </h3>
            <p className="text-muted-foreground mb-4">
              请尝试调整搜索条件或筛选条件
            </p>
            <Button onClick={() => {
              setSearchQuery("");
              setSelectedLocation("全部地区");
              setSelectedCategory("全部分类");
              setShowVerifiedOnly(false);
              setShowAiOnly(false);
            }}>
              清除筛选条件
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SuppliersPage;