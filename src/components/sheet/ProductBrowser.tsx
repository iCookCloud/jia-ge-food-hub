import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  Plus, 
  ShoppingCart,
  Eye
} from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";

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
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  
  const { data: products = [], isLoading: productsLoading } = useProducts({});
  
  // 显示所有产品
  const filteredProducts = products;

  // 按供应商分组 - 现在所有商品都属于优质食材供应有限公司
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const supplier = "优质食材供应有限公司";
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
              <Badge variant="outline" className="text-xs">
                {product.category_chinese || "未分类"}
              </Badge>
              
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


  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      {selectionMode && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
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
          </CardContent>
        </Card>
      )}

      {/* 商品列表 */}
      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            暂无商品
          </h3>
          <p className="text-muted-foreground">
            请联系管理员添加商品
          </p>
        </Card>
      )}
    </div>
  );
};