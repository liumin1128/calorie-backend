## Why

用户需要追踪每日饮水量以维持健康习惯。当前系统缺少独立的饮水记录能力，用户无法记录和查询每天喝了多少水。食物中的水分由前端基于 CalorieEntry 的 water 字段自行计算，后端只需管理用户手动饮水量。

## What Changes

- **新增 WaterIntake 模块**: 极简饮水记录模块，每用户每天一条记录，支持查询和设置
- **查询 API**: 查询指定日期范围内的每日饮水量
- **设置 API**: 设置/覆盖某天的饮水量，用户可自由加减调整

## Capabilities

### New Capabilities
- `water-intake`: 每日饮水量查询与设置，每用户每天一条记录，覆盖式更新

### Modified Capabilities

## Impact

- **新增模块**: `src/water/` — WaterIntake schema、controller、service、dto
- **数据库**: 新增 `waterintakes` 集合，`{ userId, date }` 唯一索引保证每天一条
- **API**: 新增 `/water` 路由组（GET 查询 + PUT 设置）
