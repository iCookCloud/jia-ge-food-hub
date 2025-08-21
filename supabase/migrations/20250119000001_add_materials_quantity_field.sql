-- 为materials相关表添加数量字段
-- 支持展示案例的库存管理

-- 1. 为 product_videos 表添加数量字段
ALTER TABLE public.product_videos 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'limited')),
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT NULL;

-- 2. 为 uploaded_images 表添加数量字段
ALTER TABLE public.uploaded_images 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'limited')),
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_quantity INTEGER DEFAULT NULL;

-- 3. 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_product_videos_stock_status ON public.product_videos(stock_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_stock_status ON public.uploaded_images(stock_status);
CREATE INDEX IF NOT EXISTS idx_product_videos_quantity ON public.product_videos(quantity);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_quantity ON public.uploaded_images(quantity);

-- 4. 更新统一素材视图，包含数量字段
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
    -- 数量相关字段
    quantity,
    stock_status,
    min_quantity,
    max_quantity,
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
    -- 数量相关字段
    quantity,
    stock_status,
    min_quantity,
    max_quantity,
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

-- 5. 更新视图注释
COMMENT ON VIEW public.materials_unified IS '统一素材视图：合并视频和图片素材，支持统一查询和分页，包含数量管理功能';

-- 6. 创建材料编辑的RLS策略
-- 允许管理员编辑所有材料
CREATE POLICY IF NOT EXISTS "Admins can update all materials" ON public.product_videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (
                id IN (
                    SELECT user_id FROM user_roles 
                    WHERE role_name IN ('admin', 'super_admin')
                )
            )
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can update all images" ON public.uploaded_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (
                id IN (
                    SELECT user_id FROM user_roles 
                    WHERE role_name IN ('admin', 'super_admin')
                )
            )
        )
    );

-- 7. 创建材料更新函数
CREATE OR REPLACE FUNCTION update_material_quantity(
    material_id UUID,
    material_type TEXT,
    new_quantity INTEGER,
    new_stock_status TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- 验证用户权限
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND (
            id IN (
                SELECT user_id FROM user_roles 
                WHERE role_name IN ('admin', 'super_admin')
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- 更新视频材料
    IF material_type = 'video' THEN
        UPDATE public.product_videos 
        SET 
            quantity = new_quantity,
            stock_status = COALESCE(new_stock_status, stock_status),
            updated_at = NOW()
        WHERE id = material_id;
    
    -- 更新图片材料
    ELSIF material_type = 'image' THEN
        UPDATE public.uploaded_images 
        SET 
            quantity = new_quantity,
            stock_status = COALESCE(new_stock_status, stock_status),
            updated_at = NOW()
        WHERE id = material_id;
    
    ELSE
        RAISE EXCEPTION 'Invalid material type: %', material_type;
    END IF;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

