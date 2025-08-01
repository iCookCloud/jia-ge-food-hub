-- 使用CASCADE强制删除所有依赖对象
ALTER TABLE quotations DROP COLUMN supplier_id CASCADE;
ALTER TABLE quotations DROP COLUMN origin_supplier_id CASCADE;
ALTER TABLE orders DROP COLUMN origin_supplier_id CASCADE;
ALTER TABLE product_videos DROP COLUMN supplier_id CASCADE;
ALTER TABLE product_lists DROP COLUMN supplier_id CASCADE;

-- 删除供应商相关的表
DROP TABLE IF EXISTS supplier_credentials CASCADE;

-- 重新创建必要的RLS策略
CREATE POLICY "Users can manage their videos" 
ON product_videos 
FOR ALL 
USING (true);

CREATE POLICY "Users can manage product lists" 
ON product_lists 
FOR ALL 
USING (true);

CREATE POLICY "Users can manage quotation items for their quotations" 
ON quotation_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.customer_id = auth.uid()
));

CREATE POLICY "Users can manage their quotations" 
ON quotations 
FOR ALL 
USING (customer_id = auth.uid());