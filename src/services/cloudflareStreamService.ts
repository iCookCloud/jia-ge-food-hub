import { supabase } from '@/integrations/supabase/client';

export interface CloudflareUploadResponse {
  result: {
    uid: string;
    thumbnail: string;
    playback: {
      hls: string;
      dash: string;
    };
    status: {
      state: string;
    };
    preview: string;
    duration: number;
  };
  success: boolean;
  errors: any[];
}

export interface VideoUploadResult {
  videoId: string;
  thumbnailUrl: string;
  videoUrl: string;
  status: string;
  duration?: number;
}

class CloudflareStreamService {
  private readonly ACCOUNT_ID = '0eec91f6c6cb0ea6076bd1fe796a78a0';
  private readonly CLOUDFLARE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${this.ACCOUNT_ID}/stream`;

  private async getApiKey(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('get-secret', {
      body: { name: 'CLOUDFLARE_API_KEY' }
    });

    if (error || !data?.value) {
      throw new Error('Cloudflare API key not configured');
    }

    return data.value;
  }

  async uploadVideo(file: File): Promise<VideoUploadResult> {
    try {
      const apiKey = await this.getApiKey();
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(this.CLOUDFLARE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: CloudflareUploadResponse = await response.json();

      if (!result.success) {
        throw new Error(`Cloudflare upload failed: ${result.errors.join(', ')}`);
      }

      return {
        videoId: result.result.uid,
        thumbnailUrl: result.result.thumbnail,
        videoUrl: result.result.playback.hls,
        status: result.result.status.state,
        duration: result.result.duration,
      };
    } catch (error) {
      console.error('视频上传失败:', error);
      throw error;
    }
  }

  async getVideoStatus(videoId: string): Promise<{ status: string; playback?: any }> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`${this.CLOUDFLARE_API_URL}/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get video status: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        status: result.result.status.state,
        playback: result.result.playback,
      };
    } catch (error) {
      console.error('获取视频状态失败:', error);
      throw error;
    }
  }

  async deleteVideo(videoId: string): Promise<void> {
    try {
      const apiKey = await this.getApiKey();
      
      const response = await fetch(`${this.CLOUDFLARE_API_URL}/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete video: ${response.statusText}`);
      }
    } catch (error) {
      console.error('删除视频失败:', error);
      throw error;
    }
  }
}

export const cloudflareStreamService = new CloudflareStreamService();