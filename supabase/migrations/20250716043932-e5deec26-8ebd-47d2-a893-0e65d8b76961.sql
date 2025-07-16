-- 先创建一些测试商品列表，然后插入货单数据
-- 创建测试商品列表
INSERT INTO public.product_lists (
    id,
    supplier_id,
    name,
    description,
    is_active,
    is_public
) VALUES 
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    '精选海鲜商品列表',
    '包含挪威三文鱼、澳洲龙虾、新鲜贝类等高品质海鲜',
    true,
    true
),
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1 OFFSET 1),
    '优质肉类商品列表',
    '精选牛肉卷、羊肉片、猪肉丸等火锅专用肉类',
    true,
    true
),
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1 OFFSET 2),
    '有机蔬菜商品列表',
    '当季新鲜有机蔬菜，无农药无污染，健康生活首选',
    true,
    true
);

-- 现在插入货单数据，使用刚创建的商品列表
INSERT INTO public.quotations (
    id,
    supplier_id,
    product_list_id,
    sheet_name,
    rebate_total,
    total_amount,
    status,
    is_shareable,
    notes,
    created_at
) VALUES 
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    (SELECT id FROM public.product_lists WHERE name LIKE '%海鲜%' LIMIT 1),
    '精选海鲜货单 - 春季特惠',
    500.00,
    15000.00,
    'active',
    true,
    '包含挪威三文鱼、澳洲龙虾、新鲜贝类等高品质海鲜',
    now() - interval '2 days'
),
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1 OFFSET 1),
    (SELECT id FROM public.product_lists WHERE name LIKE '%肉类%' LIMIT 1),
    '优质肉类组合 - 火锅专用',
    300.00,
    8500.00,
    'active',
    true,
    '精选牛肉卷、羊肉片、猪肉丸等火锅专用肉类',
    now() - interval '1 day'
),
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1 OFFSET 2),
    (SELECT id FROM public.product_lists WHERE name LIKE '%蔬菜%' LIMIT 1),
    '有机蔬菜礼盒 - 健康首选',
    200.00,
    3500.00,
    'active',
    true,
    '当季新鲜有机蔬菜，无农药无污染，健康生活首选',
    now() - interval '3 hours'
);