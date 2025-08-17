# 首页商品数据源迁移方案

## 当前状态

**首页商品展示**：使用硬编码的 mock 数据（`src/pages/Index.tsx:26-82`）
**商品页面**：通过 Global ERP API 获取第三方数据（`src/services/api.ts:66-89`）
**数据库表**：Supabase `products` 表已完整建立，包含 40+ 字段

## 核心变更

### 1. 修改 Index.tsx
- 删除硬编码的 `mockProducts` 数组
- 使用 `useProducts()` hook 获取 Supabase 数据
- 调整商品卡片数据映射适配本地数据结构

### 2. 修改 productService
- 替换 `productService.getAll()` 中的 `globalErpService.fetchProducts()`
- 改为直接查询 Supabase `products` 表
- 移除 `mapGlobalErpProduct` 数据转换函数

### 3. 数据字段映射
```
本地数据库字段 -> 组件属性
standard_chinese_name -> name
unit_price -> price  
product_image -> image
specifications -> specifications
storage_requirements -> storageRequirements
requires_cold_chain -> requiresColdChain
is_fragile -> isFragile
vendor -> supplier.name
is_active -> inStock (表示商品可用状态，非库存数量)
quantity -> 包装描述 (text类型，如"500g/片")
unit -> 计量单位
```

**注意**：数据库中没有库存数量字段，`is_active` 仅表示商品上架状态。


### 5. 搜索和分类功能集成

#### 分类标签动态加载
- 首页分类标签改为从数据库动态获取（当前硬编码：`["海鲜", "肉类", "蔬菜", "调料", "冷冻食品", "有机食品"]`）
- 使用 `useCategoriesByLevel(1)` 获取一级分类作为快捷标签
- 点击标签触发分类筛选，跳转到产品页面带分类参数

#### 搜索功能增强
- 搜索框支持商品名称、分类、供应商的联合查询
- 基于 Supabase 全文搜索或 ILIKE 模糊匹配
- 通过 `product_category_info` 视图实现分类关联搜索

#### 分类关联查询结构
```sql
-- 利用现有的 product_category_info 视图
SELECT p.*, pci.category_name, pci.full_path
FROM products p
LEFT JOIN product_category_info pci ON p.id = pci.product_id
WHERE pci.category_id = ? OR p.standard_chinese_name ILIKE ?
```

### 6. 数据统计集成
- 商品数量：从 `COUNT(products WHERE is_active = true)` 获取真实数据
- 供应商数量：从 `COUNT(DISTINCT vendor)` 获取
- 其他统计数据可保持静态展示

## 实施步骤

1. **修改 productService 数据源**
   - 更新 `src/services/api.ts` 中的 `productService.getAll()`
   - 从 Global ERP 切换到 Supabase `products` 表
   - 添加分类关联查询逻辑

2. **更新数据接口**
   - 修改 `src/hooks/useProducts.tsx` 的 Product 接口
   - 添加分类相关字段映射

3. **首页搜索功能改造**
   - 修改 `src/pages/Index.tsx` 实现搜索状态管理
   - 添加分类标签点击事件处理
   - 集成真实的商品数据展示

4. **分类标签动态化**
   - 替换硬编码分类标签为数据库查询
   - 使用 `useCategoriesByLevel(1)` 获取一级分类

5. **数据统计真实化**
   - 统计数据从数据库实时查询
   - 商品数量、供应商数量使用真实数据

6. **测试验证**
   - 验证数据展示正确性
   - 测试搜索和筛选功能
   - 确认分类关联查询性能