import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMaterial } from "@/hooks/useMaterials";
import { MaterialViewer } from "@/components/material/MaterialViewer";
import { ProductList } from "@/components/material/ProductCard";
import { useCart } from "@/hooks/useCart";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play,
  Clock,
  User,
  Eye,
  Calendar,
  Package,
  ArrowLeft,
  Share2,
  Heart,
  ExternalLink,
  Video,
  Image as ImageIcon,
  Tag,
  FileImage,
  ShoppingCart
} from "lucide-react";

// 统一的素材数据类型
interface MaterialDetailItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  type: 'video' | 'image';
  
  // 视频特有属性
  cloudflare_video_id?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  
  // 图片特有属性
  public_url?: string;
  images?: string[];
  
  // 统计信息
  views?: number;
  likes?: number;
  shares?: number;
  
  // 关联数据
  video_product_associations?: VideoProductAssociation[];
  image_product_associations?: ImageProductAssociation[];
  
  // 其他属性
  supplier_id?: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

type VideoProductAssociation = Database['public']['Tables']['video_product_associations']['Row'];
type ImageProductAssociation = Database['public']['Tables']['image_product_associations']['Row'];

const MaterialDetailPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [isLiked, setIsLiked] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialDetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取素材详情数据
  useEffect(() => {
    const fetchMaterialDetail = async () => {
      if (!id || !type) return;
      
      setIsLoading(true);
      setError(null);

      try {
        let materialData: MaterialDetailItem | null = null;

        if (type === 'video') {
          // 查询视频数据
          const { data, error } = await supabase
            .from('product_videos')
            .select(`
              *,
              video_product_associations (
                id,
                original_product_id,
                product_sku,
                product_name,
                recommended_quantity,
                quantity_note,
                product_snapshot
              )
            `)
            .eq('id', id)
            .eq('is_active', true)
            .single();

          if (data && !error) {
            materialData = {
              ...data,
              type: 'video' as const,
              video_product_associations: data.video_product_associations || []
            };
          } else {
            setError('视频未找到');
            return;
          }
        } else if (type === 'image') {
          // 查询图片数据
          const { data, error } = await supabase
            .from('uploaded_images')
            .select(`
              *,
              image_product_associations (
                id,
                original_product_id,
                product_sku,
                product_name,
                recommended_quantity,
                quantity_note,
                product_snapshot
              )
            `)
            .eq('id', id)
            .eq('is_active', true)
            .single();

          if (data && !error) {
            // 处理多图数据
            let images: string[] = [];
            
            // 如果有 images_data，使用多图数据
            if (data.images_data && data.images_data.images && Array.isArray(data.images_data.images)) {
              images = data.images_data.images.map((img: any) => img.public_url).filter(Boolean);
            }
            
            // 如果没有多图数据，使用单图数据作为后备
            if (images.length === 0 && data.public_url) {
              images = [data.public_url];
            }
            
            materialData = {
              ...data,
              type: 'image' as const,
              images: images,
              image_product_associations: data.image_product_associations || []
            };
          } else {
            setError('图片未找到');
            return;
          }
        } else {
          setError('无效的素材类型');
          return;
        }

        setMaterial(materialData);
      } catch (err) {
        console.error('Failed to fetch material:', err);
        setError('加载素材时出错');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterialDetail();
  }, [type, id]);

  // 暂时硬编码为空数组，后续可以实现推荐算法
  const relatedMaterials: MaterialDetailItem[] = [];

  // 获取统一的关联商品数据
  const getProductAssociations = () => {
    if (!material) return [];
    
    if (material.type === 'video' && material.video_product_associations) {
      return material.video_product_associations;
    }
    
    if (material.type === 'image' && material.image_product_associations) {
      return material.image_product_associations;
    }
    
    return [];
  };

  const handleProductClick = async (association: VideoProductAssociation | ImageProductAssociation) => {
    if (!association.original_product_id) {
      toast({
        title: "无法访问",
        description: "商品信息不完整",
        variant: "destructive"
      });
      return;
    }

    setLoadingProductId(association.id);

    try {
      // 直接使用 original_product_id 跳转到本地商品详情页
      navigate(`/products/${association.original_product_id}`);
    } catch (error) {
      console.error('Failed to navigate to product:', error);
      toast({
        title: "访问失败",
        description: "无法访问商品详情页",
        variant: "destructive"
      });
    } finally {
      setLoadingProductId(null);
    }
  };

  // 添加到购物车功能
  const handleAddToCart = async (association: VideoProductAssociation | ImageProductAssociation, quantity: number) => {
    setLoadingProductId(association.id);

    try {
      // 优先使用快照中的展示字段，确保名称/图片/价格/规格正确
      const snap: any = (association as any).product_snapshot || {};
      const nameFromSnapshot = snap.standard_chinese_name || snap.standard_english_name || association.product_name;
      const priceFromSnapshot = typeof snap.price === 'number' ? String(snap.price) : (snap.price ?? '0');
      const imageFromSnapshot = snap.main_image_url || '';
      const specFromSnapshot = snap.specification || association.product_sku || '';
      const unitFromSnapshot = snap.unit || '件';
      const vendorFromSnapshot = snap.vendor || 'iCook';

      const cartItem = {
        id: association.original_product_id || association.id,
        name: nameFromSnapshot || '未知商品',
        price: priceFromSnapshot || '0',
        unit: unitFromSnapshot,
        image: imageFromSnapshot,
        specifications: specFromSnapshot,
        supplier: {
          name: vendorFromSnapshot,
          verified: true
        }
      };

      // 使用传入的数量添加到购物车
      addItem(cartItem, quantity);
      
      toast({
        title: "添加成功",
        description: `${association.product_name} × ${quantity} 已添加到购物车`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: "添加失败",
        description: "无法添加到购物车，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoadingProductId(null);
    }
  };

  // 批量添加到购物车功能
  const handleAddAllToCart = async (associations: (VideoProductAssociation | ImageProductAssociation)[]) => {
    try {
      let successCount = 0;
      let failCount = 0;

      for (const association of associations) {
        try {
          // 优先使用快照中的展示字段
          const snap: any = (association as any).product_snapshot || {};
          const nameFromSnapshot = snap.standard_chinese_name || snap.standard_english_name || association.product_name;
          const priceFromSnapshot = typeof snap.price === 'number' ? String(snap.price) : (snap.price ?? '0');
          const imageFromSnapshot = snap.main_image_url || '';
          const specFromSnapshot = snap.specification || association.product_sku || '';
          const unitFromSnapshot = snap.unit || '件';
          const vendorFromSnapshot = snap.vendor || 'iCook';

          const cartItem = {
            id: association.original_product_id || association.id,
            name: nameFromSnapshot || '未知商品',
            price: priceFromSnapshot || '0',
            unit: unitFromSnapshot,
            image: imageFromSnapshot,
            specifications: specFromSnapshot,
            supplier: {
              name: vendorFromSnapshot,
              verified: true
            }
          };

          // 使用推荐数量添加到购物车
          const recommendedQuantity = (association as any).recommended_quantity || 1;
          addItem(cartItem, recommendedQuantity);
          successCount++;
        } catch (error) {
          console.error(`Failed to add ${association.product_name} to cart:`, error);
          failCount++;
        }
      }

      // 显示批量添加结果
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "批量添加成功",
          description: `成功添加 ${successCount} 个商品到购物车`,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "部分添加成功",
          description: `成功添加 ${successCount} 个商品，失败 ${failCount} 个`,
          variant: "default"
        });
      } else {
        toast({
          title: "批量添加失败",
          description: `所有商品添加失败，请稍后重试`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to batch add to cart:', error);
      toast({
        title: "批量添加失败",
        description: "批量添加过程中发生错误，请稍后重试",
        variant: "destructive"
      });
    }
  };


  const handleShare = async () => {
    if (!material) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: material.title,
          text: material.description || material.content,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "链接已复制",
          description: "素材链接已复制到剪贴板",
        });
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };


  const getCategoryBadge = (category: string) => {
    const colors = {
      // 视频分类
      "产品介绍": "bg-primary text-primary-foreground",
      "操作教程": "bg-success text-success-foreground",
      "客户案例": "bg-brand-orange text-white",
      "行业资讯": "bg-purple-500 text-white",
      "工艺展示": "bg-blue-500 text-white",
      "质量检测": "bg-green-600 text-white",
      // 图片分类
      "产品展示": "bg-primary text-primary-foreground",
      "使用场景": "bg-indigo-500 text-white",
      "生产工艺": "bg-orange-500 text-white",
      "质量检验": "bg-green-600 text-white",
      "包装运输": "bg-gray-600 text-white",
      "展会活动": "bg-pink-500 text-white"
    };
    return <Badge className={colors[category] || "bg-muted"}>{category}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !material) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">素材未找到</h1>
            <p className="text-muted-foreground mb-4">
              {error || "请求的素材不存在"}
            </p>
            <Link to="/materials">
              <Button>返回素材中心</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link to="/materials">
            <Button variant="ghost" size="sm" className="h-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">返回素材中心</span>
              <span className="sm:hidden">返回</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Main Material Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Material Viewer */}
            <MaterialViewer material={material} />

            {/* Material Info */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                {/* Category and Type Info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(material.category || (material.type === 'video' ? "产品介绍" : "产品展示"))}
                    
                    {/* Type Badge */}
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {material.type === 'video' ? (
                        <>
                          <Video className="w-3 h-3" />
                          视频
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3" />
                          图片
                        </>
                      )}
                    </Badge>

                    {/* Duration for videos */}
                    {material.type === 'video' && material.duration_seconds && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {Math.floor(material.duration_seconds / 60)}:{(material.duration_seconds % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3 leading-tight">
                  {material.title}
                </h1>

                {/* Stats - Split into two rows on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {material.views || 0} 观看
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {material.created_at ? new Date(material.created_at).toLocaleDateString('zh-CN') : "未知时间"}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                      <span className="hidden sm:inline">喜欢</span>
                      <span className="ml-1">{(material.likes || 0) + (isLiked ? 1 : 0)}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3" 
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">分享</span>
                    </Button>
                  </div>
                </div>

                {/* Supplier Info */}
                {material.supplier_id && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4 hover:bg-muted/80 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">供应商</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        专业食材供应商
                      </p>
                    </div>
                    <Link to={`/supplier/${material.supplier_id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        查看
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Description and Content */}
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    {material.type === 'video' ? '视频介绍' : '图片说明'}
                  </h3>
                  
                  {/* Description */}
                  {material.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {material.description}
                    </p>
                  )}
                  
                  {/* Content */}
                  {material.content && (
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-2">详细说明</h4>
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {material.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {material.tags && material.tags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        标签
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {material.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Related Products - Enhanced Design */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Package className="w-5 h-5 mr-2" />
                    关联商品
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {getProductAssociations().length} 个商品
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {material.type === 'video' ? '视频中展示的相关商品' : '图片中展示的相关商品'}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <ProductList
                  associations={getProductAssociations()}
                  onProductClick={handleProductClick}
                  onAddToCart={handleAddToCart}
                  onAddAllToCart={handleAddAllToCart}
                  loadingProductId={loadingProductId}
                  showQuantityControls={true}
                  isAdminMode={false}
                />
              </CardContent>
            </Card>

            {/* Related Materials - 改为通用的相关素材 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <FileImage className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  相关素材
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {relatedMaterials.length > 0 ? (
                  relatedMaterials.map((relatedMaterial: MaterialDetailItem) => (
                    <Link key={relatedMaterial.id} to={`/materials/${relatedMaterial.type}/${relatedMaterial.id}`}>
                      <div className="flex gap-2 sm:gap-3 group hover:bg-muted p-2 rounded-lg transition-colors">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={relatedMaterial.type === 'video' ? relatedMaterial.thumbnail_url : relatedMaterial.public_url} 
                            alt={relatedMaterial.title}
                            className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {relatedMaterial.type === 'video' ? (
                              <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            ) : (
                              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            )}
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 text-xs rounded">
                            {relatedMaterial.type === 'video' ? (
                              relatedMaterial.duration_seconds ? 
                                `${Math.floor(relatedMaterial.duration_seconds / 60)}:${(relatedMaterial.duration_seconds % 60).toString().padStart(2, '0')}` :
                                relatedMaterial.duration || '视频'
                            ) : (
                              '图片'
                            )}
                          </div>
                          {/* 类型标识 */}
                          <div className="absolute top-1 left-1">
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              {relatedMaterial.type === 'video' ? '视频' : '图片'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedMaterial.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {relatedMaterial.views || 0} 观看
                          </p>
                          {/* 分类显示 */}
                          {relatedMaterial.category && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {relatedMaterial.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileImage className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">暂无相关素材</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MaterialDetailPage;