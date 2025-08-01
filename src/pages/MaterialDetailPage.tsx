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

  // Mock video data for fallback
  const mockVideo = {
    id: id,
    title: "新鲜三文鱼片制作工艺展示",
    description: "详细展示挪威进口三文鱼的加工制作过程，从原料选择到最终包装，每一个环节都严格把控，确保产品的品质和新鲜度。本视频将带您了解专业的海鲜加工流程。",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "/src/assets/salmon-fillet.jpg",
    duration: "03:45",
    category: "产品介绍", 
    supplier: "海鲜直供",
    supplierLogo: "/src/assets/salmon-fillet.jpg",
    uploadDate: "2024-01-15",
    views: 1250,
    likes: 89,
    tags: ["海鲜", "三文鱼", "制作工艺", "挪威进口"],
    relatedProducts: [
      {
        id: "P001",
        name: "新鲜三文鱼片 挪威进口",
        price: "128.00",
        image: "/src/assets/salmon-fillet.jpg"
      },
      {
        id: "P005", 
        name: "三文鱼刺身级切片",
        price: "168.00",
        image: "/src/assets/salmon-fillet.jpg"
      }
    ]
  };

  const displayVideo = video || mockVideo;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: displayVideo.title,
          text: displayVideo.description,
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

  const relatedVideos = [
    {
      id: "V002",
      title: "火锅牛肉卷最佳涮制教程",
      thumbnail: "/src/assets/beef-rolls.jpg",
      duration: "05:20",
      views: 890
    },
    {
      id: "V004",
      title: "香料配比秘诀分享",
      thumbnail: "/src/assets/spice-set.jpg", 
      duration: "06:30",
      views: 1560
    }
  ];

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
                  <video
                    className="w-full h-full"
                    controls
                    poster={(displayVideo as any).thumbnail_url || (displayVideo as any).thumbnail}
                    preload="metadata"
                  >
                    <source src={(displayVideo as any).video_url || (displayVideo as any).videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </CardContent>
            </Card>

            {/* Video Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge((displayVideo as any).category || "产品介绍")}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {(displayVideo as any).duration_seconds ? `${Math.floor((displayVideo as any).duration_seconds / 60)}:${((displayVideo as any).duration_seconds % 60).toString().padStart(2, '0')}` : (displayVideo as any).duration}
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      {displayVideo.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {(displayVideo as any).views || 0} 观看
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {(displayVideo as any).created_at ? new Date((displayVideo as any).created_at).toLocaleDateString() : (displayVideo as any).uploadDate}
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
                      {((displayVideo as any).likes || 0) + (isLiked ? 1 : 0)}
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
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-4">
                  <img 
                    src={(displayVideo as any).supplierLogo || (displayVideo as any).supplier_credentials?.business_license || "/src/assets/salmon-fillet.jpg"} 
                    alt={(displayVideo as any).supplier_credentials?.company_name || (displayVideo as any).supplier}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{(displayVideo as any).supplier_credentials?.company_name || (displayVideo as any).supplier}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(displayVideo as any).supplier_credentials?.verification_status === 'verified' ? '已认证供应商' : '专业食材供应商'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/supplier/${(displayVideo as any).supplier_id || (displayVideo as any).supplier}`}>
                      <Button variant="outline" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        查看主页
                      </Button>
                    </Link>
                    {(displayVideo as any).supplier_credentials?.contact_email && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${(displayVideo as any).supplier_credentials.contact_email}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          联系
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="font-semibold">视频介绍</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {displayVideo.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {((displayVideo as any).tags || []).map((tag: string) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Related Products */}
                  {(displayVideo as any).relatedProducts?.length > 0 && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">相关商品</h4>
                      <div className="space-y-2">
                        {(displayVideo as any).relatedProducts.map((product: any) => (
                          <Link key={product.id} to={`/products/${product.id}`}>
                            <div className="flex items-center justify-between p-2 rounded border hover:bg-background transition-colors">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-sm text-muted-foreground">价格: ¥{product.price}</span>
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
                {((displayVideo as any).relatedProducts || []).map((product: any) => (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors group">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {product.name}
                        </h4>
                        <p className="text-primary font-semibold">¥{product.price}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Related Videos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  相关视频
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedVideos.map(relatedVideo => (
                  <Link key={relatedVideo.id} to={`/materials/${relatedVideo.id}`}>
                    <div className="flex gap-3 group hover:bg-muted p-2 rounded-lg transition-colors">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={relatedVideo.thumbnail} 
                          alt={relatedVideo.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1 text-xs rounded">
                          {relatedVideo.duration}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedVideo.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {relatedVideo.views} 观看
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MaterialDetailPage;