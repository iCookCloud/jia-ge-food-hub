import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Image,
  FileImage
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMaterials } from "@/hooks/useMaterials";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";

// 素材数据类型定义
interface MaterialItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  type: 'video' | 'image';
  
  // 视频特有属性
  thumbnail?: string;
  thumbnail_url?: string;
  duration?: string;
  duration_seconds?: number;
  
  // 图片特有属性
  public_url?: string;
  file_path?: string;
  mime_type?: string;
  
  // 通用属性
  supplier?: string;
  supplier_credentials?: {
    company_name?: string;
  };
  uploadDate?: string;
  created_at?: string;
  views?: number;
  relatedProducts?: string[];
  uploaded_by?: string;
}

// 兼容旧接口
interface VideoItem extends Omit<MaterialItem, 'type'> {
  type?: 'video';
}

// 图片数据类型
interface ImageItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  public_url?: string;
  file_path?: string;
  mime_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}


const MaterialsPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("全部");
  
  // 对搜索词进行防抖处理，500ms延迟
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // 搜索状态指示器
  const isSearching = searchTerm !== debouncedSearchTerm;
  
  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [allMaterials, setAllMaterials] = useState<MaterialItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const ITEMS_PER_PAGE = 9; // 每页显示9个素材

  // 视频和图片通用分类
  const categories = [
    "全部", 
    // 视频分类
    "产品介绍", "操作教程", "客户案例", "行业资讯", "工艺展示", "质量检测",
    // 图片分类
    "产品展示", "使用场景", "生产工艺", "质量检验", "包装运输", "展会活动"
  ];
  
  const filters = useMemo(() => ({
    search: debouncedSearchTerm,
    category: selectedCategory === "全部" ? undefined : selectedCategory,
    supplier: selectedSupplier === "全部" ? undefined : selectedSupplier
  }), [debouncedSearchTerm, selectedCategory, selectedSupplier]);

  const pagination = useMemo(() => ({
    page: currentPage,
    limit: ITEMS_PER_PAGE
  }), [currentPage]);
  
  const { data: materials = [], isLoading, error } = useMaterials(filters, pagination);
  
  // 管理数据累积和重置
  useEffect(() => {
    // 只有在数据真正加载完成后才处理状态
    if (isLoading) {
      return;
    }
    
    if (currentPage === 1) {
      // 第一页或过滤条件改变时，重置数据
      setAllMaterials(materials || []);
      const shouldHaveMore = materials && materials.length === ITEMS_PER_PAGE;
      setHasMore(shouldHaveMore);
    } else if (materials && materials.length > 0) {
      // 加载更多时，累积数据
      setAllMaterials(prev => {
        const existingIds = new Set(prev.map(v => v.id));
        const newMaterials = materials.filter(v => !existingIds.has(v.id));
        const updatedMaterials = [...prev, ...newMaterials];
        return updatedMaterials;
      });
      // 只有当返回的数据等于期望的每页数据量时，才认为还有更多数据
      const shouldHaveMore = materials.length === ITEMS_PER_PAGE;
      setHasMore(shouldHaveMore);
    } else if (currentPage > 1) {
      // 如果不是第一页，但返回空数据或没有数据，说明已经没有更多了
      setHasMore(false);
    }
    
    setIsLoadingMore(false);
  }, [materials, currentPage, isLoading]);


  // 记录上一次的过滤条件，用于精确检测变化
  const prevFiltersForReset = useRef({
    selectedCategory,
    debouncedSearchTerm,
    selectedSupplier
  });
  
  // 当过滤条件真正改变时，重置分页状态
  useEffect(() => {
    const prev = prevFiltersForReset.current;
    const hasRealChange = 
      prev.selectedCategory !== selectedCategory ||
      prev.debouncedSearchTerm !== debouncedSearchTerm ||
      prev.selectedSupplier !== selectedSupplier;
    
    // 更新记录的过滤条件
    prevFiltersForReset.current = {
      selectedCategory,
      debouncedSearchTerm,
      selectedSupplier
    };
    
    // 只有在确实有变化时才重置状态
    if (hasRealChange) {
      setCurrentPage(1);
      setAllMaterials([]);
      setHasMore(true);
    }
  }, [selectedCategory, debouncedSearchTerm, selectedSupplier]);

  // 加载更多处理函数
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoadingMore, hasMore, isLoading, currentPage]);

  // 无限滚动功能
  useEffect(() => {
    const handleScroll = () => {
      // 更严格的条件检查
      if (!hasMore || isLoadingMore || isLoading) {
        return;
      }
      
      // 额外检查：如果是第一页且没有数据，不触发加载更多
      if (currentPage === 1 && allMaterials.length === 0) {
        return;
      }

      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      // 当滚动到距离底部400px时触发加载更多
      const threshold = 400;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      
      if (scrolledToBottom) {
        handleLoadMore();
      }
    };

    // 增加防抖时间，减少触发频率
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 200); // 从100ms增加到200ms
    };

    window.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [hasMore, isLoadingMore, isLoading, handleLoadMore]);

  // 使用累积的数据
  const finalDisplayMaterials = allMaterials.length > 0 ? allMaterials : materials;
  
  const filteredMaterials = finalDisplayMaterials.filter((material: MaterialItem) => {
    const matchesCategory = selectedCategory === "全部" || material.category === selectedCategory;
    const matchesSearch = material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSupplier = selectedSupplier === "全部" || material.supplier === selectedSupplier || material.supplier_credentials?.company_name === selectedSupplier;
    return matchesCategory && matchesSearch && matchesSupplier;
  });

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

  // 素材卡片组件
  const MaterialCard = ({ material }: { material: MaterialItem }) => {
    const isVideo = material.type === 'video';
    const isImage = material.type === 'image';

    return (
      <Link to={`/materials/${material.type}/${material.id}`}>
        <Card className="group hover:shadow-lg transition-all duration-300 hover-scale">
          <CardContent className="p-0">
            {/* 素材预览 */}
            <div className="relative aspect-video overflow-hidden rounded-t-lg">
              {isVideo && (
                <>
                  <img 
                    src={material.thumbnail_url || material.thumbnail} 
                    alt={material.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      console.error('图片加载失败:', material.thumbnail_url || material.thumbnail);
                      const img = e.target as HTMLImageElement;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        setTimeout(() => {
                          img.src = img.src + '?retry=' + Date.now();
                        }, 1000);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-primary ml-1" />
                    </div>
                  </div>
                  {/* 时长标识 */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {material.duration_seconds ? `${Math.floor(material.duration_seconds / 60)}:${(material.duration_seconds % 60).toString().padStart(2, '0')}` : material.duration}
                  </div>
                </>
              )}
              
              {isImage && (
                <>
                  <img 
                    src={material.public_url} 
                    alt={material.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      console.error('图片加载失败:', material.public_url);
                      const img = e.target as HTMLImageElement;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        setTimeout(() => {
                          img.src = img.src + '?retry=' + Date.now();
                        }, 1000);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  {/* 图片类型标识 */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                    <FileImage className="w-3 h-3 mr-1" />
                    图片
                  </div>
                </>
              )}
              
              {/* 分类标识 */}
              <div className="absolute top-2 left-2">
                {getCategoryBadge(material.category || (isVideo ? "产品介绍" : "产品展示"))}
              </div>
              
              {/* 类型标识 */}
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="text-xs">
                  {isVideo ? (
                    <><Video className="w-3 h-3 mr-1" />视频</>
                  ) : (
                    <><FileImage className="w-3 h-3 mr-1" />图片</>
                  )}
                </Badge>
              </div>
            </div>

            {/* 素材信息 */}
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {material.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {material.description}
              </p>
              
              {/* 供应商和统计 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {(material as any).uploader_profile?.company_name || 
                   (material as any).uploader_profile?.nickname || 
                   material.supplier_credentials?.company_name || 
                   material.supplier || 
                   '未知供应商'}
                </span>
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {material.views || 0}
                </span>
              </div>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-1">
                {(material.tags || []).slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* 关联产品 */}
              {material.relatedProducts?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">关联商品:</p>
                  <p className="text-xs font-medium line-clamp-1">
                    {material.relatedProducts[0]}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">素材中心</h1>
            <p className="text-muted-foreground">浏览产品展示素材，观看操作教程，查看行业案例</p>
          </div>
          {user && (
            <Link to="/materials/upload">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                上传素材
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                  <Input
                    placeholder="搜索素材标题、描述或标签..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 ${isSearching ? 'pr-10' : ''}`}
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

        {/* Materials Grid */}
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
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">加载素材时出现错误</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              重新加载
            </Button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">没有找到符合条件的素材</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("全部");
                setSelectedSupplier("全部");
              }}
            >
              清除筛选条件
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material: MaterialItem) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}

        {/* Loading More Skeleton */}
        {isLoadingMore && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {[...Array(3)].map((_, i) => (
              <Card key={`loading-${i}`} className="animate-pulse">
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
        )}

        {/* Load More */}
        {filteredMaterials.length > 0 && hasMore && (
          <div className="flex flex-col items-center mt-8 gap-2">
            <Button 
              variant="outline" 
              onClick={handleLoadMore}
              disabled={isLoadingMore || isLoading}
            >
              {isLoadingMore ? "加载中..." : "加载更多素材"}
            </Button>
            <p className="text-xs text-muted-foreground">或滚动到底部自动加载</p>
          </div>
        )}
        
        {/* No More Data Message */}
        {filteredMaterials.length > 0 && !hasMore && (
          <div className="flex justify-center mt-8">
            <p className="text-muted-foreground text-sm">没有更多素材了</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MaterialsPage;