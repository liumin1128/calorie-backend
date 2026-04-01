## Why

当前卡路里记录没有来源标识，所有条目均为手动创建。后续计划对接 iOS 健康 App 数据导入，需要区分"手动录入"和"外部导入"的记录，以便用户筛选、展示不同来源的数据，并为将来扩展更多数据源做好准备。

## What Changes

- CalorieEntry Schema 新增 `source` 字段，枚举值为 `manual`（默认）和 `healthkit`
- 创建 DTO 同步增加 `source` 可选字段，默认值为 `manual`
- 查询接口支持按 `source` 筛选
- 已有数据兼容处理：未填写 `source` 的历史记录视为 `manual`

## Capabilities

### New Capabilities

（无新增能力模块）

### Modified Capabilities

- `calorie-entry`: 新增 `source` 字段支持数据来源标识，查询支持按来源筛选

## Impact

- **Schema**: `calorie-entry.schema.ts` 新增 `source` 字段
- **DTO**: `create-calorie-entry.dto.ts`、`query-calorie-entry.dto.ts`、`update-calorie-entry.dto.ts` 需更新
- **Service**: `calorie.service.ts` 查询逻辑增加 `source` 过滤
- **API**: 现有 API 行为向后兼容，`source` 为可选字段，默认 `manual`
- **数据库**: 历史数据无需迁移，`source` 为可选字段并设置默认值
