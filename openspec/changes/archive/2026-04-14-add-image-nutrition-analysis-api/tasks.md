## 1. 扩展 VercelAiClient 多模态支持

- [x] 1.1 在 `vercel-ai.client.ts` 中扩展 `ChatMessage` 类型，`content` 支持 `string | ContentPart[]`，定义 `ContentPart` 类型（TextPart / ImageUrlPart）
- [x] 1.2 新增 `chatWithModel(model, messages, options?)` 方法，支持 `maxTokens` 和 `responseFormat` 参数，调用时使用指定模型而非默认模型
- [x] 1.3 确保现有 `chat()` 方法不受影响，保持向后兼容

## 2. 新增图片营养分析 DTO

- [x] 2.1 创建 `src/vercel-gateway/dto/image-nutrition.dto.ts`，定义响应结构 `ImageNutritionResponseDto`（包含 `foods` 数组、`summary`、`model` 字段）
- [x] 2.2 定义 `FoodNutritionItem` 接口（`name`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `unit`, `quantity`）

## 3. 实现图片营养分析 Service 逻辑

- [x] 3.1 在 `vercel-gateway.service.ts` 中新增 `analyzeImageNutrition(file: Express.Multer.File)` 方法
- [x] 3.2 实现图片 Buffer → Base64 data URL 转换逻辑
- [x] 3.3 构造 system prompt（指示 AI 分析食物营养、参考文本信息、返回 JSON 格式）
- [x] 3.4 构造多模态 messages 并调用 `VercelAiClient.chatWithModel('openai/gpt-5-nano', ...)`
- [x] 3.5 JSON.parse AI 响应，解析失败时抛出 502 HttpException

## 4. 新增图片营养分析 Controller 端点

- [x] 4.1 在 `vercel-gateway.controller.ts` 中新增 `POST /gateway/ai/image-nutrition` 路由
- [x] 4.2 使用 `@UseInterceptors(FileInterceptor('image'))` 处理文件上传
- [x] 4.3 使用 `@UseGuards(JwtAuthGuard)` 保护端点
- [x] 4.4 配置 Multer：fileFilter 限制 JPEG/PNG/WebP/GIF，limits.fileSize 限制 5MB
- [x] 4.5 校验文件是否存在，不存在时返回 400

## 5. 模块配置更新

- [x] 5.1 在 `vercel-gateway.module.ts` 中确保 MulterModule 或 Multer 配置可用（NestJS 默认内置，确认无需额外注册）

## 6. 测试验证

- [x] 6.1 编写 `analyzeImageNutrition` 的单元测试，验证 Base64 转换、prompt 构造、JSON 解析逻辑
- [x] 6.2 验证文件上传限制（格式、大小）的拦截行为
- [ ] 6.3 手动测试端点：上传真实食物图片，验证端到端返回结构化营养数据
