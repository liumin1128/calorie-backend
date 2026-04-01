## Why

当前去重策略基于 `userId + entryDate + type`，存在逻辑缺陷：同一时间同一类型可能有多条合法记录（如同时间段吃了两种食物，都是 `intake`）。需要改为前端传入的唯一标识 `externalId` 作为去重键，由调用方保证唯一性，更加灵活可靠。

## What Changes

- Schema 新增 `externalId` 可选字符串字段
- 唯一复合索引从 `{ userId, entryDate, type }` 改为 `{ userId, externalId }`（稀疏索引，仅对有 `externalId` 的记录生效）
- Service `create` 方法：有 `externalId` 时走 upsert 去重，没有时走普通创建
- DTO 新增 `externalId` 可选字段
- **BREAKING**: 移除基于 `entryDate + type` 的去重逻辑

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `calorie-entry`: 去重策略从 `userId + entryDate + type` 改为 `userId + externalId`，新增 `externalId` 字段

## Impact

- **Schema**: `calorie-entry.schema.ts` 新增字段、替换索引
- **DTO**: `create-calorie-entry.dto.ts` 新增 `externalId` 可选字段
- **Service**: `calorie.service.ts` 重写 `create` 方法的去重逻辑
- **Controller**: `calorie.controller.ts` 保持 201/200 状态码区分逻辑
- **数据库**: 原唯一索引需删除，新建稀疏唯一索引
