## Why

用户录入身高体重时，每条记录都有 `recordedAt` 时间戳。当前系统在查询用户完整信息（`GET /user/full-profile`）时，总是返回**全局最新**的身高体重数据，无法基于时间点进行回溯查询。这导致在"查看历史信息"等场景下，用户看到的身高体重永远是当前最新值，而不是当时的实际数据。需要支持"截止到某个时间点的最新身高体重"查询能力，使数据展示符合时间语义。

## What Changes

- 修改 `DynamicDataService.findLatestByCategories` 方法，增加可选的 `beforeDate` 参数，支持查询 `recordedAt <= beforeDate` 的最新记录
- 修改 `GET /user/full-profile` 接口，增加可选的 `date` 查询参数，传入时返回截止到该时间点的最新身高体重
- 修改 `GET /dynamic-data/latest` 接口的查询逻辑，从"指定日期当天范围"改为"截止到指定日期"（`recordedAt <= 该日期结束时间`），使语义更清晰

## Capabilities

### New Capabilities

（无新增能力模块）

### Modified Capabilities

- `dynamic-data`: 修改时间点查询逻辑，从"同一天范围内"改为"截止到指定时间点"；`findLatestByCategories` 新增 `beforeDate` 支持
- `user-profile`: `GET /user/full-profile` 新增可选 `date` 查询参数，支持回溯查询历史时间点的身高体重

## Impact

- **API 变更**: `GET /user/full-profile` 新增可选 query param `date`（非 Breaking，不带参数时行为不变）
- **API 行为变更**: `GET /dynamic-data/latest` 的 `date` 参数语义从"当天范围"变为"截止到该日期"（**BREAKING** — 原有只查当天的行为会改变）
- **受影响代码**: `src/dynamic-data/dynamic-data.service.ts`、`src/user/user.service.ts`、`src/user/user.controller.ts`、`src/dynamic-data/dynamic-data.controller.ts`
- **受影响测试**: `src/dynamic-data/dynamic-data.service.spec.ts`、`src/user/user.service.spec.ts`
