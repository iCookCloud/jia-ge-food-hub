-- 创建3个测试供应商数据（使用随机UUID，不依赖特定用户）
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
  '香满天调料批发',
  '91110000MA009012BC',
  '王老板',
  '137-0000-9012',
  'wang@xiangman.com',
  'pending',
  NULL
);