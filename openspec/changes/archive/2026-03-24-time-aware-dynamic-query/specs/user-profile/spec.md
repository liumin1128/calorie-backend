## MODIFIED Requirements

### Requirement: 查询完整用户信息
系统 SHALL 提供 `GET /user/full-profile` 接口，返回已认证用户的完整信息，包含基础资料和截止到指定时间点的最新身高体重。

查询参数：
- `date` (Date, 可选): 截止日期，不传则返回全局最新数据

响应结构：
```json
{
  "id": "string",
  "email": "string",
  "nickname": "string",
  "gender": "male | female | other | null",
  "birthday": "ISO Date | null",
  "signature": "string | null",
  "latestHeight": { "value": 175.5, "recordedAt": "ISO DateTime" } | null,
  "latestWeight": { "value": 70.2, "recordedAt": "ISO DateTime" } | null
}
```

#### Scenario: 查询当前最新完整信息
- **WHEN** 已认证用户访问 `GET /user/full-profile`（不带 date 参数），且该用户已录入过身高体重
- **THEN** 系统返回基础信息和全局最新的身高、体重数据（行为不变）

#### Scenario: 查询历史时间点的完整信息
- **WHEN** 已认证用户访问 `GET /user/full-profile?date=2026-03-15`，且该用户在 3月10日录入过身高、3月20日录入过新身高
- **THEN** 系统返回基础信息，`latestHeight` 为 3月10日的记录（3月20日的记录被排除，因为晚于查询日期）

#### Scenario: 查询历史时间点无动态数据
- **WHEN** 已认证用户访问 `GET /user/full-profile?date=2026-01-01`，但该用户的身高体重记录都在 2026年2月之后
- **THEN** `latestHeight` 和 `latestWeight` 返回 `null`
