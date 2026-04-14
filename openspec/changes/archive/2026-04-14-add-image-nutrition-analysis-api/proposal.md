## Why

用户希望通过拍照快速获取食物的营养成分和卡路里信息，而非手动逐条搜索输入。当前系统仅支持文本方式记录卡路里，缺乏图像识别能力。新增图片营养分析 API 可大幅降低用户记录门槛，提升使用体验和数据准确性。

## What Changes

- 新增 `POST /gateway/ai/image-nutrition` 端点，接收用户上传的食物图片（multipart/form-data），调用 Vercel AI Gateway（使用 `openai/gpt-5-nano` 多模态模型）分析图片中的食物营养成分和卡路里
- 若图片中包含文本信息（如包装营养标签），AI 应参考文本内容辅助分析
- 返回结构化营养分析结果（食物名称、卡路里、蛋白质、碳水、脂肪等）
- 扩展 `VercelAiClient`，新增支持多模态（图片 + 文本）的 chat 方法
- 端点需要 JWT 认证保护

## Capabilities

### New Capabilities
- `image-nutrition-analysis`: 图片营养分析能力，包括图片上传、多模态 AI 调用、结构化营养数据返回

### Modified Capabilities
- `ai-client`: 扩展 `VercelAiClient` 以支持多模态消息（image_url content part），新增 `chatWithModel` 方法允许调用时指定模型
- `vercel-gateway`: 新增图片营养分析端点 `POST /gateway/ai/image-nutrition`，扩展 VercelGatewayController 和 VercelGatewayService

## Impact

- **新增文件**: `src/vercel-gateway/dto/image-nutrition.dto.ts`（请求/响应 DTO）
- **修改文件**: `src/vercel-gateway/vercel-ai.client.ts`（新增多模态支持）、`src/vercel-gateway/vercel-gateway.controller.ts`（新增端点）、`src/vercel-gateway/vercel-gateway.service.ts`（新增业务逻辑）、`src/vercel-gateway/vercel-gateway.module.ts`（注册 MulterModule）
- **新增依赖**: 可能需要 `@nestjs/platform-express` 中的 Multer 文件上传支持
- **环境变量**: 模型固定为 `openai/gpt-5-nano`，无需额外环境变量
- **API 变更**: 新增端点，非破坏性变更
