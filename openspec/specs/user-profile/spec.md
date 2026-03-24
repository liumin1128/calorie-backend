### Requirement: 更新用户基础信息
系统 SHALL 提供 `PUT /user/profile` 接口，允许已认证用户更新自己的基础个人信息。

可更新字段：
- `nickname` (string, 可选)
- `gender` (enum: `male` | `female` | `other`, 可选)
- `birthday` (Date, 可选)
- `signature` (string, 最大 200 字符, 可选)

更新操作 SHALL 仅修改请求中包含的字段，未传递的字段保持不变（部分更新）。

#### Scenario: 成功更新个人信息
- **WHEN** 已认证用户发送 `PUT /user/profile` 请求，包含 `{ gender: "male", birthday: "1995-06-15" }`
- **THEN** 系统更新对应字段并返回更新后的完整用户基础信息（不含密码）

#### Scenario: 未认证用户被拒绝
- **WHEN** 未携带有效 JWT 的请求访问 `PUT /user/profile`
- **THEN** 系统返回 401 Unauthorized

#### Scenario: 空请求体
- **WHEN** 已认证用户发送 `PUT /user/profile` 但请求体为空
- **THEN** 系统返回当前用户信息（无报错，无变更）

### Requirement: 查询完整用户信息
系统 SHALL 提供 `GET /user/full-profile` 接口，返回已认证用户的完整信息，包含基础资料和最新身高体重。

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

#### Scenario: 查询有完整数据的用户
- **WHEN** 已认证用户访问 `GET /user/full-profile`，且该用户已录入过身高体重
- **THEN** 系统返回基础信息和最新的身高、体重数据（各取最近一条）

#### Scenario: 查询无动态数据的新用户
- **WHEN** 已认证用户访问 `GET /user/full-profile`，但从未录入过身高体重
- **THEN** `latestHeight` 和 `latestWeight` 返回 `null`
