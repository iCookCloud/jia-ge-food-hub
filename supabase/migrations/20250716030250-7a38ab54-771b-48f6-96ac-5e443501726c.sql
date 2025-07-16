-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');

-- 创建用户角色表
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'buyer',
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    assigned_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 启用RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 创建安全定义函数来检查用户角色
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_roles 
  WHERE user_id = user_uuid 
  AND is_active = true 
  ORDER BY assigned_at DESC 
  LIMIT 1;
$$;

-- 创建检查角色权限的函数
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, required_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role = required_role 
    AND is_active = true
  );
$$;

-- 创建RLS策略
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON user_roles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 创建触发器，为新用户自动分配买家角色
CREATE OR REPLACE FUNCTION assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 为新创建的用户profile分配默认买家角色
    INSERT INTO user_roles (user_id, role, assigned_at)
    VALUES (NEW.id, 'buyer', now());
    
    RETURN NEW;
END;
$$;

-- 创建触发器
CREATE TRIGGER assign_default_role_trigger
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION assign_default_role();

-- 为现有的用户分配默认角色
INSERT INTO user_roles (user_id, role, assigned_at)
SELECT id, 'buyer', now()
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_roles);

-- 更新时间戳触发器
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();