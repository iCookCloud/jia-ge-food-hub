import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "@/services/api";
import { materialService } from "@/services/coreDataService";
// Remove suppliers import for now
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Package, Building2, Video, ArrowRight, Command } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'product' | 'supplier' | 'video';
  image?: string;
  url: string;
  metadata?: {
    price?: number;
    unit?: string;
    vendor?: string;
    verified?: boolean;
    duration?: string;
    views?: number;
  };
}

interface GlobalSearchProps {
  children?: React.ReactNode;
}

export function GlobalSearch({ children }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // 不再预先加载所有产品，改为按需搜索

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Perform search with debounce - 直接从服务器搜索
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const searchTimer = setTimeout(async () => {
      try {
        const searchTerm = query.toLowerCase();
        const results: SearchResult[] = [];

        // Search products using server API
        const productResult = await productService.getAll(
          { search: query }, 
          { page: 1, limit: 10 }
        );
        
        if (productResult.data) {
          productResult.data.forEach(product => {
            const name = product.standard_chinese_name || product.standard_english_name || product.sku;
            const specs = product.specifications || '';
            
            results.push({
              id: product.id,
              title: name,
              description: specs || '暂无规格说明',
              type: 'product',
              image: product.product_image,
              url: `/products/${product.id}`,
              metadata: {
                price: product.unit_price,
                unit: product.unit,
                vendor: product.vendor
              }
            });
          });
        }

        // Search videos using server API
        try {
          const videoResult = await materialService.getAll(
            { search: query }, 
            { page: 1, limit: 5 }
          );
          
          if (videoResult.data) {
            videoResult.data.forEach(video => {
              results.push({
                id: video.id,
                title: video.title || '未命名视频',
                description: video.description || '暂无描述',
                type: 'video',
                image: video.thumbnail_url,
                url: `/materials/video/${video.id}`,
                metadata: {
                  duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : undefined
                }
              });
            });
          }
        } catch (videoError) {
          // 视频搜索失败时继续处理其他结果
        }

        // Sort results by relevance (exact matches first)
        results.sort((a, b) => {
          const aExact = a.title.toLowerCase().startsWith(searchTerm);
          const bExact = b.title.toLowerCase().startsWith(searchTerm);
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return 0;
        });

        setSearchResults(results.slice(0, 20)); // Limit to 20 results
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setIsOpen(false);
    setQuery("");
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'product': return Package;
      case 'supplier': return Building2;
      case 'video': return Video;
      default: return Search;
    }
  };

  const getTypeBadge = (type: SearchResult['type']) => {
    switch (type) {
      case 'product': return { text: '商品', variant: 'default' as const };
      case 'supplier': return { text: '供应商', variant: 'secondary' as const };
      case 'video': return { text: '视频', variant: 'outline' as const };
      default: return { text: '其他', variant: 'outline' as const };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        {/* 隐藏的标题和描述用于无障碍性 */}
        <DialogTitle className="sr-only">全局搜索</DialogTitle>
        <DialogDescription className="sr-only">搜索商品、供应商和视频内容</DialogDescription>
        
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索商品、供应商、视频内容..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 border-none focus-visible:ring-0 text-base"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!query.trim() ? (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                开始搜索
              </h3>
              <p className="text-muted-foreground">
                输入关键词搜索商品、供应商或视频内容
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">热门搜索：</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['三文鱼', '牛肉', '调料', '海鲜直供'].map(tag => (
                    <Button 
                      key={tag} 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuery(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : isSearching ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              {/* Group results by type */}
              {['product', 'video'].map(type => {
                const typeResults = searchResults.filter(r => r.type === type);
                if (typeResults.length === 0) return null;

                const TypeIcon = getTypeIcon(type as SearchResult['type']);
                const typeName = type === 'product' ? '商品' : '视频';

                return (
                  <div key={type} className="mb-4">
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-muted-foreground">
                      <TypeIcon className="h-4 w-4" />
                      <span>{typeName}</span>
                      <span className="text-xs">({typeResults.length})</span>
                    </div>
                    <div className="space-y-1">
                      {typeResults.map((result) => {
                        const badge = getTypeBadge(result.type);
                        return (
                          <Card 
                            key={result.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors border-0 shadow-none"
                            onClick={() => handleResultClick(result)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center space-x-3">
                                {result.image && (
                                  <img 
                                    src={result.image} 
                                    alt={result.title}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-foreground truncate">
                                      {result.title}
                                    </h4>
                                    <Badge variant={badge.variant} className="text-xs">
                                      {badge.text}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {result.description}
                                  </p>
                                  {result.metadata && (
                                    <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                                      {result.metadata.price && (
                                        <span>
                                          ¥{result.metadata.price}
                                          {result.metadata.unit && result.metadata.unit !== "个" && `/${result.metadata.unit}`}
                                        </span>
                                      )}
                                      {result.metadata.verified && (
                                        <Badge variant="outline" className="text-xs">已认证</Badge>
                                      )}
                                      {result.metadata.duration && (
                                        <span>{result.metadata.duration}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                未找到结果
              </h3>
              <p className="text-muted-foreground">
                试试其他关键词或检查拼写
              </p>
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="border-t border-border p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              使用 ↑ ↓ 导航，Enter 选择，Esc 关闭
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}