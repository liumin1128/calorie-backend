## Why

用户需要记录每日的卡路里摄入与消耗情况，这是卡路里管理应用的核心业务功能。当前系统仅有认证模块，缺少实际业务数据的管理能力。新增卡路里记录 CRUD 功能后，每个用户可以独立管理自己的卡路里条目，实现基本的热量追踪。

## What Changes

- 新增 `calorie` 业务模块（Controller / Service / Module / Schema / DTO）
- 新增 `CalorieEntry` Mongoose Schema，包含字段：用户关联、时间、卡路里数值、类型（摄入/消耗）、title、description、images
- 提供 RESTful CRUD API：创建、查询列表（分页 + 按用户隔离）、查询单条、更新、删除
- 所有接口需 JWT 认证，数据按用户隔离（只能操作自己的记录）
- 支持按时间范围筛选查询

## Capabilities

### New Capabilities

- `calorie-entry`: 卡路里条目的增删改查，包含数据模型定义、DTO 校验、RESTful API 端点、用户数据隔离

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **新增代码**: `src/calorie/` 模块目录（controller、service、module、schema、dto）
- **模块注册**: `app.module.ts` 需导入 CalorieModule
- **API 端点**: 新增 `/calorie` 路由组（GET / POST / PATCH / DELETE）
- **数据库**: MongoDB 新增 `calorieentries` 集合
- **依赖**: 复用现有 JWT 认证守卫（`JwtAuthGuard`），无新增外部依赖
