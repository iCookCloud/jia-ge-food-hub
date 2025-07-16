-- 首先清理不存在对应 profiles 记录的 supplier_credentials
DELETE FROM public.supplier_credentials 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 然后建立外键关系
ALTER TABLE public.supplier_credentials 
ADD CONSTRAINT fk_supplier_credentials_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;