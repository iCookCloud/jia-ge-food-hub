-- 插入初始分类数据
-- 根据分析报告建立3级分类体系的初始数据

-- 1. 插入一级分类 (大类)
INSERT INTO product_categories (name, slug, description, level, sort_order, icon, color) VALUES
  ('餐饮用具', 'tableware-supplies', '包括各类容器、饮具、服务用具等餐饮相关用品', 1, 1, 'utensils', '#3B82F6'),
  ('食品原料', 'food-ingredients', '包括茶叶、调料、配料等各类食品原材料', 1, 2, 'leaf', '#10B981'),
  ('设备器材', 'equipment-machinery', '包括制作设备、储存设备、服务设备等', 1, 3, 'cog', '#8B5CF6'),
  ('服装配饰', 'apparel-accessories', '包括工作服装、防护用品等', 1, 4, 'shirt', '#F59E0B'),
  ('装饰用品', 'decorative-items', '包括墙面装饰、空间装饰等装饰物品', 1, 5, 'palette', '#EC4899'),
  ('特殊商品', 'special-products', '包括易碎品、冷链产品、电子产品等需要特殊处理的商品', 1, 6, 'star', '#6B7280');

-- 2. 插入二级分类 (中类)
-- 餐饮用具的二级分类
INSERT INTO product_categories (name, slug, description, parent_id, level, sort_order) VALUES
  -- 餐饮用具 > 包装容器
  ('包装容器', 'packaging-containers', '各类包装和容器用品', 
   (SELECT id FROM product_categories WHERE slug = 'tableware-supplies'), 2, 1),
  ('饮具用品', 'drinking-supplies', '杯具、饮品相关用品', 
   (SELECT id FROM product_categories WHERE slug = 'tableware-supplies'), 2, 2),
  ('服务用具', 'service-tools', '餐饮服务相关工具和用具', 
   (SELECT id FROM product_categories WHERE slug = 'tableware-supplies'), 2, 3),
  
  -- 食品原料的二级分类
  ('茶叶饮品', 'tea-beverages', '各类茶叶和饮品原料', 
   (SELECT id FROM product_categories WHERE slug = 'food-ingredients'), 2, 1),
  ('调料配料', 'seasonings-ingredients', '调料、配料、添加剂等', 
   (SELECT id FROM product_categories WHERE slug = 'food-ingredients'), 2, 2),
  ('烘焙原料', 'baking-ingredients', '烘焙制作所需的原材料', 
   (SELECT id FROM product_categories WHERE slug = 'food-ingredients'), 2, 3),
  
  -- 设备器材的二级分类
  ('制作设备', 'production-equipment', '用于制作和加工的设备', 
   (SELECT id FROM product_categories WHERE slug = 'equipment-machinery'), 2, 1),
  ('储存设备', 'storage-equipment', '用于储存和保鲜的设备', 
   (SELECT id FROM product_categories WHERE slug = 'equipment-machinery'), 2, 2),
  ('服务设备', 'service-equipment', '用于服务和销售的设备', 
   (SELECT id FROM product_categories WHERE slug = 'equipment-machinery'), 2, 3),
  
  -- 服装配饰的二级分类
  ('工作服装', 'work-apparel', '工作时穿着的服装', 
   (SELECT id FROM product_categories WHERE slug = 'apparel-accessories'), 2, 1),
  ('防护用品', 'protective-equipment', '安全防护相关用品', 
   (SELECT id FROM product_categories WHERE slug = 'apparel-accessories'), 2, 2),
  
  -- 装饰用品的二级分类
  ('墙面装饰', 'wall-decorations', '墙面装饰物品', 
   (SELECT id FROM product_categories WHERE slug = 'decorative-items'), 2, 1),
  ('空间装饰', 'space-decorations', '空间装饰和布置用品', 
   (SELECT id FROM product_categories WHERE slug = 'decorative-items'), 2, 2),
  
  -- 特殊商品的二级分类
  ('易碎品', 'fragile-items', '易碎易损的商品', 
   (SELECT id FROM product_categories WHERE slug = 'special-products'), 2, 1),
  ('冷链产品', 'cold-chain-products', '需要冷藏或冷冻的产品', 
   (SELECT id FROM product_categories WHERE slug = 'special-products'), 2, 2),
  ('电子产品', 'electronic-products', '电子设备和数码产品', 
   (SELECT id FROM product_categories WHERE slug = 'special-products'), 2, 3);

