# 当前订单流程实现指南

> **文档创建时间**: 2025-08-19  
> **状态**: ✅ 已验证正常工作  
> **基于**: 实际代码实现和数据库验证

## 概述

本文档详细描述贾哥食品集采平台当前正在使用的完整订单流程实现。与分析文档不同，这是一个**实际工作**的流程指南，所有步骤都已验证可以正常运行。

## 🔄 完整业务流程

### 流程概览
```
创建货单 → 分享给供应商 → 供应商报价 → 买家在订单页面查看报价 → 买家确认报价 → 生成正式订单
```

### 状态流转图

#### 货单状态流转 (product_lists.status)
```
draft → shared → confirmed → delivered
  ↓        ↓          ↓          ↓
创建货单  分享给供应商  买家确认订单  货物交付
```
**注意**: 货单可同时分享给多个供应商，状态基于买家操作而非供应商行为

#### 分享状态流转 (order_list_shares.status) - 每个分享记录独立
```
pending → viewed → quoted → (最终状态)
   ↓        ↓        ↓         ↓
分享给供应商  供应商查看  供应商报价   等待买家决策
```
**多供应商场景**: 
- 供应商A: pending → viewed → quoted 
- 供应商B: pending → quoted
- 供应商C: pending → viewed
- 买家可以比较所有报价后选择确认某一个

#### 订单状态流转 (orders) - 每个报价生成独立订单
```
is_confirmed: false → is_confirmed: true
        ↓                      ↓
  供应商报价自动生成           买家选择并确认特定订单
  (status: pending)         (status: confirmed)
```
**关键特性**:
- 买家确认某个订单后，该货单状态变为confirmed
- 同一货单的其他待确认订单自动变为cancelled状态
- 其他供应商的报价状态自动变为rejected
- 支持真正的多供应商竞价机制

---

## 📋 详细实现步骤

### 第1步：创建货单
**操作者**: 买家  
**页面**: `/create-order-list`  
**涉及服务**: `productListService.createProductList()`

**流程**:
1. 买家从购物车或直接选择商品创建货单
2. 系统在 `product_lists` 表插入货单记录
3. 在 `product_list_items` 表插入商品明细
4. 货单状态设为 `draft`
5. 此时货单还可以编辑，但只能编辑货单名称等采购要求，商品明细不能编辑。

**关键代码位置**:
- `src/services/productListService.ts:19`
- `src/pages/CreateOrderListPage.tsx`

### 第2步：分享给供应商
**操作者**: 买家  
**页面**: 货单详情页  
**涉及服务**: `orderListShareService.shareOrderListToSuppliers()`

**流程**:
1. 买家选择目标供应商
2. 系统在 `order_list_shares` 表创建分享记录
3. 分享状态设为 `pending`
4. 货单状态更新为 `shared`

**关键代码位置**:
- `src/services/orderListShareService.ts:77`
- `src/components/order-list/SupplierSelector.tsx`

### 第3步：供应商报价
**操作者**: 供应商  
**页面**: `/orders` (收到的货单Tab)  
**涉及服务**: `orderListResponseService.confirmToSender()`

**流程**:
1. 供应商查看分享的货单详情
2. 修改商品价格和数量
3. 提交报价，系统执行：
   - 在 `order_list_quotations` 表创建报价记录
   - **自动预生成未确认订单**在 `orders` 表（`is_confirmed=false`）
   - 在 `order_items` 表插入修改后的商品明细
   - 更新分享状态为 `quoted`

**关键代码位置**:
- `src/services/orderListResponseService.ts:117`
- `src/pages/OrdersPage.tsx` (供应商视图)

**🌟 核心特性 - 预生成订单机制**:
```javascript
// 供应商报价时自动创建未确认订单
const order = await this.createConfirmationOrder(
  response.id,
  orderListId, 
  modifications
);
// 订单状态: is_confirmed = false
```

### 第4步：买家查看报价
**操作者**: 买家  
**页面**: `/orders` ("我的订单"Tab)  
**数据源**: `orders` 表 + 状态筛选

