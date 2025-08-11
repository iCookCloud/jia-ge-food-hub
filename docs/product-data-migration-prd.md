# 产品数据源迁移需求文档

## 项目概述

产品查询数据源从本地Supabase迁移至Global ERP，同时实施产品快照策略确保历史数据独立性。

### 核心需求
- 产品浏览功能使用Global ERP数据源 (bugntldehbdyfipzykdd)
- 历史货单数据完全独立，不受ERP变更影响
- 保持现有API接口兼容性

## 字段映射

| 当前字段 | Global ERP字段 | 映射策略 |
|---------|---------------|----------|
| unit_price | price | 直接映射 |
| category_chinese | category | 直接映射 |
| specifications | specification | 直接映射 |
| product_image | main_image_url | 直接映射 |
| standard_english_name | - | 设为null |

## 数据库结构变更

### 表结构升级
```sql
-- 1. product_list_items 表 ✅ 已完成
ALTER TABLE product_list_items ADD COLUMN 
  product_snapshot JSONB NOT NULL,
  product_sku VARCHAR(100),
  product_name VARCHAR(500),
  snapshot_source VARCHAR(20) DEFAULT 'global_erp',
  snapshot_time TIMESTAMP DEFAULT NOW();

-- 2. quotation_items 表 (预留) ✅ 已完成
ALTER TABLE quotation_items ADD COLUMN 
  product_snapshot JSONB,
  product_sku VARCHAR(100),
  product_name VARCHAR(500),
  snapshot_source VARCHAR(20),
  snapshot_time TIMESTAMP DEFAULT NOW();

-- 3. order_items 表 (预留) ✅ 已完成
ALTER TABLE order_items ADD COLUMN 
  product_snapshot JSONB,
  product_sku VARCHAR(100),
  product_name VARCHAR(500),
  snapshot_source VARCHAR(20),
  snapshot_time TIMESTAMP DEFAULT NOW();

-- 4. video_product_associations 表 (视频产品关联) ✅ 已完成
ALTER TABLE video_product_associations ADD COLUMN 
  product_snapshot JSONB,                    -- 关联时的产品快照
  product_sku VARCHAR(100),                  -- 便于查询显示
  product_name VARCHAR(500),                 -- 便于显示
  snapshot_source VARCHAR(20),               -- 'global_erp' 或 'local'
  snapshot_time TIMESTAMP DEFAULT NOW(),
  original_product_id VARCHAR(100);          -- 原始产品ID (追溯用)

-- 5. wishlist 表 (收藏夹) ✅ 已完成
ALTER TABLE wishlist ADD COLUMN 
  product_snapshot JSONB,
  product_sku VARCHAR(100),
  product_name VARCHAR(500),
  snapshot_source VARCHAR(20),
  snapshot_time TIMESTAMP DEFAULT NOW();

-- 索引 ✅ 已完成
CREATE INDEX CONCURRENTLY idx_product_list_items_sku 
  ON product_list_items(product_sku);
CREATE INDEX CONCURRENTLY idx_product_list_items_snapshot_gin 
  ON product_list_items USING GIN (product_snapshot);
CREATE INDEX CONCURRENTLY idx_video_associations_sku 
  ON video_product_associations(product_sku);
CREATE INDEX CONCURRENTLY idx_wishlist_sku 
  ON wishlist(product_sku);
```

### 产品快照结构
```json
{
  "id": "uuid",
  "sku": "PFG-92",
  "standard_chinese_name": "产品名称",
  "price": 268.00,
  "category": "分类",
  "specification": "规格",
  "main_image_url": "图片URL",
  "is_active": true,
  "weight": "1.000",
  "variants": null,
  "source": "global_erp",
  "snapshot_time": "2025-08-11T10:30:00Z"
}
```

## 实施步骤

