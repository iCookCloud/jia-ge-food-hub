import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { CreateProductListDialog } from "@/components/cart/CreateProductListDialog";
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
  List,
  AlertCircle,
  ShoppingCart
} from "lucide-react";

const categories = ["全部", "海鲜", "肉类", "蔬菜", "调料", "冷冻食品", "有机食品"];
const origins = ["全部", "本地", "挪威", "澳大利亚", "意大利", "厄瓜多尔"];

const ProductsPage = () => {
  const { data: products = [], isLoading, error } = useProducts();
  const { items: cartItems, getTotalItems, getTotalAmount, clearCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedOrigin, setSelectedOrigin] = useState("全部");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  // Convert database products to the format expected by ProductCard
  const convertedProducts = products.map(product => ({
    id: product.id,
    name: product.standard_chinese_name || product.standard_english_name || product.sku,
    image: product.product_image || "/placeholder.svg",
    price: product.unit_price || "0.00",
    unit: product.unit || "个",
    specifications: product.specifications || "暂无规格说明",
    category: product.category_chinese || product.category_english || "其他",
    origin: "暂无产地信息",
    supplier: {
      name: product.vendor || "未知供应商",
      verified: true,
      location: "暂无地址"
    },
    rating: 4.5 + Math.random() * 0.5, // Mock rating
    inStock: product.is_active || false,
    featured: false
  }));

  // Filter products based on selected criteria
  const filteredProducts = convertedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.specifications.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || product.category === selectedCategory;
    const matchesOrigin = selectedOrigin === "全部" || product.origin === selectedOrigin;

    return matchesSearch && matchesCategory && matchesOrigin;
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
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">商品中心</h1>
            <p className="text-muted-foreground">发现优质食材，连接专业供应商</p>
          </div>
          
          {/* Cart Summary */}
          {totalItems > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        已选 {totalItems} 件商品
                      </div>
                      <div className="text-xs text-muted-foreground">
                        合计：¥{totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => setShowCreateDialog(true)}
                    >
                      生成货单
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearCart}>
                      清空
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">加载中...</span>
                  </div>
                )}
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
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
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
                  无法加载商品数据，请刷新页面重试
                </p>
              </Card>
            ) : sortedProducts.length > 0 ? (
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
                }}>
                  清除筛选条件
                </Button>
              </Card>
            )}
          </main>
        </div>
      </div>

      <CreateProductListDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        cartItems={cartItems}
        onSuccess={() => {
          clearCart();
        }}
      />
    </Layout>
  );
};

export default ProductsPage;