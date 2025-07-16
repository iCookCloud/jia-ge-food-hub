-- 修改商品表的RLS策略，允许所有人查看活跃商品
-- 首先删除现有的策略
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;

-- 创建新的策略：任何人都可以查看活跃商品
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- 只有商品所有者可以管理自己的商品
CREATE POLICY "Users can manage their own products" 
ON public.products 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());