-- 确保所有商品默认为可参与状态
-- 1. 更新所有现有商品为活跃状态
UPDATE products 
SET is_active = true, updated_at = now()
WHERE is_active IS NULL OR is_active = false;

-- 2. 确保 is_active 字段的默认值为 true
ALTER TABLE products 
ALTER COLUMN is_active SET DEFAULT true;

-- 3. 更新所有现有货单为可分享状态（如果需要）
UPDATE quotations 
SET is_shareable = true, updated_at = now()
WHERE is_shareable IS NULL OR is_shareable = false;

-- 4. 确保 is_shareable 字段的默认值为 true  
ALTER TABLE quotations 
ALTER COLUMN is_shareable SET DEFAULT true;