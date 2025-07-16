import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
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
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  MapPin,
  Star,
  Package,
  Grid3X3,
  List
} from "lucide-react";

// Import product images
import salmonImage from "@/assets/salmon-fillet.jpg";
import beefImage from "@/assets/beef-rolls.jpg";
import vegetableImage from "@/assets/vegetable-platter.jpg";
import spiceImage from "@/assets/spice-set.jpg";

// Extended mock data for products
const mockProducts = [
  {
    id: "1",
    name: "新鲜三文鱼片 挪威进口",
    image: salmonImage,
    price: "128.00",
    unit: "kg",
    specifications: "500g/片 冷链配送",
    category: "海鲜",
    origin: "挪威",
    supplier: {
      name: "海鲜直供",
      verified: true,
      location: "广东深圳"
    },
    rating: 4.8,
    inStock: true,
    featured: true
  },
  {
    id: "2", 
    name: "优质牛肉卷 火锅专用",
    image: beefImage,
    price: "89.00",
    unit: "kg",
    specifications: "200g/盒 冷冻保存",
    category: "肉类",
    origin: "澳大利亚",
    supplier: {
      name: "优质肉类",
      verified: true,
      location: "山东青岛"
    },
    rating: 4.6,
    inStock: true,
    featured: false
  },
  {
    id: "3",
    name: "有机蔬菜拼盘",
    image: vegetableImage,
    price: "35.00", 
    unit: "份",
    specifications: "混合蔬菜 当日采摘",
    category: "蔬菜",
    origin: "本地",
    supplier: {
      name: "绿色农场",
      verified: false,
      location: "江苏南京"
    },
    rating: 4.5,
    inStock: true,
    featured: false
  },
  {
    id: "4",
    name: "进口调味料套装",
    image: spiceImage,
    price: "156.00",
    unit: "套",
    specifications: "10种调料 餐厅专用",
    category: "调料",
    origin: "意大利",
    supplier: {
      name: "调味专家",
      verified: true,
      location: "上海浦东"
    },
    rating: 4.7,
    inStock: false,
    featured: true
  },
  // Additional products for demonstration
  {
    id: "5",
    name: "精选大虾 南美白虾",
    image: salmonImage, // Reusing for demo
    price: "78.00",
    unit: "kg",
    specifications: "30-40只/kg 冷冻",
    category: "海鲜",
    origin: "厄瓜多尔",
    supplier: {
      name: "海鲜直供",
      verified: true,
      location: "广东深圳"
    },
    rating: 4.6,
    inStock: true,
    featured: false
  },
  {
    id: "6",
    name: "新鲜鸡胸肉",
    image: beefImage, // Reusing for demo
    price: "32.00",
    unit: "kg",
    specifications: "无骨去皮 当日屠宰",
    category: "肉类",
    origin: "本地",
    supplier: {
      name: "优质肉类",
      verified: true,
      location: "山东青岛"
    },
    rating: 4.4,
    inStock: true,
    featured: false
  }
];

const categories = ["全部", "海鲜", "肉类", "蔬菜", "调料", "冷冻食品", "有机食品"];
const origins = ["全部", "本地", "挪威", "澳大利亚", "意大利", "厄瓜多尔"];
const suppliers = ["全部", "海鲜直供", "优质肉类", "绿色农场", "调味专家"];

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedOrigin, setSelectedOrigin] = useState("全部");
  const [selectedSupplier, setSelectedSupplier] = useState("全部");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Filter products based on selected criteria
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.specifications.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || product.category === selectedCategory;
    const matchesOrigin = selectedOrigin === "全部" || product.origin === selectedOrigin;
    const matchesSupplier = selectedSupplier === "全部" || product.supplier.name === selectedSupplier;
    const matchesStock = !showInStockOnly || product.inStock;
    const matchesVerified = !showVerifiedOnly || product.supplier.verified;

    return matchesSearch && matchesCategory && matchesOrigin && matchesSupplier && matchesStock && matchesVerified;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "featured":
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-3">商品分类</h3>
        <div className="space-y-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">产地</h3>
        <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {origins.map(origin => (
              <SelectItem key={origin} value={origin}>{origin}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">供应商</h3>
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {suppliers.map(supplier => (
              <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">筛选条件</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="inStock" 
              checked={showInStockOnly}
              onCheckedChange={(checked) => setShowInStockOnly(checked === true)}
            />
            <label htmlFor="inStock" className="text-sm text-foreground">仅显示有库存</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="verified" 
              checked={showVerifiedOnly}
              onCheckedChange={(checked) => setShowVerifiedOnly(checked === true)}
            />
            <label htmlFor="verified" className="text-sm text-foreground">仅显示认证供应商</label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">商品中心</h1>
          <p className="text-muted-foreground">发现优质食材，连接专业供应商</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索商品名称、规格..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Quick Category Filters */}
              <div className="flex flex-wrap gap-2">
                {categories.slice(1, 5).map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Mobile Filter Trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="h-4 w-4" />
                    筛选
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>商品筛选</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSection />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 space-y-6">
            <Card>
              <CardContent className="p-6">
                <FilterSection />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-muted-foreground">
                  共找到 {sortedProducts.length} 个商品
                </p>
                <Badge variant="outline">
                  {selectedCategory !== "全部" && selectedCategory}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="featured">推荐排序</SelectItem>
                    <SelectItem value="price-low">价格从低到高</SelectItem>
                    <SelectItem value="price-high">价格从高到低</SelectItem>
                    <SelectItem value="rating">评分最高</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border border-border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {sortedProducts.length > 0 ? (
              <div className={`
                ${viewMode === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }
              `}>
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  未找到匹配的商品
                </h3>
                <p className="text-muted-foreground mb-4">
                  请尝试调整搜索条件或筛选条件
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("全部");
                  setSelectedOrigin("全部");
                  setSelectedSupplier("全部");
                  setShowInStockOnly(false);
                  setShowVerifiedOnly(false);
                }}>
                  清除筛选条件
                </Button>
              </Card>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;