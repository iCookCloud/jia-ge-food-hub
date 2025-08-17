import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MessageCircle, Plus, Minus, Snowflake, AlertTriangle, Package2, Star } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image?: string;
    price: string;
    unit: string;
    specifications?: string;
    sku?: string;
    subcategory?: string;
    dimensions?: string;
    storageRequirements?: string;
    requiresColdChain?: boolean;
    isFragile?: boolean;
    supplier: {
      name: string;
      verified: boolean;
    };
    rating?: number;
    inStock: boolean;
  };
  mode?: "grid" | "list";
}

export function ProductCard({ product, mode = "grid" }: ProductCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const navigate = useNavigate();
  const currentQuantity = getItemQuantity(product.id);

  // 存储要求转换
  const getStorageText = (requirement?: string) => {
    switch (requirement?.toLowerCase()) {
      case 'dry': return '常温存储';
      case 'cold': return '冷藏存储';
      case 'frozen': return '冷冻存储';
      default: return requirement || '常规存储';
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // 防止触发卡片点击
    if (currentQuantity === 0) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.image,
        specifications: product.specifications,
        supplier: product.supplier
      }, 1);
    } else {
      updateQuantity(product.id, currentQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // 防止触发卡片点击
    if (currentQuantity > 0) {
      updateQuantity(product.id, currentQuantity - 1);
    }
  };
  // Grid模式（默认大卡片）
  if (mode === "grid") {
    return (
      <Card 
        className="group hover:shadow-card transition-all duration-200 hover:scale-[1.02] overflow-hidden cursor-pointer" 
        onClick={handleCardClick}
      >
        <div className="aspect-square overflow-hidden bg-muted">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
              <div className="text-muted-foreground text-sm">暂无图片</div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            {/* 第1行：商品名称 + SKU + 标签 */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors flex-1">
                {product.name}
                {product.sku && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">
                    • {product.sku.trim()}
                  </span>
                )}
              </h3>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {product.subcategory && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {product.subcategory.trim()}
                  </Badge>
                )}
                <div className="flex gap-1">
                  {product.requiresColdChain && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-700">
                      <Snowflake className="h-2 w-2 mr-0.5" />
                      冷链
                    </Badge>
                  )}
                  {product.isFragile && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 bg-red-100 text-red-700">
                      <AlertTriangle className="h-2 w-2 mr-0.5" />
                      易碎
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* 第2行：规格信息 */}
            {product.specifications && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                规格：{product.specifications.trim()}
              </p>
            )}

            {/* 第3行：包装尺寸 + 存储要求 */}
            {(product.dimensions || product.storageRequirements) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {product.dimensions && (
                  <span className="flex items-center gap-1">
                    <Package2 className="h-3 w-3" />
                    {product.dimensions.trim()}
                  </span>
                )}
                {product.dimensions && product.storageRequirements && (
                  <span>|</span>
                )}
                {product.storageRequirements && (
                  <span>{getStorageText(product.storageRequirements)}</span>
                )}
              </div>
            )}

            {/* 第4行：价格 + 评分 */}
            <div className="flex items-center justify-between">
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-primary">
                  ¥{product.price}
                </span>
                {product.unit && product.unit !== "个" && (
                  <span className="text-xs text-muted-foreground">
                    /{product.unit}
                  </span>
                )}
              </div>
              
              {product.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-warning fill-current" />
                  <span className="text-xs text-muted-foreground">{product.rating}</span>
                </div>
              )}
            </div>

            {/* 第5行：供应商 + 认证标识 */}
            <div className="flex items-center space-x-1">
              <Building2 className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {product.supplier.name}
              </span>
              {product.supplier.verified && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">
                  认证
                </Badge>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex space-x-2 w-full">
            <Button 
              variant={product.inStock ? "default" : "secondary"} 
              size="sm" 
              className="flex-1"
              disabled={!product.inStock}
            >
              <MessageCircle className="h-3 w-3" />
              {product.inStock ? "咨询询价" : "缺货"}
            </Button>
            
            {currentQuantity === 0 ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={(e) => handleAddToCart(e)}
                disabled={!product.inStock}
              >
                <Plus className="h-3 w-3" />
                加入货单
              </Button>
            ) : (
              <div className="flex-1 flex items-center space-x-1">
                <Button 
                  variant="outline" 
                  size="icon-sm"
                  onClick={(e) => handleDecreaseQuantity(e)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="flex-1 text-center text-sm font-medium">
                  {currentQuantity}
                </div>
                <Button 
                  variant="outline" 
                  size="icon-sm"
                  onClick={(e) => handleAddToCart(e)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  }

  // List模式（条状简版）
  return (
    <Card 
      className="group hover:shadow-card transition-all duration-200 overflow-hidden cursor-pointer" 
      onClick={handleCardClick}
    >
      <div className="p-3 sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          {/* 商品图片 - 小尺寸 */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 overflow-hidden rounded bg-muted">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                <Package2 className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* 主要信息区域 */}
          <div className="flex-1 min-w-0">
            {/* 第一行：商品名称 + 价格 */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors flex-1">
                {product.name}
                {product.sku && (
                  <span className="text-xs text-muted-foreground font-normal ml-1 hidden sm:inline">
                    • {product.sku.trim()}
                  </span>
                )}
              </h3>
              <div className="text-right flex-shrink-0">
                <div className="flex items-baseline space-x-1">
                  <span className="text-base sm:text-lg font-bold text-primary">
                    ¥{product.price}
                  </span>
                  {product.unit && product.unit !== "个" && (
                    <span className="text-xs text-muted-foreground">
                      /{product.unit}
                    </span>
                  )}
                </div>
                {product.rating && (
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <Star className="h-3 w-3 text-warning fill-current" />
                    <span className="text-xs text-muted-foreground">{product.rating}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 第二行：规格 + 标签（桌面端） */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                {product.specifications && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {product.specifications.trim()}
                  </p>
                )}
              </div>
              <div className="hidden sm:flex gap-1 flex-shrink-0">
                {product.subcategory && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {product.subcategory.trim()}
                  </Badge>
                )}
                {product.requiresColdChain && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-700">
                    <Snowflake className="h-2 w-2 mr-0.5" />
                    冷链
                  </Badge>
                )}
                {product.isFragile && (
                  <Badge variant="secondary" className="text-xs px-1 py-0 bg-red-100 text-red-700">
                    <AlertTriangle className="h-2 w-2 mr-0.5" />
                    易碎
                  </Badge>
                )}
              </div>
            </div>
            
            {/* 第三行：供应商信息 */}
            <div className="flex items-center space-x-1 mb-2">
              <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                {product.supplier.name}
              </span>
              {product.supplier.verified && (
                <Badge variant="secondary" className="h-4 px-1 text-xs flex-shrink-0">
                  认证
                </Badge>
              )}
            </div>

            {/* 移动端标签行 */}
            <div className="flex gap-1 mb-2 sm:hidden">
              {product.subcategory && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {product.subcategory.trim()}
                </Badge>
              )}
              {product.requiresColdChain && (
                <Badge variant="secondary" className="text-xs px-1 py-0 bg-blue-100 text-blue-700">
                  <Snowflake className="h-2 w-2 mr-0.5" />
                  冷链
                </Badge>
              )}
              {product.isFragile && (
                <Badge variant="secondary" className="text-xs px-1 py-0 bg-red-100 text-red-700">
                  <AlertTriangle className="h-2 w-2 mr-0.5" />
                  易碎
                </Badge>
              )}
            </div>

            {/* 最后一行：操作按钮 */}
            <div className="flex gap-1 sm:gap-2">
              <Button 
                variant={product.inStock ? "default" : "secondary"} 
                size="sm" 
                className="text-xs px-2 sm:px-3 flex-1"
                disabled={!product.inStock}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                询价
              </Button>
              
              {currentQuantity === 0 ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs px-2 sm:px-3 flex-1"
                  onClick={(e) => handleAddToCart(e)}
                  disabled={!product.inStock}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  加入货单
                </Button>
              ) : (
                <div className="flex items-center space-x-1 flex-1">
                  <Button 
                    variant="outline" 
                    size="icon-sm"
                    className="w-6 h-6 sm:w-8 sm:h-8"
                    onClick={(e) => handleDecreaseQuantity(e)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="text-center text-sm font-medium flex-1">
                    {currentQuantity} 件
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon-sm"
                    className="w-6 h-6 sm:w-8 sm:h-8"
                    onClick={(e) => handleAddToCart(e)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}