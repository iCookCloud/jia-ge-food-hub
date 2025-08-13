// 商品供应商信息展示组件
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Package, 
  Truck,
  Shield,
  MessageCircle,
  ExternalLink,
  Award,
  Users,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supplierService, SupplierProfile, RatingInfo } from '@/services/supplierService';
import { toast } from '@/hooks/use-toast';

interface ProductSupplierInfoProps {
  supplierId?: string;
  productId?: string;
  showTitle?: boolean;
  compact?: boolean;
}

interface RatingDisplayProps {
  ratingInfo: RatingInfo;
  compact?: boolean;
}

interface ContactMethodsProps {
  contactInfo: any;
  compact?: boolean;
  onContact?: (method: string) => void;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({ ratingInfo, compact = false }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index}
        className={`h-3 w-3 ${
          index < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {renderStars(ratingInfo.overall_rating)}
        </div>
        <span className="text-sm font-medium">{ratingInfo.overall_rating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">
          ({ratingInfo.total_reviews}评价)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">综合评分</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {renderStars(ratingInfo.overall_rating)}
          </div>
          <span className="text-lg font-bold">{ratingInfo.overall_rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">配送速度:</span>
          <div className="flex items-center gap-1">
            {renderStars(ratingInfo.delivery_rating)}
            <span className="ml-1">{ratingInfo.delivery_rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">商品质量:</span>
          <div className="flex items-center gap-1">
            {renderStars(ratingInfo.quality_rating)}
            <span className="ml-1">{ratingInfo.quality_rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">服务态度:</span>
          <div className="flex items-center gap-1">
            {renderStars(ratingInfo.service_rating)}
            <span className="ml-1">{ratingInfo.service_rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>总评价数: {ratingInfo.total_reviews}</span>
        <span>近期订单: {ratingInfo.recent_orders}</span>
      </div>
    </div>
  );
};

const ContactMethods: React.FC<ContactMethodsProps> = ({ 
  contactInfo, 
  compact = false,
  onContact 
}) => {
  const handleContact = (method: string, value?: string) => {
    onContact?.(method);
    
    if (method === 'phone' && value) {
      window.open(`tel:${value}`);
    } else if (method === 'email' && value) {
      window.open(`mailto:${value}`);
    } else {
      toast({
        title: "联系供应商",
        description: `将通过${method}方式联系供应商`,
      });
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        {contactInfo?.phone && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleContact('phone', contactInfo.phone)}
            className="flex-1"
          >
            <Phone className="h-3 w-3 mr-1" />
            <span className="hidden sm:inline">电话</span>
            <span className="sm:hidden">拨打</span>
          </Button>
        )}
        <Button 
          size="sm"
          onClick={() => handleContact('message')}
          className="flex-1"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">在线咨询</span>
          <span className="sm:hidden">咨询</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">联系方式</h4>
      
      <div className="space-y-2">
        {contactInfo?.contact_person && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">联系人:</span>
            <span>{contactInfo.contact_person}</span>
          </div>
        )}
        
        {contactInfo?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">电话:</span>
            <span>{contactInfo.phone}</span>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleContact('phone', contactInfo.phone)}
            >
              拨打
            </Button>
          </div>
        )}
        
        {contactInfo?.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">邮箱:</span>
            <span className="truncate">{contactInfo.email}</span>
          </div>
        )}
        
        {contactInfo?.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">地址:</span>
            <span className="flex-1">{contactInfo.address}</span>
          </div>
        )}
        
        {contactInfo?.business_hours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">营业时间:</span>
            <span>{contactInfo.business_hours}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          size="sm" 
          className="flex-1"
          onClick={() => handleContact('message')}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          在线咨询
        </Button>
        {contactInfo?.phone && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleContact('phone', contactInfo.phone)}
          >
            <Phone className="h-4 w-4 mr-2" />
            拨打电话
          </Button>
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductSupplierInfo: React.FC<ProductSupplierInfoProps> = ({
  supplierId,
  productId,
  showTitle = true,
  compact = false
}) => {
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const loadData = async () => {
      if (!supplierId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);

        const supplierData = await supplierService.fetchSupplierById(supplierId);
        
        if (!cancelled) {
          setSupplier(supplierData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load supplier info:', err);
          setError('加载供应商信息失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      cancelled = true;
    };
  }, [supplierId]);


  const handleContact = (method: string) => {
    console.log('Contact supplier:', supplierId, 'via', method, 'for product:', productId);
    // 这里可以记录用户行为，用于统计和优化
  };

  if (loading) {
    return <LoadingSkeleton compact={compact} />;
  }

  if (error || !supplier) {
    return (
      <Card className="text-center p-6">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">
          {error || '供应商信息不可用'}
        </p>
        {error && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSupplierInfo}
            className="mt-2"
          >
            重新加载
          </Button>
        )}
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src="" alt={supplier.name} />
              <AvatarFallback>
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{supplier.name}</h4>
                {supplier.quality_certifications && supplier.quality_certifications.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    认证
                  </Badge>
                )}
              </div>
              
              {supplier.rating_info && (
                <RatingDisplay ratingInfo={supplier.rating_info} compact />
              )}
            </div>
            
            <div className="flex-shrink-0">
              <Link to={`/suppliers/${supplier.id}`}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  详情
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <ContactMethods 
              contactInfo={supplier.contact_info}
              compact
              onContact={handleContact}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            供应商信息
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="space-y-6">
        {/* 供应商基本信息 */}
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src="" alt={supplier.name} />
            <AvatarFallback>
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{supplier.name}</h3>
              <Badge variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                已认证
              </Badge>
            </div>
            
            {supplier.business_license && (
              <p className="text-sm text-muted-foreground mb-2">
                营业执照: {supplier.business_license}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {supplier.service_areas && supplier.service_areas.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  服务 {supplier.service_areas.length} 个区域
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(supplier.created_at).getFullYear()} 年加入
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <Link to={`/suppliers/${supplier.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看详情
              </Button>
            </Link>
          </div>
        </div>

        <Separator />

        {/* 认证信息 */}
        {supplier.quality_certifications && supplier.quality_certifications.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              质量认证
            </h4>
            <div className="flex flex-wrap gap-2">
              {supplier.quality_certifications.map((cert, index) => (
                <Badge key={index} variant="secondary">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 评分信息 */}
        {supplier.rating_info && (
          <div>
            <RatingDisplay ratingInfo={supplier.rating_info} />
          </div>
        )}

        <Separator />

        {/* 配送信息 */}
        {supplier.delivery_info && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              配送信息
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">交货期:</span>
                <span className="ml-2">{supplier.delivery_info.lead_time} 天</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">最小起订:</span>
                <span className="ml-2">{supplier.delivery_info.minimum_order} 件</span>
              </div>
              
              <div>
                <span className="text-muted-foreground">配送费:</span>
                <span className="ml-2">¥{supplier.delivery_info.shipping_cost}</span>
              </div>
              
              {supplier.delivery_info.free_shipping_threshold && (
                <div>
                  <span className="text-muted-foreground">包邮门槛:</span>
                  <span className="ml-2">¥{supplier.delivery_info.free_shipping_threshold}</span>
                </div>
              )}
            </div>
            
            {supplier.delivery_info.regions && supplier.delivery_info.regions.length > 0 && (
              <div>
                <span className="text-muted-foreground text-sm">配送区域:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {supplier.delivery_info.regions.slice(0, 5).map((region, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {region}
                    </Badge>
                  ))}
                  {supplier.delivery_info.regions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{supplier.delivery_info.regions.length - 5}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* 联系方式 */}
        <ContactMethods 
          contactInfo={supplier.contact_info}
          onContact={handleContact}
        />
      </CardContent>
    </Card>
  );
};

export default ProductSupplierInfo;