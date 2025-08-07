import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMaterial } from "@/hooks/useMaterials";
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
  Download,
  ExternalLink
} from "lucide-react";

const MaterialDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  
  const { data: video, isLoading, error } = useMaterial(id || "");

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
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-4">
          <Link to="/materials">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回视频列表
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Content */}
          <div className="lg:col-span-2 space-y-6">
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
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge(video.category || "产品介绍")}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : "未知"}
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      {video.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {video.views || 0} 观看
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {video.created_at ? new Date(video.created_at).toLocaleDateString() : "未知"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                      {(video.likes || 0) + (isLiked ? 1 : 0)}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      分享
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      下载
                    </Button>
                  </div>
                </div>

                {/* Supplier Info */}
                {video.supplier_id && (
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">供应商</h3>
                      <p className="text-sm text-muted-foreground">
                        专业食材供应商
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/supplier/${video.supplier_id}`}>
                        <Button variant="outline" size="sm">
                          <User className="w-4 h-4 mr-2" />
                          查看主页
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="font-semibold">视频介绍</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {video.description || "暂无描述"}
                  </p>
                  
                  {/* Tags - 暂时隐藏，因为数据库中没有tags字段 */}
                  
                  {/* Related Products - 通过关联表获取 */}
                  {video.video_product_associations?.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">相关商品</h4>
                      <div className="space-y-2">
                        {video.video_product_associations.map((association: any) => (
                          <Link key={association.product_id} to={`/products/${association.product_id}`}>
                            <div className="flex items-center justify-between p-2 rounded border hover:bg-background transition-colors">
                              <span className="font-medium">
                                {association.products?.standard_chinese_name || association.products?.standard_english_name || "未知商品"}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                价格: ¥{association.products?.unit_price || "未知"}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  关联商品
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {video.video_product_associations?.length > 0 ? (
                  video.video_product_associations.map((association: any) => (
                    <Link key={association.product_id} to={`/products/${association.product_id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group">
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {association.products?.standard_chinese_name || association.products?.standard_english_name || "未知商品"}
                          </h4>
                          <p className="text-primary font-semibold">¥{association.products?.unit_price || "未知"}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    暂无关联商品
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Related Videos - 暂时隐藏，后续可以实现推荐算法 */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MaterialDetailPage;