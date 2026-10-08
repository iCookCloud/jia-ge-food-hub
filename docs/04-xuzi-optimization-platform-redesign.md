# 旭哥优选平台优化设计

## 📋 平台概述

**平台性质**: 多租户商品展示和询价服务平台  
**核心定位**: 多租户商品案例展示 + 跨租户咨询询价  
**商业模式**: 租户发布商品案例 + 买家跨租户浏览 + 在线咨询交易  
**技术架构**: Supabase + React + TypeScript + 多租户架构

**旭哥优选定位**: 平台首个租户，主营采购服务

---

# 第一部分：完整数据库表设计

## 🗄️ 核心系统表结构

### 1. 用户认证与角色表

#### auth.users（Supabase原生认证表）
用户基础认证信息

**字段设计**:
- **id**: UUID主键
- **email**: 用户邮箱
- **created_at/updated_at**: 创建和更新时间

#### user_profiles（用户档案表）
用户详细档案信息

**字段结构**:
- **id**: UUID主键，关联auth.users(id)
- **role**: 用户角色：buyer(买家), tenant(租户), admin(管理员)
- **tenant_id**: UUID，关联tenants(id)，所属租户（仅租户用户）
- **display_name**: 显示名称
- **company_name**: 公司名称
- **contact_phone**: 联系电话
- **contact_wechat**: 微信号
- **avatar_url**: 头像URL
- **is_active**: 是否激活
- **created_at/updated_at**: 创建和更新时间

### 2. 多租户系统表

#### tenants（租户表）
平台租户基本信息

**字段结构**:
- **id**: UUID主键
- **owner_id**: UUID，关联user_profiles(id)，租户所有者
- **name**: 租户名称（如"旭哥优选"）
- **slug**: URL标识符（如"xuzi-youxuan"）
- **description**: 租户描述
- **logo_url**: Logo URL
- **contact_info**: 联系方式JSON
- **is_active**: 是否激活
- **created_at/updated_at**: 创建和更新时间

#### product_categories（商品分类表）
商品分类管理

**字段结构**:
- **id**: UUID主键
- **parent_id**: UUID，上级分类ID
- **name**: 分类名称
- **description**: 分类描述
- **sort_order**: 排序顺序
- **is_active**: 是否激活
- **created_at/updated_at**: 创建和更新时间

### 3. 商品系统表

#### products（商品信息表）
商品基础信息管理

**字段结构**:
- **id**: UUID主键
- **tenant_id**: UUID，关联tenants(id)，所属租户
- **publisher_id**: UUID，关联user_profiles(id)，发布者
- **name**: 商品名称
- **description**: 商品描述
- **category_id**: UUID，关联product_categories(id)
- **price**: 价格
- **unit**: 单位（件/公斤/套等）
- **specifications**: 规格参数JSON
- **images**: 商品图片JSON数组
- **video_url**: 产品视频URL
- **is_featured**: 是否精选
- **is_public**: 是否跨租户可见
- **is_active**: 是否激活
- **created_at/updated_at**: 创建和更新时间

#### showcase_cases（案例展示表）
租户发布的服务案例

**字段结构**:
- **id**: UUID主键
- **tenant_id**: UUID，关联tenants(id)，所属租户
- **publisher_id**: UUID，关联user_profiles(id)，案例发布者
- **title**: 案例标题
- **description**: 案例描述
- **project_type**: 项目类型
- **client_info**: 客户信息JSON（可脱敏）
- **before_images**: 项目前图片JSON
- **after_images**: 项目后图片JSON
- **featured_products**: 案例相关商品UUID数组
- **is_featured**: 是否精选案例
- **is_public**: 是否公开展示
- **created_at/updated_at**: 创建和更新时间


### 4. 咨询系统表

#### inquiries（咨询表）
用户跨租户咨询记录

