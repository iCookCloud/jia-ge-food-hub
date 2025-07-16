import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SupplierCard } from "@/components/supplier/SupplierCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuppliers } from "@/hooks/useSuppliers";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, MapPin, Building2, AlertCircle } from "lucide-react";

const locations = ["全部地区", "广东深圳", "山东青岛", "江苏南京", "上海浦东"];
const categories = ["全部分类", "海鲜", "肉类", "蔬菜", "调料", "冷冻食品", "有机食品"];

const SuppliersPage = () => {
  const { data: suppliers = [], isLoading, error } = useSuppliers();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("全部地区");
  const [selectedCategory, setSelectedCategory] = useState("全部分类");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Convert database suppliers to the format expected by SupplierCard
  const convertedSuppliers = suppliers.map(supplier => ({
    id: supplier.id,
    name: supplier.company_name,
    description: `专业食材供应商，联系人：${supplier.contact_person}，电话：${supplier.contact_phone}`,
    location: "暂无地址信息",
    categories: ["食材供应"],
    verified: supplier.verification_status === 'verified',
    rating: 4.5 + Math.random() * 0.5, // Mock rating
    productCount: Math.floor(Math.random() * 200) + 50, // Mock product count
    hasAiChat: true
  }));

  const filteredSuppliers = convertedSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = selectedLocation === "全部地区" || supplier.location === selectedLocation;
    const matchesCategory = selectedCategory === "全部分类" || 
                           supplier.categories.includes(selectedCategory);
    const matchesVerified = !showVerifiedOnly || supplier.verified;

    return matchesSearch && matchesLocation && matchesCategory && matchesVerified;
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            共找到 {filteredSuppliers.length} 家供应商
          </p>
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">加载中...</span>
            </div>
          )}
        </div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-start space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              加载失败
            </h3>
            <p className="text-muted-foreground mb-4">
              无法加载供应商数据，请刷新页面重试
            </p>
          </Card>
        ) : filteredSuppliers.length > 0 ? (
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