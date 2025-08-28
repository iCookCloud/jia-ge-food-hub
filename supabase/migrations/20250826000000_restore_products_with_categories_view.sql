-- 恢复 products_with_categories 视图
-- 创建时间: 2025-08-26
-- 问题: 该视图被意外删除，导致产品查询功能全面失效
-- 影响: ProductSelector, 推荐系统, 搜索功能, 案例商品关联等

-- 删除视图（如果存在）
DROP VIEW IF EXISTS products_with_categories;

-- 创建 products_with_categories 视图
CREATE VIEW products_with_categories AS
SELECT 
  -- 基础商品字段
  p.id,
  p.sku,
  p.standard_chinese_name,
  p.standard_english_name,
  p.unit_price,
  p.specifications,
  p.product_image,
  p.vendor,
  p.user_id,
  p.is_active,
  p.is_public,
  p.is_fragile,
  p.requires_cold_chain,
  p.review_status,
  p.source_type,
  p.created_at,
  p.updated_at,
  
  -- 原有产品表字段
  p.category_chinese,
  p.category_english,
  p.subcategory,
  p.quantity,
  p.unit,
  p.storage_requirements,
  p.outer_box_dimensions,
  
  -- 主分类相关字段
  pc.id as primary_category_id,
  pc.name as primary_category_name,
  pc.slug as primary_category_slug,
  pc.level as primary_category_level,
  
  -- 分类路径字段（简化版本）
  pc.name as primary_category_path,
  ARRAY[pc.id] as primary_category_path_ids,
  ARRAY[pc.id] as all_category_ids,
  ARRAY[pc.name] as all_category_names,
  ARRAY[pc.name] as all_category_paths,
  ARRAY[pc.id] as searchable_category_ids,
  
  -- 搜索文本字段（组合多个字段用于全文搜索）
  CONCAT_WS(' ', 
    p.standard_chinese_name, 
    p.standard_english_name, 
    p.sku, 
    p.specifications,
    p.category_chinese,
    p.category_english,
    pc.name
  ) as search_text

FROM products p
LEFT JOIN product_category_relations pcr ON p.id = pcr.product_id AND pcr.is_primary = true
LEFT JOIN product_categories pc ON pcr.category_id = pc.id;

-- 添加注释
COMMENT ON VIEW products_with_categories IS '产品与分类的综合视图，包含搜索优化字段和分类关联信息';

-- 验证视图创建成功
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM products_with_categories WHERE is_active = true;
    RAISE NOTICE 'products_with_categories 视图创建成功，包含 % 个活跃商品', record_count;
END $$;