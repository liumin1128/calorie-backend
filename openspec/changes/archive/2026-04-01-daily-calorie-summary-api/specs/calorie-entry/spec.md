## ADDED Requirements

### Requirement: 查询每日卡路里摄入和消耗汇总
系统 SHALL 允许已认证用户查询指定时间范围内每天的卡路里摄入总量和消耗总量。

#### Scenario: 成功查询每日汇总
- **WHEN** 已认证用户发送 GET /calorie/daily-summary?startDate=2026-03-01&endDate=2026-03-07
- **THEN** 系统返回 200 状态码及以日期为 key 的对象，每个 value 包含 `totalIntake`（当日摄入总卡路里）和 `totalBurn`（当日消耗总卡路里），仅包含有数据的日期

#### Scenario: 返回数据格式
- **WHEN** 用户在 2026-03-01 有两条摄入（500, 300）和一条消耗（200），2026-03-02 有一条摄入（400）
- **THEN** 系统返回 `{ "2026-03-01": { "totalIntake": 800, "totalBurn": 200 }, "2026-03-02": { "totalIntake": 400, "totalBurn": 0 } }`

#### Scenario: 范围内无数据
- **WHEN** 已认证用户查询的时间范围内没有任何卡路里条目
- **THEN** 系统返回 200 状态码及空对象 `{}`

#### Scenario: 仅返回当前用户数据
- **WHEN** 已认证用户查询的时间范围内存在其他用户的卡路里条目
- **THEN** 系统 MUST 仅返回当前用户的数据，不包含其他用户的条目

### Requirement: 每日汇总查询参数校验
系统 MUST 对每日汇总查询的输入参数进行严格校验。

#### Scenario: startDate 和 endDate 均为必填
- **WHEN** 已认证用户发送 GET /calorie/daily-summary 缺少 startDate 或 endDate
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 日期格式校验
- **WHEN** 已认证用户发送的 startDate 或 endDate 不是有效的日期格式（YYYY-MM-DD）
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: startDate 不应晚于 endDate
- **WHEN** 已认证用户发送的 startDate 晚于 endDate
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 GET /calorie/daily-summary
- **THEN** 系统返回 401 状态码
