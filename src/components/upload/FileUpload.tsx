import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, FileImage, FileVideo, File } from 'lucide-react';
import { storageService, FileUploadOptions } from '@/services/storageService';

interface FileUploadProps {
  onUploadComplete: (results: Array<{ path: string; publicUrl: string }>) => void;
  onUploadError?: (error: string) => void;
  options: FileUploadOptions;
  multiple?: boolean;
  className?: string;
  accept?: string;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  result?: { path: string; publicUrl: string };
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  options,
  multiple = false,
  className = '',
  accept,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // 检查文件数量限制
    if (!multiple && fileArray.length > 1) {
      toast({
        title: '文件数量限制',
        description: '只能上传一个文件',
        variant: 'destructive'
      });
      return;
    }

    // 创建上传文件状态
    const newUploadingFiles: UploadingFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // 开始上传
    uploadFiles(fileArray);
  };

  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file, index) => {
      try {
        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map((uf, i) => 
              uf.file === file && uf.status === 'uploading'
                ? { ...uf, progress: Math.min(uf.progress + 10, 90) }
                : uf
            )
          );
        }, 200);

        const result = await storageService.uploadFile(file, options);

        clearInterval(progressInterval);

        if (result.error) {
          throw new Error(result.error);
        }

        // 更新成功状态
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { 
                  ...uf, 
                  progress: 100, 
                  status: 'success', 
                  result: result.data! 
                }
              : uf
          )
        );

        return result.data!;
      } catch (error) {
        // 更新错误状态
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file 
              ? { 
                  ...uf, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : '上传失败' 
                }
              : uf
          )
        );
        
        onUploadError?.(error instanceof Error ? error.message : '上传失败');
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successResults = results.filter(Boolean) as Array<{ path: string; publicUrl: string }>;
    
    if (successResults.length > 0) {
      onUploadComplete(successResults);
      toast({
        title: '上传成功',
        description: `成功上传 ${successResults.length} 个文件`
      });
    }
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 拖拽上传区域 */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              拖拽文件到此处或点击选择文件
            </p>
            <p className="text-xs text-muted-foreground">
              {options.allowedTypes && `支持格式: ${options.allowedTypes.join(', ')}`}
              {options.maxSize && ` | 最大大小: ${options.maxSize}MB`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <Input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept || options.allowedTypes?.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* 上传进度列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">上传进度</Label>
          <div className="space-y-2">
            {uploadingFiles.map((uploadingFile, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadingFile.file)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            uploadingFile.status === 'success' ? 'default' :
                            uploadingFile.status === 'error' ? 'destructive' : 'secondary'
                          }
                        >
                          {uploadingFile.status === 'uploading' ? '上传中' :
                           uploadingFile.status === 'success' ? '完成' : '失败'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadingFile(uploadingFile.file)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(uploadingFile.file.size)}</span>
                      {uploadingFile.status === 'uploading' && (
                        <>
                          <span>•</span>
                          <span>{uploadingFile.progress}%</span>
                        </>
                      )}
                    </div>
                    {uploadingFile.status === 'uploading' && (
                      <Progress value={uploadingFile.progress} className="mt-2 h-1" />
                    )}
                    {uploadingFile.status === 'error' && uploadingFile.error && (
                      <p className="text-xs text-destructive mt-1">{uploadingFile.error}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};