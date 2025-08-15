# 商品管理架构设计

## 业务需求

### 数据来源
- **Global ERP (第三方)**: 大量商品池，作为商品来源
- **本地数据库**: 精选商品展示给用户
- **商家提交**: 商家直接提交商品到本地库

### 功能要求
- 管理员可以从Global ERP中选择指定商品导入到本地
- 首页等用户端只显示本地库中的商品
- 本地商品支持分类关联、价格修改等完整管理功能
- 商家提交的商品直接存储到本地库
- 支持手动同步已导入的Global ERP商品信息

## 技术方案

### 数据架构
采用**复制到本地products表**的方式，扩展现有数据表结构：

```sql
-- 扩展现有products表
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_type VARCHAR DEFAULT 'local';
ALTER TABLE products ADD COLUMN IF NOT EXISTS source_id VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_status VARCHAR DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- source_type枚举值：
-- 'local': 本地创建商品
-- 'global_erp': 从Global ERP导入
-- 'merchant': 商家提交

-- review_status枚举值：
-- 'pending': 待审核
-- 'approved': 已通过
-- 'rejected': 已拒绝
```

### 工作流程

#### 管理员导入流程
```
Global ERP商品浏览 → 搜索/筛选 → 选择商品 → 导入到本地 → 本地管理
```

#### 商品同步流程
- **手动同步**: 管理员主动触发单个或批量商品同步
- **选择性同步**: 只同步基础信息（名称、规格、图片），保留本地修改（价格、分类）

### 页面设计

#### 单页面双模式
商品管理页面采用Tab切换的方式，包含两种工作模式：

- **本地商品管理**: 管理已导入的本地商品
- **第三方商品选择**: 从Global ERP搜索和导入商品

#### 组件拆分结构
```
src/components/admin/product-management/
├── ProductManagementPage.tsx           // 主页面容器
├── LocalProductManagement.tsx          // 本地商品管理组件
├── GlobalErpProductSelection.tsx       // 第三方商品选择组件
├── components/
│   ├── ProductTable.tsx               // 通用商品表格组件
│   ├── ProductRow.tsx                  // 商品行组件
│   ├── BatchOperationBar.tsx          // 批量操作栏
│   ├── ImportDialog.tsx               // 导入确认对话框
│   └── SyncStatusIndicator.tsx        // 同步状态指示器
└── hooks/
    ├── useLocalProducts.ts            // 本地商品数据hooks
    ├── useProductImport.ts            // 商品导入逻辑hooks
    └── useProductSync.ts              // 商品同步逻辑hooks
```

### 商品状态管理

#### 状态字段分工
- `is_active`: 上下架状态，本地完全控制
- `review_status`: 审核状态，用于商家提交商品的审核流程
- `review_notes`: 审核备注或拒绝理由
- `reviewed_at`: 审核时间
- `reviewed_by`: 审核人员ID

#### 不同来源商品的状态流
**Global ERP导入商品**
```
导入 → review_status: 'approved', is_active: true
```

**商家提交商品**
```
提交 → review_status: 'pending', is_active: false
审核通过 → review_status: 'approved', is_active: true
审核拒绝 → review_status: 'rejected', is_active: false
```

#### 审核操作
```typescript
// 审核通过
const approveProduct = async (productId: string, adminUserId: string) => {
  await supabase.from('products').update({
    review_status: 'approved',
    review_notes: '审核通过',
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminUserId,
    is_active: true
  }).eq('id', productId);
};

// 审核拒绝
const rejectProduct = async (productId: string, adminUserId: string, reason: string) => {
  await supabase.from('products').update({
    review_status: 'rejected',
    review_notes: reason,
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminUserId,
    is_active: false
  }).eq('id', productId);
};
```

### 核心功能实现

#### ID生成策略
```typescript
const generateProductId = (sourceType: string, sourceId?: string): string => {
  if (sourceType === 'global_erp' && sourceId) {
    return sourceId; // Global ERP商品复用原ID
  }
  return crypto.randomUUID(); // 本地/商家商品生成新ID
};
```

#### 商品导入
```typescript
const importFromGlobalErp = async (selectedProducts: string[]) => {
  const globalProducts = await globalErpService.fetchProductsByIds(selectedProducts);
  
  const localProducts = globalProducts.map(globalProduct => ({
    // 混合ID策略：Global ERP商品复用原ID
    id: generateProductId('global_erp', globalProduct.id),
    
    // 字段映射
    sku: globalProduct.sku,
    standard_chinese_name: globalProduct.standard_chinese_name,
    unit_price: globalProduct.price?.toString(),
    product_image: globalProduct.main_image_url,
    specifications: globalProduct.specification,
    is_active: globalProduct.is_active,
    
    // 来源信息
    source_type: 'global_erp',
    source_id: globalProduct.id,
    last_sync_at: new Date().toISOString(),
    
    // 审核信息
    review_status: 'approved',
    review_notes: null,
    reviewed_at: null,
    reviewed_by: null,
    
    // 本地字段默认值
    user_id: null,
    is_public: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  await supabase.from('products').insert(localProducts);
};
```

#### 手动同步
```typescript
const syncProduct = async (localProductId: string) => {
  const localProduct = await supabase
    .from('products')
    .select('*')
    .eq('id', localProductId)
    .single();
    
  if (localProduct.source_type === 'global_erp' && localProduct.source_id) {
    // 使用source_id从Global ERP获取最新数据
    const globalProduct = await globalErpService.fetchProductById(localProduct.source_id);
    
    // 只同步基础字段，保留本地修改
    await supabase.from('products').update({
      standard_chinese_name: globalProduct.standard_chinese_name,
      specifications: globalProduct.specification,
      product_image: globalProduct.main_image_url,
      last_sync_at: new Date().toISOString()
      // 保留本地的：unit_price, 分类关联等
    }).eq('id', localProductId);
  }
};
```

#### 功能分工

**本地商品管理模式**
- 批量上下架
- 批量分类关联
- 编辑价格
- 手动同步（仅第三方来源商品）
- 分类筛选和搜索

**第三方商品选择模式**
- 搜索Global ERP商品
- 批量选择和导入
- 查看导入状态
- 预览商品详情

### 数据查询逻辑

#### 用户端查询
```typescript
// 只查询本地products表
const userProducts = await supabase
  .from('products')
  .select(`*, product_categories(*)`)
  .eq('is_active', true);
```

#### 管理端查询
```typescript
// 本地商品管理
const localProducts = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

// 第三方商品选择  
const globalProducts = await globalErpService.fetchProducts(filters, pagination);
```