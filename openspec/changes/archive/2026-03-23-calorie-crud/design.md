## Context

当前系统仅有认证模块（Auth），用户可以注册、登录并获取个人资料。作为卡路里管理应用的核心功能，需要新增卡路里条目的 CRUD 模块，让每个用户独立记录和管理自己的卡路里摄入与消耗数据。

现有架构采用 NestJS 标准模块化分层（Controller → Service → Schema），JWT 认证通过 `JwtAuthGuard` 实现，全局启用 `ValidationPipe`。新模块将完全复用这些基础设施。

## Goals / Non-Goals

**Goals:**
- 提供完整的卡路里条目 CRUD API（创建、分页查询、单条查询、更新、删除）
- 严格的用户数据隔离，用户只能操作自己的记录
- 支持按时间范围筛选
- 支持图片 URL 数组存储（图片上传不在本次范围内）

**Non-Goals:**
- 不包含图片上传/存储服务（仅存储 URL）
- 不包含卡路里统计汇总 API（后续迭代）
- 不包含食物数据库/自动识别功能
- 不包含数据导入导出

## Decisions

### 1. 数据模型设计

`CalorieEntry` Schema 字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | ObjectId (ref: User) | 所属用户，建立索引 |
| type | enum: 'intake' / 'burn' | 摄入或消耗 |
| calories | number | 卡路里数值（正数） |
| title | string | 条目标题 |
| description | string | 详细描述（可选） |
| images | string[] | 图片 URL 数组（可选） |
| entryDate | Date | 条目关联的日期时间 |
| timestamps | auto | createdAt / updatedAt 自动管理 |

**理由**: 使用 `type` 枚举区分摄入/消耗比分两个集合更简洁，查询也更方便。`entryDate` 独立于 `createdAt`，允许用户补录历史数据。

### 2. API 路由设计

所有路由前缀 `/calorie`，全部需要 JWT 认证：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /calorie | 创建条目 |
| GET | /calorie | 查询列表（分页 + 时间筛选） |
| GET | /calorie/:id | 查询单条 |
| PATCH | /calorie/:id | 更新条目 |
| DELETE | /calorie/:id | 删除条目 |

**理由**: 遵循 RESTful 惯例，使用 PATCH 而非 PUT 支持部分更新。

### 3. 用户数据隔离策略

Service 层所有操作自动注入当前用户 ID（从 JWT token 中提取），查询条件始终包含 `userId` 过滤。Controller 从 `@Request()` 中获取用户信息传递给 Service。

**理由**: 在 Service 层统一处理比在 Guard 中拦截更灵活、更明确，也更易测试。

### 4. 分页策略

采用 `skip/limit` 分页（page + pageSize 参数），默认 pageSize=20，最大 100。返回 `total` 总数用于前端分页。

**理由**: 数据量级不大的场景下，offset 分页实现简单、前端友好。

### 5. 索引设计

- `{ userId: 1, entryDate: -1 }` 复合索引：覆盖用户 + 时间范围的常见查询模式

## Risks / Trade-offs

- **[图片 URL 无校验]** → 本期仅存储 URL 字符串，不验证 URL 可达性。后续接入图片上传服务后可统一校验。
- **[skip/limit 分页性能]** → 当数据量极大时 skip 性能会下降。当前用户级数据量可控，暂不引入游标分页。
- **[无软删除]** → 采用硬删除简化实现。如需回收站功能，后续可加 `deletedAt` 字段。
