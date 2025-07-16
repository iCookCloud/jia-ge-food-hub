import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { VideoUpload } from "@/components/upload/VideoUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function VideoUploadPage() {
  const navigate = useNavigate();
  const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);

  const handleUploadComplete = (video: any) => {
    setUploadedVideos(prev => [...prev, video]);
  };

  const handleUploadError = (error: string) => {
    console.error('视频上传错误:', error);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 页面头部 */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">视频上传</h1>
          </div>
        </div>

        {/* 上传说明 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">上传说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span>支持格式：MP4、MOV、AVI、WMV、WebM</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span>文件大小：最大 500MB</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span>视频会自动上传到 Cloudflare Stream 进行处理和优化</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-medium">•</span>
              <span>上传完成后，视频将在视频中心展示，其他用户可以查看</span>
            </div>
          </CardContent>
        </Card>

        {/* 视频上传组件 */}
        <Card>
          <CardHeader>
            <CardTitle>上传视频</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoUpload 
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </CardContent>
        </Card>

        {/* 上传成功的视频列表 */}
        {uploadedVideos.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>已上传视频 ({uploadedVideos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedVideos.map((video, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-3">
                      <Video className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{video.title}</p>
                        {video.description && (
                          <p className="text-sm text-muted-foreground">{video.description}</p>
                        )}
                      </div>
                    </div>
                    <Link to={`/materials/${video.id}`}>
                      <Button variant="outline" size="sm">
                        查看详情
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}