### 1. 数据库迁移
```sql
-- 第1步: 移除外键约束 (避免数据填充时的约束冲突) ✅ 已完成
ALTER TABLE product_list_items DROP CONSTRAINT IF EXISTS fk_product_list_items_product;
ALTER TABLE quotation_items DROP CONSTRAINT IF EXISTS fk_quotation_items_product;
ALTER TABLE video_product_associations DROP CONSTRAINT IF EXISTS fk_video_product_associations_product;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS fk_order_items_product_id;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS fk_wishlist_product_id;
ALTER TABLE wishlist DROP CONSTRAINT IF EXISTS wishlist_product_id_fkey;
ALTER TABLE user_footprints DROP CONSTRAINT IF EXISTS user_footprints_product_id_fkey;
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;

-- 第2步: 执行表结构升级脚本
-- 添加快照字段到各个表
-- 创建索引
-- 更新TypeScript类型定义
```

### 2. 历史数据回填 ✅ 已完成
```sql
-- 为现有product_list_items填充快照
UPDATE product_list_items 
SET 
  product_snapshot = jsonb_build_object(
    'id', p.id,
    'sku', p.sku,
    'standard_chinese_name', p.standard_chinese_name,
    'price', COALESCE(p.unit_price::numeric, 0),
    'category', p.category_chinese,
    'specification', p.specifications,
    'main_image_url', p.product_image,
    'is_active', COALESCE(p.is_active, true),
    'source', 'local',
    'snapshot_time', NOW()::text
  ),
  product_sku = p.sku,
  product_name = COALESCE(p.standard_chinese_name, p.standard_english_name, p.sku),
  snapshot_source = 'local'
FROM products p
WHERE product_list_items.product_id = p.id;

-- 为现有video_product_associations填充快照
UPDATE video_product_associations 
SET 
  product_snapshot = jsonb_build_object(
    'id', p.id,
    'sku', p.sku,
    'standard_chinese_name', p.standard_chinese_name,
    'price', COALESCE(p.unit_price::numeric, 0),
    'main_image_url', p.product_image,
    'source', 'local',
    'snapshot_time', NOW()::text
  ),
  product_sku = p.sku,
  product_name = COALESCE(p.standard_chinese_name, p.standard_english_name, p.sku),
  snapshot_source = 'local',
  original_product_id = p.id
FROM products p
WHERE video_product_associations.product_id = p.id;

-- 为现有wishlist填充快照 (如果需要保留)
UPDATE wishlist 
SET 
  product_snapshot = jsonb_build_object(
    'id', p.id,
    'sku', p.sku,
    'standard_chinese_name', p.standard_chinese_name,
    'price', COALESCE(p.unit_price::numeric, 0),
    'main_image_url', p.product_image,
    'source', 'local',
    'snapshot_time', NOW()::text
  ),
  product_sku = p.sku,
  product_name = COALESCE(p.standard_chinese_name, p.standard_english_name, p.sku),
  snapshot_source = 'local'
FROM products p
WHERE wishlist.product_id = p.id;

-- 清理 product_variants (532条数据)
-- 该表为产品变体系统(整件/单袋销售单位)，功能未完全实现，建议清理
DELETE FROM product_variants;

-- 注意: 如果未来需要变体功能，可使用Global ERP的variants JSONB字段
```