**流程**:
1. 买家进入订单页面
2. 查看"我的订单"Tab
3. 使用筛选按钮：
   - **全部订单**: 显示所有订单
   - **待确认**: 显示 `is_confirmed=false` 的订单
   - **已确认**: 显示 `is_confirmed=true` 的订单
4. 查看订单详情和供应商报价信息

**关键代码位置**:
- `src/pages/OrdersPage.tsx:47-65` (数据筛选逻辑)
- `src/hooks/useOrders.tsx`

### 第5步：买家确认报价
**操作者**: 买家  
**页面**: `/orders` 或 `/orders/:id`  
**涉及服务**: 数据库函数 `confirm_order()`

**流程**:
1. 买家在待确认订单上点击"确认订单"
2. 系统调用 `confirm_order(order_id)` 数据库函数
3. 更新订单：
   - `is_confirmed = true`
   - `confirmed_at = 当前时间`
   - `status = 'confirmed'`
4. 更新相关报价状态为 `accepted`
5. 发送通知给供应商

**关键代码位置**:
- `src/pages/OrdersPage.tsx:89` (`handleConfirmOrder`)
- 数据库函数: `confirm_order()`

### 第6步：生成正式订单
**自动完成**: 订单在第3步就已预生成，第5步只是状态确认  
**最终状态**: `orders.is_confirmed = true`

**结果**:
- 买家获得确认的订单
- 供应商收到订单确认通知
- 订单进入履约阶段

---

## 🗄️ 核心数据库表

### 主要业务表

| 表名 | 作用 | 关键字段 |
|------|------|----------|
| `product_lists` | 货单主表 | `id`, `name`, `status`, `user_id` |
| `product_list_items` | 货单明细 | `product_list_id`, `quantity`, `unit_price` |
| `order_list_shares` | 分享记录 | `order_list_id`, `shared_by`, `shared_to`, `status` |
| `order_list_quotations` | 报价记录 | `order_list_id`, `quoted_by`, `generated_order_id` |
| `orders` | 订单主表 | `id`, `user_id`, `is_confirmed`, `quotation_id` |
| `order_items` | 订单明细 | `order_id`, `product_name`, `quantity`, `unit_price` |

### 状态字段说明

**product_lists.status**:
- `draft`: 草稿状态
- `shared`: 已分享给供应商
- `negotiating`: 协商中
- `confirmed`: 已确认

**order_list_shares.status**:
- `pending`: 待查看
- `viewed`: 已查看
- `quoted`: 已报价
- `declined`: 已拒绝

**order_list_quotations.status**:
- `pending`: 待确认
- `accepted`: 已接受
- `rejected`: 已拒绝

**orders.is_confirmed**:
- `false`: 待确认订单（预生成）
- `true`: 已确认订单（正式）

---

## 🔧 关键技术实现

### 1. 预生成订单机制

**设计理念**: 供应商报价时立即创建订单，买家确认时直接更新状态

**优势**:
- 提升用户体验，减少等待时间
- 保证数据一致性
- 简化确认流程

**实现代码**:
```javascript
// orderListResponseService.ts:367
async createConfirmationOrder(responseId, originalOrderListId, modifications) {
  // 创建未确认订单
  const order = await supabase.from('orders').insert({
    user_id: originalOrderList.user_id, // 买家ID
    total_amount: totalAmount,
    status: 'pending',
    is_confirmed: false, // 关键字段
    quotation_id: responseId
  });
  
  // 创建订单明细
  await supabase.from('order_items').insert(orderItems);
  
  return order;
}
```

### 2. 数据库函数确认机制

**函数**: `confirm_order(order_id)`

**功能**:
```sql
-- 更新订单为已确认状态
UPDATE orders 
SET 
    is_confirmed = TRUE,
    confirmed_at = NOW(),
    updated_at = NOW()
WHERE 
    id = order_id AND 
    user_id = auth.uid() AND 
    is_confirmed = FALSE;

-- 更新相关报价状态为已接受
UPDATE order_list_quotations 
SET 
    status = 'accepted',
    updated_at = NOW()
WHERE generated_order_id = order_id;
```

