-- 创建统一素材视图
-- 创建时间: 2025-08-17

-- 1. 首先给 product_videos 表添加缺失的字段
ALTER TABLE public.product_videos 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '产品介绍',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS content TEXT;

-- 2. 为新字段创建索引
CREATE INDEX IF NOT EXISTS idx_product_videos_uploaded_by ON public.product_videos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_product_videos_category ON public.product_videos(category);
CREATE INDEX IF NOT EXISTS idx_product_videos_tags ON public.product_videos USING GIN(tags);

-- 3. 创建统一素材视图
CREATE OR REPLACE VIEW public.materials_unified AS
(
  -- 视频素材
  SELECT 
    id,
    title,
    description,
    content,
    category,
    tags,
    created_at,
    updated_at,
    uploaded_by,
    'video'::text as type,
    -- 视频特有字段
    video_url,
    thumbnail_url,
    duration_seconds,
    cloudflare_video_id,
    status,
    -- 图片字段设为 NULL
    NULL::text as public_url,
    NULL::text as file_path,
    NULL::bigint as file_size,
    NULL::text as mime_type,
    NULL::text as bucket_name,
    NULL::text as folder_path
  FROM public.product_videos 
  WHERE is_active = true AND status = 'ready'
)
UNION ALL
(
  -- 图片素材
  SELECT 
    id,
    title,
    description,
    content,
    category,
    tags,
    created_at,
    updated_at,
    uploaded_by,
    'image'::text as type,
    -- 视频字段设为 NULL
    NULL::text as video_url,
    NULL::text as thumbnail_url,
    NULL::integer as duration_seconds,
    NULL::text as cloudflare_video_id,
    NULL::text as status,
    -- 图片特有字段
    public_url,
    file_path,
    file_size,
    mime_type,
    bucket_name,
    folder_path
  FROM public.uploaded_images 
  WHERE is_active = true
);

-- 4. 为视图添加注释
COMMENT ON VIEW public.materials_unified IS '统一素材视图：合并视频和图片素材，支持统一查询和分页';

-- 5. 给现有视频记录设置默认值（如果 uploaded_by 为空）
-- 注意：这需要根据实际业务逻辑调整
UPDATE public.product_videos 
SET uploaded_by = supplier_id 
WHERE uploaded_by IS NULL AND supplier_id IS NOT NULL;

-- 完成提示
SELECT 'Materials unified view created successfully' as status;