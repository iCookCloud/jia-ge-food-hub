import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Package, 
  Plus, 
  ShoppingCart,
  Eye,
  Filter,
  Grid3X3,
  List
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";

interface ProductBrowserProps {
  onProductSelect?: (product: Product) => void;
  onBulkCreate?: (products: Product[]) => void;
  selectionMode?: boolean;
}

export const ProductBrowser = ({ 
  onProductSelect, 
  onBulkCreate, 
  selectionMode = false 
}: ProductBrowserProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedSupplier, setSelectedSupplier] = useState("全部");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { data: products = [], isLoading: productsLoading } = useProducts({
    search: searchQuery,
    category: selectedCategory === "全部" ? undefined : selectedCategory
  });
  
  const { data: suppliers = [] } = useSuppliers();

  const categories = [
    "全部", "海鲜水产", "肉类", "蔬菜", "乳制品", "冷冻食品", "调料", "粮油", "饮品", "烘焙"
  ];

  // 过滤产品
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.standard_chinese_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.standard_english_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "全部" || 
      product.category_chinese === selectedCategory;
    
    const matchesSupplier = selectedSupplier === "全部" || 
      product.vendor === selectedSupplier;
    
    return matchesSearch && matchesCategory && matchesSupplier;
  });

  // 按供应商分组
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const supplier = product.vendor || "未知供应商";
    if (!groups[supplier]) {
      groups[supplier] = [];
    }
    groups[supplier].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  const handleProductToggle = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.find(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleBulkCreateSheet = () => {
    if (selectedProducts.length > 0 && onBulkCreate) {
      onBulkCreate(selectedProducts);
      setSelectedProducts([]);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {selectionMode && (
            <Checkbox
              checked={selectedProducts.some(p => p.id === product.id)}
              onCheckedChange={() => handleProductToggle(product)}
              className="mt-2"
            />
          )}
          
          {product.product_image && (
            <img 
              src={product.product_image} 
              alt={product.standard_chinese_name || product.sku}
              className="w-16 h-16 object-cover rounded-md"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-primary">
              {product.standard_chinese_name || product.standard_english_name || product.sku}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              SKU: {product.sku}
            </p>
            
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {product.category_chinese || "未分类"}
                </Badge>
                <span className="text-muted-foreground">
                  {product.vendor || "未知供应商"}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-primary">
                  ¥{product.unit_price || "0.00"}
                </span>
                <span className="text-muted-foreground">
                  /{product.unit || "件"}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-1 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-7 text-xs"
                onClick={() => onProductSelect?.(product)}
              >
                <Plus className="h-3 w-3 mr-1" />
                添加
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product }: { product: Product }) => (
    <div className="flex items-center space-x-4 p-3 hover:bg-muted/50 rounded-lg cursor-pointer group">
      {selectionMode && (
        <Checkbox
          checked={selectedProducts.some(p => p.id === product.id)}
          onCheckedChange={() => handleProductToggle(product)}
        />
      )}
      
      {product.product_image && (
        <img 
          src={product.product_image} 
          alt={product.standard_chinese_name || product.sku}
          className="w-12 h-12 object-cover rounded"
        />
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary">
          {product.standard_chinese_name || product.standard_english_name || product.sku}
        </h3>
        <p className="text-xs text-muted-foreground">
          SKU: {product.sku} | {product.vendor || "未知供应商"}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="text-xs">
          {product.category_chinese || "未分类"}
        </Badge>
        <span className="font-semibold text-primary">
          ¥{product.unit_price || "0.00"}
        </span>
        <span className="text-muted-foreground text-xs">
          /{product.unit || "件"}
        </span>
      </div>
      
      <div className="flex space-x-1">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onProductSelect?.(product)}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索商品名称、SKU..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全部">全部供应商</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.company_name}>
                      {supplier.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {selectionMode && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                已选择 {selectedProducts.length} 个商品
              </span>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                  disabled={selectedProducts.length === 0}
                >
                  清空选择
                </Button>
                <Button 
                  size="sm"
                  onClick={handleBulkCreateSheet}
                  disabled={selectedProducts.length === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  创建货单 ({selectedProducts.length})
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 商品列表 */}
      {productsLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([supplier, products]) => (
            <Card key={supplier}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {supplier}
                  <Badge variant="secondary" className="ml-2">
                    {products.length} 商品
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            未找到相关商品
          </h3>
          <p className="text-muted-foreground">
            请尝试调整搜索条件或筛选器
          </p>
        </Card>
      )}
    </div>
  );
};