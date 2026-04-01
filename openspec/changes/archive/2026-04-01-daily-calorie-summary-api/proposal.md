## Why

前端需要展示用户在某段时间内每天的卡路里摄入和消耗概况（如图表、日历视图）。目前卡路里条目 API 只支持分页列表查询，前端需要手动拉取全部条目再按天聚合，既浪费带宽又影响性能。提供一个服务端按天聚合的 API 可以大幅简化前端逻辑并提升响应速度。

## What Changes

- 新增 `GET /calorie/daily-summary` 端点，接受 `startDate` 和 `endDate` 查询参数
- 使用 MongoDB Aggregation Pipeline 按天分组，分别汇总 `intake` 和 `burn` 类型的 calories
- 返回以日期字符串为 key 的对象，value 包含 `totalIntake` 和 `totalBurn`
- 仅返回有数据的日期（无数据的日期不出现在结果中）
- 需要 JWT 认证，仅查询当前用户数据

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `calorie-entry`: 新增按天汇总查询端点 `GET /calorie/daily-summary`，支持时间范围筛选，返回每日摄入/消耗总量

## Impact

- **代码**: 修改 `src/calorie/` 模块，新增 DTO、Service 方法、Controller 端点
- **API**: 新增 `GET /calorie/daily-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **数据库**: 利用已有的 `CalorieEntry` 集合和 `{ userId: 1, entryDate: -1 }` 索引，通过 aggregation pipeline 查询，无需新增 schema 或索引
- **依赖**: 无新增依赖
