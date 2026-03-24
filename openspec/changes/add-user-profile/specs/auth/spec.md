## MODIFIED Requirements

### Requirement: 用户登录返回完整信息
系统 SHALL 在用户登录成功后，响应中除 `access_token` 和基础用户信息外，额外返回最新的身高和体重数据。

修改后的登录响应结构：
```json
{
  "access_token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "gender": "male | female | other | null",
    "birthday": "ISO Date | null",
    "signature": "string | null",
    "latestHeight": { "value": 175.5, "recordedAt": "ISO DateTime" } | null,
    "latestWeight": { "value": 70.2, "recordedAt": "ISO DateTime" } | null
  }
}
```

#### Scenario: 登录时有动态数据
- **WHEN** 用户登录成功，且此前已录入过身高和体重
- **THEN** 响应的 `user` 中包含 `latestHeight` 和 `latestWeight`（各取最新一条）

#### Scenario: 登录时无动态数据
- **WHEN** 用户登录成功，但从未录入过身高和体重
- **THEN** `latestHeight` 和 `latestWeight` 返回 `null`

#### Scenario: 登录时有部分动态数据
- **WHEN** 用户登录成功，只录入过身高但未录入体重
- **THEN** `latestHeight` 返回最新数据，`latestWeight` 返回 `null`
