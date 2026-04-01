## Context

当前 `calorie` 模块提供卡路里条目的 CRUD 操作，数据通过 `CalorieEntry` 集合存储，已有 `{ userId: 1, entryDate: -1 }` 复合索引。前端需要按天展示摄入/消耗汇总数据，现有 API 只支持分页列表查询，无法高效地提供聚合数据。

现有 Schema 关键字段：
- `userId`: ObjectId（关联用户）
- `type`: `'intake'` | `'burn'`
- `calories`: number
- `entryDate`: Date

## Goals / Non-Goals

**Goals:**
- 提供 `GET /calorie/daily-summary` 端点，按天聚合用户的卡路里数据
- 使用 MongoDB Aggregation Pipeline 在数据库层完成聚合，减少数据传输和前端计算
- 返回结构为 `{ [date: string]: { totalIntake: number, totalBurn: number } }`

**Non-Goals:**
- 不做缓存（数据量不大，聚合查询性能足够）
- 不支持按周/月粒度聚合（本次只按天）
- 不做数据补零（无数据的日期不返回 key）

## Decisions

### 1. 使用 MongoDB Aggregation Pipeline

**选择**: 直接使用 Mongoose 的 `.aggregate()` 方法执行 MongoDB Aggregation Pipeline

**理由**: 
- 聚合逻辑在数据库层完成，避免将大量原始条目传输到应用层
- MongoDB 的 `$group` + `$dateToString` 能高效按天分组并分类汇总
- 已有 `{ userId: 1, entryDate: -1 }` 索引可加速 `$match` 阶段

**替代方案**: 在应用层查询原始数据后手动聚合 → 数据量大时性能差，且浪费带宽

### 2. 端点路径 `/calorie/daily-summary`

**选择**: 在现有 `calorie` 模块下新增路径 `/calorie/daily-summary`

**理由**: 
- 复用已有模块结构、认证守卫、依赖注入
- 语义上属于卡路里数据的派生查询，放在同一模块合理
- 注意：需要将该路由声明放在 `:id` 路由之前，避免 NestJS 将 `daily-summary` 当作 `:id` 参数匹配

### 3. 返回格式为对象而非数组

**选择**: 返回 `{ "2026-03-23": { totalIntake: 1200, totalBurn: 300 }, ... }`

**理由**: 
- 前端按日期查找 O(1)，适合日历/图表场景
- 用户指定需要以日期为 key 的对象格式

**替代方案**: 返回数组 `[{ date, totalIntake, totalBurn }]` → 需额外转换，不符合需求

### 4. 必须提供 startDate 和 endDate

**选择**: 两个参数均为必填

**理由**:
- 避免全量聚合导致的性能问题
- 前端明确需要某段时间的数据，必传符合使用场景

## Risks / Trade-offs

- **[时区问题]** → 使用 `$dateToString` 时指定 UTC 时区，前端统一以 UTC 日期传参。后续如需支持用户时区可扩展
- **[大范围查询]** → 如果用户查询跨度过大（如一整年），aggregation 可能较慢。当前不限制范围，后续可加最大天数限制
- **[路由冲突]** → `daily-summary` 可能被 `:id` 路由捕获 → 确保 `@Get('daily-summary')` 声明在 `@Get(':id')` 之前
