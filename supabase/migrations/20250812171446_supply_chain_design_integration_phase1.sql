-- 供应链设计一体化功能 - Phase 1: 基础数据集成
-- 创建时间: 2025-01-12 17:14:46

-- 1. 创建设计案例表
CREATE TABLE IF NOT EXISTS public.design_cases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    style VARCHAR(100) NOT NULL,
    area VARCHAR(100),
    location VARCHAR(100),
    designer VARCHAR(100),
    designer_id UUID,
    price VARCHAR(50),
    image VARCHAR(500),
    images TEXT[], -- 多张图片数组
    category VARCHAR(100),
    tags TEXT[], -- 标签数组
    likes INTEGER DEFAULT 0,
    description TEXT,
    -- 新增预算相关字段
    estimated_budget_min DECIMAL(10,2),
    estimated_budget_max DECIMAL(10,2),
    material_list TEXT[], -- 主要材料列表
    supplier_recommendations TEXT[], -- 推荐供应商ID列表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 创建材料商品表（用于本地商品展示，实际数据来源于 ERP）
CREATE TABLE IF NOT EXISTS public.materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10,2),
    supplier VARCHAR(100),
    supplier_id UUID,
    rating DECIMAL(2,1) DEFAULT 0,
    description TEXT,
    specifications JSONB, -- 规格参数
    features TEXT[], -- 产品特性数组
    images TEXT[], -- 产品图片数组
    stock INTEGER DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pcs',
    erp_product_id VARCHAR(50), -- ERP系统中的商品ID
    design_compatibility TEXT[], -- 兼容的设计风格
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 创建案例商品关联表
CREATE TABLE IF NOT EXISTS public.case_product_associations (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES public.design_cases(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL, -- ERP 系统中的商品 ID
    category VARCHAR(50),
    priority INTEGER DEFAULT 0,
    usage_description TEXT,
    quantity_suggestion INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. 创建供应商评价表
CREATE TABLE IF NOT EXISTS public.supplier_ratings (
    id SERIAL PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    images TEXT[], -- 评价图片
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 创建用户商品偏好表
CREATE TABLE IF NOT EXISTS public.user_product_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_category VARCHAR(50),
    style_preference VARCHAR(50),
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    brand_preferences TEXT[], -- 偏好品牌数组
    quality_priority INTEGER DEFAULT 5 CHECK (quality_priority >= 1 AND quality_priority <= 10),
    price_priority INTEGER DEFAULT 5 CHECK (price_priority >= 1 AND price_priority <= 10),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. 扩展现有 orders 表，添加设计项目相关字段
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS design_case_id INTEGER REFERENCES public.design_cases(id),
ADD COLUMN IF NOT EXISTS project_type VARCHAR(50) DEFAULT 'material_only',
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE,
ADD COLUMN IF NOT EXISTS installation_required BOOLEAN DEFAULT FALSE;

-- 7. 创建供应商信息快照表（用于缓存 ERP 系统的供应商信息）
CREATE TABLE IF NOT EXISTS public.supplier_profiles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_license VARCHAR(100),
    service_areas TEXT[], -- 服务区域数组
    product_categories TEXT[], -- 主营产品类别数组
    quality_certifications TEXT[], -- 质量认证数组
    contact_info JSONB, -- 联系信息
    delivery_info JSONB, -- 配送信息
    rating_info JSONB, -- 评分信息
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_design_cases_style ON public.design_cases(style);
CREATE INDEX IF NOT EXISTS idx_design_cases_category ON public.design_cases(category);
CREATE INDEX IF NOT EXISTS idx_design_cases_location ON public.design_cases(location);

CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_supplier_id ON public.materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_erp_product_id ON public.materials(erp_product_id);

CREATE INDEX IF NOT EXISTS idx_case_product_associations_case_id ON public.case_product_associations(case_id);
CREATE INDEX IF NOT EXISTS idx_case_product_associations_product_id ON public.case_product_associations(product_id);

CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier_id ON public.supplier_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_user_id ON public.supplier_ratings(user_id);

CREATE INDEX IF NOT EXISTS idx_user_product_preferences_user_id ON public.user_product_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_design_case_id ON public.orders(design_case_id);

CREATE INDEX IF NOT EXISTS idx_supplier_profiles_is_active ON public.supplier_profiles(is_active);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.design_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_product_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_product_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略

-- 设计案例：所有人可以查看，认证用户可以创建
CREATE POLICY "Anyone can view design cases" 
ON public.design_cases 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create design cases" 
ON public.design_cases 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own design cases" 
ON public.design_cases 
FOR UPDATE 
USING (designer_id = auth.uid());

-- 材料商品：所有人可以查看
CREATE POLICY "Anyone can view materials" 
ON public.materials 
FOR SELECT 
USING (true);

-- 系统可以管理材料数据
CREATE POLICY "System can manage materials" 
ON public.materials 
FOR ALL 
USING (true);

-- 案例商品关联：所有人可以查看，系统可以管理
CREATE POLICY "Anyone can view case product associations" 
ON public.case_product_associations 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage case product associations" 
ON public.case_product_associations 
FOR ALL 
USING (true);

-- 供应商评价：用户可以查看和创建自己的评价
CREATE POLICY "Anyone can view supplier ratings" 
ON public.supplier_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create supplier ratings" 
ON public.supplier_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own supplier ratings" 
ON public.supplier_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 用户商品偏好：用户只能查看和管理自己的偏好
CREATE POLICY "Users can view own preferences" 
ON public.user_product_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" 
ON public.user_product_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 供应商信息：所有人可以查看
CREATE POLICY "Anyone can view supplier profiles" 
ON public.supplier_profiles 
FOR SELECT 
USING (true);

-- 系统可以管理供应商信息
CREATE POLICY "System can manage supplier profiles" 
ON public.supplier_profiles 
FOR ALL 
USING (true);

-- 创建触发器自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建时间戳更新触发器
CREATE TRIGGER update_design_cases_updated_at
    BEFORE UPDATE ON public.design_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON public.materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_product_preferences_updated_at
    BEFORE UPDATE ON public.user_product_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_profiles_updated_at
    BEFORE UPDATE ON public.supplier_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 添加约束检查
ALTER TABLE public.design_cases 
ADD CONSTRAINT check_design_cases_style 
CHECK (style IN ('现代简约', '工业风', '侘寂风', '轻奢风', '中式风', '北欧风', '地中海风', '田园风'));

ALTER TABLE public.materials 
ADD CONSTRAINT check_materials_category 
CHECK (category IN ('餐具', '包装', '设备', '装修材料', '家具', '照明', '装饰品', '其他'));

ALTER TABLE public.orders 
ADD CONSTRAINT check_orders_project_type 
CHECK (project_type IN ('design_project', 'material_only', 'full_service'));

-- 插入一些示例数据
INSERT INTO public.design_cases (
    title, style, area, location, designer, price, image, category, tags, 
    description, estimated_budget_min, estimated_budget_max
) VALUES 
(
    '现代简约咖啡厅设计',
    '现代简约',
    '120㎡',
    '上海',
    '张设计师',
    '15-20万',
    '/images/cases/modern-cafe.jpg',
    '咖啡厅',
    ARRAY['现代', '简约', '咖啡厅', '商业空间'],
    '采用简洁的线条和中性色调，营造舒适的咖啡空间氛围',
    150000,
    200000
),
(
    '工业风火锅店设计',
    '工业风',
    '200㎡',
    '北京',
    '李设计师',
    '25-30万',
    '/images/cases/industrial-hotpot.jpg',
    '火锅店',
    ARRAY['工业风', '火锅', '餐饮', '复古'],
    '运用裸露的砖墙和金属元素，打造个性化的火锅用餐环境',
    250000,
    300000
);

-- 插入一些示例材料数据
INSERT INTO public.materials (
    name, category, price, supplier, rating, description, 
    specifications, features, images, stock, unit, design_compatibility
) VALUES 
(
    '北欧风实木餐桌',
    '家具',
    1200.00,
    '优品家具',
    4.5,
    '精选北欧橡木制作，简约时尚设计',
    '{"material": "橡木", "size": "120x80x75cm", "color": "原木色"}',
    ARRAY['环保材料', '耐用', '简约设计'],
    ARRAY['/images/materials/nordic-table.jpg'],
    50,
    'pcs',
    ARRAY['现代简约', '北欧风']
),
(
    '工业风吊灯',
    '照明',
    380.00,
    '灯饰世界',
    4.2,
    '复古工业风设计，适合餐厅酒吧等场所',
    '{"material": "金属+玻璃", "power": "40W", "color": "黑色"}',
    ARRAY['复古设计', '节能', '耐用'],
    ARRAY['/images/materials/industrial-light.jpg'],
    30,
    'pcs',
    ARRAY['工业风', '复古风']
);

-- 创建案例和商品的关联
INSERT INTO public.case_product_associations (
    case_id, product_id, category, priority, usage_description, quantity_suggestion
) VALUES 
(1, 'PROD001', '家具', 1, '用作咖啡厅的主要座位区餐桌', 6),
(1, 'PROD002', '照明', 2, '咖啡厅主要照明设备', 4),
(2, 'PROD002', '照明', 1, '火锅店包间主要照明', 8);