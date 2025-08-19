-- 简化版图片上传RLS修复
-- 创建时间: 2025-01-12

-- 1. 创建 uploaded_images 表
CREATE TABLE IF NOT EXISTS public.uploaded_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT DEFAULT '产品展示',
    tags TEXT[] DEFAULT '{}',
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
CREATE INDEX IF NOT EXISTS idx_uploaded_images_category ON public.uploaded_images(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_tags ON public.uploaded_images USING GIN(tags);

-- 5. 创建图片产品关联表
CREATE TABLE IF NOT EXISTS public.image_product_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES public.uploaded_images(id) ON DELETE CASCADE,
    original_product_id TEXT NOT NULL,
    product_snapshot JSONB NOT NULL,
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    snapshot_source TEXT DEFAULT 'global_erp',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. 启用图片产品关联表的 RLS
ALTER TABLE public.image_product_associations ENABLE ROW LEVEL SECURITY;

-- 7. 创建图片产品关联表的 RLS 策略
CREATE POLICY "Users can view image associations for their images" 
ON public.image_product_associations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.uploaded_images 
        WHERE id = image_product_associations.image_id 
        AND uploaded_by = auth.uid()
    )
);

CREATE POLICY "Users can create image associations for their images" 
ON public.image_product_associations FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.uploaded_images 
        WHERE id = image_product_associations.image_id 
        AND uploaded_by = auth.uid()
    )
);

CREATE POLICY "Users can update image associations for their images" 
ON public.image_product_associations FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.uploaded_images 
        WHERE id = image_product_associations.image_id 
        AND uploaded_by = auth.uid()
    )
);

CREATE POLICY "Users can delete image associations for their images" 
ON public.image_product_associations FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.uploaded_images 
        WHERE id = image_product_associations.image_id 
        AND uploaded_by = auth.uid()
    )
);

-- 8. 创建图片产品关联表的索引
CREATE INDEX IF NOT EXISTS idx_image_product_associations_image_id ON public.image_product_associations(image_id);
CREATE INDEX IF NOT EXISTS idx_image_product_associations_original_product_id ON public.image_product_associations(original_product_id);
CREATE INDEX IF NOT EXISTS idx_image_product_associations_product_sku ON public.image_product_associations(product_sku);
CREATE INDEX IF NOT EXISTS idx_image_product_associations_snapshot_source ON public.image_product_associations(snapshot_source);

-- 完成
SELECT 'Enhanced image upload with metadata and associations completed' as status;









