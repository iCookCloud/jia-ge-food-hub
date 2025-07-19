-- 先创建用户档案
INSERT INTO public.profiles (
  id,
  nickname,
  avatar_url,
  phone
) VALUES 
(
  '00000000-1111-2222-3333-444444444444',
  '鲜绿农产品',
  NULL,
  '138-0000-1234'
),
(
  '00000000-1111-2222-3333-555555555555',
  '优质肉业',
  NULL,
  '139-0000-5678'
),
(
  '00000000-1111-2222-3333-666666666666',
  '香满天调料',
  NULL,
  '137-0000-9012'
);

-- 然后创建供应商凭证
INSERT INTO public.supplier_credentials (
  user_id,
  company_name,
  business_license,
  contact_person,
  contact_phone,
  contact_email,
  verification_status,
  verification_date
) VALUES 
-- 供应商1：已验证的蔬菜供应商
(
  '00000000-1111-2222-3333-444444444444',
  '鲜绿农产品有限公司',
  '91110000MA001234XY',
  '张经理',
  '138-0000-1234',
  'zhang@xianlv.com',
  'verified',
  NOW() - INTERVAL '30 days'
),
-- 供应商2：已验证的肉类供应商
(
  '00000000-1111-2222-3333-555555555555',
  '优质肉业集团',
  '91110000MA005678ZA',
  '李总监',
  '139-0000-5678',
  'li@youzhi.com',
  'verified',
  NOW() - INTERVAL '15 days'
),
-- 供应商3：待验证的调料供应商
(
  '00000000-1111-2222-3333-666666666666',
  '香满天调料批发',
  '91110000MA009012BC',
  '王老板',
  '137-0000-9012',
  'wang@xiangman.com',
  'pending',
  NULL
);