### 3. 状态驱动的UI逻辑

**订单页面筛选**:
```javascript
// OrdersPage.tsx:57-62
if (orderFilter === "pending") {
  filteredOrders = allOrders.filter(order => order.is_confirmed === false);
} else if (orderFilter === "confirmed") {
  filteredOrders = allOrders.filter(order => order.is_confirmed === true);
}
```

**确认按钮显示逻辑**:
```javascript
// 待确认订单显示"确认订单"按钮
{!order.is_confirmed && (
  <Button onClick={() => handleConfirmOrder(order.id)}>
    确认订单
  </Button>
)}
```

---

## 🎯 关键设计特点

### 1. 单一报价系统
- 使用 `order_list_quotations` 表作为唯一报价数据源
- 避开了旧 `quotations` 系统的Bug
- 提供完整的报价生命周期管理

### 2. 自动化订单预生成
- 供应商报价时自动创建未确认订单
- 买家确认时直接更新状态，无需重复创建
- 减少用户等待时间，提升体验

### 3. 清晰的数据分离
- **货单** (`product_lists`): 采购需求和分享
- **报价** (`order_list_quotations`): 供应商响应
- **订单** (`orders`): 最终交易记录

### 4. 完整的状态追踪
- 货单状态: `draft` → `shared` → `negotiating` → `confirmed`
- 分享状态: `pending` → `viewed` → `quoted`
- 订单状态: `is_confirmed: false` → `is_confirmed: true`

---

## 🚀 使用指南

### 买家操作流程
1. **创建货单**: 访问 `/create-order-list`，选择商品创建货单
2. **分享给供应商**: 在货单详情页选择供应商并分享
3. **查看报价**: 访问 `/orders`，切换到"我的订单"Tab
4. **筛选订单**: 使用"待确认"按钮查看待确认的报价
5. **确认订单**: 点击"确认订单"按钮完成交易

### 供应商操作流程
1. **查看分享**: 访问 `/orders`，切换到"收到的货单"Tab
2. **修改报价**: 点击货单查看详情，修改价格和数量
3. **提交报价**: 确认修改后提交报价
4. **等待确认**: 等待买家确认订单

### 开发者调试
1. **查看数据流**: 检查各表的记录创建和状态更新
2. **测试确认**: 使用 `confirm_order()` 函数测试订单确认
3. **状态追踪**: 监控 `is_confirmed` 字段的状态变化

---

## 📊 性能与监控

### 关键指标
- 货单创建成功率
- 分享到报价的转化率
- 报价到确认的转化率
- 平均响应时间

### 监控要点
- `order_list_quotations` 表的 `generated_order_id` 是否正确关联
- `orders` 表的 `is_confirmed` 状态更新是否及时
- 数据库函数 `confirm_order()` 的执行成功率

---

## 🔗 相关文件

### 核心服务文件
- `src/services/productListService.ts` - 货单管理
- `src/services/orderListShareService.ts` - 分享功能
- `src/services/orderListResponseService.ts` - 报价处理

### 页面组件
- `src/pages/CreateOrderListPage.tsx` - 创建货单
- `src/pages/OrdersPage.tsx` - 订单管理
- `src/pages/OrderListDetail.tsx` - 货单详情

### 钩子函数
- `src/hooks/useOrders.tsx` - 订单数据获取
- `src/hooks/useProductLists.tsx` - 货单数据获取

### 数据库迁移
- `supabase/migrations/20250818150000_simplify_supplier_system.sql`
- `supabase/migrations/20250119000000_add_order_confirmation_field.sql`

---


# 当前发现的bug
## 我的货单显示问题
货单列表里面，有的明明已经不是草稿状态了，显示的还是草稿。进详情时候可以发现已经不能编辑了，而且有分享记录了。但状态文本还是写的“草稿”

*最后更新: 2025-08-19*