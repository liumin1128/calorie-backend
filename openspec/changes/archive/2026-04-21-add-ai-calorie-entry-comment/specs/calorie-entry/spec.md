## ADDED Requirements

### Requirement: 已认证用户可获取单条卡路里记录 AI 点评
系统 SHALL 提供 `POST /calorie/:id/comment` 端点，允许已认证用户基于自己的单条卡路里记录生成 AI 点评。请求 MUST 只依赖路径参数中的记录 ID，后端 MUST 自行查询记录并返回点评结果。

#### Scenario: 成功点评饮食记录
- **WHEN** 已认证用户请求 `POST /calorie/:id/comment`，且该记录属于当前用户并且 `type` 为 `intake`
- **THEN** 系统返回 200 状态码，以及包含饮食点评文本和模型标识的响应对象

#### Scenario: 成功点评运动记录
- **WHEN** 已认证用户请求 `POST /calorie/:id/comment`，且该记录属于当前用户并且 `type` 为 `burn`
- **THEN** 系统返回 200 状态码，以及包含运动点评文本和模型标识的响应对象

#### Scenario: 记录不存在或不属于当前用户
- **WHEN** 已认证用户请求 `POST /calorie/:id/comment`，但该记录不存在或属于其他用户
- **THEN** 系统返回 404 状态码，且不泄露其他用户数据存在性

#### Scenario: 未认证用户请求点评
- **WHEN** 未携带有效 JWT 的请求访问 `POST /calorie/:id/comment`
- **THEN** 系统返回 401 状态码

### Requirement: 单条记录点评由后端固定规则生成
系统 MUST 使用后端固定提示词和记录数据生成点评，不得要求客户端传入模型、提示词或记录内容。系统 MUST 固定使用 `gpt-5.4-nano` 生成点评，输出内容 MUST 健康积极、直接点评、无问候语，并限制在 40 字以内。

#### Scenario: 请求体无需额外字段
- **WHEN** 已认证用户发送 `POST /calorie/:id/comment` 且请求体为空
- **THEN** 系统仍可仅基于路径参数中的记录 ID 查询数据并完成点评

#### Scenario: 饮食记录使用饮食语境生成点评
- **WHEN** 被点评的记录为饮食记录，且包含 `title`、`calories`、`description`、`mealType` 等字段中的任意可用信息
- **THEN** 系统使用这些记录字段构造饮食语境，并返回面向饮食行为的简短点评

#### Scenario: 运动记录使用运动语境生成点评
- **WHEN** 被点评的记录为运动记录，且包含 `title`、`calories`、`description`、`duration` 等字段中的任意可用信息
- **THEN** 系统使用这些记录字段构造运动语境，并返回面向运动行为的简短点评

#### Scenario: 输出超过约束时被规范化
- **WHEN** AI 原始输出包含寒暄、换行或超过 40 字
- **THEN** 系统对输出进行规范化，并返回符合“直接点评、40 字以内”约束的文本

### Requirement: 点评失败返回可识别错误
当 AI 网关调用失败、模型不可用或返回结果无法用于生成有效点评时，系统 MUST 返回明确的错误响应，而不是伪造默认点评。

#### Scenario: AI 网关调用失败
- **WHEN** 系统在生成点评时调用 AI 网关失败
- **THEN** 系统返回 502 状态码，表示点评暂时不可用

#### Scenario: AI 返回空文本或不可用文本
- **WHEN** AI 返回空字符串、纯空白或无法整理成有效点评的内容
- **THEN** 系统返回 502 状态码，而不是返回成功状态码和占位文本