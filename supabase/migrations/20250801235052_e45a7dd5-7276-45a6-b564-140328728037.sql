-- 删除依赖supplier_id的RLS策略
DROP POLICY IF EXISTS "Suppliers can manage their quotations" ON quotations;
DROP POLICY IF EXISTS "Users can manage quotation items for their quotations" ON quotation_items;

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

-- 重新创建quotation_items的RLS策略，不依赖supplier_id
CREATE POLICY "Users can manage quotation items for their quotations" 
ON quotation_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.customer_id = auth.uid()
));

-- 重新创建quotations的RLS策略，只允许客户查看他们的报价
CREATE POLICY "Users can manage their quotations" 
ON quotations 
FOR ALL 
USING (customer_id = auth.uid());