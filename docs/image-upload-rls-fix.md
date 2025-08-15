# 图片上传RLS策略修复文档

## 问题描述

在图片上传功能中出现了 "new row violates row-level security policy" 错误，这是因为：

1. **缺少 `uploaded_images` 表**：代码中尝试插入图片信息到不存在的表
2. **缺少RLS策略**：即使表存在，也没有正确的行级安全策略
3. **TypeScript类型不匹配**：类型定义中缺少相关表的定义
4. **缺少图片产品关联表**：无法建立图片与产品的关联关系

## 修复内容

### 1. 数据库表结构

创建了 `uploaded_images` 表来存储用户上传的图片信息：

```sql
CREATE TABLE public.uploaded_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT DEFAULT '产品展示',
    tags TEXT[] DEFAULT '{}',
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

创建了 `image_product_associations` 表来建立图片与产品的关联：

```sql
CREATE TABLE public.image_product_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES public.uploaded_images(id) ON DELETE CASCADE,
    original_product_id TEXT NOT NULL,
    product_snapshot JSONB NOT NULL,
    product_sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    snapshot_source TEXT DEFAULT 'global_erp',
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

为 `image_product_associations` 表启用了行级安全策略：

- **查看权限**：用户只能查看自己图片的关联关系
- **创建权限**：用户只能为自己的图片创建关联关系
- **更新权限**：用户只能更新自己图片的关联关系
- **删除权限**：用户只能删除自己图片的关联关系

### 3. TypeScript类型定义

在 `src/integrations/supabase/types.ts` 中添加了相关表的类型定义：

```typescript
uploaded_images: {
  Row: {
    id: string
    title: string
    description: string | null
    content: string | null
    category: string
    tags: string[]
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

image_product_associations: {
  Row: {
    id: string
    image_id: string
    original_product_id: string
    product_snapshot: Json
    product_sku: string
    product_name: string
    snapshot_source: string
    created_at: string
    updated_at: string
  }
  // ... Insert 和 Update 类型
}
```

### 4. 代码修复

在 `VideoUpload.tsx` 组件中启用了完整的图片上传功能：

- **图片元数据管理**：支持标题、描述、内容、分类、标签等
- **产品关联**：可以选择关联的产品，自动创建快照
- **数据库存储**：图片信息自动保存到数据库
- **关联关系**：建立图片与产品的关联关系

### 5. 功能增强

- **分类管理**：支持图片分类（产品展示、使用场景、生产工艺等）
- **标签系统**：支持添加和删除标签
- **产品关联**：可以选择关联的产品，支持Global ERP数据源
- **快照机制**：自动创建产品快照，确保数据独立性

## 技术细节

### 索引优化

创建了以下索引来优化查询性能：

```sql
-- uploaded_images 表索引
CREATE INDEX idx_uploaded_images_uploaded_by ON public.uploaded_images(uploaded_by);
CREATE INDEX idx_uploaded_images_bucket_folder ON public.uploaded_images(bucket_name, folder_path);
CREATE INDEX idx_uploaded_images_category ON public.uploaded_images(category);
CREATE INDEX idx_uploaded_images_tags ON public.uploaded_images USING GIN(tags);

-- image_product_associations 表索引
CREATE INDEX idx_image_product_associations_image_id ON public.image_product_associations(image_id);
CREATE INDEX idx_image_product_associations_original_product_id ON public.image_product_associations(original_product_id);
CREATE INDEX idx_image_product_associations_product_sku ON public.image_product_associations(product_sku);
CREATE INDEX idx_image_product_associations_snapshot_source ON public.image_product_associations(snapshot_source);
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

1. **文件上传**：将图片文件上传到 Supabase Storage
2. **元数据管理**：填写图片标题、描述、内容、分类、标签等
3. **产品关联**：选择关联的产品，自动创建产品快照
4. **数据存储**：在 `uploaded_images` 表中保存图片元数据
5. **关联建立**：在 `image_product_associations` 表中建立关联关系
6. **安全控制**：应用RLS策略确保数据安全
7. **返回响应**：返回上传成功的响应

## 注意事项

- 确保用户已登录（`auth.uid()` 存在）
- 图片文件大小和类型验证在上传前进行
- 数据库操作失败不会影响文件上传的成功
- 所有图片信息都关联到上传用户
- 产品关联支持Global ERP数据源，自动创建快照

## 测试结果

✅ **修复完成**：图片上传功能现在可以正常工作
✅ **RLS策略**：不再出现行级安全策略违反的错误
✅ **类型安全**：TypeScript类型定义完整，编译无错误
✅ **功能完整**：支持完整的图片元数据管理和产品关联
✅ **性能优化**：创建了必要的索引和约束

## 下一步

图片上传RLS问题已经完全修复，现在可以：

1. 正常使用图片上传功能
2. 管理图片元数据（标题、描述、分类、标签等）
3. 关联产品并创建快照
4. 享受安全的行级访问控制

所有功能都已经过测试，可以正常使用。

