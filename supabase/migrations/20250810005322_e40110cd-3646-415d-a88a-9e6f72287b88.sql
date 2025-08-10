-- 1) quotations: add fields and indexes
ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS supplier_id uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS final_total_amount numeric DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_quotations_supplier_id ON public.quotations (supplier_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations (status);

-- 2) Rework quotations RLS policies
-- Drop existing broad policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their quotations" ON public.quotations;
DROP POLICY IF EXISTS "Customers can view quotations sent to them" ON public.quotations;

-- SELECT: involved parties (customer or supplier) and admins
CREATE POLICY "Quotations visible to involved parties and admins"
  ON public.quotations
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR supplier_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::user_role)
  );

-- INSERT: only customer (creator) or admin
CREATE POLICY "Customers can create quotations"
  ON public.quotations
  FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role)
  );

-- UPDATE by suppliers during pending confirmation (allow moving to confirmed)
CREATE POLICY "Suppliers can update pending quotations"
  ON public.quotations
  FOR UPDATE
  USING (
    supplier_id = auth.uid() AND status = 'pending_supplier'
  )
  WITH CHECK (
    supplier_id = auth.uid() AND status IN ('pending_supplier','confirmed')
  );

-- UPDATE by customers: allow cancelling their own quotation
CREATE POLICY "Customers can cancel their quotations"
  ON public.quotations
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid() AND status = 'cancelled');

-- Admins: full access
CREATE POLICY "Admins can manage all quotations"
  ON public.quotations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));


-- 3) quotation_items policies
-- Drop legacy broad policy
DROP POLICY IF EXISTS "Users can manage quotation items for their quotations" ON public.quotation_items;

-- SELECT: items of quotations visible to involved parties and admins
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

-- INSERT: customer can add items for their own quotations
CREATE POLICY "Customers can insert items for their quotations"
  ON public.quotation_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND q.customer_id = auth.uid()
    )
  );

-- DELETE: customer can delete items for their own quotations
CREATE POLICY "Customers can delete items for their quotations"
  ON public.quotation_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_items.quotation_id
        AND q.customer_id = auth.uid()
    )
  );

-- UPDATE: suppliers can edit items only when parent quotation is pending confirmation
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

-- Admins: full access on quotation_items
CREATE POLICY "Admins can manage all quotation items"
  ON public.quotation_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));


-- 4) orders: add quotation_id + index
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quotation_id uuid;

CREATE INDEX IF NOT EXISTS idx_orders_quotation_id ON public.orders (quotation_id);

-- Adjust orders RLS for stricter INSERT and admin access
-- Drop permissive INSERT policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Admins manage all orders
CREATE POLICY IF NOT EXISTS "Admins can manage all orders"
  ON public.orders
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- INSERT only from confirmed quotation belonging to the user
CREATE POLICY IF NOT EXISTS "Customers can create orders from confirmed quotations"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = orders.quotation_id
        AND q.customer_id = auth.uid()
        AND q.status = 'confirmed'
    )
  );