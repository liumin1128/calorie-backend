## MODIFIED Requirements

### Requirement: 更新用户基础信息
系统 SHALL 提供 `PUT /user/profile` 接口，允许已认证用户更新自己的基础个人信息。

可更新字段：
- `nickname` (string, 可选)
- `gender` (enum: `male` | `female` | `other`, 可选)
- `birthday` (Date, 可选)
- `signature` (string, 最大 200 字符, 可选)
- `targetWeight` (number, 可选, 单位 kg, 范围 30~300)
- `healthConditions` (string[], 可选, 每项最大 50 字符, 数组最多 20 项)

更新操作 SHALL 仅修改请求中包含的字段，未传递的字段保持不变（部分更新）。

#### Scenario: 成功更新个人信息
- **WHEN** 已认证用户发送 `PUT /user/profile` 请求，包含 `{ gender: "male", birthday: "1995-06-15" }`
- **THEN** 系统更新对应字段并返回更新后的完整用户基础信息（不含密码）

#### Scenario: 成功更新目标体重
- **WHEN** 已认证用户发送 `PUT /user/profile` 请求，包含 `{ targetWeight: 65 }`
- **THEN** 系统更新 targetWeight 字段并返回更新后的用户信息

#### Scenario: 成功更新健康状况
- **WHEN** 已认证用户发送 `PUT /user/profile` 请求，包含 `{ healthConditions: ["高血压", "糖尿病"] }`
- **THEN** 系统更新 healthConditions 字段并返回更新后的用户信息

#### Scenario: 目标体重超出合理范围
- **WHEN** 已认证用户发送 `PUT /user/profile` 请求，包含 `{ targetWeight: 5 }`（小于 30kg）
- **THEN** 系统返回 400 Bad Request，提示目标体重不在合理范围内

#### Scenario: 未认证用户被拒绝
- **WHEN** 未携带有效 JWT 的请求访问 `PUT /user/profile`
- **THEN** 系统返回 401 Unauthorized

#### Scenario: 空请求体
- **WHEN** 已认证用户发送 `PUT /user/profile` 但请求体为空
- **THEN** 系统返回当前用户信息（无报错，无变更）

### Requirement: 查询完整用户信息
系统 SHALL 提供 `GET /user/full-profile` 接口，返回已认证用户的完整信息，包含基础资料、截止到指定时间点的最新身高体重，以及目标体重和健康状况。

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
  "targetWeight": "number | null",
  "healthConditions": "string[] | null",
  "latestHeight": { "value": 175.5, "recordedAt": "ISO DateTime" } | null,
  "latestWeight": { "value": 70.2, "recordedAt": "ISO DateTime" } | null
}
```

#### Scenario: 查询包含健康信息的完整资料
- **WHEN** 已认证用户访问 `GET /user/full-profile`，且该用户已设置 targetWeight 和 healthConditions
- **THEN** 系统返回包含 targetWeight 和 healthConditions 的完整用户信息

#### Scenario: 查询未设置健康信息的用户资料
- **WHEN** 已认证用户访问 `GET /user/full-profile`，但该用户未设置 targetWeight 和 healthConditions
- **THEN** 响应中 targetWeight 和 healthConditions 均返回 null

#### Scenario: 查询当前最新完整信息
- **WHEN** 已认证用户访问 `GET /user/full-profile`（不带 date 参数），且该用户已录入过身高体重
- **THEN** 系统返回基础信息和全局最新的身高、体重数据

#### Scenario: 查询历史时间点的完整信息
- **WHEN** 已认证用户访问 `GET /user/full-profile?date=2026-03-15`，且该用户在 3月10日录入过身高、3月20日录入过新身高
- **THEN** 系统返回基础信息，`latestHeight` 为 3月10日的记录（3月20日的记录被排除，因为晚于查询日期）

#### Scenario: 未认证用户被拒绝
- **WHEN** 未携带有效 JWT 的请求访问 `GET /user/full-profile`
- **THEN** 系统返回 401 Unauthorized
