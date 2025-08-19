-- 聊天协商系统数据库迁移
-- 实现买家-供应商直接协商功能

-- 1. 重命名 product_lists 表为 order_lists (如果还没有重命名)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_lists') THEN
        -- 重命名表
        ALTER TABLE product_lists RENAME TO order_lists;
        
        -- 重命名相关索引和约束
        ALTER INDEX IF EXISTS product_lists_pkey RENAME TO order_lists_pkey;
        ALTER INDEX IF EXISTS product_lists_share_code_key RENAME TO order_lists_share_code_key;
        
        -- 重命名外键约束中的引用
        ALTER TABLE product_list_items RENAME TO order_list_items;
        ALTER TABLE order_list_items RENAME COLUMN product_list_id TO order_list_id;
        
        -- 更新外键约束
        ALTER TABLE order_list_items DROP CONSTRAINT IF EXISTS product_list_items_product_list_id_fkey;
        ALTER TABLE order_list_items ADD CONSTRAINT order_list_items_order_list_id_fkey 
            FOREIGN KEY (order_list_id) REFERENCES order_lists(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. 修改 order_lists 表状态约束
ALTER TABLE order_lists 
DROP CONSTRAINT IF EXISTS order_lists_status_check;

ALTER TABLE order_lists 
ADD CONSTRAINT order_lists_status_check 
CHECK (status IN ('draft', 'shared', 'negotiating', 'confirmed', 'delivered'));

-- 3. 添加新字段到 order_lists 表
ALTER TABLE order_lists ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE order_lists ADD COLUMN IF NOT EXISTS final_supplier_id UUID REFERENCES auth.users(id);
ALTER TABLE order_lists ADD COLUMN IF NOT EXISTS final_amount DECIMAL(12,2);

-- 2. 修改 supplier_quotations 表，增加协商功能
ALTER TABLE supplier_quotations ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12,2);
ALTER TABLE supplier_quotations ADD COLUMN IF NOT EXISTS current_amount DECIMAL(12,2);
ALTER TABLE supplier_quotations ADD COLUMN IF NOT EXISTS negotiation_count INTEGER DEFAULT 0;
ALTER TABLE supplier_quotations ADD COLUMN IF NOT EXISTS supplier_confirmed BOOLEAN DEFAULT false;
ALTER TABLE supplier_quotations ADD COLUMN IF NOT EXISTS buyer_confirmed BOOLEAN DEFAULT false;

-- 更新现有数据，设置原始金额等于总金额
UPDATE supplier_quotations 
SET 
  original_amount = total_amount,
  current_amount = total_amount
WHERE original_amount IS NULL;

-- 设置非空约束
ALTER TABLE supplier_quotations 
ALTER COLUMN original_amount SET NOT NULL,
ALTER COLUMN current_amount SET NOT NULL;

