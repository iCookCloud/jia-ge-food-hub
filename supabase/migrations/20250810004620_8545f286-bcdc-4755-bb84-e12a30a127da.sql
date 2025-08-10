
-- 1) quotations 表新增字段与索引
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS supplier_id uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_total_amount numeric DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_quotations_supplier_id ON public.quotations (supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations (status);

-- 2) orders 表新增 quotation_id 字段与索引
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quotation_id uuid;

CREATE INDEX IF NOT EXISTS idx_orders_quotation_id ON public.orders (quotation_id);

-- 3) 调整 quotations 的 RLS 策略
-- 移除过于宽泛的策略（若存在）
DROP POLICY IF EXISTS "Users can manage their quotations" ON public.quotations;

-- 允许买家/厂家/管理员查询与自己相关的报价
CREATE POLICY "Quotations visible to involved parties and admins"
  ON public.quotations
  FOR SELECT
  USING (
    (customer_id = auth.uid())
    OR (supplier_id = auth.uid())
    OR (has_role(auth.uid(), 'admin'::user_role))
  );

-- 仅买家（或管理员）可以创建报价
CREATE POLICY "Customers can create quotations"
  ON public.quotations
  FOR INSERT
  WITH CHECK (
    (customer_id = auth.uid())
    OR (has_role(auth.uid(), 'admin'::user_role))
  );

-- 厂家在待确认阶段可以更新（调价或确认）
CREATE POLICY "Suppliers can update pending quotations"
  ON public.quotations
  FOR UPDATE
  USING (
    (supplier_id = auth.uid())
    AND (status = 'pending_supplier')
  )
  WITH CHECK (
    (supplier_id = auth.uid())
    AND (status IN ('pending_supplier','confirmed'))
  );

-- 买家可以取消自己的报价
CREATE POLICY "Customers can cancel their quotations"
  ON public.quotations
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid() AND status = 'cancelled');

-- 管理员可管理所有报价
CREATE POLICY "Admins can manage all quotations"
  ON public.quotations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 4) 调整 quotation_items 的 RLS 策略
-- 先移除旧策略（若存在）
DROP POLICY IF EXISTS "Users can manage quotation items for their quotations" ON public.quotation_items;

-- 买家/厂家/管理员均可查看与自己相关的报价条目
CREATE POLICY "Quotation items visible to involved parties and admins"
  ON public.quotation_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND (
          q.customer_id = auth.uid()
          OR q.supplier_id = auth.uid()
          OR has_role(auth.uid(), 'admin'::user_role)
        )
    )
  );

-- 厂家仅在待确认阶段可以修改报价条目
CREATE POLICY "Suppliers can update items for pending quotations"
  ON public.quotation_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND q.supplier_id = auth.uid()
        AND q.status = 'pending_supplier'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND q.supplier_id = auth.uid()
        AND q.status IN ('pending_supplier','confirmed')
    )
  );

-- 管理员可管理所有报价条目
CREATE POLICY "Admins can manage all quotation items"
  ON public.quotation_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 5) orders 的 RLS：管理员与“从已确认报价下单”的限制
-- 管理员管理所有订单
CREATE POLICY IF NOT EXISTS "Admins can manage all orders"
  ON public.orders
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 仅当报价已确认且属于当前用户时，允许创建订单
CREATE POLICY IF NOT EXISTS "Customers can create orders from confirmed quotations"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    (user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = orders.quotation_id
        AND q.customer_id = auth.uid()
        AND q.status = 'confirmed'
    )
  );
