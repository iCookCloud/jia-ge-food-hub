-- 删除返利相关的表
DROP TABLE IF EXISTS commission_distributions CASCADE;
DROP TABLE IF EXISTS share_chains CASCADE;
DROP TABLE IF EXISTS distribution_applications CASCADE;
DROP TABLE IF EXISTS distribution_authorizations CASCADE;

-- 删除orders表中的返利相关字段
ALTER TABLE orders 
DROP COLUMN IF EXISTS rebate_total,
DROP COLUMN IF EXISTS rebate_chain,
DROP COLUMN IF EXISTS share_chain_id;

-- 删除quotations表中的返利相关字段
ALTER TABLE quotations 
DROP COLUMN IF EXISTS rebate_total;