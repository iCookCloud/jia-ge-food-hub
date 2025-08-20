# 数据库结构参考 (Database Schema Reference)

## 概述

本文档列举了价格食品平台线上数据库Public Schema中的所有表和视图，为开发和维护提供业务数据库结构参考。

## 数据表 (Tables)

#### 用户相关
- `profiles` - 用户档案 ✅ (用于 admin_users_view, available_suppliers 视图)
- `supplier_profiles` - 供应商档案 ✅ (正在使用)
  - **使用位置**: 
    - `src/services/supplierService.ts:397,416,492,504,621,667,684` - 供应商CRUD操作和查询
    - `src/pages/admin/UserManagementPage.tsx:114` - 管理员用户管理页面
- `user_roles` - 用户角色 ✅ (核心权限系统)
  - **使用位置**: 
    - `src/hooks/useAuth.tsx:136` - 认证系统获取用户角色
    - `src/hooks/useRole.tsx:27,46,66,99,131,144` - 角色管理完整CRUD操作
    - `src/pages/admin/UserManagementPage.tsx:104` - 管理员用户管理
    - `src/pages/admin/RoleManagePage.tsx:55` - 角色管理页面
    - 数据库函数: `has_role()`, `get_user_roles()` 依赖此表
- `user_notifications` - 用户通知 ✅ (完整通知系统)
  - **使用位置**: 
    - `src/services/notificationService.ts:21` - 通知服务创建通知
    - `src/hooks/useNotifications.tsx:26,52,67,91` - 通知管理hook完整功能
    - `src/components/notifications/NotificationBell.tsx:3` - 通知铃铛UI组件
    - `src/hooks/useRealtimeNotifications.tsx` - 实时通知订阅
- `user_messages` - 用户消息 ✅ (完整消息系统)
  - **使用位置**: 
    - `src/services/messageService.ts:41,81,106,128,141,157` - 消息服务完整CRUD操作
    - `src/hooks/useMessages.tsx:13` - 消息管理hook
    - `src/components/quotations/QuotationChat.tsx:23` - 报价聊天UI组件
- `user_footprints` - 用户足迹 🗑️ (代码未实际调用，已从数据库删除，相关组件已清理)
- `user_points` - 用户积分 🗑️ (代码中无引用，已从数据库删除)
- `user_product_preferences` - 用户产品偏好 🗑️ (功能未实际使用，已从数据库删除，相关组件已清理)

#### 产品相关
- `products` - 产品主表 ✅ (用于 products_with_categories 视图)
- `product_categories` - 产品分类 ✅ (用于 category_paths, category_statistics, product_category_info, products_with_categories 视图)
- `product_category_relations` - 产品分类关联 ✅ (用于 product_category_info, products_with_categories 视图)
- `product_images` - 产品图片 🗑️ (空表无引用，已从数据库删除)
- `product_videos` - 产品视频 ✅ (用于 materials_unified 视图)
- `product_view_history` - 产品浏览历史 🗑️ (空表无引用，已从数据库删除)
- `product_attribute_values` - 产品属性值 🗑️ (空表无引用，已从数据库删除)

#### 分类系统
- `categories` - 分类主表 🗑️ (空表未使用，已从数据库删除，项目使用product_categories)
- `category_attributes` - 分类属性 🗑️ (有配置数据但代码未使用，已从数据库删除)

#### 订单和货单
- `orders` - 订单 ✅ (核心订单系统)
  - **使用位置**: 
    - `src/services/analyticsService.ts:38,45,165` - 订单统计分析
    - `src/services/coreDataService.ts:77,111,129,139,158,177` - 核心数据服务
    - `src/services/orderListResponseService.ts:346,587,718` - 订单响应服务
- `order_items` - 订单项目 ✅ (订单明细系统)
  - **使用位置**: 
    - `src/services/analyticsService.ts:96` - 热门产品统计
    - `src/services/orderListResponseService.ts:358,378` - 订单项目处理
