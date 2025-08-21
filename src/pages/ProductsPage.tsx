import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Eye,
  ArrowUpRight,
  Target,
  Package,
  FileText,
  CheckCircle
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useProductsWithPagination } from "@/hooks/useProductsWithPagination";
import { useCategoriesByLevel } from "@/hooks/useCategories";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/lib/utils";
import { ProductCard } from "@/components/product/ProductCard";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Pagination } from "@/components/common/Pagination";

// 保留原有的产地选项（后续可以改为从数据库获取）
const origins = ["全部", "本地", "挪威", "澳大利亚", "意大利", "厄瓜多尔"];

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedOrigin, setSelectedOrigin] = useState("全部");
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  
  const navigate = useNavigate();

  // 处理URL参数
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategoryName(decodeURIComponent(categoryParam));
    }
  }, [searchParams]);

  // 获取一级分类用于快速筛选
  const { data: level1Categories } = useCategoriesByLevel(1);

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
      category: selectedCategoryName || (selectedCategoryId ? selectedCategoryId.toString() : undefined),
      sortBy: sortField,
      sortOrder,
      limit: pageSize
    };
  }, [debouncedSearchQuery, selectedCategoryName, selectedCategoryId, sortBy, pageSize]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedCategoryName, selectedCategoryId, sortBy]);

  const {
    data: products,
    count: totalCount,
    totalPages,
    isLoading,
    error
  } = useProductsWithPagination({
    ...queryParams,
    page: currentPage,
    limit: pageSize
  });

  // Convert database products to the format expected by ProductCard
  const convertedProducts = products.map(product => ({
    id: product.id,
    name: product.standard_chinese_name || product.standard_english_name || product.sku,
    image: product.product_image || "/placeholder.svg",
    price: product.unit_price || "0.00",
    unit: product.unit || "",
    specifications: product.specifications || "暂无规格说明",
    sku: product.sku,
    subcategory: product.subcategory,
    dimensions: product.outer_box_dimensions,
    storageRequirements: product.storage_requirements,
    requiresColdChain: product.requires_cold_chain || false,
    isFragile: product.is_fragile || false,
    category: product.category_chinese || product.category_english || "其他",
    supplier: {
      name: (product as any).user_profile?.company_name || 
            (product as any).user_profile?.nickname || 
            product.vendor || 
            "未知供应商",
      verified: true // 硬编码：所有供应商都显示为已认证
    },
    rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(2)), // 4.0-5.0，保留2位小数
    inStock: product.is_active || false
  }));


  // 使用转换后的真实数据
  const displayProducts = convertedProducts;

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // 重置到第一页
  };

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
            {/* CategorySelector is not defined in the provided code, assuming it's a placeholder for a component */}
            {/* For now, we'll just show a placeholder or remove if not used */}
            {/* <CategorySelector
              value={selectedCategoryId}
              onValueChange={(value) => setSelectedCategoryId(value as number)}
              placeholder="选择详细分类..."
              className="w-full"
            /> */}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-foreground mb-3">产地</h3>
        {/* Select is not defined in the provided code, assuming it's a placeholder for a component */}
        {/* For now, we'll just show a placeholder or remove if not used */}
        {/* <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {origins.map(origin => (
              <SelectItem key={origin} value={origin}>{origin}</SelectItem>
            ))}
          </SelectContent>
        </Select> */}
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
          
          
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="搜索商品名称、规格..." 
                  className="w-full px-3 py-2 border rounded-lg"
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
              {/* Sheet is not defined in the provided code, assuming it's a placeholder for a component */}
              {/* For now, we'll just show a placeholder or remove if not used */}
              {/* <Sheet>
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
              </Sheet> */}
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
                  {displayProducts.length} / {totalCount} 个商品
                </p>
                {isLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? '加载中...' : '加载更多...'}
                    </span>
                  </div>
                )}
                {selectedCategoryId && (
                  <div className="text-xs text-muted-foreground">
                    已选择分类
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {/* 暂时禁用排序和视图切换功能 */}
              </div>
            </div>

            {/* Products Grid */}
              {isLoading && displayProducts.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="h-48 w-full bg-gray-200 animate-pulse" />
                      <CardContent className="p-4">
                        <div className="h-4 w-full bg-gray-200 animate-pulse mb-2" />
                        <div className="h-4 w-3/4 bg-gray-200 animate-pulse mb-2" />
                        <div className="h-4 w-1/2 bg-gray-200 animate-pulse" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="p-12 text-center">
                  <div className="h-12 w-12 mx-auto bg-red-200 rounded-full mb-4 flex items-center justify-center">
                    <span className="text-red-600 text-2xl">!</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    加载失败
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    无法加载商品数据，请刷新页面重试
                  </p>
                </Card>
              ) : displayProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayProducts.map((product, index) => (
                      <ProductCard key={`${product.id}-${index}`} product={product} mode={viewMode} />
                    ))}
                  </div>
                  
                  {/* 分页组件 */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    isLoading={isLoading}
                  />
                </>
              ) : !isLoading ? (
                <Card className="p-12 text-center">
                  <div className="h-12 w-12 mx-auto bg-gray-200 rounded-full mb-4 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
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
            {/* </InfiniteScroll> */}
          </main>
        </div>
      </div>

    </Layout>
  );
};

export default ProductsPage;