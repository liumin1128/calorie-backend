## Context

当前 Calorie 后端仅有 `auth` 模块，User Schema 只包含 `email`、`password`、`nickname` 三个字段。系统缺少个人信息管理能力，且没有时间序列健康数据的存储方案。本次变更需要：

1. 扩展用户基础信息并提供独立的 profile 管理模块
2. 设计通用的动态数据存储方案（身高、体重等随时间变化的指标）
3. 修改登录响应以返回完整用户画像

现有约束：
- NestJS 11 模块化架构，Mongoose 9 ODM
- JWT 认证体系已建立，守卫机制成熟
- 全局 ValidationPipe（whitelist: true）

## Goals / Non-Goals

**Goals:**
- 提供用户基础信息（性别、生日、签名）的更新接口
- 设计可扩展的动态数据模型，支持通过 `category` 区分不同类型（身高、体重，未来可扩展其他指标）
- 动态数据支持时间点查询（当天最新）和时间段趋势查询（每天最新）
- 登录及 full-profile 接口聚合返回基础信息和最新动态数据

**Non-Goals:**
- 不做数据可视化（前端负责）
- 不做批量导入/导出
- 不做动态数据的删除或修改（追加模式，保留历史）
- 不引入缓存层（当前数据量不需要）

## Decisions

### Decision 1: 基础信息直接扩展 User Schema

**选择**: 在现有 User Schema 上直接新增 `gender`、`birthday`、`signature` 字段（均为可选字段）。

**理由**: 这些字段与用户强绑定、变更频率低、无需历史追踪，直接在 User 文档上操作最简单。

**备选方案**: 独立 Profile Collection —— 引入额外 join 成本，对于少量静态字段过度设计。

### Decision 2: 新建 `user` 模块管理 profile 逻辑

**选择**: 从 `auth` 模块中分离出 `user` 模块，负责用户信息查询与更新。

**理由**: 
- `auth` 模块专注认证流程（注册/登录/JWT），不应承载个人信息管理职责
- 符合单一职责原则，便于后续扩展（如头像上传、偏好设置）
- `auth` 模块通过 DI 注入 `UserService` 和 `DynamicDataService` 来组装登录响应

### Decision 3: 动态数据独立 Collection + category 分类

**选择**: 新建 `DynamicData` Collection，结构为 `{ userId, category, value, recordedAt }`。

**理由**:
- 身高体重是连续追踪的时间序列数据，与用户基础信息性质不同
- `category` 字段（如 `height`、`weight`）使模型可扩展到其他动态指标
- 独立 Collection 避免 User 文档无限膨胀
- `recordedAt` 字段按用户指定时间记录（默认当前时间），结合 `createdAt` 保留系统时间戳

**备选方案**: 嵌入 User 文档的子数组 —— 随数据增长文档会超限（16MB），查询效率也会下降。

### Decision 4: 查询策略 — MongoDB 聚合管道

**选择**: 
- **时间点查询**: 按 `userId + category + recordedAt <= 指定日期结束`，`sort({ recordedAt: -1 })` 取第一条
- **时间段趋势**: 使用 MongoDB Aggregation Pipeline，按天分组 `$group`，取每天 `$last`（按 recordedAt 排序后）

**理由**: 利用 MongoDB 原生聚合能力，避免应用层循环处理，性能较优。建立 `{ userId, category, recordedAt }` 复合索引支撑查询。

### Decision 5: `auth` 模块登录响应变更方式

**选择**: `AuthService` 注入 `UserService` 和 `DynamicDataService`，在 `buildResponse` 中聚合数据。

**理由**: 保持 Controller 薄层设计，聚合逻辑在 Service 层完成。通过模块 `exports` 和 `imports` 建立依赖关系。

## Risks / Trade-offs

- **[趋势查询性能]** → 建立 `{ userId, category, recordedAt }` 复合索引；数据量大后可考虑按时间范围分片查询
- **[登录响应延迟]** → 聚合查询增加一次 DB 调用；当前阶段可接受，未来可加缓存
- **[category 扩展性]** → 当前硬编码 `height` / `weight`，未来需扩展时应定义枚举常量或配置
- **[数据不可修改]** → 追加模式意味着错误数据无法修正；可后续补充修改/删除接口，当前优先保证简洁
