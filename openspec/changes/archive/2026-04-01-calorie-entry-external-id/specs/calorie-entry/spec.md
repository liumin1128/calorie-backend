## ADDED Requirements

### Requirement: 卡路里条目支持外部唯一标识
系统 SHALL 支持可选的 `externalId` 字符串字段，用于标识来自外部系统的记录唯一性。

#### Scenario: 创建条目时传入 externalId
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-04-01T12:00:00Z", externalId: "hk-uuid-001" }`
- **THEN** 系统创建条目，`externalId` 字段为 `hk-uuid-001`

#### Scenario: 创建条目时不传 externalId
- **WHEN** 已认证用户发送 POST /calorie，body 不包含 `externalId` 字段
- **THEN** 系统正常创建条目，`externalId` 字段为空

#### Scenario: 基于 externalId 去重
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId: "hk-uuid-001"`，且该用户已存在相同 `externalId` 的记录
- **THEN** 系统更新已有记录并返回 200 状态码

#### Scenario: 不同用户相同 externalId 不冲突
- **WHEN** 用户 A 和用户 B 分别创建 `externalId: "hk-uuid-001"` 的记录
- **THEN** 系统为两个用户各创建一条记录

## MODIFIED Requirements

### Requirement: 卡路里条目去重
系统 SHALL 基于 `userId + externalId` 进行去重。当创建条目时传入 `externalId` 且匹配到已有记录，系统 MUST 更新该记录而非新增。未传入 `externalId` 的记录不参与去重。

#### Scenario: 有 externalId 且首次创建
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId: "hk-uuid-002"`，且不存在该用户下相同 `externalId` 的记录
- **THEN** 系统创建新条目并返回 201 状态码

#### Scenario: 有 externalId 且重复
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId: "hk-uuid-002"`，且已存在该用户下相同 `externalId` 的记录
- **THEN** 系统更新已有记录并返回 200 状态码

#### Scenario: 无 externalId 不去重
- **WHEN** 已认证用户发送 POST /calorie，body 不包含 `externalId`
- **THEN** 系统始终创建新条目并返回 201 状态码

### Requirement: 唯一复合索引
系统 MUST 在数据库层面对 `userId + externalId` 建立稀疏唯一复合索引，仅对包含 `externalId` 的记录生效。

#### Scenario: 并发创建相同 externalId 条目
- **WHEN** 两个并发请求尝试为同一用户创建相同 `externalId` 的记录
- **THEN** 仅一条记录被创建，另一请求执行更新

### Requirement: 创建卡路里条目
系统 SHALL 允许已认证用户创建卡路里条目，条目 MUST 自动关联当前用户。条目 MAY 包含可选的 `source` 和 `externalId` 字段。当传入 `externalId` 且 `userId + externalId` 匹配到已有记录时，系统 SHALL 更新该记录并返回 200；否则创建新记录并返回 201。

#### Scenario: 成功创建摄入条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-03-23T12:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，条目的 userId 为当前用户，`source` 默认为 `manual`

#### Scenario: 成功创建消耗条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "burn", calories: 300, title: "跑步", entryDate: "2026-03-23T18:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，`source` 默认为 `manual`

#### Scenario: 带 externalId 的重复条目自动更新
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId` 且该用户已有相同 `externalId` 的记录
- **THEN** 系统更新已有记录并返回 200 状态码及更新后的完整条目数据

#### Scenario: 缺少必填字段
- **WHEN** 已认证用户发送 POST /calorie，body 缺少 type、calories 或 title
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 POST /calorie
- **THEN** 系统返回 401 状态码
