-- 创建获取已验证供应商的存储过程
-- 创建时间: 2025-01-13

-- 创建存储过程：获取已验证的供应商
CREATE OR REPLACE FUNCTION public.get_verified_suppliers(
  search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  company_name TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  verification_status TEXT,
  verification_date TIMESTAMPTZ,
  profile_nickname TEXT,
  profile_avatar_url TEXT,
  profile_phone TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.company_name,
    sc.contact_person,
    sc.contact_phone,
    sc.contact_email,
    sc.verification_status,
    sc.verification_date,
    p.nickname as profile_nickname,
    p.avatar_url as profile_avatar_url,
    p.phone as profile_phone,
    sc.created_at
  FROM public.supplier_credentials sc
  LEFT JOIN public.profiles p ON sc.user_id = p.id
  WHERE sc.verification_status = 'verified'
    AND (
      search_query IS NULL 
      OR search_query = ''
      OR sc.company_name ILIKE '%' || search_query || '%'
      OR sc.contact_person ILIKE '%' || search_query || '%'
      OR p.nickname ILIKE '%' || search_query || '%'
    )
  ORDER BY sc.verification_date DESC NULLS LAST, sc.created_at DESC;
END;
$$;

-- 为存储过程添加注释
COMMENT ON FUNCTION public.get_verified_suppliers(TEXT) IS '获取已验证的供应商列表，支持搜索功能';

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_verified_suppliers(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_verified_suppliers(TEXT) TO anon;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_supplier_credentials_verification_status 
ON public.supplier_credentials(verification_status);

CREATE INDEX IF NOT EXISTS idx_supplier_credentials_company_name 
ON public.supplier_credentials(company_name);

CREATE INDEX IF NOT EXISTS idx_supplier_credentials_contact_person 
ON public.supplier_credentials(contact_person);

