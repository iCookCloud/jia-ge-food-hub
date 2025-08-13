-- 简化版图片上传RLS修复
-- 创建时间: 2025-01-12

-- 1. 创建 uploaded_images 表
CREATE TABLE IF NOT EXISTS public.uploaded_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_name TEXT NOT NULL,
    folder_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 启用 RLS
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略
CREATE POLICY "Users can view their own uploaded images" 
ON public.uploaded_images FOR SELECT 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can create their own uploaded images" 
ON public.uploaded_images FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own uploaded images" 
ON public.uploaded_images FOR UPDATE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own uploaded images" 
ON public.uploaded_images FOR DELETE 
USING (auth.uid() = uploaded_by);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_uploaded_images_uploaded_by ON public.uploaded_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_bucket_folder ON public.uploaded_images(bucket_name, folder_path);

-- 完成
SELECT 'Simple image upload RLS fix completed' as status;
