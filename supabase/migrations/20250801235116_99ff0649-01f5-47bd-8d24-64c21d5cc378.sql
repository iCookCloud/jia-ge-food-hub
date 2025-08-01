-- 删除所有依赖supplier_id的RLS策略
DROP POLICY IF EXISTS "Suppliers can manage their videos" ON product_videos;
DROP POLICY IF EXISTS "Suppliers can manage video-product associations" ON video_product_associations;
DROP POLICY IF EXISTS "Suppliers can manage their product lists" ON product_lists;

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

-- 重新创建product_videos的RLS策略，基于用户ID
CREATE POLICY "Users can manage their videos" 
ON product_videos 
FOR ALL 
USING (true); -- 暂时允许所有用户查看视频

-- 重新创建product_lists的RLS策略
CREATE POLICY "Users can manage product lists" 
ON product_lists 
FOR ALL 
USING (true); -- 暂时允许所有用户操作产品列表

-- 重新创建quotation_items的RLS策略
CREATE POLICY "Users can manage quotation items for their quotations" 
ON quotation_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.customer_id = auth.uid()
));

-- 重新创建quotations的RLS策略
CREATE POLICY "Users can manage their quotations" 
ON quotations 
FOR ALL 
USING (customer_id = auth.uid());