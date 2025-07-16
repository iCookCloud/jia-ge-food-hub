-- 建立 supplier_credentials 和 profiles 表之间的外键关系
-- supplier_credentials.user_id 应该引用 profiles.id
ALTER TABLE public.supplier_credentials 
ADD CONSTRAINT fk_supplier_credentials_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 确保 profiles 表有正确的主键约束 (如果不存在)
-- 这将确保 PostgREST 能够识别表之间的关系
DO $$
BEGIN
    -- 检查是否已经存在主键约束
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' 
        AND constraint_type = 'PRIMARY KEY'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;
END $$;