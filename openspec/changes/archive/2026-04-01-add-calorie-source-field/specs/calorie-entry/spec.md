## ADDED Requirements

### Requirement: 卡路里条目支持数据来源标识
系统 SHALL 为每条卡路里记录提供 `source` 字段，标识数据来源。`source` MUST 为枚举值：`manual`（手动录入）或 `healthkit`（iOS 健康 App 导入）。未指定时默认为 `manual`。

#### Scenario: 手动创建条目不指定 source
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-04-01T12:00:00Z" }` 且未包含 `source` 字段
- **THEN** 系统创建条目，`source` 字段默认为 `manual`

#### Scenario: 显式指定 source 为 healthkit
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "burn", calories: 300, title: "跑步", entryDate: "2026-04-01T18:00:00Z", source: "healthkit" }`
- **THEN** 系统创建条目，`source` 字段为 `healthkit`

#### Scenario: source 值非法
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ source: "unknown" }`
- **THEN** 系统返回 400 状态码及校验错误信息

### Requirement: 按来源筛选卡路里条目
系统 SHALL 允许已认证用户按 `source` 筛选卡路里条目列表。

#### Scenario: 按 manual 筛选
- **WHEN** 已认证用户发送 GET /calorie?source=manual
- **THEN** 系统返回 `source` 为 `manual` 的条目，同时包含历史数据中无 `source` 字段的条目

#### Scenario: 按 healthkit 筛选
- **WHEN** 已认证用户发送 GET /calorie?source=healthkit
- **THEN** 系统仅返回 `source` 为 `healthkit` 的条目

#### Scenario: 不指定 source 查询
- **WHEN** 已认证用户发送 GET /calorie 不带 source 参数
- **THEN** 系统返回所有来源的条目（行为不变）

## MODIFIED Requirements

### Requirement: 创建卡路里条目
系统 SHALL 允许已认证用户创建卡路里条目，条目 MUST 自动关联当前用户。条目 MAY 包含可选的 `source` 字段，默认为 `manual`。

#### Scenario: 成功创建摄入条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-03-23T12:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，条目的 userId 为当前用户，`source` 默认为 `manual`

#### Scenario: 成功创建消耗条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "burn", calories: 300, title: "跑步", entryDate: "2026-03-23T18:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，`source` 默认为 `manual`

#### Scenario: 缺少必填字段
- **WHEN** 已认证用户发送 POST /calorie，body 缺少 type、calories 或 title
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 POST /calorie
- **THEN** 系统返回 401 状态码

### Requirement: 查询卡路里条目列表
系统 SHALL 允许已认证用户分页查询自己的卡路里条目，结果 MUST 仅包含当前用户的数据。支持按 `source` 筛选。

#### Scenario: 默认分页查询
- **WHEN** 已认证用户发送 GET /calorie
- **THEN** 系统返回当前用户的条目列表（默认第 1 页，每页 20 条）、总数，按 entryDate 降序排列

#### Scenario: 指定页码和每页数量
- **WHEN** 已认证用户发送 GET /calorie?page=2&pageSize=10
- **THEN** 系统返回第 2 页的 10 条数据及总数

#### Scenario: 按时间范围筛选
- **WHEN** 已认证用户发送 GET /calorie?startDate=2026-03-01&endDate=2026-03-31
- **THEN** 系统仅返回 entryDate 在指定范围内的条目

#### Scenario: 按类型筛选
- **WHEN** 已认证用户发送 GET /calorie?type=intake
- **THEN** 系统仅返回摄入类型的条目

#### Scenario: 按来源筛选
- **WHEN** 已认证用户发送 GET /calorie?source=manual
- **THEN** 系统返回 `source` 为 `manual` 或未设置 `source` 的条目

#### Scenario: 无数据
- **WHEN** 已认证用户没有任何卡路里条目
- **THEN** 系统返回空数组和 total 为 0
