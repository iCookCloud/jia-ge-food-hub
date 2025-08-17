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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Video, Clock, Package, Tag, Loader2, Images } from 'lucide-react';
import { cloudflareStreamService, VideoUploadResult } from '@/services/cloudflareStreamService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { productService } from '@/services/api';
import { Product } from '@/hooks/useProducts';

type UploadMode = 'video' | 'images';

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

interface ImageFile {
  file: File;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  result?: { path: string; publicUrl: string; fileSize: number };
  error?: string;
}

interface ImageCollectionDraft {
  images: ImageFile[];
  // 共享元数据
  title: string;
  description: string;
  content: string;
  tags: string[];
  selectedProducts: string[];
  category: string;
  // 整体状态
  isCreating: boolean;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('video');
  const [uploadingVideos, setUploadingVideos] = useState<UploadingVideo[]>([]);
  const [imageCollection, setImageCollection] = useState<ImageCollectionDraft | null>(null);
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
        // 从本地产品列表获取产品信息
        const productData = products.find(p => p.id === productId);
        
        if (productData) {
          associations.push({
            video_id: videoId,
            original_product_id: productId,
            product_snapshot: {
              id: productData.id,
              sku: productData.sku,
              standard_chinese_name: productData.standard_chinese_name,
              price: productData.unit_price,
              main_image_url: productData.product_image,
              specification: productData.specifications,
              source: 'local_products',
              snapshot_time: new Date().toISOString()
            },
            product_sku: productData.sku,
            product_name: productData.standard_chinese_name,
            snapshot_source: 'local_products'
          });
        }
      } catch (error) {
        console.warn(`Failed to get product ${productId} for video association:`, error);
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

  // 创建图片产品关联（带快照）
  const createImageProductAssociations = async (imageId: string, selectedProducts: string[]) => {
    const associations = [];
    
    for (const productId of selectedProducts) {
      try {
        // 从本地产品列表获取产品信息
        const productData = products.find(p => p.id === productId);
        
        if (productData) {
          associations.push({
            image_id: imageId,
            original_product_id: productId,
            product_snapshot: {
              id: productData.id,
              sku: productData.sku,
              standard_chinese_name: productData.standard_chinese_name,
              price: productData.unit_price,
              main_image_url: productData.product_image,
              specification: productData.specifications,
              source: 'local_products',
              snapshot_time: new Date().toISOString()
            },
            product_sku: productData.sku,
            product_name: productData.standard_chinese_name,
            snapshot_source: 'local_products'
          });
        }
      } catch (error) {
        console.warn(`Failed to get product ${productId} for image association:`, error);
      }
    }
    
    if (associations.length > 0) {
      const { error } = await supabase
        .from('image_product_associations')
        .insert(associations);
        
      if (error) {
        console.error('Failed to create image-product associations:', error);
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

  // 图片分类选项
  const imageCategories = [
    '产品展示',
    '使用场景',
    '生产工艺',
    '质量检验',
    '包装运输',
    '展会活动'
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
    
    if (uploadMode === 'video') {
      // 验证视频文件类型
      const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      const validVideoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.qt'];
      
      const invalidFiles = fileArray.filter(file => {
        const hasValidType = validVideoTypes.includes(file.type);
        const hasValidExtension = validVideoExtensions.some(ext => 
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

      // 验证视频文件大小 (限制为500MB)
      const maxVideoSize = 500 * 1024 * 1024; // 500MB
      const oversizedFiles = fileArray.filter(file => file.size > maxVideoSize);
      
      if (oversizedFiles.length > 0) {
        toast({
          title: '文件太大',
          description: '视频文件大小不能超过 500MB',
          variant: 'destructive'
        });
        return;
      }

      // 创建上传视频状态
      const newUploadingVideos: UploadingVideo[] = fileArray.map(file => ({
        file,
        progress: 0,
        status: 'pending',
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        content: '',
        tags: [],
        selectedProducts: [],
        category: '产品介绍'
      }));

      setUploadingVideos(prev => [...prev, ...newUploadingVideos]);
      
    } else if (uploadMode === 'images') {
      // 验证图片文件类型
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      const invalidFiles = fileArray.filter(file => {
        const hasValidType = validImageTypes.includes(file.type);
        const hasValidExtension = validImageExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        return !hasValidType && !hasValidExtension;
      });
      
      if (invalidFiles.length > 0) {
        toast({
          title: '文件类型不支持',
          description: '请上传 JPG、PNG、GIF 或 WebP 格式的图片文件',
          variant: 'destructive'
        });
        return;
      }

      // 验证图片文件大小 (限制为10MB)
      const maxImageSize = 10 * 1024 * 1024; // 10MB
      const oversizedFiles = fileArray.filter(file => file.size > maxImageSize);
      
      if (oversizedFiles.length > 0) {
        toast({
          title: '文件太大',
          description: '图片文件大小不能超过 10MB',
          variant: 'destructive'
        });
        return;
      }

      // 过滤掉重复的文件（基于文件名和大小）
      const existingFiles = imageCollection?.images || [];
      const filteredFiles = fileArray.filter(newFile => 
        !existingFiles.some(existing => 
          existing.file.name === newFile.name && 
          existing.file.size === newFile.size
        )
      );

      if (filteredFiles.length === 0) {
        toast({
          title: '文件已存在',
          description: '选择的文件已经在列表中了',
          variant: 'default'
        });
        return;
      }

      // 创建图片集合草稿
      const newImageFiles: ImageFile[] = filteredFiles.map(file => ({
        file,
        uploadStatus: 'pending',
        progress: 0
      }));

      if (imageCollection) {
        // 如果已有图片集合，添加到现有集合中
        setImageCollection(prev => prev ? {
          ...prev,
          images: [...prev.images, ...newImageFiles]
        } : null);
      } else {
        // 创建新的图片集合
        setImageCollection({
          images: newImageFiles,
          title: '',
          description: '',
          content: '',
          tags: [],
          selectedProducts: [],
          category: '产品展示',
          isCreating: false
        });
      }
    }
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

  const removeImageFromCollection = (file: File) => {
    if (!imageCollection) return;
    
    const updatedImages = imageCollection.images.filter(img => img.file !== file);
    
    if (updatedImages.length === 0) {
      // 如果没有图片了，清空整个集合
      setImageCollection(null);
    } else {
      setImageCollection(prev => prev ? { ...prev, images: updatedImages } : null);
    }
    
    // 释放内存中的预览URL
    if (file.type.startsWith('image/')) {
      URL.revokeObjectURL(URL.createObjectURL(file));
    }
  };

  const updateCollectionInfo = (field: keyof ImageCollectionDraft, value: string | string[]) => {
    if (!imageCollection) return;
    setImageCollection(prev => prev ? { ...prev, [field]: value } : null);
  };

  const toggleCollectionProduct = (productId: string) => {
    if (!imageCollection) return;
    
    const isSelected = imageCollection.selectedProducts.includes(productId);
    const updatedProducts = isSelected 
      ? imageCollection.selectedProducts.filter(id => id !== productId)
      : [...imageCollection.selectedProducts, productId];
    
    setImageCollection(prev => prev ? { ...prev, selectedProducts: updatedProducts } : null);
  };

  const addCollectionTag = (tag: string) => {
    if (!tag.trim() || !imageCollection) return;
    
    if (!imageCollection.tags.includes(tag.trim())) {
      setImageCollection(prev => prev ? { 
        ...prev, 
        tags: [...prev.tags, tag.trim()] 
      } : null);
    }
  };

  const removeCollectionTag = (tagToRemove: string) => {
    if (!imageCollection) return;
    
    setImageCollection(prev => prev ? {
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    } : null);
  };

  const uploadSingleImage = async (file: File) => {
    if (!imageCollection) return;
    
    try {
      // 更新状态为上传中
      setImageCollection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map(img => 
            img.file === file 
              ? { ...img, uploadStatus: 'uploading', progress: 0 }
              : img
          )
        };
      });

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImageCollection(prev => {
          if (!prev) return null;
          return {
            ...prev,
            images: prev.images.map(img => 
              img.file === file && img.uploadStatus === 'uploading'
                ? { ...img, progress: Math.min(img.progress + 10, 90) }
                : img
            )
          };
        });
      }, 200);

      // 使用 storageService 上传图片到 Supabase Storage
      const { storageService } = await import('@/services/storageService');
      const result = await storageService.uploadFile(file, {
        bucket: 'product-images',
        folder: 'upload-images',
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 // 10MB
      });

      clearInterval(progressInterval);

      if (result.error) {
        throw new Error(result.error);
      }

      // 更新成功状态
      setImageCollection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map(img => 
            img.file === file 
              ? { 
                  ...img, 
                  uploadStatus: 'uploaded',
                  progress: 100,
                  result: {
                    path: result.data!.path,
                    publicUrl: result.data!.publicUrl,
                    fileSize: file.size
                  }
                }
              : img
          )
        };
      });

      toast({
        title: '图片上传成功',
        description: `"${file.name}" 已成功上传`
      });

    } catch (error) {
      // 更新错误状态
      setImageCollection(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.map(img => 
            img.file === file 
              ? { 
                  ...img, 
                  uploadStatus: 'error',
                  error: error instanceof Error ? error.message : '上传失败'
                }
              : img
          )
        };
      });
      
      toast({
        title: '图片上传失败',
        description: error instanceof Error ? error.message : '上传失败',
        variant: 'destructive'
      });
    }
  };

  const uploadAllImages = async () => {
    if (!imageCollection) return;
    
    const pendingImages = imageCollection.images.filter(img => img.uploadStatus === 'pending');
    
    for (const imageFile of pendingImages) {
      await uploadSingleImage(imageFile.file);
    }
  };

  const createImageMaterial = async () => {
    if (!imageCollection || imageCollection.isCreating) return;
    
    const uploadedImages = imageCollection.images.filter(img => img.uploadStatus === 'uploaded');
    
    if (uploadedImages.length === 0) {
      toast({
        title: '无法创建素材',
        description: '请先上传至少一张图片',
        variant: 'destructive'
      });
      return;
    }
    
    if (!imageCollection.title.trim()) {
      toast({
        title: '请填写素材标题',
        description: '素材标题不能为空',
        variant: 'destructive'
      });
      return;
    }

    try {
      setImageCollection(prev => prev ? { ...prev, isCreating: true } : null);

      // 构建完整的描述信息
      const fullDescription = `${imageCollection.description}\n\n${imageCollection.content}`.trim();

      // 构建 images_data
      const imagesData = {
        images: uploadedImages.map((img, index) => ({
          file_path: img.result!.path,
          public_url: img.result!.publicUrl,
          file_size: img.result!.fileSize,
          mime_type: img.file.type,
          sort_order: index
        })),
        total_count: uploadedImages.length,
        total_size: uploadedImages.reduce((sum, img) => sum + img.result!.fileSize, 0)
      };

      // 使用第一张图片的信息作为主图信息
      const firstImage = uploadedImages[0];

      // 保存到数据库
      const { data, error } = await supabase
        .from('uploaded_images')
        .insert({
          title: imageCollection.title,
          description: fullDescription,
          file_path: firstImage.result!.path, // 第一张图片信息
          public_url: firstImage.result!.publicUrl,
          file_size: firstImage.result!.fileSize,
          mime_type: firstImage.file.type,
          uploaded_by: user!.id,
          bucket_name: 'product-images',
          folder_path: 'upload-images',
          category: imageCollection.category,
          tags: imageCollection.tags,
          content: imageCollection.content,
          images_data: imagesData // 所有图片信息
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 创建与产品的关联
      if (data && imageCollection.selectedProducts.length > 0) {
        await createImageProductAssociations(data.id, imageCollection.selectedProducts);
      }

      toast({
        title: '图片素材创建成功',
        description: `素材 "${imageCollection.title}" 已创建，包含 ${uploadedImages.length} 张图片`
      });

      // 清空状态
      setImageCollection(null);

    } catch (error) {
      toast({
        title: '创建素材失败',
        description: error instanceof Error ? error.message : '创建失败',
        variant: 'destructive'
      });
    } finally {
      setImageCollection(prev => prev ? { ...prev, isCreating: false } : null);
    }
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
      {/* 上传模式选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">选择上传类型</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={uploadMode} 
            onValueChange={(value: UploadMode) => setUploadMode(value)}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="video" id="video" />
              <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer flex-1">
                <Video className="h-5 w-5" />
                <div>
                  <div className="font-medium">上传视频</div>
                  <div className="text-xs text-muted-foreground">MP4, MOV, AVI, WMV, WebM</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="images" id="images" />
              <Label htmlFor="images" className="flex items-center gap-2 cursor-pointer flex-1">
                <Images className="h-5 w-5" />
                <div>
                  <div className="font-medium">上传多图</div>
                  <div className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP</div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

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
          {uploadMode === 'video' ? (
            <Video className="h-16 w-16 text-muted-foreground mb-4" />
          ) : (
            <Images className="h-16 w-16 text-muted-foreground mb-4" />
          )}
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {uploadMode === 'video' ? 
                '拖拽视频文件到此处或点击选择' : 
                '拖拽图片文件到此处或点击选择'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {uploadMode === 'video' ? 
                '支持格式: MP4, MOV, AVI, WMV, WebM | 最大大小: 500MB' :
                '支持格式: JPG, PNG, GIF, WebP | 最大大小: 10MB'
              }
            </p>
          </div>
          <Button className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            {uploadMode === 'video' ? '选择视频文件' : '选择图片文件'}
          </Button>
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept={uploadMode === 'video' ? 'video/*' : 'image/*'}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* 视频上传进度列表 */}
      {uploadMode === 'video' && uploadingVideos.length > 0 && (
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
                              onKeyDown={(e) => {
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

      {/* 图片集合上传 */}
      {uploadMode === 'images' && imageCollection && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">图片素材制作</Label>
            <Badge variant="secondary">
              {imageCollection.images.length} 张图片
            </Badge>
          </div>

          {/* 图片预览网格 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">图片预览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageCollection.images.map((imageFile, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={URL.createObjectURL(imageFile.file)}
                        alt={imageFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* 状态指示器 */}
                    <div className="absolute top-2 left-2">
                      <Badge 
                        variant={
                          imageFile.uploadStatus === 'uploaded' ? 'default' :
                          imageFile.uploadStatus === 'error' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {imageFile.uploadStatus === 'pending' ? '待上传' :
                         imageFile.uploadStatus === 'uploading' ? `${imageFile.progress}%` :
                         imageFile.uploadStatus === 'uploaded' ? '已上传' : '失败'}
                      </Badge>
                    </div>

                    {/* 操作按钮 */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {imageFile.uploadStatus === 'pending' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => uploadSingleImage(imageFile.file)}
                            className="h-6 w-6 p-0"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        )}
                        {imageFile.uploadStatus === 'error' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => uploadSingleImage(imageFile.file)}
                            className="h-6 w-6 p-0"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImageFromCollection(imageFile.file)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* 进度条 */}
                    {imageFile.uploadStatus === 'uploading' && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <Progress value={imageFile.progress} className="h-1" />
                      </div>
                    )}

                    {/* 错误信息 */}
                    {imageFile.uploadStatus === 'error' && imageFile.error && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-destructive/90 text-destructive-foreground text-xs p-1 rounded truncate">
                          {imageFile.error}
                        </div>
                      </div>
                    )}

                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      {imageFile.file.name}
                    </div>
                  </div>
                ))}
              </div>

              {/* 批量上传按钮 */}
              <div className="mt-4 flex justify-center">
                <Button 
                  onClick={uploadAllImages}
                  disabled={!imageCollection.images.some(img => img.uploadStatus === 'pending')}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  批量上传所有图片
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 素材信息表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">素材信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 基础信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="collection-title" className="text-sm font-medium">素材标题 *</Label>
                  <Input
                    id="collection-title"
                    value={imageCollection.title}
                    onChange={(e) => updateCollectionInfo('title', e.target.value)}
                    placeholder="请输入素材标题"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="collection-category" className="text-sm font-medium">素材分类</Label>
                  <Select
                    value={imageCollection.category}
                    onValueChange={(value) => updateCollectionInfo('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageCategories.map(category => (
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
                  <Label htmlFor="collection-description" className="text-sm font-medium">简短描述</Label>
                  <Textarea
                    id="collection-description"
                    value={imageCollection.description}
                    onChange={(e) => updateCollectionInfo('description', e.target.value)}
                    placeholder="请输入素材简短描述"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="collection-content" className="text-sm font-medium">详细说明</Label>
                  <Textarea
                    id="collection-content"
                    value={imageCollection.content}
                    onChange={(e) => updateCollectionInfo('content', e.target.value)}
                    placeholder="请输入详细的素材说明内容，如使用场景、产品特色等"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 标签管理 */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  素材标签
                </Label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入标签后按回车添加"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addCollectionTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                  {imageCollection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {imageCollection.tags.map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex} 
                          variant="secondary" 
                          className="text-xs flex items-center gap-1"
                        >
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeCollectionTag(tag)}
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
                  选择与此素材相关的产品，方便用户查找和了解
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
                            id={`collection-product-${product.id}`}
                            checked={imageCollection.selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleCollectionProduct(product.id)}
                          />
                          <Label 
                            htmlFor={`collection-product-${product.id}`}
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
                {imageCollection.selectedProducts.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    已选择 {imageCollection.selectedProducts.length} 个产品
                  </div>
                )}
              </div>

              {/* 创建素材按钮 */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={createImageMaterial}
                  disabled={
                    imageCollection.isCreating ||
                    !imageCollection.title.trim() ||
                    !imageCollection.images.some(img => img.uploadStatus === 'uploaded')
                  }
                  className="flex items-center gap-2"
                >
                  {imageCollection.isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      创建图片素材
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};