-- 3. 创建货单数据，使用刚创建的商品列表
INSERT INTO public.quotations (
    supplier_id,
    product_list_id,
    sheet_name,
    rebate_total,
    total_amount,
    status,
    is_shareable,
    notes
) VALUES 
(
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    (SELECT id FROM public.product_lists WHERE name LIKE '%海鲜%' LIMIT 1),
    '精选海鲜货单 - 春季特惠',
    500.00,
    15000.00,
    'draft',
    true,
    '包含挪威三文鱼、澳洲龙虾、新鲜贝类等高品质海鲜'
),
(
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    (SELECT id FROM public.product_lists WHERE name LIKE '%肉类%' LIMIT 1),
    '优质肉类组合 - 火锅专用',
    300.00,
    8500.00,
    'draft',
    true,
    '精选牛肉卷、羊肉片、猪肉丸等火锅专用肉类'
),
(
    (SELECT user_id FROM public.supplier_credentials WHERE verification_status = 'verified' LIMIT 1),
    (SELECT id FROM public.product_lists WHERE name LIKE '%蔬菜%' LIMIT 1),
    '有机蔬菜礼盒 - 健康首选',
    200.00,
    3500.00,
    'draft',
    true,
    '当季新鲜有机蔬菜，无农药无污染，健康生活首选'
);