import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MessageCircle, Star, Plus, Minus } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    image?: string;
    price: string;
    unit: string;
    specifications?: string;
    supplier: {
      name: string;
      verified: boolean;
    };
    rating?: number;
    inStock: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, getItemQuantity } = useCart();
  const currentQuantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
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

  const handleDecreaseQuantity = () => {
    if (currentQuantity > 0) {
      updateQuantity(product.id, currentQuantity - 1);
    }
  };
  return (
    <Card className="group hover:shadow-card transition-all duration-200 hover:scale-[1.02] overflow-hidden">
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
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {product.specifications && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {product.specifications}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-bold text-primary">
                  ¥{product.price}
                </span>
                <span className="text-xs text-muted-foreground">
                  /{product.unit}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              {product.rating && (
                <>
                  <Star className="h-3 w-3 text-warning fill-current" />
                  <span className="text-xs text-muted-foreground">{product.rating}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
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
              onClick={handleAddToCart}
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
                onClick={handleDecreaseQuantity}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="flex-1 text-center text-sm font-medium">
                {currentQuantity}
              </div>
              <Button 
                variant="outline" 
                size="icon-sm"
                onClick={handleAddToCart}
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