## ADDED Requirements

### Requirement: 设置每日饮水量
系统 SHALL 允许已认证用户设置指定日期的饮水量。每用户每天在数据库中 MUST 仅有一条记录，重复设置 SHALL 覆盖已有记录。

#### Scenario: 首次设置某天饮水量
- **WHEN** 已认证用户发送 PUT /water，body 包含 `{ date: "2026-04-16", amount: 1500 }`，且该日期无记录
- **THEN** 系统创建记录并返回 200 状态码及 `{ date: "2026-04-16", amount: 1500 }`

#### Scenario: 覆盖某天饮水量
- **WHEN** 已认证用户发送 PUT /water，body 包含 `{ date: "2026-04-16", amount: 2000 }`，且该日期已有记录（amount: 1500）
- **THEN** 系统覆盖更新并返回 200 状态码及 `{ date: "2026-04-16", amount: 2000 }`

#### Scenario: 将饮水量设为 0
- **WHEN** 已认证用户发送 PUT /water，body 包含 `{ date: "2026-04-16", amount: 0 }`
- **THEN** 系统覆盖更新并返回 200 状态码及 `{ date: "2026-04-16", amount: 0 }`

#### Scenario: 缺少必填字段
- **WHEN** 已认证用户发送 PUT /water，body 缺少 date 或 amount
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: amount 为负数
- **WHEN** 已认证用户发送 PUT /water，body 包含 `{ amount: -100 }`
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: date 格式不合法
- **WHEN** 已认证用户发送 PUT /water，body 包含 `{ date: "invalid" }`
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 PUT /water
- **THEN** 系统返回 401 状态码

### Requirement: 查询每日饮水量
系统 SHALL 允许已认证用户查询指定日期范围内的每日饮水量，结果 MUST 仅包含当前用户的数据。

#### Scenario: 查询日期范围内的饮水记录
- **WHEN** 已认证用户发送 GET /water?startDate=2026-04-10&endDate=2026-04-16，范围内有 3 天有记录
- **THEN** 系统返回 `{ data: [{ date: "2026-04-10", amount: 1500 }, { date: "2026-04-12", amount: 2000 }, { date: "2026-04-16", amount: 1800 }] }`，按 date 升序排列

#### Scenario: 查询无数据的日期范围
- **WHEN** 已认证用户查询的日期范围内无任何饮水记录
- **THEN** 系统返回 `{ data: [] }`

#### Scenario: 缺少必填查询参数
- **WHEN** 已认证用户发送 GET /water 缺少 startDate 或 endDate
- **THEN** 系统返回 400 状态码

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 GET /water
- **THEN** 系统返回 401 状态码

### Requirement: 数据隔离
系统 MUST 确保每个用户只能查询和设置自己的饮水记录。

#### Scenario: 用户数据隔离
- **WHEN** 用户 A 设置了 2026-04-16 饮水量为 2000ml，用户 B 查询同一天
- **THEN** 用户 B 的查询结果不包含用户 A 的数据

### Requirement: 数据唯一性约束
系统 MUST 在数据库层面对 `userId + date` 建立唯一索引，确保每用户每天仅一条记录。

#### Scenario: 并发设置同一天饮水量
- **WHEN** 同一用户两个并发请求设置相同日期的饮水量
- **THEN** 最终该日期仅有一条记录，值为最后一次写入的 amount