**字段结构**:
- **id**: UUID主键
- **inquirer_id**: UUID，关联user_profiles(id)，咨询者
- **target_tenant_id**: UUID，关联tenants(id)，目标租户
- **target_contact_id**: UUID，关联user_profiles(id)，目标联系人（案例发布者）
- **product_id**: UUID，关联products(id)，相关商品（可选）
- **case_id**: UUID，关联showcase_cases(id)，相关案例（可选）
- **list_id**: UUID，关联product_lists(id)，相关货单（可选）
- **subject**: 咨询主题
- **message**: 咨询内容
- **contact_method**: 联系方式：platform, phone, wechat
- **status**: 状态：open, responded, closed
- **created_at/updated_at**: 创建和更新时间

#### messages（消息表）
咨询对话消息记录

**字段结构**:
- **id**: UUID主键
- **inquiry_id**: UUID，关联inquiries(id)
- **sender_id**: UUID，关联user_profiles(id)
- **content**: 消息内容
- **message_type**: 消息类型：text, image, file
- **attachments**: 附件JSON
- **is_read**: 是否已读
- **created_at**: 创建时间


### 5. 货单系统表

#### product_lists（货单表）
用户创建的采购清单

**字段结构**:
- **id**: UUID主键
- **user_id**: UUID，关联user_profiles(id)
- **name**: 货单名称
- **description**: 货单描述
- **status**: 状态：draft, finalized, shared
- **created_at/updated_at**: 创建和更新时间

#### product_list_items（货单明细表）
货单中的商品明细

**字段结构**:
- **id**: UUID主键
- **list_id**: UUID，关联product_lists(id)
- **product_id**: UUID，关联products(id)
- **quantity**: 数量
- **notes**: 备注
- **created_at**: 创建时间


---

# 第二部分：核心功能设计

## 🎯 功能模块

### 1. 多租户管理
- 租户注册申请
- 租户独立展示空间
- 数据权限隔离

### 2. 商品管理
- 租户商品发布编辑
- 跨租户商品浏览
- 商品分类管理
- 商品搜索筛选

### 3. 案例展示
- 租户案例发布
- 案例多媒体展示
- 跨租户案例浏览

### 4. 咨询系统
- 跨租户在线咨询
- 直接联系案例发布者
- 实时消息通信
- 咨询历史记录

### 5. 货单功能
- 创建采购清单
- 货单分享
- 基于货单询价

### 6. 管理功能
- 租户管理
- 用户管理
- 内容审核
- 数据统计

---

# 第三部分：用户体验流程

## 👥 用户使用流程

### 买家用户流程
1. **注册登录** - 邮箱注册，完善基本信息
2. **跨租户浏览** - 浏览所有租户的商品和案例
3. **创建货单** - 添加跨租户商品到货单
4. **发起咨询** - 直接向案例发布者或商品所属租户咨询
5. **实时沟通** - 与对应租户联系人在线交流询价

### 租户用户流程
1. **申请入驻** - 提交租户申请，等待审核
2. **建立店铺** - 设置租户信息，上传Logo和介绍
3. **发布内容** - 发布商品和案例，展示服务能力
4. **接收咨询** - 处理来自买家的咨询请求
5. **客户服务** - 提供专业咨询和报价服务

### 管理员流程
1. **租户审核** - 审核新租户申请
2. **内容管理** - 审核商品和案例内容
3. **平台监控** - 监控平台运营数据

## 🎯 核心功能优势

- **多租户架构**: 支持多个独立商家入驻展示
- **跨租户浏览**: 买家可浏览所有租户商品案例
- **精准联系**: 咨询直达案例发布者，提高响应效率
- **统一体验**: 跨租户统一的用户体验和交互界面

## 📱 技术实现

### 前端技术栈
- **React**: 组件化UI开发
- **TypeScript**: 类型安全
- **Tailwind CSS**: 样式系统
- **Vite**: 构建工具

### 后端服务
- **Supabase**: 数据库 + 认证 + 实时功能
- **PostgreSQL**: 数据存储
- **Row Level Security**: 数据权限控制

## 📊 数据库设计原则

- **简洁高效**: 只保留核心必要字段
- **扩展性**: 使用JSON字段存储灵活数据
- **安全性**: RLS策略确保数据访问安全
- **实时性**: 支持实时数据同步和通信

---

**总结**: 本设计专注于当前实际需求，去除过度设计的复杂功能，保持系统简洁高效，支持核心的商品展示和咨询询价业务流程。