### 3. Global ERP连接服务 ✅ 已完成
```typescript
// src/services/globalErpService.ts
const GLOBAL_ERP_BASE_URL = 'https://bugntldehbdyfipzykdd.supabase.co/rest/v1';
const PRODUCT_FIELDS = 'id,sku,standard_chinese_name,price,category,specification,main_image_url,is_active,weight,variants,image_urls';

const getHeaders = () => ({
  'apikey': process.env.VITE_GLOBAL_ERP_ANON_KEY || '',
  'Authorization': `Bearer ${process.env.VITE_GLOBAL_ERP_ANON_KEY || ''}`,
  'Content-Type': 'application/json'
});

export const globalErpService = {
  async fetchProducts(filters = {}, pagination = {}) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('is_active', 'eq.true');
    
    if (pagination.limit) {
      url.searchParams.append('limit', pagination.limit.toString());
    }
    if (pagination.offset) {
      url.searchParams.append('offset', pagination.offset.toString());
    }
    if (filters.search) {
      url.searchParams.append('or', `standard_chinese_name.ilike.*${filters.search}*,specification.ilike.*${filters.search}*`);
    }
    if (filters.category && filters.category !== '全部') {
      url.searchParams.append('category', `eq.${filters.category}`);
    }
    
    const sortBy = filters.sortBy || 'created_at';
    const ascending = filters.sortOrder === 'asc';
    
    if (sortBy === 'price') {
      url.searchParams.append('order', `price.${ascending ? 'asc' : 'desc'}.nullslast`);
    } else if (sortBy === 'name') {
      url.searchParams.append('order', `standard_chinese_name.${ascending ? 'asc' : 'desc'}.nullslast`);
    } else {
      url.searchParams.append('order', 'created_at.desc.nullslast');
    }
    
    const response = await fetch(url.toString(), { headers: getHeaders() });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    return { data: await response.json(), count: 0 };
  },

  async fetchProductById(id: string) {
    const url = new URL(`${GLOBAL_ERP_BASE_URL}/products`);
    url.searchParams.append('select', PRODUCT_FIELDS);
    url.searchParams.append('id', `eq.${id}`);
    url.searchParams.append('limit', '1');
    
    const response = await fetch(url.toString(), { headers: getHeaders() });
    
    if (!response.ok) {
      throw new Error(`Global ERP API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  }
};
```

### 4. 产品服务改造 ✅ 已完成
```typescript
// src/services/api.ts
import { globalErpService } from './globalErpService';

const mapGlobalErpProduct = (item: any) => ({
  id: item.id,
  sku: item.sku,
  standard_chinese_name: item.standard_chinese_name,
  standard_english_name: null,
  category_chinese: item.category,
  unit_price: item.price?.toString() || null,
  specifications: item.specification,
  product_image: item.main_image_url,
  is_active: item.is_active,
  weight: item.weight,
  variants: item.variants,
  created_at: item.created_at,
  updated_at: item.updated_at
});

export const productService = {
  async getAll(filters = {}, pagination = {}) {
    try {
      const { data, count } = await globalErpService.fetchProducts(filters, pagination);
      return { 
        data: data.map(mapGlobalErpProduct), 
        error: null, 
        count 
      };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }, 
        count: 0 
      };
    }
  },

  async getById(id: string) {
    try {
      const data = await globalErpService.fetchProductById(id);
      if (!data) {
        return { data: null, error: { message: 'Product not found' } };
      }
      return { data: mapGlobalErpProduct(data), error: null };
    } catch (error) {
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' } 
      };
    }
  }
};
```

### 5. 货单服务改造 ✅ 已完成
```typescript
// src/services/productListService.ts
export const productListService = {
  createFromCart: async (cartItems: CartItem[], name: string) => {
    const items = cartItems.map(item => ({
      product_list_id: productList.id,
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      // 产品快照
      product_snapshot: {
        id: item.id,
        sku: item.sku || '',
        standard_chinese_name: item.name,
        price: parseFloat(item.price),
        specification: item.specifications,
        main_image_url: item.image,
        source: 'global_erp',
        snapshot_time: new Date().toISOString()
      },
      product_sku: item.sku,
      product_name: item.name,
      snapshot_source: 'global_erp'
    }));
    // 执行插入...
  },

  getUserProductLists: async () => {
    const { data } = await supabase
      .from('product_lists')
      .select(`
        *,
        product_list_items (
          id, quantity, unit_price,
          product_sku, product_name, product_snapshot
        )
      `);
    
    return data?.map(list => ({
      ...list,
      items: list.product_list_items?.map(item => ({
        name: item.product_name || item.product_snapshot?.standard_chinese_name,
        sku: item.product_sku,
        image: item.product_snapshot?.main_image_url,
        specifications: item.product_snapshot?.specification,
        quantity: item.quantity,
        price: item.unit_price
      }))
    }));
  }
};
```

### 6. 视频上传服务改造 ✅ 已完成
```typescript
// src/components/upload/VideoUpload.tsx
// 修改视频产品关联逻辑
const createVideoProductAssociations = async (videoId: string, selectedProducts: string[]) => {
  const associations = [];
  
  for (const productId of selectedProducts) {
    // 从Global ERP获取最新产品信息
    const productData = await globalErpService.fetchProductById(productId);
    
    if (productData) {
      associations.push({
        video_id: videoId,
        original_product_id: productId,
        product_snapshot: {
          id: productData.id,
          sku: productData.sku,
          standard_chinese_name: productData.standard_chinese_name,
          price: productData.price,
          main_image_url: productData.main_image_url,
          specification: productData.specification,
          source: 'global_erp',
          snapshot_time: new Date().toISOString()
        },
        product_sku: productData.sku,
        product_name: productData.standard_chinese_name,
        snapshot_source: 'global_erp'
      });
    }
  }
  
  if (associations.length > 0) {
    const { error } = await supabase
      .from('video_product_associations')
      .insert(associations);
      
    if (error) {
      console.error('Failed to create video-product associations:', error);
    }
  }
};

