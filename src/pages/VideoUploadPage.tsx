import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FileInput } from "@/components/ui/file-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Video } from "lucide-react";

const VideoUploadPage = () => {
  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadedVideos, setUploadedVideos] = useState<
    { title: string; videoUrl: string; thumbnailUrl: string }[]
  >([]);
  const [isActive, setIsActive] = useState(true);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleVideoFileChange = (file: File | null) => {
    setVideoFile(file);
  };

  const handleThumbnailFileChange = (file: File | null) => {
    setThumbnailFile(file);
  };

  const handleIsActiveChange = (checked: boolean) => {
    setIsActive(checked);
  };

  const handleUpload = () => {
    if (!title || !videoFile || !thumbnailFile) {
      alert("请填写标题、选择视频文件和缩略图");
      return;
    }

    // 这里应该是上传到 Supabase Storage 的逻辑
    const videoUrl = URL.createObjectURL(videoFile);
    const thumbnailUrl = URL.createObjectURL(thumbnailFile);

    setUploadedVideos([
      ...uploadedVideos,
      { title, videoUrl, thumbnailUrl },
    ]);

    // 清空表单
    setTitle("");
    setVideoFile(null);
    setThumbnailFile(null);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">上传商品视频</h1>

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">视频标题</Label>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                />
              </div>

              <div>
                <Label htmlFor="video">视频文件</Label>
                <FileInput
                  id="video"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                />
              </div>

              <div>
                <Label htmlFor="thumbnail">缩略图</Label>
                <FileInput
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={isActive}
                  onCheckedChange={handleIsActiveChange}
                />
                <Label htmlFor="active">是否上线</Label>
              </div>

              <Button onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                上传
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded list */}
        <div className="mt-6 space-y-3">
          {uploadedVideos.map((uploadedVideo, index) => (
            <Card key={index}>
              <CardContent className="flex items-center space-x-4">
                <Video className="w-6 h-6 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{uploadedVideo.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    视频地址: {uploadedVideo.videoUrl}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    缩略图地址: {uploadedVideo.thumbnailUrl}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default VideoUploadPage;
