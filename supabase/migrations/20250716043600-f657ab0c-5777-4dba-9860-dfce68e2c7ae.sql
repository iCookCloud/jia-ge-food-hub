-- 创建分销返利系统的数据表

-- 1. 修改产品货单表，增加返利相关字段
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS rebate_total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS sheet_name TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS sheet_type TEXT DEFAULT 'quotation';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS origin_supplier_id UUID;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS is_shareable BOOLEAN DEFAULT true;

-- 2. 创建分享链路表
CREATE TABLE IF NOT EXISTS public.share_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sheet_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES public.share_chains(id),
    share_depth INTEGER DEFAULT 0,
    share_code TEXT UNIQUE NOT NULL,
    children_count INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- 3. 创建返利分配记录表
CREATE TABLE IF NOT EXISTS public.commission_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    sheet_id UUID NOT NULL REFERENCES public.quotations(id),
    share_chain_id UUID NOT NULL REFERENCES public.share_chains(id),
    user_id UUID NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    contribution_score INTEGER DEFAULT 0,
    order_total DECIMAL(10,2) NOT NULL,
    distribution_type TEXT DEFAULT 'direct', -- direct, indirect, platform
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. 修改订单表，添加分享链路跟踪
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sheet_id UUID REFERENCES public.quotations(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS share_chain_id UUID REFERENCES public.share_chains(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rebate_total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rebate_chain TEXT; -- 存储链路信息如 "A→B→D→F"
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS origin_supplier_id UUID;

-- 创建索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_share_chains_user_id ON public.share_chains(user_id);
CREATE INDEX IF NOT EXISTS idx_share_chains_parent_id ON public.share_chains(parent_id);
CREATE INDEX IF NOT EXISTS idx_share_chains_sheet_id ON public.share_chains(sheet_id);
CREATE INDEX IF NOT EXISTS idx_commission_distributions_user_id ON public.commission_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_distributions_order_id ON public.commission_distributions(order_id);

-- 启用RLS
ALTER TABLE public.share_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_distributions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 分享链路：用户可以查看相关的分享链路
CREATE POLICY "Users can view related share chains" 
ON public.share_chains 
FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.share_chains sc 
        WHERE sc.parent_id = share_chains.id AND sc.user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.quotations q 
        WHERE q.id = sheet_id AND q.supplier_id = auth.uid()
    )
);

-- 用户可以创建分享链路
CREATE POLICY "Users can create share chains" 
ON public.share_chains 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的分享链路
CREATE POLICY "Users can update own share chains" 
ON public.share_chains 
FOR UPDATE 
USING (user_id = auth.uid());

-- 返利分配：用户可以查看自己的返利记录
CREATE POLICY "Users can view own commission distributions" 
ON public.commission_distributions 
FOR SELECT 
USING (user_id = auth.uid());

-- 系统可以创建返利分配记录
CREATE POLICY "System can create commission distributions" 
ON public.commission_distributions 
FOR INSERT 
WITH CHECK (true);