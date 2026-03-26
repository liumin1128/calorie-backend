## 1. 依赖与环境配置

- [x] 1.1 检查 `@nestjs/axios` 是否已安装，若未安装则执行 `pnpm add @nestjs/axios axios`
- [x] 1.2 在 `.env` 中新增 `VERCEL_AI_TOKEN=<your-token>`、`VERCEL_AI_GATEWAY_URL=https://ai-gateway.vercel.sh`、`VERCEL_AI_MODEL=deepseek-chat`（占位值，不提交真实 Token）

## 2. 模块骨架

- [x] 2.1 创建 `src/vercel-gateway/vercel-gateway.module.ts`，引入 `HttpModule`、`ConfigModule`，注入 `UserModule`、`CalorieModule`（供 Service 使用），并声明 Controller 和 Service
- [x] 2.2 在 `src/app.module.ts` 中将 `VercelGatewayModule` 加入 `imports`

## 3. DTO

- [x] 3.1 创建 `src/vercel-gateway/dto/suggest.dto.ts`，包含 `question` 字段（string，必填，`@MaxLength(500)`）

## 4. CalorieService 扩展

- [x] 4.1 在 `src/calorie/calorie.service.ts` 中新增 `summarizeLast7Days(userId: string)` 方法：查询近 7 天（含今天）的所有记录，按 type 分组，返回 `{ intakeTotal, intakeCount, burnTotal, burnCount, intakeEntries: [{title, calories, description, entryDate}], burnEntries: [{title, calories, description, entryDate}] }`（按 entryDate 降序）
- [x] 4.2 确认 `src/calorie/calorie.module.ts` 已 export `CalorieService`（若未 export，添加 exports）

## 5. VercelGatewayService 实现

- [x] 5.1 创建 `src/vercel-gateway/vercel-gateway.service.ts`，构造函数中通过 `ConfigService` 读取 `VERCEL_AI_TOKEN`、`VERCEL_AI_GATEWAY_URL`、`VERCEL_AI_MODEL`；Token 未配置则抛出异常（fail-fast）
- [x] 5.2 实现私有基础方法 `request<T>(method: string, path: string, body?: unknown)`：自动注入 `Authorization: Bearer <token>` 请求头，超时 30 秒，捕获非 2xx 响应并转为 NestJS `HttpException`（不透传原始错误体）
- [x] 5.3 实现 `ping()` 方法：仅验证 Token 已配置，返回 `{ status: 'ok', gateway: 'vercel-ai-gateway', model: <VERCEL_AI_MODEL> }`（不发起外部请求）
- [x] 5.4 实现 `getSuggestion(userId: string, question: string)` 方法：
  - 并行调用（`Promise.all`）：`UserService.getFullProfile` 获取 `targetWeight`、`healthConditions`、`latestHeight`、`latestWeight`；`CalorieService.summarizeLast7Days(userId)` 获取近7天详细条目和统计
  - 计算日均值（intakeAvg、burnAvg，各除以 7）和净热量差
  - 构造 user message：按 design.md Decision 6 模板，将 intakeEntries 和 burnEntries 格式化为「MM/DD  标题（N kcal），描述」逐条列出，无记录时写"暂无"，末尾追加统计汇总和 question
  - 调用 `POST /v1/chat/completions`（OpenAI 兼容格式，`max_tokens: 800`）
  - 返回 `{ suggestion: string, model: string }`

## 6. Controller 实现

- [x] 6.1 创建 `src/vercel-gateway/vercel-gateway.controller.ts`，路由前缀为 `/gateway`
- [x] 6.2 实现 `GET /gateway/ping`，`@UseGuards(JwtAuthGuard)` 保护，JSDoc 注释，调用 `ping()`
- [x] 6.3 实现 `POST /gateway/ai/suggest`，`@UseGuards(JwtAuthGuard)` 保护，从 JWT payload 提取 `userId`，接收 `SuggestDto`，调用 `getSuggestion(userId, question)`，JSDoc 注释

## 7. 验证

- [x] 7.1 访问 `GET /gateway/ping`（携带有效 JWT），确认返回 `{ status: "ok", gateway: "vercel-ai-gateway", model: "deepseek-chat" }`
- [x] 7.2 访问 `POST /gateway/ai/suggest`（携带有效 JWT），body `{ "question": "我每天应该摄入多少卡路里？" }`，确认返回 `{ suggestion: "...", model: "deepseek-chat" }`，且建议内容引用了具体食物/运动项目名称
- [x] 7.3 访问 `POST /gateway/ai/suggest` 不携带 JWT，确认返回 401
- [x] 7.4 `question` 超过 500 字符时，确认返回 400 Bad Request
