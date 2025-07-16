-- 创建一些测试货单数据
INSERT INTO public.quotations (
    id,
    supplier_id,
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
    '有机蔬菜礼盒 - 健康首选',
    200.00,
    3500.00,
    'active',
    true,
    '当季新鲜有机蔬菜，无农药无污染，健康生活首选',
    now() - interval '3 hours'
),
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    '调料大全 - 厨房必备',
    150.00,
    2800.00,
    'active',
    true,
    '包含各种进口调料、香料、酱料等厨房必备品',
    now() - interval '5 hours'
),
(
    gen_random_uuid(),
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1 OFFSET 1),
    '冷冻食品专场 - 便捷美味',
    400.00,
    12000.00,
    'active',
    true,
    '精选冷冻海鲜、速冻面点、冷冻蔬菜等便捷食品',
    now() - interval '1 hour'
);

-- 创建一些测试分享链路数据
INSERT INTO public.share_chains (
    sheet_id,
    user_id,
    parent_id,
    share_depth,
    share_code,
    children_count,
    total_orders,
    total_sales,
    total_commission
) VALUES 
(
    (SELECT id FROM public.quotations WHERE sheet_name LIKE '%海鲜%' LIMIT 1),
    (SELECT id FROM public.profiles LIMIT 1),
    NULL,
    0,
    'SHARE001',
    3,
    5,
    25000.00,
    1250.00
),
(
    (SELECT id FROM public.quotations WHERE sheet_name LIKE '%肉类%' LIMIT 1),
    (SELECT id FROM public.profiles LIMIT 1 OFFSET 1),
    NULL,
    0,
    'SHARE002',
    2,
    3,
    15000.00,
    750.00
),
(
    (SELECT id FROM public.quotations WHERE sheet_name LIKE '%蔬菜%' LIMIT 1),
    (SELECT id FROM public.profiles LIMIT 1 OFFSET 2),
    NULL,
    0,
    'SHARE003',
    1,
    2,
    7000.00,
    350.00
);