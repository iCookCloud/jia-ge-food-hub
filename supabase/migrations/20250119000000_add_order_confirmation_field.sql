-- 为订单表添加确认字段和相关功能
-- 支持供应商创建未确认订单，买家确认后锁定不可修改

-- 1. 为 orders 表添加确认字段
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quotation_id UUID; -- 关联到报价记录

-- 2. 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_is_confirmed ON orders(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_orders_quotation_id ON orders(quotation_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_is_confirmed ON orders(user_id, is_confirmed);

-- 3. 更新 order_list_quotations 表，添加关联订单字段
ALTER TABLE order_list_quotations ADD COLUMN IF NOT EXISTS generated_order_id UUID REFERENCES orders(id);

-- 4. 添加索引
CREATE INDEX IF NOT EXISTS idx_order_list_quotations_generated_order_id ON order_list_quotations(generated_order_id);

-- 5. 更新 orders 表的 RLS 策略
-- 允许供应商创建未确认的订单
CREATE POLICY IF NOT EXISTS "Suppliers can create unconfirmed orders" ON orders
    FOR INSERT WITH CHECK (
        is_confirmed = FALSE AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_supplier = TRUE
        )
    );

-- 允许供应商更新自己创建的未确认订单
CREATE POLICY IF NOT EXISTS "Suppliers can update unconfirmed orders" ON orders
    FOR UPDATE USING (
        is_confirmed = FALSE AND
        EXISTS (
            SELECT 1 FROM order_list_quotations 
            WHERE generated_order_id = orders.id AND quoted_by = auth.uid()
        )
    );

-- 订单所有者可以确认订单
CREATE POLICY IF NOT EXISTS "Order owners can confirm orders" ON orders
    FOR UPDATE USING (user_id = auth.uid());

-- 用户可以查看自己的订单和相关的未确认订单
CREATE POLICY IF NOT EXISTS "Users can view their orders and related unconfirmed orders" ON orders
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM order_list_quotations 
            WHERE generated_order_id = orders.id AND quoted_by = auth.uid()
        )
    );

-- 6. 创建函数：确认订单
CREATE OR REPLACE FUNCTION confirm_order(order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 更新订单为已确认状态
    UPDATE orders 
    SET 
        is_confirmed = TRUE,
        confirmed_at = NOW(),
        updated_at = NOW()
    WHERE 
        id = order_id AND 
        user_id = auth.uid() AND 
        is_confirmed = FALSE;
    
    -- 更新相关报价状态为已接受
    UPDATE order_list_quotations 
    SET 
        status = 'accepted',
        updated_at = NOW()
    WHERE generated_order_id = order_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建函数：取消未确认订单
CREATE OR REPLACE FUNCTION cancel_unconfirmed_order(order_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 只能取消未确认的订单
    DELETE FROM orders 
    WHERE 
        id = order_id AND 
        user_id = auth.uid() AND 
        is_confirmed = FALSE;
    
    -- 更新相关报价状态为已拒绝
    UPDATE order_list_quotations 
    SET 
        status = 'rejected',
        generated_order_id = NULL,
        updated_at = NOW()
    WHERE generated_order_id = order_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