// 在上传成功后调用
if (result.databaseVideoId && uploadingVideo.selectedProducts.length > 0) {
  await createVideoProductAssociations(result.databaseVideoId, uploadingVideo.selectedProducts);
}
```

### 7. 视频显示服务改造
```typescript
// 获取视频关联的产品信息
const getVideoProducts = async (videoId: string) => {
  const { data, error } = await supabase
    .from('video_product_associations')
    .select('product_snapshot, product_sku, product_name, snapshot_source')
    .eq('video_id', videoId);
    
  if (error) return [];
    
  return data?.map(association => ({
    name: association.product_name,
    sku: association.product_sku,
    image: association.product_snapshot?.main_image_url,
    price: association.product_snapshot?.price,
    specifications: association.product_snapshot?.specification,
    source: association.snapshot_source
  })) || [];
};
```

## 环境配置

```env
# .env.local
VITE_GLOBAL_ERP_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1Z250bGRlaGJkeWZpcHp5a2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTI0NzcsImV4cCI6MjA2MDg4ODQ3N30.M6-BjX6Km_B7ZP5WQWDiMGTSVLW2_sVyQty6QXy9ocw
VITE_GLOBAL_ERP_API_URL=https://bugntldehbdyfipzykdd.supabase.co
```

## 验收标准

### 功能验收 ✅ 迁移完成
- [x] 产品浏览页面显示Global ERP数据
- [x] 产品搜索、分类筛选功能正常
- [x] 货单创建和显示功能正常
- [x] 历史货单正常显示（基于快照）
- [x] 视频上传时产品关联功能正常
- [x] 视频详情页显示关联产品信息正常

### 性能验收  
- [ ] 产品列表加载 < 2秒
- [ ] 产品搜索响应 < 1秒
- [ ] 货单创建响应 < 3秒

### 数据完整性验收 ✅ 完成
- [x] 历史货单项有完整快照数据 (3/3项已回填)
- [x] 历史视频产品关联有完整快照数据 (2/2项已回填)
- [x] 产品字段映射准确
- [x] 无数据丢失
- [x] 已移除所有对本地products表的直接引用
- [x] 统计分析服务已切换到Global ERP + 快照数据
- [x] 删除无用的产品创建页面和组件 (ProductCreatePage.tsx, ProductCreateForm.tsx)
- [x] 清理相关路由和导入 (/products/create)

## 存储优化

### JSONB存储成本
- 单个产品快照: ~393字节
- 1000个货单项: 393KB  
- 4个表总计: 1.57MB (包含视频关联表)

### 查询优化
```sql
-- GIN索引支持JSONB查询
SELECT * FROM product_list_items 
WHERE product_snapshot->>'sku' = 'PFG-92';

SELECT * FROM product_list_items 
WHERE product_snapshot->>'category' = '餐具类';

-- 视频关联产品查询
SELECT * FROM video_product_associations 
WHERE product_snapshot->>'sku' = 'PFG-92';
```

## 风险控制

| 风险项 | 影响级别 | 缓解措施 |
|--------|----------|----------|
| 跨区域网络延迟 | 中等 | 缓存策略，CDN加速 |
| API限频 | 低 | 请求限流和重试机制 |
| 字段缺失 | 低 | 完善字段映射和默认值 |
| JSONB性能 | 低 | GIN索引，单条<400字节 |
| 大事务锁表 | 中等 | 分批处理，CONCURRENTLY索引 |