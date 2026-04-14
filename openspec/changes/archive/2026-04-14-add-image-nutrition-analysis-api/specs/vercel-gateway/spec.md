## ADDED Requirements

### Requirement: 图片营养分析路由和服务编排
`VercelGatewayController` SHALL 新增 `POST /gateway/ai/image-nutrition` 路由，使用 `@UseInterceptors(FileInterceptor('image'))` 处理文件上传，并使用 `@UseGuards(JwtAuthGuard)` 保护。

`VercelGatewayService` SHALL 新增 `analyzeImageNutrition(file: Express.Multer.File)` 方法，负责：
1. 将图片 Buffer 转为 Base64 data URL（`data:<mimetype>;base64,<data>`）
2. 构造 system prompt，指示 AI 分析食物营养成分，参考图片中文本
3. 构造多模态 messages（system + user，user content 包含 image_url 和 text parts）
4. 调用 `VercelAiClient.chatWithModel('openai/gpt-5-nano', messages, { responseFormat: { type: 'json_object' } })`
5. JSON.parse AI 返回内容，解析失败时抛出 502
6. 返回 `{ foods, summary, model }` 结构

#### Scenario: Controller 正确处理文件上传
- **WHEN** 已认证用户以 multipart/form-data 格式上传 image 文件到 `POST /gateway/ai/image-nutrition`
- **THEN** Controller SHALL 通过 FileInterceptor 接收文件，传入 Service 处理

#### Scenario: Service 构造正确的多模态消息
- **WHEN** Service 收到合法图片文件
- **THEN** SHALL 构造包含 image_url（Base64 data URL）和 text prompt 的 messages 数组，调用 VercelAiClient

#### Scenario: Multer 配置文件限制
- **WHEN** 用户上传超过 5MB 或非法格式文件
- **THEN** Multer fileFilter/limits SHALL 拦截并返回 400 错误