- `product_lists` - 产品清单（货单）✅ (货单系统核心)
  - **使用位置**: 
    - `src/services/productListService.ts:35,90,114,152,177,203` - 完整货单管理
    - `src/services/chatNegotiationService.ts:77,128,192,277,334` - 聊天谈判功能
    - `src/services/orderListResponseService.ts:85,132,265,322,402,576` - 订单响应处理
- `product_list_items` - 产品清单项目 ✅ (货单明细系统)
  - **使用位置**: 
    - `src/services/productListService.ts:75` - 货单项目管理
    - `src/services/orderListResponseService.ts:281,301,331,411,507` - 订单响应项目处理
- `order_list_quotations` - 货单报价 ✅ (报价系统核心)
  - **使用位置**: 
    - `src/services/quotationService.ts:19,52,68,79` - 报价管理服务
    - `src/services/orderListResponseService.ts:151,177,211,469,491,539,566,603,640` - 报价响应处理
- `order_list_responses` - 货单响应 🗑️ (仅设计文档提及，代码未实现，已从数据库删除)
- `order_list_shares` - 货单分享 ✅ (货单分享系统)
  - **使用位置**: 
    - `src/services/orderListShareService.ts` - 货单分享服务完整功能
    - `src/pages/OrderListDetail.tsx:25` - 货单详情页分享功能
    - `src/pages/QuotationPage.tsx:24` - 报价页面分享处理
    - `src/components/order-list/SupplierSelector.tsx:12` - 供应商选择组件

#### 报价相关
- `quotations` - 报价单 ✅ (聊天询价系统核心)
  - **使用位置**: 
    - `src/services/chatNegotiationService.ts:66,117,181,215,266,300,323,391,419` - 聊天谈判服务
    - `src/services/coreDataService.ts:182` - 核心数据服务
- `quotation_items` - 报价单项目 ⚠️ (空表无引用，待确认聊天询价系统后决定)
- `quotation_conversations` - 报价对话 ⚠️ (空表无引用，待确认聊天询价系统后决定)
- `supplier_quotations` - 供应商报价 ⚠️ (空表无引用，待确认聊天询价系统后决定)

#### 案例设计 🗑️ (已从数据库删除)
- `cases` - 案例 🗑️ (AI胡乱创建，已从数据库删除)
- `design_cases` - 设计案例 🗑️ (AI胡乱创建，已从数据库删除)
- `case_products` - 案例产品 🗑️ (AI胡乱创建，已从数据库删除)
- `case_product_associations` - 案例产品关联 🗑️ (AI胡乱创建，已从数据库删除)
- `case_view_history` - 案例浏览历史 🗑️ (AI胡乱创建，已从数据库删除)

#### 材料和媒体
- `materials` - 材料 🗑️ (表包含测试数据但项目中未使用，已从数据库删除)
- `uploaded_images` - 上传图片 ✅ (用于 materials_unified 视图)
- `image_product_associations` - 图片产品关联 ✅ (用于图片与产品的关联管理)
  - **使用位置**: 
    - `src/pages/MaterialDetailPage.tsx:65` - 获取图片关联的产品信息
    - `src/components/upload/VideoUpload.tsx:124` - 创建图片与产品的关联
- `video_product_associations` - 视频产品关联 ✅ (用于视频与产品的关联管理)
  - **使用位置**: 
    - `src/services/coreDataService.ts:147` - 获取视频关联产品信息和根据产品ID查询视频
    - `src/pages/MaterialDetailPage.tsx:41` - 获取视频关联的产品信息  
    - `src/components/upload/VideoUpload.tsx:117` - 创建视频与产品的关联

#### 评价和推荐
- `reviews` - 评价 🗑️ (项目中未使用，已从数据库删除)
- `supplier_ratings` - 供应商评级 ✅ (正在使用)
  - **使用位置**: 
    - `src/services/supplierService.ts:431,447,466` - 供应商评级CRUD操作
    - `src/pages/SupplierDetailPage.tsx:131` - 供应商详情页加载和显示评级数据
- `recommendation_feedback` - 推荐反馈 🗑️ (代码中无引用，已从数据库删除)
- `recommendation_quality` - 推荐质量 🗑️ (代码中无引用，已从数据库删除)
- `recommendation_sessions` - 推荐会话 🗑️ (代码中无引用，已从数据库删除)

