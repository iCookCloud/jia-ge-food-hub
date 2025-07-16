import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Video, Play, Clock } from 'lucide-react';
import { cloudflareStreamService, VideoUploadResult } from '@/services/cloudflareStreamService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VideoUploadProps {
  onUploadComplete?: (video: any) => void;
  onUploadError?: (error: string) => void;
}

interface UploadingVideo {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  result?: VideoUploadResult;
  title: string;
  description: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadComplete,
  onUploadError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideos, setUploadingVideos] = useState<UploadingVideo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
    
    // 验证文件类型
    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/wmv', 'video/webm'];
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
    
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

    // 创建上传视频状态
    const newUploadingVideos: UploadingVideo[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
      title: file.name.replace(/\.[^/.]+$/, ''), // 去掉文件扩展名作为默认标题
      description: ''
    }));

    setUploadingVideos(prev => [...prev, ...newUploadingVideos]);

    // 开始上传
    uploadVideos(fileArray);
  };

  const uploadVideos = async (files: File[]) => {
    for (const file of files) {
      try {
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

        // 上传到 Cloudflare Stream
        const result = await cloudflareStreamService.uploadVideo(file);

        clearInterval(progressInterval);

        // 更新为处理状态
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

        // 保存到数据库
        const uploadingVideo = uploadingVideos.find(uv => uv.file === file) || 
                              { title: file.name.replace(/\.[^/.]+$/, ''), description: '' };

        const { data: videoData, error: dbError } = await supabase
          .from('product_videos')
          .insert({
            title: uploadingVideo.title,
            description: uploadingVideo.description,
            cloudflare_video_id: result.videoId,
            thumbnail_url: result.thumbnailUrl,
            video_url: result.videoUrl,
            duration_seconds: result.duration,
            supplier_id: user?.id,
            status: 'active',
            is_active: true
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`数据库保存失败: ${dbError.message}`);
        }

        // 更新成功状态
        setUploadingVideos(prev => 
          prev.map(uv => 
            uv.file === file 
              ? { 
                  ...uv, 
                  progress: 100, 
                  status: 'success'
                }
              : uv
          )
        );

        onUploadComplete?.(videoData);

        toast({
          title: '视频上传成功',
          description: `"${uploadingVideo.title}" 已上传并保存`
        });

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

  const updateVideoInfo = (file: File, field: 'title' | 'description', value: string) => {
    setUploadingVideos(prev =>
      prev.map(uv =>
        uv.file === file ? { ...uv, [field]: value } : uv
      )
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
                        {uploadingVideo.status === 'uploading' ? '上传中' :
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

                  {uploadingVideo.status !== 'success' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`title-${index}`} className="text-sm">视频标题</Label>
                        <Input
                          id={`title-${index}`}
                          value={uploadingVideo.title}
                          onChange={(e) => updateVideoInfo(uploadingVideo.file, 'title', e.target.value)}
                          placeholder="请输入视频标题"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`description-${index}`} className="text-sm">视频描述</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={uploadingVideo.description}
                          onChange={(e) => updateVideoInfo(uploadingVideo.file, 'description', e.target.value)}
                          placeholder="请输入视频描述"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {uploadingVideo.status !== 'error' && uploadingVideo.status !== 'success' && (
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