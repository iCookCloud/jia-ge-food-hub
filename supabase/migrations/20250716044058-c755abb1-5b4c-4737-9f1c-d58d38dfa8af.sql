-- 分步骤创建测试数据
-- 1. 首先确保有supplier_credentials数据
DO $$
DECLARE
    supplier_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO supplier_count FROM public.supplier_credentials WHERE verification_status = 'verified';
    
    IF supplier_count = 0 THEN
        -- 如果没有验证的供应商，创建一个
        INSERT INTO public.supplier_credentials (
            user_id,
            company_name,
            contact_person,
            contact_phone,
            contact_email,
            verification_status
        ) VALUES (
            (SELECT id FROM public.profiles LIMIT 1),
            '测试供应商公司',
            '张经理',
            '138-0000-0001',
            'test@supplier.com',
            'verified'
        );
    END IF;
END $$;

-- 2. 创建商品列表
INSERT INTO public.product_lists (
    supplier_id,
    name,
    description,
    is_active,
    is_public
) VALUES 
(
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    '精选海鲜商品列表',
    '包含挪威三文鱼、澳洲龙虾、新鲜贝类等高品质海鲜',
    true,
    true
),
(
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    '优质肉类商品列表', 
    '精选牛肉卷、羊肉片、猪肉丸等火锅专用肉类',
    true,
    true
),
(
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    '有机蔬菜商品列表',
    '当季新鲜有机蔬菜，无农药无污染，健康生活首选',
    true,
    true
);