import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  ChevronLeft, 
  ChevronRight,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';

// 素材数据类型
interface MaterialItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  
  // 视频特有属性
  cloudflare_video_id?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  
  // 图片特有属性
  public_url?: string;
  images?: string[]; // 多图支持
}

interface MaterialViewerProps {
  material: MaterialItem;
  className?: string;
}

// 视频播放器组件
const VideoPlayer: React.FC<{ material: MaterialItem }> = ({ material }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!material.cloudflare_video_id) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>视频加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <iframe
        src={`https://customer-fn1cto1c4empk25m.cloudflarestream.com/${material.cloudflare_video_id}/iframe`}
        className="w-full h-full border-none"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        title={material.title}
      />
    </div>
  );
};

// 图片查看器组件
const ImageViewer: React.FC<{ material: MaterialItem }> = ({ material }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 获取图片列表（支持单图和多图）
  const images = material.images && material.images.length > 0 
    ? material.images 
    : material.public_url 
      ? [material.public_url]
      : [];

  const currentImage = images[currentImageIndex];

  // 键盘支持
  useEffect(() => {
    if (images.length <= 1) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, isFullscreen]);

  // 缩放控制
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.5));
    if (zoom <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // 重置缩放和位置
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // 切换图片
  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
    handleReset();
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % images.length);
    handleReset();
  };

  // 鼠标拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - position.x, 
        y: e.clientY - position.y 
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 全屏切换
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (images.length === 0) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
            <ZoomIn className="w-8 h-8" />
          </div>
          <p>暂无图片</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="relative w-full h-full overflow-hidden bg-black cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 主图片 */}
        <img
          src={currentImage}
          alt={material.title}
          className="w-full h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          draggable={false}
        />

        {/* 控制按钮层 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 顶部工具栏 */}
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-auto">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomIn}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomOut}
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                className="bg-black/50 hover:bg-black/70 text-white border-0 text-xs px-3"
              >
                重置
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>

          {/* 多图导航 */}
          {images.length > 1 && (
            <>
              {/* 左右切换按钮 */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 pointer-events-auto"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-0 pointer-events-auto"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* 缩略图导航 - 优化为滚动条样式 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className="bg-black/50 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex gap-2 max-w-xs overflow-x-auto scrollbar-hide">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          handleReset();
                        }}
                        className={`flex-shrink-0 w-12 h-8 rounded overflow-hidden border-2 transition-all hover:scale-105 ${
                          index === currentImageIndex 
                            ? 'border-white ring-1 ring-white/50' 
                            : 'border-white/30 hover:border-white/60'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`图片 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 图片信息 */}
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-auto">
            {images.length > 1 ? `${currentImageIndex + 1} / ${images.length}` : '图片'}
            {zoom !== 1 && ` • ${Math.round(zoom * 100)}%`}
          </div>
        </div>
      </div>

      {/* 全屏模态框 */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          >
            <X className="w-4 h-4" />
          </Button>
          <ImageViewer material={{ ...material, images: images }} />
        </div>
      )}
    </>
  );
};

// 主要的素材查看器组件
export const MaterialViewer: React.FC<MaterialViewerProps> = ({ 
  material, 
  className = "" 
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {material.type === 'video' ? (
            <VideoPlayer material={material} />
          ) : (
            <ImageViewer material={material} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialViewer;