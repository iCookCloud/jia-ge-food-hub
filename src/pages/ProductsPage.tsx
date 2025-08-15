import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteProducts } from "@/hooks/useInfiniteProducts";
import { useCart } from "@/hooks/useCart";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { useDebounce } from "@/hooks/useDebounce";
import { CreateProductListForm } from "@/components/cart/CreateProductListForm";
import { CategorySelector, CategoryBreadcrumbs } from "@/components/category/CategorySelector";
import { useCategoriesByLevel, useCategoryBySlug } from "@/hooks/useCategories";
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
import { 
  Search, 
  Filter, 
  Package,
  Grid3X3,
  List,
  AlertCircle,
  ShoppingCart
} from "lucide-react";

// 保留原有的产地选项（后续可以改为从数据库获取）
const origins = ["全部", "本地", "挪威", "澳大利亚", "意大利", "厄瓜多尔"];

const ProductsPage = () => {
  const { items: cartItems, getTotalItems, getTotalAmount, clearCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedOrigin, setSelectedOrigin] = useState("全部");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 获取一级分类用于快速筛选
  const { data: level1Categories } = useCategoriesByLevel(1);

  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  // 防抖搜索查询
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 构建查询参数
  const queryParams = useMemo(() => {
    let sortField = "created_at";
    let sortOrder: "asc" | "desc" = "desc";
    
    switch (sortBy) {
      case "price-low":
        sortField = "price";
        sortOrder = "asc";
        break;
      case "price-high":
        sortField = "price";
        sortOrder = "desc";
        break;
      case "name":
        sortField = "name";
        sortOrder = "asc";
        break;
      case "newest":
        sortField = "created_at";
        sortOrder = "desc";
        break;
      case "featured":
      default:
        // 推荐排序：优先显示最近更新的商品
        sortField = "updated_at";
        sortOrder = "desc";
        break;
    }
    
    return {
      search: debouncedSearchQuery,
      category: selectedCategoryId ? selectedCategoryId.toString() : undefined,
      sortBy: sortField,
      sortOrder,
      limit: 12
    };
  }, [debouncedSearchQuery, selectedCategoryId, sortBy]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteProducts(queryParams);

  // 合并所有页面的产品数据，确保去重
  const allProducts = useMemo(() => {
    const products = data?.pages.flatMap(page => page.data) || [];
    // 使用 Map 去重，以产品ID为key
    const uniqueProductsMap = new Map();
    products.forEach(product => {
      if (!uniqueProductsMap.has(product.id)) {
        uniqueProductsMap.set(product.id, product);
      }
    });
    return Array.from(uniqueProductsMap.values());
  }, [data]);

  // 获取总数
  const totalCount = data?.pages[0]?.count || 0;

  // Convert database products to the format expected by ProductCard
  const convertedProducts = allProducts.map(product => ({
    id: product.id,
    name: product.standard_chinese_name || product.standard_english_name || product.sku,
    image: product.product_image || "/placeholder.svg",
    price: product.unit_price || "0.00",
    unit: product.unit || "个",
    specifications: product.specifications || "暂无规格说明",
    sku: product.sku,
    subcategory: product.subcategory,
    dimensions: product.outer_box_dimensions,
    storageRequirements: product.storage_requirements,
    requiresColdChain: product.requires_cold_chain || false,
    isFragile: product.is_fragile || false,
    category: product.category_chinese || product.category_english || "其他",
    supplier: {
      name: product.vendor || "未知供应商",
      verified: true // 硬编码：所有供应商都显示为已认证
    },
    rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(2)), // 4.0-5.0，保留2位小数
    inStock: product.is_active || false
  }));

  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-3">商品分类</h3>
        <div className="space-y-3">
          {/* 清除分类选择 */}
          <Button
            variant={!selectedCategoryId ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => setSelectedCategoryId(undefined)}
          >
            全部商品
          </Button>
          
          {/* 一级分类快速选择 */}
          {level1Categories?.map(category => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </Button>
          ))}
          
          {/* 分类选择器 */}
          <div className="mt-3">
            <CategorySelector
              value={selectedCategoryId}
              onValueChange={(value) => setSelectedCategoryId(value as number)}
              placeholder="选择详细分类..."
              className="w-full"
            />
          </div>
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
                {!showCreateForm ? (
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
                        onClick={() => setShowCreateForm(true)}
                      >
                        生成货单
                      </Button>
                      <Button size="sm" variant="outline" onClick={clearCart}>
                        清空
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CreateProductListForm
                    cartItems={cartItems}
                    onSuccess={() => {
                      clearCart();
                      setShowCreateForm(false);
                    }}
                    onCancel={() => setShowCreateForm(false)}
                  />
                )}
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
                {level1Categories?.slice(0, 4).map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategoryId === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
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
                  {convertedProducts.length} / {totalCount} 个商品
                </p>
                {(isLoading || isFetchingNextPage) && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? '加载中...' : '加载更多...'}
                    </span>
                  </div>
                )}
                {selectedCategoryId && (
                  <CategoryBreadcrumbs 
                    categoryId={selectedCategoryId} 
                    showIcon={false}
                    className="text-xs"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="featured">推荐排序</SelectItem>
                    <SelectItem value="newest">最新发布</SelectItem>
                    <SelectItem value="price-low">价格从低到高</SelectItem>
                    <SelectItem value="price-high">价格从高到低</SelectItem>
                    <SelectItem value="name">商品名称</SelectItem>
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

            {/* Products Grid/List with Infinite Scroll */}
            <InfiniteScroll
              hasNextPage={hasNextPage || false}
              isLoading={isFetchingNextPage}
              onLoadMore={fetchNextPage}
              threshold={300}
            >
              {isLoading && convertedProducts.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
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
              ) : convertedProducts.length > 0 ? (
                <>
                  <div className={`
                    ${viewMode === "grid" 
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "space-y-4"
                    }
                  `}>
                    {convertedProducts.map((product, index) => (
                      <ProductCard key={`${product.id}-${index}`} product={product} mode={viewMode} />
                    ))}
                  </div>
                  
                  {/* 加载更多指示器 */}
                  {isFetchingNextPage && (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-3 text-muted-foreground">加载更多商品...</span>
                    </div>
                  )}
                  
                  {/* 没有更多数据提示 */}
                  {!hasNextPage && convertedProducts.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">已加载全部 {totalCount} 个商品</p>
                    </div>
                  )}
                </>
              ) : !isLoading ? (
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
                    setSelectedCategoryId(undefined);
                    setSelectedOrigin("全部");
                  }}>
                    清除筛选条件
                  </Button>
                </Card>
              ) : null}
            </InfiniteScroll>
          </main>
        </div>
      </div>

    </Layout>
  );
};

export default ProductsPage;