-- 修改供应商认证表的RLS策略，允许所有人查看已验证的供应商
-- 首先删除现有的策略
DROP POLICY IF EXISTS "Users can manage their own supplier credentials" ON public.supplier_credentials;

-- 创建新的策略：任何人都可以查看已验证的供应商
CREATE POLICY "Anyone can view verified suppliers" 
ON public.supplier_credentials 
FOR SELECT 
USING (verification_status = 'verified');

-- 只有供应商自己可以管理自己的认证信息
CREATE POLICY "Users can manage their own supplier credentials" 
ON public.supplier_credentials 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());