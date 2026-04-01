## ADDED Requirements

### Requirement: 卡路里条目去重
系统 SHALL 基于 `userId + entryDate + type` 进行去重。当创建条目时匹配到已有记录，系统 MUST 更新该记录而非新增。

#### Scenario: 首次创建条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-04-01T12:00:00Z" }`，且不存在 userId + entryDate + type 相同的记录
- **THEN** 系统创建新条目并返回 201 状态码及完整条目数据

#### Scenario: 重复条目自动更新
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 600, title: "午餐（修正）", entryDate: "2026-04-01T12:00:00Z" }`，且已存在同一用户、同一 entryDate、同一 type 的记录
- **THEN** 系统更新已有记录的 calories、title 等字段并返回 200 状态码及更新后的完整条目数据

#### Scenario: 不同 type 不视为重复
- **WHEN** 同一用户在同一 entryDate 已有 `intake` 记录，发送 POST /calorie 创建 `burn` 记录
- **THEN** 系统创建新条目并返回 201 状态码

#### Scenario: 不同 entryDate 不视为重复
- **WHEN** 同一用户同一 type 但 entryDate 不同
- **THEN** 系统创建新条目并返回 201 状态码

### Requirement: 唯一复合索引
系统 MUST 在数据库层面对 `userId + entryDate + type` 建立唯一复合索引，保证数据一致性。

#### Scenario: 并发创建相同条目
- **WHEN** 两个并发请求尝试创建 userId、entryDate、type 完全相同的记录
- **THEN** 仅一条记录被创建，另一个请求执行更新

## MODIFIED Requirements

### Requirement: 创建卡路里条目
系统 SHALL 允许已认证用户创建卡路里条目，条目 MUST 自动关联当前用户。条目 MAY 包含可选的 `source` 字段，默认为 `manual`。当 `userId + entryDate + type` 匹配到已有记录时，系统 SHALL 更新该记录并返回 200；否则创建新记录并返回 201。

#### Scenario: 成功创建摄入条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-03-23T12:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，条目的 userId 为当前用户，`source` 默认为 `manual`

#### Scenario: 成功创建消耗条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "burn", calories: 300, title: "跑步", entryDate: "2026-03-23T18:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，`source` 默认为 `manual`

#### Scenario: 重复条目自动更新
- **WHEN** 已认证用户发送 POST /calorie，body 的 userId + entryDate + type 与已有记录相同
- **THEN** 系统更新已有记录并返回 200 状态码及更新后的完整条目数据

#### Scenario: 缺少必填字段
- **WHEN** 已认证用户发送 POST /calorie，body 缺少 type、calories 或 title
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 POST /calorie
- **THEN** 系统返回 401 状态码
