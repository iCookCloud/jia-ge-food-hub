-- 简化供应商系统：在profiles表中添加供应商标识和企业信息

-- 为profiles表添加供应商相关字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_supplier BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_license TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_email TEXT;

-- 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_is_supplier ON profiles(is_supplier) WHERE is_supplier = TRUE;

-- 更新现有数据的注释
-- 注：由于没有supplier_credentials表，跳过数据迁移步骤
-- 新的供应商系统将通过用户在界面中手动设置is_supplier来启用

-- 创建或更新order_list_quotations表，用于存储报价信息
CREATE TABLE IF NOT EXISTS order_list_quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_list_id UUID NOT NULL REFERENCES product_lists(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    quoted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_total_amount DECIMAL(10,2),
    quoted_total_amount DECIMAL(10,2),
    quoted_items JSONB, -- 存储修改后的商品价格和数量
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- 确保每个供应商对同一个货单只能有一个有效报价
    UNIQUE(order_list_id, quoted_by)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_order_list_quotations_order_list_id ON order_list_quotations(order_list_id);
CREATE INDEX IF NOT EXISTS idx_order_list_quotations_quoted_by ON order_list_quotations(quoted_by);
CREATE INDEX IF NOT EXISTS idx_order_list_quotations_shared_by ON order_list_quotations(shared_by);
CREATE INDEX IF NOT EXISTS idx_order_list_quotations_status ON order_list_quotations(status);

-- 更新order_list_shares表，简化结构
ALTER TABLE order_list_shares 
DROP COLUMN IF EXISTS supplier_info,
ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES order_list_quotations(id) ON DELETE SET NULL;

-- 创建RLS策略
ALTER TABLE order_list_quotations ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的报价和收到的报价
CREATE POLICY "Users can view their own quotations" ON order_list_quotations
    FOR SELECT USING (
        quoted_by = auth.uid() OR 
        shared_by = auth.uid()
    );

-- 供应商可以创建报价
CREATE POLICY "Suppliers can create quotations" ON order_list_quotations
    FOR INSERT WITH CHECK (
        quoted_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_supplier = TRUE
        )
    );

-- 供应商可以更新自己的报价
CREATE POLICY "Suppliers can update their own quotations" ON order_list_quotations
    FOR UPDATE USING (quoted_by = auth.uid());

-- 货单所有者可以更新报价状态
CREATE POLICY "Order list owners can update quotation status" ON order_list_quotations
    FOR UPDATE USING (shared_by = auth.uid());

-- 创建简化的供应商查询视图
CREATE OR REPLACE VIEW available_suppliers AS
SELECT 
    p.id,
    p.nickname,
    p.avatar_url,
    p.company_name,
    p.company_description,
    p.company_phone,
    p.company_email,
    p.company_address,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.is_supplier = TRUE
ORDER BY p.updated_at DESC;

-- 创建自动更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_order_list_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_list_quotations_updated_at
    BEFORE UPDATE ON order_list_quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_order_list_quotations_updated_at();