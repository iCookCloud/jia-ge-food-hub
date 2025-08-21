# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要要求
**不主动启动项目** ：修改代码后不要主动启动项目，因为已启动完毕，检查代码仅使用lint或者build即可。
**supabase** 对应的supabase项目id为 skowhfrykowtbchoypbl
**询价功能说明**：点击"咨询询价"按钮时，应跳转到对应的聊天窗口。询价功能实际上就是聊天功能，与传统的报价流程无关。

## 常用命令 (Common Commands)

**开发环境**
- `npm run dev` - 启动开发服务器，运行在 http://localhost:8080
- `npm run build` - 生产环境构建
- `npm run build:dev` - 开发模式构建
- `npm run lint` - 运行 ESLint 检查代码质量
- `npm run preview` - 预览生产构建结果

**数据库迁移**
- Supabase 迁移文件位于 `/supabase/migrations/`
- 数据库结构变更需要创建新的迁移文件

## 架构概览 (Architecture Overview)

**技术栈**
- **前端**: Vite + React + TypeScript
- **UI组件**: shadcn-ui (基于 Radix UI)
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: TanStack React Query + Zustand
- **表单**: React Hook Form + Zod
- **路由**: React Router v6

**项目结构**
```
src/
├── components/          # React 组件
│   ├── ui/             # shadcn-ui 基础组件
│   ├── auth/           # 认证相关组件
│   ├── product/        # 产品相关组件
│   ├── quotations/     # 报价相关组件
│   └── layout/         # 布局组件
├── pages/              # 页面组件
├── hooks/              # 自定义 hooks
├── services/           # API 服务层
├── integrations/       # 第三方集成 (Supabase)
└── lib/               # 工具函数
```

**数据架构**
- 使用 Supabase 作为后端服务，包含认证、数据库、实时订阅
- 主要实体：users, products, quotations, orders, product_lists, messages
- 支持三种用户角色：buyer, supplier, admin
- 实现了 RLS (Row Level Security) 进行数据权限控制

**状态管理模式**
- React Query 处理服务端状态、缓存和同步
- 自定义 hooks 封装数据获取逻辑 (useProducts, useQuotations, useOrders)
- Context API 管理全局认证状态 (AuthProvider)
- 本地状态使用 React useState 和 useReducer

**服务层模式**
- `/src/services/api.ts` - 通用 API 工具和产品服务
- 专用服务文件：quotationService, realtimeService, storageService
- 统一的错误处理和类型定义
- 使用 TypeScript 的数据库类型定义确保类型安全

**认证和权限**
- 基于 Supabase Auth 的用户认证系统
- 路由级权限控制：PublicRoute, ProtectedRoute, AdminRoute
- 用户角色动态加载和权限检查
- 自动创建用户档案和默认买家角色

**实时功能**
- 通过 Supabase Realtime 实现数据实时同步
- realtimeService 提供订阅数据库变更的统一接口
- 支持产品、订单、消息的实时更新

**UI 和样式约定**
- 使用 shadcn-ui 组件系统，配置在 `components.json`
- CSS 变量系统支持主题定制和暗色模式
- 响应式设计，移动端优先
- 使用 Lucide React 图标库
- Toast 通知使用 sonner 和内置 toast 系统

## 开发注意事项

**数据库操作**
- 所有数据库类型定义在 `/src/integrations/supabase/types.ts`
- 使用 productService 等专用服务而不是直接调用 supabase client
- 遵循 RLS 策略，确保数据安全访问

**组件开发**
- 新组件应放在对应的功能目录下
- UI 组件统一使用 shadcn-ui 模式
- 使用 TypeScript 确保类型安全
- 遵循现有的命名约定和目录结构

**状态管理**
- 服务端状态使用 React Query hooks
- 将数据获取逻辑封装在自定义 hooks 中
- 避免在组件中直接调用 API 服务

**路径别名**
- `@/` 指向 `src/` 目录
- 使用绝对导入而不是相对路径
- 别名配置在 `vite.config.ts` 和 `tsconfig.json` 中

**错误处理**
- 使用 `handleApiError` 进行统一的错误消息处理
- Toast 通知用于用户友好的错误反馈
- 在组件层面处理加载和错误状态