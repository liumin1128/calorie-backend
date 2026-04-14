## MODIFIED Requirements

### Requirement: VercelAiClient 提供基础 chat 调用能力
`VercelAiClient` SHALL 封装对 Vercel AI Gateway 的 HTTP 通信，提供 `chat(messages, maxTokens?)` 方法，返回 AI 回复文本（string）。客户端 SHALL 从环境变量读取 `VERCEL_AI_TOKEN`、`VERCEL_AI_GATEWAY_URL`、`VERCEL_AI_MODEL`，并在初始化时校验 Token 是否存在。

此外，`VercelAiClient` SHALL 新增 `chatWithModel(model, messages, options?)` 方法，允许调用方指定模型名称。`options` SHALL 支持 `maxTokens`（默认 800）和 `responseFormat`（可选，如 `{ type: "json_object" }`）参数。

`messages` 的 `content` 字段 SHALL 支持 string 类型（纯文本）和数组类型（多模态 content parts），其中数组元素 SHALL 支持 `{ type: "text", text: string }` 和 `{ type: "image_url", image_url: { url: string } }` 两种格式。

#### Scenario: chat 调用成功返回文本
- **WHEN** 调用者传入合法 messages 数组
- **THEN** client 向 Vercel AI Gateway 发起 POST /v1/chat/completions 请求，返回 AI 回复文本字符串

#### Scenario: VERCEL_AI_TOKEN 未配置时抛出异常
- **WHEN** 应用启动且 `VERCEL_AI_TOKEN` 环境变量未设置
- **THEN** 构造函数 SHALL 抛出错误，阻止服务正常启动

#### Scenario: AI 网关请求失败时统一错误处理
- **WHEN** HTTP 请求超时或 Vercel AI Gateway 返回非 2xx 状态码
- **THEN** client SHALL 抛出 `HttpException`，状态码透传或降级为 502

#### Scenario: chatWithModel 指定模型调用
- **WHEN** 调用者传入 model 为 `openai/gpt-5-nano`，messages 包含多模态内容
- **THEN** client SHALL 使用指定模型（而非默认模型）发起请求，并正确传递 content parts

#### Scenario: chatWithModel 使用 responseFormat
- **WHEN** 调用者传入 `responseFormat: { type: "json_object" }`
- **THEN** 请求体 SHALL 包含 `response_format` 字段，AI 返回 JSON 格式内容
