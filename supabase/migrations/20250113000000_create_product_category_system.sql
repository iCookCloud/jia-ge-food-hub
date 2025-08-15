-- 创建产品分类系统
-- 这个迁移文件创建支持多级分类的完整产品分类体系

-- 1. 产品分类表 (支持多级层次结构)
CREATE TABLE product_categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,          -- 分类名称
  slug VARCHAR(100) NOT NULL UNIQUE,   -- URL友好的标识符
  description TEXT,                    -- 分类描述
  parent_id BIGINT REFERENCES product_categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,    -- 分类层级 (1:一级分类, 2:二级分类, 3:三级分类)
  sort_order INTEGER DEFAULT 0,        -- 排序权重
  is_active BOOLEAN DEFAULT true,      -- 是否启用
  icon VARCHAR(50),                    -- 分类图标
  color VARCHAR(7),                    -- 分类颜色 (hex格式)
  metadata JSONB DEFAULT '{}',         -- 扩展属性(额外配置信息)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 产品分类关联表 (产品与分类的多对多关系)
CREATE TABLE product_category_relations (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,    -- 产品ID (来自Global ERP)
  category_id BIGINT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,    -- 是否为主分类
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- 3. 分类属性定义表 (每个分类可以有特定的属性)
CREATE TABLE category_attributes (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  attribute_name VARCHAR(100) NOT NULL, -- 属性名称
  attribute_type VARCHAR(50) NOT NULL,  -- 属性类型: text,number,select,multi_select,boolean
  is_required BOOLEAN DEFAULT false,    -- 是否必填
  options JSONB DEFAULT '{}',          -- 选项配置 (对于select类型)
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 产品属性值表 (存储产品的具体属性值)
CREATE TABLE product_attribute_values (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  attribute_id BIGINT NOT NULL REFERENCES category_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,                 -- 属性值
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, attribute_id)
);

-- 5. 创建索引优化查询性能
-- 分类层级查询优化
CREATE INDEX idx_product_categories_parent_level ON product_categories(parent_id, level) WHERE is_active = true;
CREATE INDEX idx_product_categories_slug ON product_categories(slug) WHERE is_active = true;
CREATE INDEX idx_product_categories_level ON product_categories(level) WHERE is_active = true;

-- 产品分类关联查询优化
CREATE INDEX idx_product_category_relations_product ON product_category_relations(product_id);
CREATE INDEX idx_product_category_relations_category ON product_category_relations(category_id);
CREATE INDEX idx_product_category_relations_primary ON product_category_relations(product_id, is_primary) WHERE is_primary = true;

-- 属性查询优化
CREATE INDEX idx_category_attributes_category ON category_attributes(category_id) WHERE is_active = true;
CREATE INDEX idx_product_attribute_values_product ON product_attribute_values(product_id);
CREATE INDEX idx_product_attribute_values_attribute ON product_attribute_values(attribute_id);

-- 6. 创建分类路径视图 (获取完整分类层次路径)
CREATE OR REPLACE VIEW category_paths AS
WITH RECURSIVE category_tree AS (
  -- 根分类
  SELECT 
    id, 
    name, 
    slug, 
    parent_id, 
    level,
    sort_order,
    is_active,
    ARRAY[name]::VARCHAR[] as path_names, 
    ARRAY[id]::BIGINT[] as path_ids,
    ARRAY[slug]::VARCHAR[] as path_slugs,
    name::TEXT as full_path,
    slug::TEXT as full_slug_path
  FROM product_categories
  WHERE parent_id IS NULL AND is_active = true
  
  UNION ALL
  
  -- 子分类递归
  SELECT 
    c.id, 
    c.name, 
    c.slug, 
    c.parent_id, 
    c.level,
    c.sort_order,
    c.is_active,
    ct.path_names || c.name::VARCHAR as path_names,
    ct.path_ids || c.id as path_ids,
    ct.path_slugs || c.slug::VARCHAR as path_slugs,
    (ct.full_path || ' > ' || c.name)::TEXT as full_path,
    (ct.full_slug_path || '/' || c.slug)::TEXT as full_slug_path
  FROM product_categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
  WHERE c.is_active = true
)
SELECT * FROM category_tree
ORDER BY level, sort_order, name;

-- 7. 创建产品完整分类信息视图
CREATE OR REPLACE VIEW product_category_info AS
SELECT 
  pcr.product_id,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  c.level as category_level,
  c.parent_id,
  pcr.is_primary,
  cp.full_path,
  cp.full_slug_path,
  cp.path_names,
  cp.path_ids
FROM product_category_relations pcr
JOIN product_categories c ON pcr.category_id = c.id
JOIN category_paths cp ON c.id = cp.id
WHERE c.is_active = true
ORDER BY pcr.product_id, c.level, c.sort_order;

-- 8. 创建分类统计视图 (统计每个分类下的产品数量)
CREATE OR REPLACE VIEW category_statistics AS
SELECT 
  c.id,
  c.name,
  c.slug,
  c.level,
  c.parent_id,
  COUNT(pcr.product_id) as product_count,
  COUNT(CASE WHEN pcr.is_primary THEN 1 END) as primary_product_count
FROM product_categories c
LEFT JOIN product_category_relations pcr ON c.id = pcr.category_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.slug, c.level, c.parent_id
ORDER BY c.level, c.sort_order, c.name;

-- 9. 添加触发器自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_attributes_updated_at
  BEFORE UPDATE ON category_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_attribute_values_updated_at
  BEFORE UPDATE ON product_attribute_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 添加约束确保数据完整性
-- 确保分类层级不超过3级
ALTER TABLE product_categories 
ADD CONSTRAINT check_category_level CHECK (level >= 1 AND level <= 3);

-- 确保父分类的层级必须小于子分类
CREATE OR REPLACE FUNCTION check_category_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_level INTEGER;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT level INTO parent_level FROM product_categories WHERE id = NEW.parent_id;
    IF parent_level IS NULL THEN
      RAISE EXCEPTION 'Parent category does not exist';
    END IF;
    IF NEW.level <= parent_level THEN
      RAISE EXCEPTION 'Child category level must be greater than parent level';
    END IF;
  ELSE
    -- 顶级分类必须是level 1
    IF NEW.level != 1 THEN
      RAISE EXCEPTION 'Root categories must have level 1';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_category_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION check_category_hierarchy();

-- 11. 启用RLS (Row Level Security)
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

-- 创建RLS政策 (所有用户都可以读取活跃的分类数据)
CREATE POLICY "Allow read access to active categories" ON product_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow read access to category relations" ON product_category_relations
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to active category attributes" ON category_attributes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Allow read access to product attribute values" ON product_attribute_values
  FOR SELECT USING (true);

-- 管理员可以进行所有操作 (后续根据需要调整)
CREATE POLICY "Allow full access for admins" ON product_categories
  FOR ALL USING (true);

CREATE POLICY "Allow full access for admins on relations" ON product_category_relations
  FOR ALL USING (true);

CREATE POLICY "Allow full access for admins on attributes" ON category_attributes
  FOR ALL USING (true);

CREATE POLICY "Allow full access for admins on attribute values" ON product_attribute_values
  FOR ALL USING (true);

-- 添加注释
COMMENT ON TABLE product_categories IS '产品分类表，支持3级层次结构';
COMMENT ON TABLE product_category_relations IS '产品与分类的关联表，支持一对多关系';
COMMENT ON TABLE category_attributes IS '分类属性定义表，为不同分类定义特殊属性';
COMMENT ON TABLE product_attribute_values IS '产品属性值表，存储产品的具体属性值';
COMMENT ON VIEW category_paths IS '分类路径视图，显示完整的分类层次路径';
COMMENT ON VIEW product_category_info IS '产品分类信息视图，包含完整的分类路径信息';
COMMENT ON VIEW category_statistics IS '分类统计视图，显示各分类下的产品数量';