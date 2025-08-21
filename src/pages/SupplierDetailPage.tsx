import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
  ArrowLeft,
  Award,
  Users,
  Calendar,
  CheckCircle,
  ExternalLink,
  Store,
  Heart,
  Share2
} from "lucide-react";
import { supplierService, SupplierProfile, SupplierRating } from "@/services/supplierService";
import { globalErpService } from "@/services/globalErpService";
import { ProductCard } from "@/components/product/ProductCard";
import { toast } from "@/hooks/use-toast";

interface ProductItem {
  id: string;
  name: string;
  image?: string;
  price: string;
  unit: string;
  specifications?: string;
  sku?: string;
  subcategory?: string;
  supplier: {
    name: string;
    verified: boolean;
  };
  inStock: boolean;
  user_id?: string; // 添加商品上传者ID
}

const SupplierDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [ratings, setRatings] = useState<SupplierRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    if (id) {
      loadSupplierDetail();
      loadSupplierProducts();
      loadSupplierRatings();
    }
  }, [id]);

  const loadSupplierDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const supplierData = await supplierService.fetchSupplierById(id);
      setSupplier(supplierData);
    } catch (err) {
      console.error('Failed to load supplier:', err);
      setError('加载供应商信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierProducts = async () => {
    if (!id) return;

    try {
      setProductsLoading(true);
      
      // 简化处理：通过 ERP 服务获取该供应商的商品
      const { data: productsData } = await globalErpService.fetchProducts(
        { supplier_id: id },
        { limit: 20 }
      );

      // 转换数据格式以匹配 ProductCard 组件
      const transformedProducts: ProductItem[] = productsData.map(product => ({
        id: product.id,
        name: product.standard_chinese_name || product.standard_english_name || product.sku,
        image: product.product_image,
        price: product.unit_price?.toString() || "0",
        unit: product.unit || "件",
        specifications: product.specifications,
        sku: product.sku,
        subcategory: product.subcategory,
        supplier: {
          name: supplier?.name || "未知供应商",
          verified: true
        },
        inStock: product.is_active || false,
        user_id: product.user_id // 添加商品上传者ID
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Failed to load supplier products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadSupplierRatings = async () => {
    if (!id) return;

    try {
      setRatingsLoading(true);
      
      const { data: ratingsData } = await supplierService.getSupplierRatings(id, 10);
      setRatings(ratingsData);
    } catch (err) {
      console.error('Failed to load supplier ratings:', err);
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleContact = (method: string) => {
    const contactInfo = supplier?.contact_info;
    
    if (method === 'phone' && contactInfo?.phone) {
      window.open(`tel:${contactInfo.phone}`);
    } else if (method === 'email' && contactInfo?.email) {
      window.open(`mailto:${contactInfo.email}`);
    } else {
      toast({
        title: "联系供应商",
        description: `将通过${method}方式联系供应商`,
      });
    }
  };

  const handleFollow = () => {
    setIsFollowed(!isFollowed);
    toast({
      title: isFollowed ? "已取消关注" : "已关注供应商",
      description: supplier?.name,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: supplier?.name,
        text: `查看供应商 ${supplier?.name} 的详细信息`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "链接已复制",
        description: "供应商详情页链接已复制到剪贴板",
      });
    }
  };

  const renderStars = (rating: number, size = 'sm') => {
    const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    
    return Array.from({ length: 5 }, (_, index) => (
      <Star 
        key={index}
        className={`${starSize} ${
          index < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded-lg"></div>
                <div className="h-48 bg-muted rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-muted rounded-lg"></div>
                <div className="h-32 bg-muted rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !supplier) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">供应商未找到</h1>
          <p className="text-muted-foreground mb-4">
            {error || "该供应商可能已停用或不存在"}
          </p>
          <Link to="/products">
            <Button>返回商品列表</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link to="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回商品列表
            </Button>
          </Link>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <span>供应商中心</span>
          <span>/</span>
          <span className="text-foreground">{supplier.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="" alt={supplier.name} />
                    <AvatarFallback>
                      <Building2 className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold">{supplier.name}</h1>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已认证
                      </Badge>
                      {supplier.quality_certifications && supplier.quality_certifications.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          资质认证
                        </Badge>
                      )}
                    </div>
                    
                    {supplier.business_license && (
                      <p className="text-sm text-muted-foreground mb-3">
                        营业执照: {supplier.business_license}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(supplier.created_at).getFullYear()} 年加入
                      </span>
                      {supplier.service_areas && supplier.service_areas.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          服务 {supplier.service_areas.length} 个区域
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {products.length} 个商品
                      </span>
                    </div>
                    
                    {/* Rating Display */}
                    {supplier.rating_info && (
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {renderStars(supplier.rating_info.overall_rating)}
                          </div>
                          <span className="text-lg font-bold">{supplier.rating_info.overall_rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({supplier.rating_info.total_reviews}评价)
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button onClick={() => handleContact('message')}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        在线咨询
                      </Button>
                      {supplier.contact_info?.phone && (
                        <Button 
                          variant="outline"
                          onClick={() => handleContact('phone')}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          拨打电话
                        </Button>
                      )}
                      <Button 
                        variant="ghost"
                        onClick={handleFollow}
                        className={isFollowed ? 'text-red-500' : ''}
                      >
                        <Heart className={`h-4 w-4 mr-2 ${isFollowed ? 'fill-current' : ''}`} />
                        {isFollowed ? '已关注' : '关注'}
                      </Button>
                      <Button variant="ghost" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Card>
              <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="products">供应商品</TabsTrigger>
                  <TabsTrigger value="about">企业信息</TabsTrigger>
                  <TabsTrigger value="reviews">客户评价</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">供应商品</h3>
                      <span className="text-sm text-muted-foreground">
                        共 {products.length} 个商品
                      </span>
                    </div>
                    
                    {productsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="animate-pulse bg-muted rounded-lg h-48"></div>
                        ))}
                      </div>
                    ) : products.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map(product => (
                          <Link key={product.id} to={`/products/${product.id}`}>
                            <ProductCard product={product} mode="list" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">该供应商暂无商品</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="about" className="p-6">
                  <div className="space-y-6">
                    {/* 服务区域 */}
                    {supplier.service_areas && supplier.service_areas.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          服务区域
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {supplier.service_areas.map((area, index) => (
                            <Badge key={index} variant="outline">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 产品类别 */}
                    {supplier.product_categories && supplier.product_categories.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          主营产品
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {supplier.product_categories.map((category, index) => (
                            <Badge key={index} variant="secondary">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 质量认证 */}
                    {supplier.quality_certifications && supplier.quality_certifications.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          质量认证
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {supplier.quality_certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="border-green-200 text-green-700">
                              <Shield className="h-3 w-3 mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 配送信息 */}
                    {supplier.delivery_info && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4 text-primary" />
                          配送服务
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="font-medium">{supplier.delivery_info.lead_time} 天</div>
                            <div className="text-muted-foreground">交货期</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="font-medium">{supplier.delivery_info.minimum_order} 件</div>
                            <div className="text-muted-foreground">最小起订</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="font-medium">¥{supplier.delivery_info.shipping_cost}</div>
                            <div className="text-muted-foreground">配送费</div>
                          </div>
                          {supplier.delivery_info.free_shipping_threshold && (
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <div className="font-medium">¥{supplier.delivery_info.free_shipping_threshold}</div>
                              <div className="text-muted-foreground">包邮门槛</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">客户评价</h3>
                      <span className="text-sm text-muted-foreground">
                        共 {ratings.length} 条评价
                      </span>
                    </div>

                    {ratingsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="animate-pulse bg-muted rounded-lg h-24"></div>
                        ))}
                      </div>
                    ) : ratings.length > 0 ? (
                      <div className="space-y-4">
                        {ratings.map(rating => (
                          <Card key={rating.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>
                                    <Users className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">用户评价</span>
                                    <div className="flex items-center gap-1">
                                      {renderStars(rating.rating)}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {new Date(rating.created_at).toLocaleDateString('zh-CN')}
                                    </span>
                                  </div>
                                  {rating.review && (
                                    <p className="text-sm text-foreground mb-2">{rating.review}</p>
                                  )}
                                  <div className="flex gap-4 text-xs text-muted-foreground">
                                    <span>配送: {rating.delivery_rating}/5</span>
                                    <span>质量: {rating.quality_rating}/5</span>
                                    <span>服务: {rating.service_rating}/5</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">暂无客户评价</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  联系方式
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.contact_info?.contact_person && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">联系人:</span>
                    <span>{supplier.contact_info.contact_person}</span>
                  </div>
                )}
                
                {supplier.contact_info?.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">电话:</span>
                    <span>{supplier.contact_info.phone}</span>
                  </div>
                )}
                
                {supplier.contact_info?.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">邮箱:</span>
                    <span className="truncate">{supplier.contact_info.email}</span>
                  </div>
                )}
                
                {supplier.contact_info?.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">地址:</span>
                    <span className="flex-1">{supplier.contact_info.address}</span>
                  </div>
                )}
                
                {supplier.contact_info?.business_hours && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">营业时间:</span>
                    <span>{supplier.contact_info.business_hours}</span>
                  </div>
                )}

                <Separator />
                
                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => handleContact('message')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    在线咨询
                  </Button>
                  {supplier.contact_info?.phone && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleContact('phone')}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      拨打电话
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>企业概况</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{products.length}</div>
                    <div className="text-xs text-muted-foreground">供应商品</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {supplier.rating_info?.overall_rating.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">综合评分</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {supplier.rating_info?.total_reviews || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">客户评价</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {new Date().getFullYear() - new Date(supplier.created_at).getFullYear()}
                    </div>
                    <div className="text-xs text-muted-foreground">经营年限</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SupplierDetailPage;