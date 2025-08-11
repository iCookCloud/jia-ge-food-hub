import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Video, Play, Clock, Package, Tag, Loader2 } from 'lucide-react';
import { cloudflareStreamService, VideoUploadResult } from '@/services/cloudflareStreamService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { productService } from '@/services/api';
import { globalErpService } from '@/services/globalErpService';
import { Product } from '@/hooks/useProducts';

interface VideoUploadProps {
  onUploadComplete?: (video: {
    id: string;
    title: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  }) => void;
  onUploadError?: (error: string) => void;
}

interface UploadingVideo {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  result?: VideoUploadResult;
  title: string;
  description: string;
  content: string;
  tags: string[];
  selectedProducts: string[];
  category: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideos, setUploadingVideos] = useState<UploadingVideo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // 懒加载产品列表 - 只有在需要时才加载
  const loadProducts = async () => {
    if (productsLoaded || productsLoading) return;
    
    setProductsLoading(true);
    try {
      const result = await productService.getAll({}, { page: 1, limit: 100 });
      if (result.data) {
        setProducts(result.data);
      }
      setProductsLoaded(true);
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载产品列表",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  // 创建视频产品关联（带快照）
  const createVideoProductAssociations = async (videoId: string, selectedProducts: string[]) => {
    const associations = [];
    
    for (const productId of selectedProducts) {
      try {
        // 从Global ERP获取最新产品信息
        const productData = await globalErpService.fetchProductById(productId);
        
        if (productData) {
          associations.push({
            video_id: videoId,
            original_product_id: productId,
            product_snapshot: {
              id: productData.id,
              sku: productData.sku,
              standard_chinese_name: productData.standard_chinese_name,
              price: productData.price,
              main_image_url: productData.main_image_url,
              specification: productData.specification,
              source: 'global_erp',
              snapshot_time: new Date().toISOString()
            },
            product_sku: productData.sku,
            product_name: productData.standard_chinese_name,
            snapshot_source: 'global_erp'
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch product ${productId} for video association:`, error);
      }
    }
    
    if (associations.length > 0) {
      const { error } = await supabase
        .from('video_product_associations')
        .insert(associations);
        
      if (error) {
        console.error('Failed to create video-product associations:', error);
      }
    }
  };
  
  // 视频分类选项
  const videoCategories = [
    '产品介绍',
    '操作教程', 
    '客户案例',
    '行业资讯',
    '工艺展示',
    '质量检测'
  ];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // 验证文件类型 - 使用更宽松的检测
    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    const validExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.qt'];
    
    const invalidFiles = fileArray.filter(file => {
      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );
      return !hasValidType && !hasValidExtension;
    });
    
    if (invalidFiles.length > 0) {
      toast({
        title: '文件类型不支持',
        description: '请上传 MP4、MOV、AVI、WMV 或 WebM 格式的视频文件',
        variant: 'destructive'
      });
      return;
    }

    // 验证文件大小 (限制为500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: '文件太大',
        description: '视频文件大小不能超过 500MB',
        variant: 'destructive'
      });
      return;
    }

    // 创建上传视频状态 - 初始状态为 pending，不自动开始上传
    const newUploadingVideos: UploadingVideo[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'pending', // 等待用户填写信息
      title: file.name.replace(/\.[^/.]+$/, ''), // 去掉文件扩展名作为默认标题
      description: '',
      content: '',
      tags: [],
      selectedProducts: [],
      category: '产品介绍'
    }));

    setUploadingVideos(prev => [...prev, ...newUploadingVideos]);

    // 不自动开始上传，等待用户点击上传按钮
  };

  const startUpload = (file: File) => {
    uploadVideos([file]);
  };

  const uploadVideos = async (files: File[]) => {
    for (const file of files) {
      try {
        // 更新状态为上传中
        setUploadingVideos(prev => 
          prev.map(uv => 
            uv.file === file ? { ...uv, status: 'uploading', progress: 0 } : uv
          )
        );

        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setUploadingVideos(prev => 
            prev.map(uv => 
              uv.file === file && uv.status === 'uploading'
                ? { ...uv, progress: Math.min(uv.progress + 5, 85) }
                : uv
            )
          );
        }, 1000);

        // 获取当前上传视频的信息
        const uploadingVideo = uploadingVideos.find(uv => uv.file === file) || 
                              { 
                                title: file.name.replace(/\.[^/.]+$/, ''), 
                                description: '', 
                                content: '', 
                                tags: [], 
                                selectedProducts: [],
                                category: '产品介绍'
                              };

        // 构建完整的描述信息
        const fullDescription = `${uploadingVideo.description}\n\n${uploadingVideo.content}`.trim();

        // 上传到 Cloudflare Stream (现在通过安全的 Edge Function)
        const result = await cloudflareStreamService.uploadVideo(
          file, 
          uploadingVideo.title, 
          fullDescription
        );

        clearInterval(progressInterval);

        // 更新为处理中状态
        setUploadingVideos(prev => 
          prev.map(uv => 
            uv.file === file 
              ? { 
                  ...uv, 
                  progress: 90, 
                  status: 'processing',
                  result 
                }
              : uv
          )
        );

        // 创建视频与产品的关联（带快照）
        if (result.databaseVideoId && uploadingVideo.selectedProducts && uploadingVideo.selectedProducts.length > 0) {
          await createVideoProductAssociations(result.databaseVideoId, uploadingVideo.selectedProducts);
        }

        // 开始轮询视频处理状态
        try {
          const processingResult = await cloudflareStreamService.pollVideoStatus(
            result.videoId,
            {
              maxAttempts: 60, // 10分钟超时
              intervalMs: 10000, // 每10秒检查一次
              onProgress: (progressResult: import('@/services/cloudflareStreamService').VideoProcessingResult) => {
                // 更新进度状态
                setUploadingVideos(prev => 
                  prev.map(uv => 
                    uv.file === file 
                      ? { 
                          ...uv, 
                          progress: progressResult.readyToStream ? 100 : 95,
                          status: progressResult.readyToStream ? 'success' : 'processing'
                        }
                      : uv
                  )
                );
              }
            }
          );

          // 处理完成，更新最终状态
          setUploadingVideos(prev => 
            prev.map(uv => 
              uv.file === file 
                ? { 
                    ...uv, 
                    progress: 100, 
                    status: 'success',
                    result: {
                      ...result,
                      thumbnailUrl: processingResult.thumbnailUrl || '',
                      videoUrl: processingResult.videoUrl || '',
                      duration: processingResult.duration
                    }
                  }
                : uv
            )
          );

          // 传递数据库视频记录信息
          onUploadComplete?.({ 
            id: result.databaseVideoId, 
            title: uploadingVideo.title,
            videoUrl: processingResult.videoUrl,
            thumbnailUrl: processingResult.thumbnailUrl
          });

          toast({
            title: '视频处理完成',
            description: `"${uploadingVideo.title}" 已上传并处理完成`
          });

        } catch (pollError) {
          
          // 轮询失败，但上传成功，提示后台处理
          setUploadingVideos(prev => 
            prev.map(uv => 
              uv.file === file 
                ? { 
                    ...uv, 
                    progress: 100, 
                    status: 'success',
                    result
                  }
                : uv
            )
          );

          onUploadComplete?.({ id: result.databaseVideoId, title: uploadingVideo.title });

          toast({
            title: '视频上传成功',
            description: `"${uploadingVideo.title}" 已上传，正在后台处理中，稍后可在视频列表查看`
          });
        }

      } catch (error) {
        // 更新错误状态
        setUploadingVideos(prev => 
          prev.map(uv => 
            uv.file === file 
              ? { 
                  ...uv, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : '上传失败' 
                }
              : uv
          )
        );
        
        onUploadError?.(error instanceof Error ? error.message : '上传失败');
        
        toast({
          title: '视频上传失败',
          description: error instanceof Error ? error.message : '上传失败',
          variant: 'destructive'
        });
      }
    }
  };

  const updateVideoInfo = (file: File, field: keyof UploadingVideo, value: string | string[]) => {
    setUploadingVideos(prev =>
      prev.map(uv =>
        uv.file === file ? { ...uv, [field]: value } : uv
      )
    );
  };

  const toggleProduct = (file: File, productId: string) => {
    setUploadingVideos(prev =>
      prev.map(uv => {
        if (uv.file === file) {
          const isSelected = uv.selectedProducts.includes(productId);
          return {
            ...uv,
            selectedProducts: isSelected 
              ? uv.selectedProducts.filter(id => id !== productId)
              : [...uv.selectedProducts, productId]
          };
        }
        return uv;
      })
    );
  };

  const addTag = (file: File, tag: string) => {
    if (!tag.trim()) return;
    setUploadingVideos(prev =>
      prev.map(uv => {
        if (uv.file === file && !uv.tags.includes(tag.trim())) {
          return { ...uv, tags: [...uv.tags, tag.trim()] };
        }
        return uv;
      })
    );
  };

  const removeTag = (file: File, tagToRemove: string) => {
    setUploadingVideos(prev =>
      prev.map(uv => {
        if (uv.file === file) {
          return { ...uv, tags: uv.tags.filter(tag => tag !== tagToRemove) };
        }
        return uv;
      })
    );
  };

  const removeUploadingVideo = (file: File) => {
    setUploadingVideos(prev => prev.filter(uv => uv.file !== file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-6">
      {/* 拖拽上传区域 */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Video className="h-16 w-16 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              拖拽视频文件到此处或点击选择
            </p>
            <p className="text-sm text-muted-foreground">
              支持格式: MP4, MOV, AVI, WMV, WebM | 最大大小: 500MB
            </p>
          </div>
          <Button className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            选择视频文件
          </Button>
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 上传进度列表 */}
      {uploadingVideos.length > 0 && (
        <div className="space-y-4">
          <Label className="text-lg font-semibold">上传进度</Label>
          <div className="space-y-4">
            {uploadingVideos.map((uploadingVideo, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      {uploadingVideo.file.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          uploadingVideo.status === 'success' ? 'default' :
                          uploadingVideo.status === 'error' ? 'destructive' : 'secondary'
                        }
                       >
                         {uploadingVideo.status === 'pending' ? '等待上传' :
                          uploadingVideo.status === 'uploading' ? '上传中' :
                         uploadingVideo.status === 'processing' ? '处理中' :
                         uploadingVideo.status === 'success' ? '完成' : '失败'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingVideo(uploadingVideo.file)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatFileSize(uploadingVideo.file.size)}</span>
                    {uploadingVideo.status !== 'error' && (
                      <>
                        <span>•</span>
                        <span>{uploadingVideo.progress}%</span>
                      </>
                    )}
                    {uploadingVideo.result?.duration && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(uploadingVideo.result.duration)}
                        </span>
                      </>
                    )}
                  </div>

                  {(uploadingVideo.status === 'pending' || uploadingVideo.status === 'uploading' || uploadingVideo.status === 'processing') && (
                    <div className="space-y-6 relative">
                      {/* 基础信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`title-${index}`} className="text-sm font-medium">视频标题 *</Label>
                          <Input
                            id={`title-${index}`}
                            value={uploadingVideo.title}
                            onChange={(e) => updateVideoInfo(uploadingVideo.file, 'title', e.target.value)}
                            placeholder="请输入视频标题"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`category-${index}`} className="text-sm font-medium">视频分类</Label>
                          <Select
                            value={uploadingVideo.category}
                            onValueChange={(value) => updateVideoInfo(uploadingVideo.file, 'category', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="选择分类" />
                            </SelectTrigger>
                            <SelectContent>
                              {videoCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* 描述和详细内容 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`description-${index}`} className="text-sm font-medium">简短描述</Label>
                          <Textarea
                            id={`description-${index}`}
                            value={uploadingVideo.description}
                            onChange={(e) => updateVideoInfo(uploadingVideo.file, 'description', e.target.value)}
                            placeholder="请输入视频简短描述"
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`content-${index}`} className="text-sm font-medium">详细文案</Label>
                          <Textarea
                            id={`content-${index}`}
                            value={uploadingVideo.content}
                            onChange={(e) => updateVideoInfo(uploadingVideo.file, 'content', e.target.value)}
                            placeholder="请输入详细的视频文案内容，如制作工艺、产品特色、使用方法等"
                            rows={3}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* 标签管理 */}
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          视频标签
                        </Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="输入标签后按回车添加"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addTag(uploadingVideo.file, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="flex-1"
                            />
                          </div>
                          {uploadingVideo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {uploadingVideo.tags.map((tag, tagIndex) => (
                                <Badge 
                                  key={tagIndex} 
                                  variant="secondary" 
                                  className="text-xs flex items-center gap-1"
                                >
                                  {tag}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={() => removeTag(uploadingVideo.file, tag)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 关联产品 */}
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          关联产品
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          选择与此视频相关的产品，方便用户查找和了解
                        </p>
                        {productsLoading ? (
                          <div className="text-sm text-muted-foreground">加载产品列表中...</div>
                        ) : !productsLoaded ? (
                          <div className="text-center py-4">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={loadProducts}
                              className="flex items-center gap-2"
                            >
                              <Package className="h-4 w-4" />
                              加载产品列表
                            </Button>
                          </div>
                        ) : (
                          <div className="max-h-40 overflow-y-auto border rounded p-3 space-y-2">
                            {products.length === 0 ? (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                暂无产品数据
                              </div>
                            ) : (
                              products.map((product) => (
                                <div key={product.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`product-${product.id}-${index}`}
                                    checked={uploadingVideo.selectedProducts.includes(product.id)}
                                    onCheckedChange={() => toggleProduct(uploadingVideo.file, product.id)}
                                  />
                                  <Label 
                                    htmlFor={`product-${product.id}-${index}`}
                                    className="flex-1 text-sm cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      {product.product_image && (
                                        <img 
                                          src={product.product_image} 
                                          alt={product.standard_chinese_name || product.sku}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium">
                                          {product.standard_chinese_name || product.standard_english_name || product.sku}
                                        </div>
                                        {product.specifications && (
                                          <div className="text-xs text-muted-foreground">
                                            {product.specifications}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Label>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                        {uploadingVideo.selectedProducts.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            已选择 {uploadingVideo.selectedProducts.length} 个产品
                          </div>
                        )}
                      </div>

                      {/* 上传按钮 */}
                      {uploadingVideo.status === 'pending' && (
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => startUpload(uploadingVideo.file)}
                            className="flex items-center gap-2"
                            disabled={!uploadingVideo.title.trim()}
                          >
                            <Upload className="h-4 w-4" />
                            开始上传
                          </Button>
                        </div>
                      )}

                      {/* 上传/处理中的蒙版 */}
                      {(uploadingVideo.status === 'uploading' || uploadingVideo.status === 'processing') && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-3 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <div className="space-y-1">
                              <p className="font-medium">
                                {uploadingVideo.status === 'uploading' ? '正在上传视频...' : '正在处理视频...'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {uploadingVideo.status === 'uploading' 
                                  ? '请稍候，视频正在上传到云端' 
                                  : 'Cloudflare 正在处理视频，生成播放链接和缩略图'
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                进度: {uploadingVideo.progress}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(uploadingVideo.status === 'uploading' || uploadingVideo.status === 'processing') && (
                    <Progress value={uploadingVideo.progress} className="h-2" />
                  )}

                  {uploadingVideo.status === 'error' && uploadingVideo.error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                      {uploadingVideo.error}
                    </div>
                  )}

                  {uploadingVideo.status === 'success' && uploadingVideo.result && (
                    <div className="bg-green-50 p-3 rounded text-sm text-green-700">
                      视频已成功上传到 Cloudflare Stream 并保存到数据库
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};