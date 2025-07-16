import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Video, 
  Play,
  Clock,
  User,
  Search,
  Filter,
  Eye,
  Plus,
  TrendingUp,
  BarChart
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMaterials } from "@/hooks/useMaterials";
import { useAuth } from "@/hooks/useAuth";

// Mock video data for fallback
const mockVideos = [
  {
    id: "V001",
    title: "新鲜三文鱼片制作工艺展示",
    description: "详细展示挪威进口三文鱼的加工制作过程，确保品质和新鲜度",
    thumbnail: "/src/assets/salmon-fillet.jpg",
    duration: "03:45",
    category: "产品介绍",
    supplier: "海鲜直供",
    uploadDate: "2024-01-15",
    views: 1250,
    relatedProducts: ["新鲜三文鱼片 挪威进口"],
    tags: ["海鲜", "三文鱼", "制作工艺"]
  },
  {
    id: "V002", 
    title: "火锅牛肉卷最佳涮制教程",
    description: "专业大厨教你如何涮制完美的牛肉卷，掌握火候和时间",
    thumbnail: "/src/assets/beef-rolls.jpg", 
    duration: "05:20",
    category: "操作教程",
    supplier: "优质肉类",
    uploadDate: "2024-01-12",
    views: 890,
    relatedProducts: ["优质牛肉卷 火锅专用"],
    tags: ["牛肉", "火锅", "教程"]
  },
  {
    id: "V003",
    title: "绿色有机蔬菜种植基地实地探访",
    description: "走进有机蔬菜种植基地，了解从种子到餐桌的全过程",
    thumbnail: "/src/assets/vegetable-platter.jpg",
    duration: "08:15", 
    category: "客户案例",
    supplier: "绿色农场",
    uploadDate: "2024-01-10",
    views: 2100,
    relatedProducts: ["有机蔬菜拼盘"],
    tags: ["有机", "蔬菜", "种植"]
  },
  {
    id: "V004",
    title: "香料配比秘诀分享",
    description: "资深调料师分享多年经验，教你调配出完美的香料比例",
    thumbnail: "/src/assets/spice-set.jpg",
    duration: "06:30",
    category: "操作教程", 
    supplier: "香料专家",
    uploadDate: "2024-01-08",
    views: 1560,
    relatedProducts: ["精选香料套装"],
    tags: ["香料", "调料", "配比"]
  }
];

const MaterialsPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("全部");
  const [activeTab, setActiveTab] = useState("all");

  const categories = ["全部", "产品介绍", "操作教程", "客户案例", "行业资讯"];
  
  const filters = {
    search: searchTerm,
    category: selectedCategory === "全部" ? undefined : selectedCategory,
    supplier: selectedSupplier === "全部" ? undefined : selectedSupplier,
    user_only: activeTab === "mine" ? user?.id : undefined
  };

  const { data: videos = [], isLoading, error } = useMaterials(filters);
  
  // Use mock data as fallback
  const displayVideos = videos.length > 0 ? videos : (activeTab === "all" ? mockVideos : []);
  
  const filteredVideos = displayVideos.filter((video: any) => {
    const matchesCategory = selectedCategory === "全部" || video.category === selectedCategory;
    const matchesSearch = video.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSupplier = selectedSupplier === "全部" || video.supplier === selectedSupplier || video.supplier_credentials?.company_name === selectedSupplier;
    return matchesCategory && matchesSearch && matchesSupplier;
  });

  const getCategoryBadge = (category: string) => {
    const colors = {
      "产品介绍": "bg-primary text-primary-foreground",
      "操作教程": "bg-success text-success-foreground", 
      "客户案例": "bg-brand-orange text-white",
      "行业资讯": "bg-purple-500 text-white"
    };
    return <Badge className={colors[category] || "bg-muted"}>{category}</Badge>;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">视频&素材中心</h1>
            <p className="text-muted-foreground">观看产品展示视频，学习操作教程，了解行业案例</p>
          </div>
          {user && (
            <Link to="/materials/upload">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                上传视频
              </Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">全部视频</TabsTrigger>
            <TabsTrigger value="mine">我的素材</TabsTrigger>
            <TabsTrigger value="stats">数据统计</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "我的视频", value: displayVideos.filter((v: any) => v.supplier === user?.email || v.supplier_id === user?.id).length, icon: Video },
                { label: "总观看", value: "5.8K", icon: Eye },
                { label: "转化订单", value: 23, icon: TrendingUp },
                { label: "视频引用", value: 45, icon: BarChart }
              ].map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <stat.icon className="h-6 w-6 text-primary" />
                      <div>
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="搜索视频标题、描述或标签..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger className="w-48">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全部">全部供应商</SelectItem>
                    <SelectItem value="海鲜直供">海鲜直供</SelectItem>
                    <SelectItem value="优质肉类">优质肉类</SelectItem>
                    <SelectItem value="绿色农场">绿色农场</SelectItem>
                    <SelectItem value="香料专家">香料专家</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Grid */}
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video: any) => (
                <Link key={video.id} to={`/materials/${video.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                    <CardContent className="p-0">
                      {/* Video Thumbnail */}
                      <div className="relative aspect-video overflow-hidden rounded-t-lg">
                        <img 
                          src={video.thumbnail_url || video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 text-primary ml-1" />
                          </div>
                        </div>
                        
                        {/* Duration Badge */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : video.duration}
                        </div>
                        
                        {/* Category Badge */}
                        <div className="absolute top-2 left-2">
                          {getCategoryBadge(video.category || "产品介绍")}
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {video.description}
                        </p>
                        
                        {/* Supplier and Stats */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {video.supplier_credentials?.company_name || video.supplier}
                          </span>
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {video.views || 0}
                          </span>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {(video.tags || []).slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Related Products */}
                        {video.relatedProducts?.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">关联商品:</p>
                            <p className="text-xs font-medium line-clamp-1">
                              {video.relatedProducts[0]}
                            </p>
                          </div>
                        )}
                        
                        {/* My Material Stats */}
                        {activeTab === "mine" && (
                          <div className="mt-3 pt-3 border-t flex justify-between text-xs">
                            <span>引用: {video.referenceCount || 0}</span>
                            <span>转化: {video.conversionCount || 0}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="mine">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.filter((video: any) => video.supplier === user?.email || video.supplier_id === user?.id).map((video: any) => (
              <Link key={video.id} to={`/materials/${video.id}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
                  <CardContent className="p-0">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img 
                        src={video.thumbnail_url || video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-primary ml-1" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {video.duration_seconds ? `${Math.floor(video.duration_seconds / 60)}:${(video.duration_seconds % 60).toString().padStart(2, '0')}` : video.duration}
                      </div>
                      <div className="absolute top-2 left-2">
                        {getCategoryBadge(video.category || "产品介绍")}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>观看: {video.views || 0}</span>
                        <span>引用: {video.referenceCount || 0}</span>
                        <span>转化: {video.conversionCount || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Load More */}
        <div className="flex justify-center mt-8">
          <Button variant="outline">加载更多视频</Button>
        </div>
      </div>
    </Layout>
  );
};

export default MaterialsPage;