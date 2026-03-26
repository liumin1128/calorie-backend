## ADDED Requirements

### Requirement: Vercel AI Gateway 通用客户端
系统 SHALL 提供 `VercelGatewayService`，封装对 Vercel AI Gateway 的 HTTP 请求，包含认证头注入、超时控制和标准化错误处理。

Token SHALL 通过环境变量 `VERCEL_AI_TOKEN` 配置，不得硬编码。
Base URL SHALL 通过环境变量 `VERCEL_AI_GATEWAY_URL` 配置，默认为 `https://ai-gateway.vercel.sh`。
AI 模型 SHALL 通过环境变量 `VERCEL_AI_MODEL` 配置，默认为 `deepseek-chat`。
所有请求 SHALL 自动附加 `Authorization: Bearer <token>` 请求头。
请求超时 SHALL 设置为 30 秒。
当网关返回非 2xx 状态码时，服务 SHALL 捕获并转换为标准 NestJS HttpException，不透传原始错误体。

#### Scenario: 认证头自动注入
- **WHEN** VercelGatewayService 发起任意 HTTP 请求
- **THEN** 请求头中自动包含 `Authorization: Bearer <VERCEL_API_TOKEN>`

#### Scenario: Token 未配置时启动失败
- **WHEN** 环境变量 `VERCEL_API_TOKEN` 未设置，应用启动
- **THEN** 服务抛出配置错误，应用无法正常启动（fail-fast）

#### Scenario: Vercel API 返回错误时标准化异常
- **WHEN** Vercel API 返回 401 或 5xx 错误
- **THEN** VercelGatewayService 抛出对应 NestJS HttpException，不透传原始错误体

### Requirement: 网关连通性验证端点
系统 SHALL 提供 `GET /gateway/ping` 端点，供前端验证 Vercel AI Gateway Token 已配置就绪。

该端点 SHALL 仅检查 `VERCEL_AI_TOKEN` 是否已在 ConfigService 中配置，不发起任何外部请求（不消耗 AI 额度）。
响应 SHALL 包含 `{ status: 'ok', gateway: 'vercel-ai-gateway', model: string }`。
该端点 SHALL 需要 JWT 认证（仅已登录用户可调用）。

#### Scenario: Token 已配置时返回成功
- **WHEN** 已认证用户访问 `GET /gateway/ping`，且 `VERCEL_AI_TOKEN` 已在环境变量中配置
- **THEN** 系统返回 200，响应体为 `{ status: "ok", gateway: "vercel-ai-gateway", model: "deepseek-chat" }`

#### Scenario: 未认证用户被拒绝
- **WHEN** 未携带有效 JWT 的请求访问 `GET /gateway/ping`
- **THEN** 系统返回 401 Unauthorized

### Requirement: AI 健康饮食建议端点
系统 SHALL 提供 `POST /gateway/ai/suggest` 端点，供已登录用户获取个性化健康/饮食建议。

该端点 SHALL 需要 JWT 认证。
后端 SHALL 自动从当前登录用户的 profile 提取 `targetWeight` 和 `healthConditions`，查询最近 7 天卡路里日均值，构造 system prompt。
前端 SHALL 只传入 `question` 字段（string，必填，最大 500 字符）。
后端 SHALL 通过 Vercel AI Gateway 调用 DeepSeek 模型（OpenAI 兼容格式 `POST /v1/chat/completions`），`max_tokens` 限制为 400。
响应 SHALL 包含 `{ suggestion: string, model: string }`。
前端 SHALL 禁止传入 systemPrompt，后端负责构造完整上下文。

#### Scenario: 成功获取 AI 建议
- **WHEN** 已认证用户访问 `POST /gateway/ai/suggest`，body 为 `{ "question": "我每天应该摄入多少卡路里？" }`
- **THEN** 系统返回 200，响应体包含 `{ suggestion: "<AI生成的建议文本>", model: "deepseek-chat" }`

#### Scenario: 有健康信息的用户获取个性化建议
- **WHEN** 已认证用户设置了 targetWeight 和 healthConditions，访问 `POST /gateway/ai/suggest`
- **THEN** AI 建议中包含对应用户目标体重和健康状况的针对性内容（system prompt 已注入用户上下文）

#### Scenario: question 超出长度限制
- **WHEN** 已认证用户发送 `question` 超过 500 字符
- **THEN** 系统返回 400 Bad Request

#### Scenario: 未认证用户被拒绝
- **WHEN** 未携带有效 JWT 的请求访问 `POST /gateway/ai/suggest`
- **THEN** 系统返回 401 Unauthorized
