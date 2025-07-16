-- 创建测试供应商数据
-- 首先为现有用户创建供应商认证记录
INSERT INTO public.supplier_credentials (
    user_id, 
    company_name, 
    contact_person, 
    contact_phone, 
    contact_email, 
    verification_status
)
SELECT 
    p.id,
    CASE 
        WHEN p.nickname IS NOT NULL THEN p.nickname || '食材供应公司'
        ELSE '佳格食材供应公司'
    END as company_name,
    COALESCE(p.nickname, '联系人') as contact_person,
    '138-0000-0000' as contact_phone,
    'contact@' || p.id::text || '.com' as contact_email,
    'verified' as verification_status
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.supplier_credentials sc 
    WHERE sc.user_id = p.id
)
LIMIT 3;

-- 为现有商品分配供应商
-- 随机分配前100个商品给第一个供应商
UPDATE public.products 
SET user_id = (
    SELECT user_id FROM public.supplier_credentials 
    WHERE verification_status = 'verified' 
    LIMIT 1
)
WHERE user_id IS NULL 
AND id IN (
    SELECT id FROM public.products 
    WHERE user_id IS NULL 
    ORDER BY created_at 
    LIMIT 100
);

-- 创建一些测试视频记录
INSERT INTO public.product_videos (
    supplier_id,
    title,
    description,
    status,
    video_url,
    thumbnail_url
)
SELECT 
    sc.user_id,
    '商品展示视频 - ' || (ROW_NUMBER() OVER())::text,
    '展示我们优质的食材产品',
    'ready',
    'https://example.com/video' || (ROW_NUMBER() OVER())::text || '.mp4',
    'https://example.com/thumb' || (ROW_NUMBER() OVER())::text || '.jpg'
FROM public.supplier_credentials sc
WHERE verification_status = 'verified'
LIMIT 5;