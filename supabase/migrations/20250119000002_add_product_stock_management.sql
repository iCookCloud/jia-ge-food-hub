-- 为products表添加库存管理功能
-- 支持商品数量、库存状态、安全库存等管理

-- 1. 为 products 表添加库存管理字段
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'out_of_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
ADD COLUMN IF NOT EXISTS safety_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMPTZ DEFAULT NOW();

-- 2. 添加索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON public.products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON public.products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_safety_stock ON public.products(safety_stock);
CREATE INDEX IF NOT EXISTS idx_products_last_stock_update ON public.products(last_stock_update);

-- 3. 创建商品库存更新函数
CREATE OR REPLACE FUNCTION update_product_stock(
    product_id TEXT,
    new_quantity INTEGER,
    new_stock_status TEXT DEFAULT NULL,
    new_safety_stock INTEGER DEFAULT NULL,
    new_max_stock INTEGER DEFAULT NULL,
    new_reorder_point INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- 验证用户权限（管理员或商品所有者）
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND (
            id IN (
                SELECT user_id FROM user_roles 
                WHERE role_name IN ('admin', 'super_admin')
            )
            OR 
            id IN (
                SELECT user_id FROM products 
                WHERE id = product_id
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges or product ownership required';
    END IF;
    
    -- 自动计算库存状态
    DECLARE
        calculated_status TEXT;
    BEGIN
        IF new_quantity IS NULL THEN
            calculated_status := new_stock_status;
        ELSE
            IF new_quantity <= 0 THEN
                calculated_status := 'out_of_stock';
            ELSIF new_quantity <= COALESCE(new_safety_stock, 0) THEN
                calculated_status := 'low_stock';
            ELSE
                calculated_status := 'in_stock';
            END IF;
        END IF;
        
        -- 更新商品库存信息
        UPDATE public.products 
        SET 
            stock_quantity = COALESCE(new_quantity, stock_quantity),
            stock_status = COALESCE(new_stock_status, calculated_status),
            safety_stock = COALESCE(new_safety_stock, safety_stock),
            max_stock = COALESCE(new_max_stock, max_stock),
            reorder_point = COALESCE(new_reorder_point, reorder_point),
            last_stock_update = NOW(),
            updated_at = NOW()
        WHERE id = product_id;
        
        RETURN FOUND;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建商品库存批量更新函数
CREATE OR REPLACE FUNCTION batch_update_product_stocks(
    stock_updates JSONB
) RETURNS INTEGER AS $$
DECLARE
    update_count INTEGER := 0;
    stock_update JSONB;
BEGIN
    -- 验证用户权限（管理员）
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND (
            id IN (
                SELECT user_id FROM user_roles 
                WHERE role_name IN ('admin', 'super_admin')
            )
        )
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- 批量更新库存
    FOR stock_update IN SELECT * FROM jsonb_array_elements(stock_updates)
    LOOP
        PERFORM update_product_stock(
            (stock_update->>'product_id')::TEXT,
            (stock_update->>'quantity')::INTEGER,
            stock_update->>'stock_status',
            (stock_update->>'safety_stock')::INTEGER,
            (stock_update->>'max_stock')::INTEGER,
            (stock_update->>'reorder_point')::INTEGER
        );
        update_count := update_count + 1;
    END LOOP;
    
    RETURN update_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建库存预警视图
CREATE OR REPLACE VIEW public.product_stock_alerts AS
SELECT 
    id,
    sku,
    standard_chinese_name,
    standard_english_name,
    stock_quantity,
    stock_status,
    safety_stock,
    max_stock,
    reorder_point,
    last_stock_update,
    vendor,
    category_chinese,
    category_english,
    CASE 
        WHEN stock_quantity <= 0 THEN '缺货'
        WHEN stock_quantity <= safety_stock THEN '库存不足'
        WHEN stock_quantity >= max_stock AND max_stock IS NOT NULL THEN '库存过高'
        ELSE '正常'
    END as alert_type,
    CASE 
        WHEN stock_quantity <= 0 THEN 'high'
        WHEN stock_quantity <= safety_stock THEN 'medium'
        WHEN stock_quantity >= max_stock AND max_stock IS NOT NULL THEN 'low'
        ELSE 'none'
    END as alert_level
FROM public.products 
WHERE is_active = true 
    AND (stock_quantity <= safety_stock OR stock_quantity <= 0 OR (stock_quantity >= max_stock AND max_stock IS NOT NULL));

-- 6. 为库存预警视图添加注释
COMMENT ON VIEW public.product_stock_alerts IS '商品库存预警视图：显示需要关注的库存状态';

-- 7. 创建库存历史记录表
CREATE TABLE IF NOT EXISTS public.product_stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    old_quantity INTEGER,
    new_quantity INTEGER NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('manual', 'automatic', 'purchase', 'sale', 'adjustment')),
    change_reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. 启用库存历史表的 RLS
ALTER TABLE public.product_stock_history ENABLE ROW LEVEL SECURITY;

-- 9. 创建库存历史表的 RLS 策略
CREATE POLICY "Users can view stock history for their products" ON public.product_stock_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_stock_history.product_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all stock history" ON public.product_stock_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND (
                id IN (
                    SELECT user_id FROM user_roles 
                    WHERE role_name IN ('admin', 'super_admin')
                )
            )
        )
    );

-- 10. 创建库存历史表的索引
CREATE INDEX IF NOT EXISTS idx_product_stock_history_product_id ON public.product_stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_history_changed_at ON public.product_stock_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_product_stock_history_change_type ON public.product_stock_history(change_type);

-- 11. 创建触发器：自动记录库存变更
CREATE OR REPLACE FUNCTION log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
        INSERT INTO public.product_stock_history (
            product_id,
            old_quantity,
            new_quantity,
            change_type,
            change_reason,
            changed_by
        ) VALUES (
            NEW.id,
            OLD.stock_quantity,
            NEW.stock_quantity,
            'manual',
            '库存管理更新',
            auth.uid()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建触发器
CREATE TRIGGER trigger_log_stock_change
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION log_stock_change();

-- 完成提示
SELECT 'Product stock management system created successfully' as status;

