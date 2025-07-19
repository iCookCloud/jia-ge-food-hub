-- 临时禁用约束检查并插入profiles数据
SET session_replication_role = replica;

-- 为测试供应商创建对应的profiles记录
INSERT INTO public.profiles (
  id,
  nickname,
  avatar_url,
  created_at
) VALUES 
-- 供应商1的profile
(
  '11111111-1111-1111-1111-111111111111',
  '鲜绿农产品',
  NULL,
  NOW() - INTERVAL '30 days'
),
-- 供应商2的profile  
(
  '22222222-2222-2222-2222-222222222222',
  '优质肉业',
  NULL,
  NOW() - INTERVAL '15 days'
),
-- 供应商3的profile
(
  '33333333-3333-3333-3333-333333333333',
  '香满天调料',
  NULL,
  NOW() - INTERVAL '7 days'
);

-- 恢复约束检查
SET session_replication_role = DEFAULT;