-- 3. 创建聊天协商记录表
CREATE TABLE IF NOT EXISTS chat_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_list_id UUID NOT NULL REFERENCES order_lists(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES supplier_quotations(id) ON DELETE CASCADE,
  
  -- 参与方
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  supplier_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- 消息内容
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'price_proposal', 'system')),
  message_content TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- 价格相关（仅在price_proposal类型时有值）
  proposed_price DECIMAL(12,2),
  price_status TEXT CHECK (price_status IN ('pending', 'accepted', 'declined')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chat_negotiations_order_list_id ON chat_negotiations(order_list_id);
CREATE INDEX IF NOT EXISTS idx_chat_negotiations_quotation_id ON chat_negotiations(quotation_id);
CREATE INDEX IF NOT EXISTS idx_chat_negotiations_buyer_supplier ON chat_negotiations(buyer_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_chat_negotiations_created_at ON chat_negotiations(created_at);

-- 5. 设置 RLS 策略
ALTER TABLE chat_negotiations ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己参与的协商
CREATE POLICY "Users can view their own negotiations" ON chat_negotiations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = supplier_id);

-- 用户只能发送自己的消息
CREATE POLICY "Users can send their own messages" ON chat_negotiations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 用户可以更新价格状态（买家确认供应商的报价，供应商确认买家的反价）
CREATE POLICY "Users can update price status" ON chat_negotiations
  FOR UPDATE USING (
    auth.uid() = buyer_id OR auth.uid() = supplier_id
  );

-- 6. 创建函数：自动生成系统消息
CREATE OR REPLACE FUNCTION create_system_message(
  p_order_list_id UUID,
  p_quotation_id UUID,
  p_buyer_id UUID,
  p_supplier_id UUID,
  p_message_content TEXT
) RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  INSERT INTO chat_negotiations (
    order_list_id,
    quotation_id,
    buyer_id,
    supplier_id,
    message_type,
    message_content,
    sender_id
  ) VALUES (
    p_order_list_id,
    p_quotation_id,
    p_buyer_id,
    p_supplier_id,
    'system',
    p_message_content,
    p_buyer_id -- 系统消息发送者设为买家
  ) RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建触发器：供应商提交报价时自动创建协商会话
CREATE OR REPLACE FUNCTION init_negotiation_on_quotation()
RETURNS TRIGGER AS $$
BEGIN
  -- 当供应商首次提交报价时，创建系统消息
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    PERFORM create_system_message(
      NEW.order_list_id,
      NEW.id,
      (SELECT buyer_id FROM order_lists WHERE id = NEW.order_list_id),
      NEW.supplier_id,
      '供应商已提交报价，可以开始协商价格。'
    );
    
    -- 更新订单状态为协商中
    UPDATE order_lists 
    SET status = 'negotiating' 
    WHERE id = NEW.order_list_id AND status = 'shared';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_init_negotiation
  AFTER UPDATE ON supplier_quotations
  FOR EACH ROW
  EXECUTE FUNCTION init_negotiation_on_quotation();

-- 8. 创建函数：双方确认后自动生成订单
CREATE OR REPLACE FUNCTION check_negotiation_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查是否双方都已确认
  IF NEW.buyer_confirmed = true AND NEW.supplier_confirmed = true 
     AND (OLD.buyer_confirmed = false OR OLD.supplier_confirmed = false) THEN
    
    -- 创建系统消息
    PERFORM create_system_message(
      NEW.order_list_id,
      NEW.id,
      (SELECT buyer_id FROM order_lists WHERE id = NEW.order_list_id),
      NEW.supplier_id,
      '双方已确认价格，正在生成订单...'
    );
    
    -- 更新订单状态
    UPDATE order_lists 
    SET 
      status = 'confirmed',
      final_supplier_id = NEW.supplier_id,
      final_amount = NEW.current_amount
    WHERE id = NEW.order_list_id;
    
    -- TODO: 这里可以触发创建正式订单的流程
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_negotiation_completion
  AFTER UPDATE ON supplier_quotations
  FOR EACH ROW
  EXECUTE FUNCTION check_negotiation_completion();

-- 9. 创建视图：方便查询协商状态
CREATE OR REPLACE VIEW negotiation_summary AS
SELECT 
  ol.id as order_list_id,
  ol.name as order_name,
  ol.status as order_status,
  sq.id as quotation_id,
  sq.supplier_id,
  sq.original_amount,
  sq.current_amount,
  sq.negotiation_count,
  sq.supplier_confirmed,
  sq.buyer_confirmed,
  sp.nickname as supplier_name,
  bp.nickname as buyer_name,
  (SELECT COUNT(*) FROM chat_negotiations cn WHERE cn.quotation_id = sq.id) as message_count,
  (SELECT MAX(created_at) FROM chat_negotiations cn WHERE cn.quotation_id = sq.id) as last_message_at
FROM order_lists ol
JOIN supplier_quotations sq ON ol.id = sq.order_list_id
JOIN profiles sp ON sq.supplier_id = sp.id
JOIN profiles bp ON ol.buyer_id = bp.id
WHERE ol.status IN ('shared', 'negotiating', 'confirmed');

-- 授权查看视图
GRANT SELECT ON negotiation_summary TO authenticated;

COMMENT ON TABLE chat_negotiations IS '聊天协商记录表，支持买家供应商实时协商';
COMMENT ON VIEW negotiation_summary IS '协商状态汇总视图，便于查询协商进度';