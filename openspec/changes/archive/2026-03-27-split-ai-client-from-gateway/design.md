## Context

当前 `VercelGatewayService` 承担两种职责：
1. **基础通信层**：读取环境变量（Token、BaseURL、Model）、构造 HTTP 请求头、统一错误处理、30秒超时
2. **业务逻辑层**：拉取用户 profile 和近 7 天卡路里数据、构造 prompt、调用 AI API、格式化返回

这种混合导致：若未来新增 AI 功能（如食物图片识别、AI 运动规划），基础通信代码必须重复实现，且难以单独测试。

## Goals / Non-Goals

**Goals:**
- 将 HTTP 通信基础层抽取为独立 `VercelAiClient` Provider
- `VercelAiClient` 对外暴露 `chat(messages, maxTokens?)` 方法，返回 AI 文本响应
- `VercelGatewayService` 仅保留业务逻辑，注入 `VercelAiClient` 发起请求
- `VercelGatewayModule` 导出 `VercelAiClient`，使其他模块可复用

**Non-Goals:**
- 不修改外部 API 路由（`/gateway/ping`、`/gateway/ai/suggest`）
- 不更改 prompt 内容或建议格式
- 不引入新的外部依赖

## Decisions

### 决策 1：`VercelAiClient` 以 NestJS Injectable Provider 形式实现

**选择**：新建 `src/vercel-gateway/vercel-ai.client.ts`，使用 `@Injectable()` 装饰器，在 `VercelGatewayModule` 中注册并 `exports`。

**原因**：与当前 NestJS 模块化架构完全一致，其他模块只需 `imports: [VercelGatewayModule]` 即可注入使用；没有引入额外的工厂模式或全局 Provider 复杂性。

**备选方案**：注册为全局 Provider（`isGlobal: true`）——拒绝，因为全局注册对小型项目过度灵活，会模糊模块边界。

### 决策 2：`chat()` 方法接受 OpenAI 标准 messages 数组

**选择**：`chat(messages: {role: string; content: string}[], maxTokens?: number): Promise<string>`

**原因**：OpenAI Chat Completions 格式是业界标准，Vercel AI Gateway 完全兼容；业务层可以自由构造任意多轮对话，`VercelAiClient` 只负责传递，不限制 prompt 结构。

**备选方案**：直接传 `systemPrompt + userMessage` 两个字符串——拒绝，耦合单轮对话模式，不利于未来多轮或工具调用场景扩展。

### 决策 3：`ping()` 方法保留在 `VercelGatewayService`

**原因**：`ping()` 不调用外部 HTTP，只返回配置状态，属于业务层的健康检查语义，不需移入 client。`VercelAiClient` 只暴露 AI 调用能力。

## Risks / Trade-offs

- [风险] 模块导入路径增加 → 缓解：文件放在同一目录 `src/vercel-gateway/`，命名清晰
- [风险] `VercelGatewayModule` 被其他模块导入时可能引入不必要的依赖（HttpModule、ConfigModule）→ 缓解：当前项目规模小，风险可接受；未来可按需拆分独立 `AiModule`
