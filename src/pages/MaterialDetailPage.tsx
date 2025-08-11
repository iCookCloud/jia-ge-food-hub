import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMaterial } from "@/hooks/useMaterials";
import { Database } from "@/integrations/supabase/types";
import { globalErpService } from "@/services/globalErpService";
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
  ExternalLink
} from "lucide-react";

type VideoProductAssociation = Database['public']['Tables']['video_product_associations']['Row'];

const MaterialDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  
  const { data: video, isLoading, error } = useMaterial(id || "");

  // 暂时硬编码为空数组，后续可以实现推荐算法
  const relatedVideos: any[] = [];

  const handleProductClick = async (association: VideoProductAssociation) => {
    if (!association.product_sku) {
      toast({
        title: "无法访问",
        description: "商品信息不完整",
        variant: "destructive"
      });
      return;
    }

    setLoadingProductId(association.id);

    try {
      // 通过SKU查找Global ERP商品
      const product = await globalErpService.fetchProductBySku(association.product_sku);
      
      if (product) {
        // 商品存在，跳转到商品详情页
        navigate(`/products/${product.id}`);
      } else {
        // 商品未找到，显示提示
        toast({
          title: "商品已下架",
          description: `商品 ${association.product_name} (${association.product_sku}) 在当前目录中不可用`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast({
        title: "加载失败",
        description: "无法加载商品信息，请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleShare = async () => {
    if (!video) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "链接已复制",
          description: "视频链接已复制到剪贴板",
        });
      }
    } catch (error) {
      console.error('分享失败:', error);
    }
  };


  const getCategoryBadge = (category: string) => {
    const colors = {
      "产品介绍": "bg-primary text-primary-foreground",
      "操作教程": "bg-success text-success-foreground",
      "客户案例": "bg-brand-orange text-white"
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

  if (error || !video) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">视频未找到</h1>
            <p className="text-muted-foreground mb-4">
              {error ? "加载视频时出错" : "请求的视频不存在"}
            </p>
            <Link to="/materials">
              <Button>返回视频列表</Button>
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
              <span className="hidden sm:inline">返回视频列表</span>
              <span className="sm:hidden">返回</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Video Player */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://customer-fn1cto1c4empk25m.cloudflarestream.com/${video.cloudflare_video_id}/iframe`}
                    className="w-full h-full border-none"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    title={video.title}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Video Info */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                {/* Category and Duration */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(video.category || "产品介绍")}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : "0:17"}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-3 leading-tight">
                  {video.title}
                </h1>

                {/* Stats - Split into two rows on mobile */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {video.views || 0} 观看
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {video.created_at ? new Date(video.created_at).toLocaleDateString('zh-CN') : "8/7/2025"}
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
                      <span className="ml-1">{(video.likes || 0) + (isLiked ? 1 : 0)}</span>
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
                {video.supplier_id && (
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
                    <Link to={`/supplier/${video.supplier_id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        查看
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="font-semibold">视频介绍</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {video.description || "暂无描述"}
                  </p>
                  
                  {/* Tags - 暂时隐藏，因为数据库中没有tags字段 */}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Related Products */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  关联商品
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {video.video_product_associations?.length > 0 ? (
                  video.video_product_associations.map((association: VideoProductAssociation, index: number) => (
                    <button
                      key={association.id || index}
                      className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleProductClick(association)}
                      disabled={loadingProductId === association.id || !association.product_sku}
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-medium text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {association.product_name || association.product_snapshot?.standard_chinese_name || "未知商品"}
                        </h4>
                        <p className="text-primary font-semibold text-sm">
                          ¥{association.product_snapshot?.price || "未知"}
                        </p>
                        {association.product_sku && (
                          <p className="text-xs text-muted-foreground">SKU: {association.product_sku}</p>
                        )}
                      </div>
                      {loadingProductId === association.id && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      )}
                      {association.product_sku && loadingProductId !== association.id && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs sm:text-sm text-center py-4">
                    暂无关联商品
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Related Videos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  相关视频
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {relatedVideos.length > 0 ? (
                  relatedVideos.map((relatedVideo: any) => (
                    <Link key={relatedVideo.id} to={`/materials/${relatedVideo.id}`}>
                      <div className="flex gap-2 sm:gap-3 group hover:bg-muted p-2 rounded-lg transition-colors">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={relatedVideo.thumbnail} 
                            alt={relatedVideo.title}
                            className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 text-xs rounded">
                            {relatedVideo.duration}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {relatedVideo.views} 观看
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground text-xs sm:text-sm text-center py-4">
                    暂无相关视频
                  </p>
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