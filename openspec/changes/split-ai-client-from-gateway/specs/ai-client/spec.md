## ADDED Requirements

### Requirement: VercelAiClient 提供基础 chat 调用能力
`VercelAiClient` SHALL 封装对 Vercel AI Gateway 的 HTTP 通信，提供 `chat(messages, maxTokens?)` 方法，返回 AI 回复文本（string）。客户端 SHALL 从环境变量读取 `VERCEL_AI_TOKEN`、`VERCEL_AI_GATEWAY_URL`、`VERCEL_AI_MODEL`，并在初始化时校验 Token 是否存在。

#### Scenario: chat 调用成功返回文本
- **WHEN** 调用者传入合法 messages 数组
- **THEN** client 向 Vercel AI Gateway 发起 POST /v1/chat/completions 请求，返回 AI 回复文本字符串

#### Scenario: VERCEL_AI_TOKEN 未配置时抛出异常
- **WHEN** 应用启动且 `VERCEL_AI_TOKEN` 环境变量未设置
- **THEN** 构造函数 SHALL 抛出错误，阻止服务正常启动

#### Scenario: AI 网关请求失败时统一错误处理
- **WHEN** HTTP 请求超时或 Vercel AI Gateway 返回非 2xx 状态码
- **THEN** client SHALL 抛出 `HttpException`，状态码透传或降级为 502

### Requirement: VercelAiClient 可被其他模块复用
`VercelGatewayModule` SHALL 在 `exports` 数组中导出 `VercelAiClient`，使其他 NestJS 模块通过 `imports: [VercelGatewayModule]` 注入使用。

#### Scenario: 其他模块注入 VercelAiClient
- **WHEN** 任意模块在 `imports` 中声明 `VercelGatewayModule`
- **THEN** 该模块的 Provider SHALL 能够通过构造函数注入 `VercelAiClient`

### Requirement: VercelGatewayService 只保留业务逻辑
`VercelGatewayService` SHALL 不再包含 HTTP 通信代码，仅负责构造 prompt、调用 `VercelAiClient.chat()`、格式化并返回结果。

#### Scenario: getSuggestion 通过 client 调用 AI
- **WHEN** 用户调用 `POST /gateway/ai/suggest`
- **THEN** `VercelGatewayService` SHALL 组装 messages 数组后调用 `VercelAiClient.chat()`，返回格式不变（`{ suggestion, model }`）
