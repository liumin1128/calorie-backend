## Context

上一版去重基于 `userId + entryDate + type` 唯一索引 + upsert，但该策略有逻辑缺陷：同一时间同一类型可以有多条不同记录。需改为由前端传入 `externalId`（如 HealthKit 的 UUID）作为去重键。

当前代码状态：Schema 有 `{ userId: 1, entryDate: 1, type: 1 }` 唯一索引，Service `create` 使用 `findOneAndUpdate` + upsert，Controller 根据 `isNew` 返回 201/200。

## Goals / Non-Goals

**Goals:**
- 新增 `externalId` 可选字段，唯一索引改为 `{ userId, externalId }` 稀疏索引
- 有 `externalId` 时走 upsert 去重，无 `externalId` 时走普通创建
- 保持 Controller 的 201/200 状态码区分

**Non-Goals:**
- 不在后端生成 `externalId`，由前端/导入方负责
- 不修改查询、更新、删除逻辑

## Decisions

### 1. 使用稀疏唯一索引（sparse）

`{ userId: 1, externalId: 1 }` 配合 `sparse: true`，只对有 `externalId` 的文档生效。手动创建的记录不传 `externalId`，不受索引约束，可以自由创建。

**替代方案**: 普通唯一索引 → 所有记录都必须有 `externalId`，手动录入不友好，放弃。

### 2. create 方法分支逻辑

- 有 `externalId`：`findOneAndUpdate({ userId, externalId }, ..., { upsert: true })` → 去重
- 无 `externalId`：`Model.create()` → 普通创建，总是返回 201

逻辑清晰，两条路径互不干扰。

### 3. externalId 由前端负责生成

HealthKit 导入时使用 HealthKit 的 UUID；手动录入可不传。后端不校验格式，仅作为字符串存储和匹配。

## Risks / Trade-offs

- **[风险] 旧索引需删除** → 部署时需先 `dropIndex` 旧的 `{ userId, entryDate, type }` 唯一索引，再创建新的稀疏索引。Mongoose 的 `autoIndex` 会自动创建新索引，但不会删除旧索引。
- **[取舍] externalId 可选** → 手动录入可以不传，意味着手动录入的记录永远不会被去重。这是预期行为。
