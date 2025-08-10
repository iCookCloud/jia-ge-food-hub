import React from "react";
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter,
  Play,
  Clock,
  Eye,
  ThumbsUp,
  Share2,
  Download,
  Grid3X3,
  List
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MaterialsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 获取视频数据
  const { data: videos, isLoading } = useQuery({
    queryKey: ['product-videos', searchQuery, categoryFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('product_videos')
        .select(`
          id,
          title,
          description,
          video_url,
          thumbnail_url,
          cloudflare_video_id,
          duration_seconds,
          is_active,
          status,
          created_at,
          updated_at,
          supplier_id
        `)
        .eq('is_active', true)
        .eq('status', 'published');

      // 应用搜索过滤
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      // 应用排序
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5分钟
  });

  // 格式化时长
  const formatDuration = (seconds?: number | null) => {
    if (!seconds || seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const colors = {
      published: "bg-success text-success-foreground",
      draft: "bg-muted text-muted-foreground",
      reviewing: "bg-warning text-warning-foreground"
    };
    const labels = {
      published: "已发布",
      draft: "草稿",
      reviewing: "审核中"
    };
    return <Badge className={colors[status] || colors.draft}>{labels[status] || status}</Badge>;
  };

  const displayVideos = videos || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">素材库</h1>
            <p className="text-muted-foreground">浏览和管理产品视频素材</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索视频标题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              <SelectItem value="seafood">海鲜水产</SelectItem>
              <SelectItem value="meat">肉类</SelectItem>
              <SelectItem value="vegetables">蔬菜</SelectItem>
              <SelectItem value="fruits">水果</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">最新发布</SelectItem>
              <SelectItem value="oldest">最早发布</SelectItem>
              <SelectItem value="title">标题排序</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Video Grid/List */}
        {!isLoading && (
          <>
            {displayVideos.length === 0 ? (
              <Card className="p-12 text-center">
                <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  暂无视频素材
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "没有找到匹配的视频" : "还没有上传任何视频素材"}
                </p>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <Link to={`/materials/${video.id}`}>
                      <div className="relative aspect-video bg-muted">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Duration overlay */}
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDuration(video.duration_seconds)}
                        </div>
                      </div>
                    </Link>
                    
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                          {video.title}
                        </h3>
                        {getStatusBadge(video.status)}
                      </div>
                      
                      {video.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {video.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                        
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Share2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="flex">
                      <Link to={`/materials/${video.id}`} className="flex-shrink-0">
                        <div className="w-48 aspect-video bg-muted relative">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDuration(video.duration_seconds)}
                          </div>
                        </div>
                      </Link>
                      
                      <CardContent className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
                            {video.title}
                          </h3>
                          {getStatusBadge(video.status)}
                        </div>
                        
                        {video.description && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {video.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {new Date(video.created_at).toLocaleDateString()}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default MaterialsPage;
