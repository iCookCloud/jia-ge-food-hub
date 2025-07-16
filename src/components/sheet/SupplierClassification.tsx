import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Package, 
  Eye, 
  Star, 
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Users
} from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import { Link } from "react-router-dom";

interface SupplierClassificationProps {
  onSupplierSelect?: (supplierId: string) => void;
}

export const SupplierClassification = ({ 
  onSupplierSelect 
}: SupplierClassificationProps) => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // 模拟获取供应商统计数据
  const getSupplierStats = (supplierId: string) => {
    // 在实际应用中，这里应该从API获取真实数据
    return {
      totalSheets: Math.floor(Math.random() * 20) + 5,
      totalProducts: Math.floor(Math.random() * 100) + 20,
      totalOrders: Math.floor(Math.random() * 50) + 10,
      rating: (Math.random() * 2 + 3).toFixed(1) // 3.0 - 5.0
    };
  };

  const SupplierCard = ({ supplier }: { supplier: any }) => {
    const stats = getSupplierStats(supplier.id);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={supplier.profiles?.avatar_url} />
                <AvatarFallback>
                  {supplier.company_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {supplier.company_name}
                </CardTitle>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{supplier.contact_person}</span>
                </div>
              </div>
            </div>
            <Badge variant={supplier.verification_status === 'verified' ? 'default' : 'secondary'}>
              {supplier.verification_status === 'verified' ? '已认证' : '待认证'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 联系信息 */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{supplier.contact_phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{supplier.contact_email}</span>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {stats.totalSheets}
              </div>
              <div className="text-xs text-muted-foreground">货单数量</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {stats.totalProducts}
              </div>
              <div className="text-xs text-muted-foreground">商品数量</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">
                {stats.totalOrders}
              </div>
              <div className="text-xs text-muted-foreground">订单数量</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold">{stats.rating}</span>
              </div>
              <div className="text-xs text-muted-foreground">评分</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2 pt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onSupplierSelect?.(supplier.id)}
            >
              <Package className="h-4 w-4 mr-1" />
              查看货单
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <Link to={`/suppliers/${supplier.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                详情
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            供应商网络概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {suppliers.length}
              </div>
              <div className="text-sm text-muted-foreground">活跃供应商</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {suppliers.filter(s => s.verification_status === 'verified').length}
              </div>
              <div className="text-sm text-muted-foreground">已认证供应商</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {suppliers.length * 15}
              </div>
              <div className="text-sm text-muted-foreground">总货单数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {suppliers.length * 45}
              </div>
              <div className="text-sm text-muted-foreground">总商品数</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 供应商列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">供应商分类</h3>
          <Badge variant="outline">
            {suppliers.length} 个供应商
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              暂无供应商
            </h3>
            <p className="text-muted-foreground">
              系统中还没有认证的供应商
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};