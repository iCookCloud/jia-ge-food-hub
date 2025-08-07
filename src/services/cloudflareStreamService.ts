import { supabase } from '@/integrations/supabase/client';

export interface VideoUploadResult {
  videoId: string;
  thumbnailUrl: string;
  videoUrl: string;
  status: string;
  duration?: number;
  databaseVideoId?: string; // 数据库中的视频记录ID
}

// Edge Function 响应接口
interface UploadVideoResponse {
  videoId: string; // 数据库中的视频记录ID
  uploadUrl: string; // Cloudflare 上传链接
  cloudflareVideoId: string; // Cloudflare 视频ID
}

// video-status Edge Function 响应接口
interface VideoStatusResponse {
  status: string;
  duration?: number;
  playbackUrl?: string;
  thumbnailUrl?: string;
  readyToStream: boolean;
}

// 视频处理结果接口
export interface VideoProcessingResult {
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  readyToStream: boolean;
}

class CloudflareStreamService {
  async uploadVideo(file: File, title: string, description: string): Promise<VideoUploadResult> {
    try {
      // 1. 调用现有的 Edge Function 获取安全的上传链接
      const { data, error } = await supabase.functions.invoke('upload-video', {
        body: { title, description }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to get upload URL');
      }

      const { uploadUrl, cloudflareVideoId, videoId }: UploadVideoResponse = data;

      // 2. 直接上传到 Cloudflare Stream
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // 3. 上传成功后，设置状态为处理中（等待 Cloudflare 处理）
      const { error: updateError } = await supabase
        .from('product_videos')
        .update({ status: 'processing' })
        .eq('id', videoId);

      if (updateError) {
        console.warn('Failed to update video status:', updateError);
      }

      return {
        videoId: cloudflareVideoId,
        databaseVideoId: videoId,
        thumbnailUrl: '', // 需要通过轮询获取
        videoUrl: '', // 需要通过轮询获取
        status: 'processing'
      };
    } catch (error) {
      console.error('视频上传失败:', error);
      throw error;
    }
  }

  // 从数据库获取视频状态
  async getVideoStatus(videoId: string): Promise<{ status: string; playback?: { hls?: string } }> {
    try {
      // 通过数据库查询视频状态，避免直接调用 Cloudflare API
      const { data, error } = await supabase
        .from('product_videos')
        .select('status, video_url, thumbnail_url, cloudflare_video_id')
        .eq('cloudflare_video_id', videoId)
        .single();

      if (error) {
        throw new Error('Failed to get video status from database');
      }

      return {
        status: data.status || 'unknown',
        playback: data.video_url ? { hls: data.video_url } : undefined
      };
    } catch (error) {
      console.error('获取视频状态失败:', error);
      throw error;
    }
  }

  // 通过 Edge Function 检查 Cloudflare 视频状态并更新数据库
  async checkVideoStatusFromCloudflare(cloudflareVideoId: string): Promise<VideoProcessingResult> {
    try {
      const { data, error } = await supabase.functions.invoke('video-status', {
        body: { cloudflareVideoId }
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to check video status');
      }

      const statusData: VideoStatusResponse = data;
      
      return {
        videoUrl: statusData.playbackUrl || null,
        thumbnailUrl: statusData.thumbnailUrl || null,
        duration: statusData.duration || null,
        status: statusData.status,
        readyToStream: statusData.readyToStream
      };
    } catch (error) {
      console.error('检查视频状态失败:', error);
      throw error;
    }
  }

  // 轮询视频状态直到处理完成
  async pollVideoStatus(
    cloudflareVideoId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (result: VideoProcessingResult) => void;
    } = {}
  ): Promise<VideoProcessingResult> {
    const { maxAttempts = 60, intervalMs = 10000, onProgress } = options; // 默认10分钟，每10秒检查一次
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.checkVideoStatusFromCloudflare(cloudflareVideoId);
        
        // 通知进度回调
        if (onProgress) {
          onProgress(result);
        }
        
        // 如果视频已就绪且有必要信息，返回结果
        if (result.readyToStream && result.videoUrl && result.thumbnailUrl) {
          return result;
        }
        
        // 如果处理失败，直接返回
        if (result.status === 'error' || result.status === 'failed') {
          throw new Error(`Video processing failed with status: ${result.status}`);
        }
        
        // 等待下次检查
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(`轮询视频状态失败 (第${attempt + 1}次尝试):`, error);
        
        // 如果是最后一次尝试，抛出错误
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        
        // 继续下一次尝试
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    
    // 超时，返回当前状态
    const finalResult = await this.checkVideoStatusFromCloudflare(cloudflareVideoId);
    console.warn('视频处理轮询超时，返回当前状态:', finalResult);
    return finalResult;
  }

  // 检查未完成的视频并更新状态
  async checkPendingVideos(): Promise<void> {
    try {
      // 查找状态为 uploading 或 processing 的视频
      const { data: pendingVideos, error } = await supabase
        .from('product_videos')
        .select('id, cloudflare_video_id, title')
        .in('status', ['uploading', 'processing'])
        .not('cloudflare_video_id', 'is', null);
      
      if (error) {
        console.error('查询待处理视频失败:', error);
        return;
      }
      
      if (!pendingVideos || pendingVideos.length === 0) {
        return;
      }
      
      console.log(`发现 ${pendingVideos.length} 个待处理视频，开始检查状态`);
      
      // 并发检查所有待处理视频的状态
      const statusPromises = pendingVideos.map(async (video: { id: string; cloudflare_video_id: string; title: string }) => {
        try {
          await this.checkVideoStatusFromCloudflare(video.cloudflare_video_id);
          console.log(`视频 "${video.title}" 状态已更新`);
        } catch (error) {
          console.error(`更新视频 "${video.title}" 状态失败:`, error);
        }
      });
      
      await Promise.allSettled(statusPromises);
      
    } catch (error) {
      console.error('检查待处理视频失败:', error);
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    try {
      // 通过数据库软删除，避免直接调用 Cloudflare API
      const { error } = await supabase
        .from('product_videos')
        .update({ is_active: false, status: 'deleted' })
        .eq('cloudflare_video_id', videoId);

      if (error) {
        throw new Error('Failed to delete video');
      }
    } catch (error) {
      console.error('删除视频失败:', error);
      throw error;
    }
  }
}

export const cloudflareStreamService = new CloudflareStreamService();