## Why

卡路里记录支持多来源（手动录入、HealthKit 导入）后，同一事件可能被重复录入。需要去重机制防止重复创建，当 `userId + entryDate + type` 相同时视为同一条记录，执行更新而非新增。

## What Changes

- 创建接口改为 upsert 语义：`userId + entryDate + type` 匹配到已有记录时更新，否则新建
- Schema 层新增 `userId + entryDate + type` 唯一复合索引，数据库层面保证唯一性
- 创建接口返回值明确标识是新建还是更新（通过 HTTP 状态码 201/200 区分）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `calorie-entry`: 创建接口增加去重 upsert 逻辑，新增唯一复合索引

## Impact

- **Schema**: `calorie-entry.schema.ts` 新增复合唯一索引
- **Service**: `calorie.service.ts` 的 `create` 方法改为 upsert
- **Controller**: `calorie.controller.ts` 根据 upsert 结果返回不同状态码
- **API**: POST /calorie 行为变更 — 重复记录不再报错而是更新，**BREAKING**（返回状态码可能从 201 变为 200）
