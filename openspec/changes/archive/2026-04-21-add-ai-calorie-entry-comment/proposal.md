## Why

当前后端已经支持卡路里记录的增删改查和通用 AI 建议，但缺少针对单条饮食或运动记录的即时点评能力。新增按记录 ID 生成 AI 点评的接口，可以让前端以更轻量的方式为用户提供针对性反馈，并复用现有的记录数据与 AI 网关能力。

## What Changes

- 为已认证用户新增单条卡路里记录 AI 点评接口，请求只提交记录 ID，由后端自行查询记录并调用 AI。
- 根据记录类型区分饮食与运动点评文案，统一要求输出健康积极、语气温和、40 字以内、直接点评。
- 固定使用 gpt-5.4-nano 模型生成点评，避免前端传入模型或提示词。
- 复用现有 CalorieEntry 数据模型，不新增新的 MongoDB 集合或持久化字段。
- 在现有 AI 客户端编排中补充单条记录点评流程、异常处理和测试覆盖。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `calorie-entry`: 扩展单条记录能力，支持已认证用户基于记录 ID 获取 AI 生成的饮食/运动点评。

## Impact

- Affected APIs: 新增与卡路里条目关联的 AI 点评端点，前端只需传递记录 ID。
- Affected code: `src/calorie` 模块将新增点评路由和服务编排；`src/vercel-gateway` 中的 AI 客户端复用于固定模型调用。
- Data model: 继续使用现有 `CalorieEntry` Schema（`type`、`title`、`calories`、`description`、`mealType`、`duration`、`entryDate` 等字段）组织提示词，不新增集合或持久化字段。
- Dependencies: 继续依赖现有 Vercel AI Gateway/OpenAI 兼容调用链，仅新增固定模型 `gpt-5.4-nano` 的使用约束。