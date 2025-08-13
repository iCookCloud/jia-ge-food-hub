# 图片上传RLS策略修复文档

## 问题描述

在图片上传功能中出现了 "new row violates row-level security policy" 错误，这是因为：

1. **缺少 `uploaded_images` 表**：代码中尝试插入图片信息到不存在的表
2. **缺少RLS策略**：即使表存在，也没有正确的行级安全策略
3. **TypeScript类型不匹配**：类型定义中缺少相关表的定义

## 修复内容

### 1. 数据库表结构

创建了 `uploaded_images` 表来存储用户上传的图片信息：

```sql
CREATE TABLE public.uploaded_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_name TEXT NOT NULL,
    folder_path TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 2. RLS策略

为 `uploaded_images` 表启用了行级安全策略：

- **查看权限**：用户只能查看自己上传的图片
- **创建权限**：用户只能创建自己的图片记录
- **更新权限**：用户只能更新自己上传的图片信息
- **删除权限**：用户只能删除自己上传的图片记录

```sql
-- 启用RLS
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "Users can view their own uploaded images" 
ON public.uploaded_images FOR SELECT 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can create their own uploaded images" 
ON public.uploaded_images FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- ... 其他策略
```

### 3. TypeScript类型定义

在 `src/integrations/supabase/types.ts` 中添加了 `uploaded_images` 表的类型定义：

```typescript
uploaded_images: {
  Row: {
    id: string
    title: string
    description: string | null
    file_path: string
    public_url: string
    file_size: number
    mime_type: string
    uploaded_by: string
    bucket_name: string
    folder_path: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  // ... Insert 和 Update 类型
}
```

### 4. 代码修复

在 `VideoUpload.tsx` 组件中启用了图片信息保存到数据库的功能：

```typescript
// 保存图片信息到数据库
if (result.data && user) {
  try {
    const { error } = await supabase
      .from('uploaded_images')
      .insert({
        title: uploadingImage.title,
        description: uploadingImage.description,
        file_path: result.data.path,
        public_url: result.data.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        bucket_name: 'product-images',
        folder_path: 'upload-images'
      });
    
    if (error) {
      console.warn('Failed to save image info to database:', error);
    }
  } catch (dbError) {
    console.warn('Database error:', dbError);
  }
}
```

## 技术细节

### 索引优化

创建了以下索引来优化查询性能：

```sql
CREATE INDEX idx_uploaded_images_uploaded_by ON public.uploaded_images(uploaded_by);
CREATE INDEX idx_uploaded_images_bucket_folder ON public.uploaded_images(bucket_name, folder_path);
```

### 约束检查

添加了数据完整性约束：

```sql
-- 文件大小必须大于0
ALTER TABLE public.uploaded_images 
ADD CONSTRAINT check_uploaded_images_file_size 
CHECK (file_size > 0);

-- MIME类型格式验证
ALTER TABLE public.uploaded_images 
ADD CONSTRAINT check_uploaded_images_mime_type 
CHECK (mime_type ~ '^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$');
```

## 使用方法

现在用户可以正常上传图片，系统会：

1. 将图片文件上传到 Supabase Storage
2. 在 `uploaded_images` 表中保存图片元数据
3. 应用RLS策略确保数据安全
4. 返回上传成功的响应

## 注意事项

- 确保用户已登录（`auth.uid()` 存在）
- 图片文件大小和类型验证在上传前进行
- 数据库操作失败不会影响文件上传的成功
- 所有图片信息都关联到上传用户

## 测试

修复完成后，图片上传功能应该能够正常工作，不再出现RLS策略违反的错误。
