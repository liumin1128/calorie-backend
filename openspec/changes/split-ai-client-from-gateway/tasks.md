## 1. 新增 VercelAiClient

- [x] 1.1 新建 `src/vercel-gateway/vercel-ai.client.ts`，使用 `@Injectable()` 装饰器
- [x] 1.2 在构造函数中注入 `ConfigService`，读取并校验 `VERCEL_AI_TOKEN`，缺失时抛出错误
- [x] 1.3 实现私有 `request<T>(method, path, body?)` 方法：设置 Authorization 头、30秒超时、统一 HttpException 错误处理
- [x] 1.4 实现公开 `chat(messages: {role: string; content: string}[], maxTokens?: number): Promise<string>` 方法，调用 `POST /v1/chat/completions`，返回 `choices[0].message.content`

## 2. 重构 VercelGatewayModule

- [x] 2.1 在 `vercel-gateway.module.ts` 的 `providers` 数组中注册 `VercelAiClient`
- [x] 2.2 在 `exports` 数组中导出 `VercelAiClient`，使其他模块可复用

## 3. 重构 VercelGatewayService

- [x] 3.1 移除 `VercelGatewayService` 中的 `token`、`baseUrl`、`model` 私有属性及其初始化逻辑
- [x] 3.2 移除 `VercelGatewayService` 中的私有 `request<T>()` 方法
- [x] 3.3 在构造函数中注入 `VercelAiClient`
- [x] 3.4 将 `getSuggestion()` 中的 `this.request(...)` 调用替换为 `this.aiClient.chat(messages, 800)`
- [x] 3.5 `ping()` 方法中 model 字段改为通过 `ConfigService` 读取（或保留在 Service 中读取）