-- 3. 插入三级分类 (小类)
-- 包装容器的三级分类
INSERT INTO product_categories (name, slug, description, parent_id, level, sort_order) VALUES
  ('杯类容器', 'cup-containers', '各种杯型容器及配件',
   (SELECT id FROM product_categories WHERE slug = 'packaging-containers'), 3, 1),
  ('盒类容器', 'box-containers', '各种盒型包装容器',
   (SELECT id FROM product_categories WHERE slug = 'packaging-containers'), 3, 2),
  ('袋类包装', 'bag-packaging', '各种袋型包装材料',
   (SELECT id FROM product_categories WHERE slug = 'packaging-containers'), 3, 3),
  ('辅助容器', 'auxiliary-containers', '托盘、吸管等辅助容器',
   (SELECT id FROM product_categories WHERE slug = 'packaging-containers'), 3, 4),

-- 饮具用品的三级分类
  ('杯具系列', 'cup-series', '各类饮品杯具',
   (SELECT id FROM product_categories WHERE slug = 'drinking-supplies'), 3, 1),
  ('配件系列', 'accessory-series', '杯盖、吸管等配件',
   (SELECT id FROM product_categories WHERE slug = 'drinking-supplies'), 3, 2),
  ('一次性用品', 'disposable-items', '一次性饮具用品',
   (SELECT id FROM product_categories WHERE slug = 'drinking-supplies'), 3, 3),

-- 茶叶饮品的三级分类
  ('绿茶系列', 'green-tea-series', '各种绿茶产品',
   (SELECT id FROM product_categories WHERE slug = 'tea-beverages'), 3, 1),
  ('乌龙茶系列', 'oolong-tea-series', '各种乌龙茶产品',
   (SELECT id FROM product_categories WHERE slug = 'tea-beverages'), 3, 2),
  ('花茶系列', 'flower-tea-series', '各种花茶和调味茶',
   (SELECT id FROM product_categories WHERE slug = 'tea-beverages'), 3, 3),
  ('咖啡系列', 'coffee-series', '咖啡豆、咖啡粉等',
   (SELECT id FROM product_categories WHERE slug = 'tea-beverages'), 3, 4),

-- 调料配料的三级分类
  ('液体配料', 'liquid-ingredients', '椰乳、糖浆等液体配料',
   (SELECT id FROM product_categories WHERE slug = 'seasonings-ingredients'), 3, 1),
  ('颗粒配料', 'granular-ingredients', '爆爆珠、珍珠等颗粒配料',
   (SELECT id FROM product_categories WHERE slug = 'seasonings-ingredients'), 3, 2),
  ('粉状配料', 'powder-ingredients', '各种粉状调料和配料',
   (SELECT id FROM product_categories WHERE slug = 'seasonings-ingredients'), 3, 3),

-- 制作设备的三级分类
  ('饮品制作', 'beverage-making', '咖啡机、果粉机等饮品制作设备',
   (SELECT id FROM product_categories WHERE slug = 'production-equipment'), 3, 1),
  ('烹饪加工', 'cooking-processing', '珍珠锅等烹饪加工设备',
   (SELECT id FROM product_categories WHERE slug = 'production-equipment'), 3, 2),
  ('封口打包', 'sealing-packaging', '封口机、包装设备等',
   (SELECT id FROM product_categories WHERE slug = 'production-equipment'), 3, 3),

-- 储存设备的三级分类
  ('冷藏设备', 'refrigeration-equipment', '冰箱、展示柜等冷藏设备',
   (SELECT id FROM product_categories WHERE slug = 'storage-equipment'), 3, 1),
  ('常温储存', 'room-temp-storage', '货架、储物柜等常温储存设备',
   (SELECT id FROM product_categories WHERE slug = 'storage-equipment'), 3, 2),

-- 工作服装的三级分类
  ('围裙系列', 'apron-series', '各种工作围裙',
   (SELECT id FROM product_categories WHERE slug = 'work-apparel'), 3, 1),
  ('帽类系列', 'hat-series', '工作帽、厨师帽等',
   (SELECT id FROM product_categories WHERE slug = 'work-apparel'), 3, 2),
  ('工作服系列', 'uniform-series', '制服、工装等',
   (SELECT id FROM product_categories WHERE slug = 'work-apparel'), 3, 3);

-- 4. 创建分类属性模板
-- 为不同分类定义特殊属性

-- 杯类容器的属性
INSERT INTO category_attributes (category_id, attribute_name, attribute_type, is_required, options, sort_order) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'cup-containers'), '容量', 'select', true, 
   '{"options": ["50ml", "100ml", "200ml", "300ml", "400ml", "500ml", "700ml", "1000ml"]}', 1),
  ((SELECT id FROM product_categories WHERE slug = 'cup-containers'), '材质', 'select', true,
   '{"options": ["塑料", "纸质", "玻璃", "不锈钢", "陶瓷", "环保材料"]}', 2),
  ((SELECT id FROM product_categories WHERE slug = 'cup-containers'), '是否带盖', 'boolean', false, '{}', 3),
  ((SELECT id FROM product_categories WHERE slug = 'cup-containers'), '颜色', 'multi_select', false,
   '{"options": ["透明", "白色", "黑色", "红色", "蓝色", "绿色", "黄色", "粉色", "其他"]}', 4);

