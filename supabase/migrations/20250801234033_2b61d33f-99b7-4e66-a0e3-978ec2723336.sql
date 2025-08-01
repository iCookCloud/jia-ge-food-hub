-- 删除供应商相关的表
DROP TABLE IF EXISTS supplier_credentials CASCADE;

-- 从其他表中删除供应商相关的字段
ALTER TABLE quotations 
DROP COLUMN IF EXISTS supplier_id,
DROP COLUMN IF EXISTS origin_supplier_id;

ALTER TABLE orders 
DROP COLUMN IF EXISTS origin_supplier_id;

ALTER TABLE product_videos 
DROP COLUMN IF EXISTS supplier_id;

ALTER TABLE product_lists 
DROP COLUMN IF EXISTS supplier_id;