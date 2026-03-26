## Why

用户个人资料当前缺乏目标体重和健康状况信息，无法为后续 AI 功能提供足够的参考数据。新增这两个字段可以让 AI 在生成饮食建议时充分考虑用户的减重目标和健康隐患，提升个性化推荐质量。

## What Changes

- 在用户 Schema 中新增 `targetWeight` 字段（number，可选），表示用户期望达到的目标体重（kg）
- 在用户 Schema 中新增 `healthConditions` 字段（string[]，可选），表示用户存在的健康隐患或身体疾病标签列表
- 更新 `PUT /user/profile` 接口，支持更新上述两个新字段
- 更新 `GET /user/full-profile` 接口，在响应体中包含上述两个字段

## Capabilities

### New Capabilities

（无新增 capability，仅扩展现有 user-profile 能力）

### Modified Capabilities

- `user-profile`：新增 `targetWeight`（目标体重）和 `healthConditions`（健康状况标签列表）字段，同时在更新和查询接口中支持这两个字段

## Impact

- **Schema**: `src/auth/schemas/user.schema.ts` — 新增两个字段
- **DTO**: `src/user/dto/update-profile.dto.ts` — 新增两个可选字段的校验
- **Service**: `src/user/user.service.ts` — 逻辑无需特殊处理（Mongoose 部分更新已支持）
- **Spec**: `openspec/specs/user-profile/spec.md` — 需更新字段列表和响应结构
- 无破坏性变更，所有新字段均为可选
