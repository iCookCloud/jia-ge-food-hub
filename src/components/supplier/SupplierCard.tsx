import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Star, MessageCircle, Eye } from "lucide-react";

interface SupplierCardProps {
  supplier: {
    id: string;
    name: string;
    logo?: string;
    description?: string;
    location: string;
    categories: string[];
    verified: boolean;
    rating?: number;
    productCount: number;
    hasAiChat: boolean;
  };
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <Card className="group hover:shadow-card transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            {supplier.logo ? (
              <img 
                src={supplier.logo} 
                alt={supplier.name}
                className="w-16 h-16 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {supplier.name}
                  </h3>
                  {supplier.verified && (
                    <Badge variant="default" className="h-5 text-xs">
                      认证供应商
                    </Badge>
                  )}
                  {supplier.hasAiChat && (
                    <Badge variant="secondary" className="h-5 text-xs bg-brand-orange text-white">
                      AI客服
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{supplier.location}</span>
                  </div>
                  
                  {supplier.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-warning fill-current" />
                      <span>{supplier.rating}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{supplier.productCount}个产品</span>
                  </div>
                </div>

                {supplier.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {supplier.description}
                  </p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1 mt-3">
              {supplier.categories.slice(0, 3).map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
              {supplier.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{supplier.categories.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0">
        <div className="flex space-x-2 w-full">
          <Button variant="outline" size="sm" className="flex-1">
            查看产品
          </Button>
          <Button 
            variant={supplier.hasAiChat ? "supplier" : "default"} 
            size="sm" 
            className="flex-1"
          >
            <MessageCircle className="h-3 w-3" />
            {supplier.hasAiChat ? "AI咨询" : "联系供应商"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}