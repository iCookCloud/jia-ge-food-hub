import { supabase } from '@/integrations/supabase/client';
import { handleApiError } from './api';

export interface UploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl: string;
  } | null;
  error: string | null;
}

export interface FileUploadOptions {
  bucket: string;
  folder?: string;
  fileName?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export const storageService = {
  /**
   * 上传文件到Supabase Storage
   */
  async uploadFile(
    file: File, 
    options: FileUploadOptions
  ): Promise<UploadResult> {
    try {
      // 验证文件大小
      if (options.maxSize && file.size > options.maxSize * 1024 * 1024) {
        return {
          data: null,
          error: `文件大小不能超过 ${options.maxSize}MB`
        };
      }

      // 验证文件类型
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        return {
          data: null,
          error: `不支持的文件类型: ${file.type}`
        };
      }

      // 生成文件路径
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = options.fileName || `${timestamp}.${fileExt}`;
      const filePath = options.folder ? `${options.folder}/${fileName}` : fileName;

      // 上传文件
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return {
          data: null,
          error: handleApiError(error)
        };
      }

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return {
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  },

  /**
   * 批量上传文件
   */
  async uploadMultipleFiles(
    files: File[],
    options: FileUploadOptions
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, options)
    );
    
    return Promise.all(uploadPromises);
  },

  /**
   * 删除文件
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    return { error: error ? handleApiError(error) : null };
  },

  /**
   * 获取文件列表
   */
  async listFiles(bucket: string, folder?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    return {
      data: data || [],
      error: error ? handleApiError(error) : null
    };
  },

  /**
   * 预设配置：商品图片上传
   */
  uploadProductImage: (file: File) => 
    storageService.uploadFile(file, {
      bucket: 'product-images',
      folder: 'products',
      maxSize: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }),

  /**
   * 预设配置：商品视频上传
   */
  uploadProductVideo: (file: File) =>
    storageService.uploadFile(file, {
      bucket: 'product-images', // 使用现有bucket，实际项目中可创建单独的video bucket
      folder: 'videos',
      maxSize: 100,
      allowedTypes: ['video/mp4', 'video/webm', 'video/mov']
    }),

  /**
   * 预设配置：用户头像上传
   */
  uploadAvatar: (file: File) =>
    storageService.uploadFile(file, {
      bucket: 'product-images',
      folder: 'avatars',
      maxSize: 2,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }),

  /**
   * 预设配置：供应商证件上传
   */
  uploadSupplierDocument: (file: File) =>
    storageService.uploadFile(file, {
      bucket: 'product-images',
      folder: 'documents',
      maxSize: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
    })
};