#### 营销相关 🗑️ (已从数据库删除)
- `coupons` - 优惠券 🗑️ (项目中未使用，已从数据库删除)
- `user_coupons` - 用户优惠券 🗑️ (项目中未使用，已从数据库删除)
- `wishlist` - 愿望清单 🗑️ (项目中未使用，已从数据库删除)
- `customer_invitations` - 客户邀请 🗑️ (项目中未使用，已从数据库删除)

#### 聊天谈判
- `chat_negotiations` - 聊天谈判 ✅ (聊天谈判系统核心)
  - **使用位置**: 
    - `src/services/chatNegotiationService.ts` - 聊天谈判服务完整功能



## 视图 (Views)

#### 用户管理视图
- `admin_users_view` - 管理员用户视图 ✅
  - **基础表**: `profiles`, `auth.users`
  - **说明**: 联合用户档案和认证用户表，仅管理员可见
  - **使用位置**: `src/pages/admin/UserManagementPage.tsx:42` - 管理员用户管理页面获取所有用户档案信息（包含邮箱）

- `available_suppliers` - 可用供应商视图 🗑️ (未在项目中使用，已从数据库删除)

#### 分类系统视图
- `category_paths` - 分类路径视图 ✅
  - **基础表**: `product_categories`
  - **说明**: 递归查询构建分类层级路径，包含完整路径信息
  - **使用位置**: `src/services/categoryService.ts:53` - getCategoryPaths方法获取分类层级路径

- `category_statistics` - 分类统计视图 ✅
  - **基础表**: `product_categories`
  - **说明**: 统计各级别分类数量
  - **使用位置**: `src/services/categoryService.ts:62` - getCategoryStatistics方法获取分类统计信息

#### 产品相关视图
- `product_category_info` - 产品分类信息视图 ✅
  - **基础表**: `product_category_relations`, `product_categories`, `category_paths`
  - **说明**: 产品与分类的关联信息，包含完整分类路径
  - **使用位置**: `src/services/categoryService.ts:76` - getProductCategories方法获取产品的分类信息

- `products_with_categories` - 带分类的产品视图 ✅
  - **基础表**: `products`, `product_category_relations`, `product_categories`, `category_paths`
  - **说明**: 产品与所有关联分类的聚合视图，包含搜索优化字段
  - **使用位置**: 多处核心使用
    - `src/services/api.ts:79` - 产品查询主要接口
    - `src/services/recommendationService.ts` - 推荐算法中获取候选商品
    - 其他多个服务文件中的产品查询功能

#### 材料统一视图
- `materials_unified` - 材料统一视图 ✅
  - **基础表**: `product_videos`, `uploaded_images`
  - **说明**: 联合视频和图片材料，提供统一的素材访问接口
  - **使用位置**: 
    - `src/services/coreDataService.ts:155` - 统一素材查询接口
    - `src/pages/admin/MaterialsManagementPage.tsx:85` - 管理页面加载素材数据


## 数据库设计特点

### 分区表设计
- 实时消息表采用按日期分区的设计，便于数据管理和查询优化

### 分类系统
- 采用递归CTE设计的分类树结构，支持无限层级嵌套
- 通过视图提供完整的分类路径和搜索功能

### 权限控制
- 使用RLS (Row Level Security) 进行数据权限控制
- 基于用户角色的访问控制

### 实时功能
- 通过Supabase Realtime实现数据实时同步
- 消息系统支持分区表优化

### 搜索优化
- `products_with_categories`视图包含`search_text`字段，支持全文搜索
- 分类路径扁平化存储，提高查询性能

## 维护注意事项

1. **分区表管理**: 需要定期创建新的消息分区表
2. **索引优化**: 关注高频查询表的索引性能
3. **权限审查**: 定期审查RLS策略的安全性
4. **数据清理**: 考虑历史数据的归档策略
5. **监控告警**: 监控表大小和查询性能

---
*最后更新: 2025-08-20*
*数据库项目ID: skowhfrykowtbchoypbl*