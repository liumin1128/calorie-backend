## Context

当前系统中，动态数据（身高体重）的查询存在两种模式：
1. `findLatest` — 查询指定日期**当天范围**（00:00~23:59）内的最新一条记录
2. `findLatestByCategories` — 查询**全局最新**（无日期约束），被 `GET /user/full-profile` 使用

用户的实际需求是：当查看某个历史时间点的信息时，应展示"截止到该时间点的最新身高体重"，而非当前最新值。这需要统一查询语义为 `recordedAt <= targetDate`。

## Goals / Non-Goals

**Goals:**
- `findLatestByCategories` 支持可选的 `beforeDate` 参数，限制 `recordedAt <= beforeDate`
- `GET /user/full-profile` 接受可选 `date` 查询参数，传入时使用时间回溯查询
- `GET /dynamic-data/latest` 的 `date` 参数语义从"当天范围"改为"截止到该日期结束时间"
- 不传时间参数时，所有接口行为保持不变（向后兼容）

**Non-Goals:**
- 不修改趋势查询（`GET /dynamic-data/trend`）的行为——趋势查询按天分组的逻辑不变
- 不修改数据录入逻辑
- 不引入新的模块或 Schema

## Decisions

### 1. 查询语义统一为 `recordedAt <= targetDate`

**选择**: 将 `findLatest` 从"当天范围查询"改为"截止日期查询"，即 `recordedAt <= dayEnd(date)`。

**理由**: "截止到某时间点的最新值"才是真正有用的语义。原有"当天范围"查询在该天无数据时返回 null，但用户实际期望看到更早的有效值。

**替代方案**: 新增独立方法 `findLatestBefore`，保留原 `findLatest` 不变。
→ 放弃原因：原有的"当天范围"语义使用场景有限，统一语义更简洁。

### 2. `findLatestByCategories` 增加可选 `beforeDate`

**选择**: 在现有 aggregate 查询中增加 `recordedAt: { $lte: beforeDate }` 条件（仅在传入时）。

**理由**: 最小化改动，不传入时保持原有"全局最新"行为。

### 3. `GET /user/full-profile?date=` 透传日期

**选择**: Controller 层接收 `date` query param，透传给 `UserService.getFullProfile`，再传给 `findLatestByCategories`。

**理由**: 层层透传，职责清晰，不增加额外抽象。

## Risks / Trade-offs

- **[Breaking Change] `GET /dynamic-data/latest` 行为变更** → 前端如果依赖"当天范围"语义需要调整。缓解：当前项目尚在初期开发，影响可控。
- **[性能] 无 `beforeDate` 限制的全局查询** → `findLatestByCategories` 不传 `beforeDate` 时是全集扫描后取最新。建议确保 `(userId, category, recordedAt)` 复合索引存在。当前数据量小，暂无需优化。
