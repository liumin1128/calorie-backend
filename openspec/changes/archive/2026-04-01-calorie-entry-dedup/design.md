## Context

CalorieEntry 已支持 `source` 字段区分手动录入和 HealthKit 导入。多来源场景下同一事件可能被重复录入（如用户手动记录后 HealthKit 再次同步），需要去重机制。

当前 `create` 方法直接调用 `Model.create()`，无去重判断。已有索引：`{ userId: 1, entryDate: -1 }`（非唯一）。

## Goals / Non-Goals

**Goals:**
- 基于 `userId + entryDate + type` 实现 upsert 去重
- 数据库唯一索引保证数据一致性
- Controller 通过状态码（201 新建 / 200 更新）明确反馈操作结果

**Non-Goals:**
- 不处理批量导入接口（后续 HealthKit 导入时再做）
- 不修改查询、更新、删除的现有逻辑

## Decisions

### 1. 使用 Mongoose `findOneAndUpdate` + `upsert: true`

Service 的 `create` 方法改用 `findOneAndUpdate`，以 `{ userId, entryDate, type }` 为查询条件，`upsert: true`。

**替代方案**: 先查再决定 insert/update → 存在竞态条件，需分布式锁，复杂度高，放弃。

### 2. 新增唯一复合索引

在 Schema 层添加 `{ userId: 1, entryDate: 1, type: 1 }` 唯一索引，数据库层兜底。

**替代方案**: 仅靠应用层去重 → 并发场景下仍可能产生重复，放弃。

### 3. 通过 `upsertedId` 判断新建/更新

`findOneAndUpdate` 返回结果配合 `rawResult: true` 可获取 `upsertedId`，有值为新建（201），无值为更新（200）。

## Risks / Trade-offs

- **[风险] 历史重复数据** → 新增唯一索引前需清理已有重复数据，否则索引创建失败。部署前运行去重脚本。
- **[风险] entryDate 精度** → 同一用户同一天多次摄入（如早餐午餐）type 都是 `intake`，如果 `entryDate` 只有日期精度则会误判为同一条。需确保客户端传入精确时间戳。
- **[取舍] upsert 语义变更** → POST 接口从纯创建变为"创建或更新"，前端需适配状态码变化。
