-- 设置 xu@icook.cloud 为管理员的直接SQL脚本
-- 在Supabase SQL编辑器中执行

-- 步骤1：查看现有用户和角色
SELECT 
    '=== 现有用户角色 ===' as info;
    
SELECT 
    ur.id as role_id,
    ur.user_id,
    ur.role,
    ur.is_active,
    ur.assigned_at,
    p.nickname,
    p.phone,
    p.created_at as profile_created
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
ORDER BY ur.assigned_at DESC;

-- 步骤2：查看所有用户档案
SELECT 
    '=== 所有用户档案 ===' as info;
    
SELECT 
    id,
    nickname,
    phone,
    created_at,
    updated_at
FROM profiles
ORDER BY created_at DESC;

-- 步骤3：查找是否有昵称为 'xu@icook.cloud' 的用户
SELECT 
    '=== 查找 xu@icook.cloud 用户 ===' as info;
    
SELECT 
    id,
    nickname,
    phone,
    created_at,
    updated_at
FROM profiles
WHERE nickname = 'xu@icook.cloud' OR nickname LIKE '%xu%';

-- 步骤4：如果找到了用户，为其分配管理员角色
-- 请将下面的 UUID 替换为实际的用户ID（从步骤3的结果中获取）
-- 取消注释下面的语句并替换用户ID

/*
-- 为指定用户分配管理员角色
INSERT INTO user_roles (user_id, role, assigned_at, is_active, created_at, updated_at)
VALUES (
    'REPLACE_WITH_ACTUAL_USER_ID', -- 替换为实际的用户ID
    'admin',
    now(),
    true,
    now(),
    now()
);
*/

-- 步骤5：验证管理员角色分配结果
SELECT 
    '=== 管理员用户列表 ===' as info;
    
SELECT 
    ur.user_id,
    ur.role,
    ur.is_active,
    ur.assigned_at,
    p.nickname,
    p.phone
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin' AND ur.is_active = true
ORDER BY ur.assigned_at DESC;

-- 步骤6：如果需要创建新用户并分配管理员角色
-- 取消注释下面的语句

/*
-- 创建新用户档案
INSERT INTO profiles (id, nickname, phone, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'xu@icook.cloud',
    NULL,
    now(),
    now()
);

-- 获取刚创建的用户ID
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    SELECT id INTO new_user_id 
    FROM profiles 
    WHERE nickname = 'xu@icook.cloud' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 为新用户分配管理员角色
    INSERT INTO user_roles (user_id, role, assigned_at, is_active, created_at, updated_at)
    VALUES (
        new_user_id,
        'admin',
        now(),
        true,
        now(),
        now()
    );
    
    RAISE NOTICE '用户 % 已创建并分配管理员角色', new_user_id;
END $$;
*/

-- 执行说明：
-- 1. 先执行步骤1-3，查看现有用户情况
-- 2. 如果找到目标用户，记录其ID
-- 3. 取消注释步骤4的语句，替换用户ID，然后执行
-- 4. 执行步骤5验证结果
-- 5. 如果没有找到用户，可以取消注释步骤6来创建新用户