-- 茶叶系列的属性
INSERT INTO category_attributes (category_id, attribute_name, attribute_type, is_required, options, sort_order) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'tea-beverages'), '茶叶类型', 'select', true,
   '{"options": ["绿茶", "红茶", "乌龙茶", "白茶", "黑茶", "花茶", "普洱茶", "调味茶"]}', 1),
  ((SELECT id FROM product_categories WHERE slug = 'tea-beverages'), '产地', 'text', false, '{}', 2),
  ((SELECT id FROM product_categories WHERE slug = 'tea-beverages'), '等级', 'select', false,
   '{"options": ["特级", "一级", "二级", "三级", "普通级"]}', 3),
  ((SELECT id FROM product_categories WHERE slug = 'tea-beverages'), '包装规格', 'text', true, '{}', 4),
  ((SELECT id FROM product_categories WHERE slug = 'tea-beverages'), '保质期', 'text', true, '{}', 5);

-- 设备类的属性
INSERT INTO category_attributes (category_id, attribute_name, attribute_type, is_required, options, sort_order) VALUES
  ((SELECT id FROM product_categories WHERE slug = 'production-equipment'), '功率', 'text', false, '{}', 1),
  ((SELECT id FROM product_categories WHERE slug = 'production-equipment'), '电压', 'select', false,
   '{"options": ["110V", "220V", "380V", "通用电压"]}', 2),
  ((SELECT id FROM product_categories WHERE slug = 'production-equipment'), '尺寸', 'text', false, '{}', 3),
  ((SELECT id FROM product_categories WHERE slug = 'production-equipment'), '重量', 'text', false, '{}', 4),
  ((SELECT id FROM product_categories WHERE slug = 'production-equipment'), '保修期', 'select', false,
   '{"options": ["1年", "2年", "3年", "5年", "终身保修"]}', 5);

-- 5. 添加示例产品分类关联 (基于现有的有效分类)
-- 注意：这里使用的product_id需要与实际Global ERP中的产品ID匹配

-- 茶叶类产品 (根据分析报告，有7个茶叶类产品)
INSERT INTO product_category_relations (product_id, category_id, is_primary) VALUES
  -- 这里需要根据实际的产品ID来更新，先用占位符
  ('tea_product_1', (SELECT id FROM product_categories WHERE slug = 'green-tea-series'), true),
  ('tea_product_2', (SELECT id FROM product_categories WHERE slug = 'oolong-tea-series'), true),
  ('tea_product_3', (SELECT id FROM product_categories WHERE slug = 'flower-tea-series'), true);

-- 杯类产品
INSERT INTO product_category_relations (product_id, category_id, is_primary) VALUES
  ('cup_product_1', (SELECT id FROM product_categories WHERE slug = 'cup-containers'), true),
  ('cup_product_2', (SELECT id FROM product_categories WHERE slug = 'cup-series'), true);

-- 盒类产品
INSERT INTO product_category_relations (product_id, category_id, is_primary) VALUES
  ('box_product_1', (SELECT id FROM product_categories WHERE slug = 'box-containers'), true);

-- 设备类产品
INSERT INTO product_category_relations (product_id, category_id, is_primary) VALUES
  ('equipment_product_1', (SELECT id FROM product_categories WHERE slug = 'beverage-making'), true);

-- 配料类产品
INSERT INTO product_category_relations (product_id, category_id, is_primary) VALUES
  ('ingredient_product_1', (SELECT id FROM product_categories WHERE slug = 'liquid-ingredients'), true),
  ('ingredient_product_2', (SELECT id FROM product_categories WHERE slug = 'granular-ingredients'), true);

-- 添加默认的"未分类"分类
INSERT INTO product_categories (name, slug, description, level, sort_order, icon, color) VALUES
  ('未分类', 'uncategorized', '尚未分类的产品，需要进一步整理分类', 1, 99, 'help-circle', '#9CA3AF');

-- 创建分类迁移日志表，用于记录分类迁移过程
CREATE TABLE category_migration_log (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  old_category VARCHAR(100),
  new_category_id BIGINT REFERENCES product_categories(id),
  migration_type VARCHAR(50), -- 'auto', 'manual', 'batch'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为迁移日志表创建索引
CREATE INDEX idx_category_migration_log_product ON category_migration_log(product_id);
CREATE INDEX idx_category_migration_log_type ON category_migration_log(migration_type);

-- 添加注释
COMMENT ON TABLE category_migration_log IS '分类迁移日志表，记录产品分类的变更历史';