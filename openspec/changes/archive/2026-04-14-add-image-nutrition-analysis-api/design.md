## Context

当前 Calorie 后端已通过 `VercelAiClient` 封装了对 Vercel AI Gateway 的文本 chat 调用能力（OpenAI Chat Completions 兼容格式），并在 `VercelGatewayService` 中实现了文本建议端点。现需新增图片营养分析能力，利用 `openai/gpt-5-nano` 多模态模型识别食物图片并返回结构化营养数据。

现有 `VercelAiClient.chat()` 仅支持纯文本 `ChatMessage`（`{ role, content: string }`），需扩展以支持多模态内容（image_url + text content parts）。

## Goals / Non-Goals

**Goals:**
- 支持用户上传食物图片，自动分析营养成分和卡路里
- 扩展 `VercelAiClient` 支持多模态消息格式和按需指定模型
- 若图片中包含文本（如营养标签），AI 应参考文本辅助分析
- 返回结构化 JSON 格式的营养分析结果（食物名称、卡路里、蛋白质、碳水、脂肪等）

**Non-Goals:**
- 不做图片持久化存储（图片仅作为分析输入，不存入数据库）
- 不做前端图片裁剪/压缩（由前端自行处理）
- 不自动创建卡路里记录（分析结果由前端确认后再提交）
- 不支持批量多图分析（单次请求单张图片）

## Decisions

### 1. 图片传输方式：Base64 内联 vs 文件上传

**选择**: multipart/form-data 文件上传，后端转为 Base64 data URL 传给 AI Gateway

**理由**:
- multipart/form-data 是 HTTP 文件上传标准，前端处理直观
- AI Gateway（OpenAI 兼容格式）的 `image_url` content part 支持 data URL（`data:image/jpeg;base64,...`）
- 服务端转换可控制图片大小校验，避免过大 payload

**替代方案**: 直接传 Base64 字符串在 JSON body 中 → 不符合 REST 文件上传惯例，且 JSON payload 会非常大

### 2. 模型选择策略

**选择**: 图片分析调用 hardcode 使用 `openai/gpt-5-nano`，不复用环境变量 `VERCEL_AI_MODEL`

**理由**:
- 图片分析需要多模态能力，而 `VERCEL_AI_MODEL` 当前默认为 `deepseek/deepseek-v3.2`（纯文本模型）
- 按需求指定 `openai/gpt-5-nano`，确保多模态能力可用
- `VercelAiClient` 新增 `chatWithModel()` 方法允许调用时覆盖模型

### 3. AI 响应解析策略

**选择**: system prompt 中要求 AI 严格返回 JSON 格式，后端 JSON.parse 解析

**理由**:
- OpenAI 兼容 API 支持 `response_format: { type: "json_object" }` 来保证 JSON 输出
- 后端做 JSON.parse + 字段校验，解析失败时返回 502 错误
- 结构化数据对前端展示更友好

### 4. 文件大小和格式限制

**选择**: 最大 5MB，仅允许 JPEG/PNG/WebP/GIF

**理由**:
- 5MB 覆盖绝大多数手机拍照场景
- 限制格式减少攻防面，且 OpenAI vision 仅支持这些格式
- Multer `fileFilter` + `limits` 在上传阶段即拦截

## Risks / Trade-offs

- **[AI 返回非预期格式]** → 后端做 JSON.parse try-catch，解析失败返回 502，附带日志便于排查
- **[图片过大导致请求超时]** → 限制 5MB + 30 秒超时已在 VercelAiClient 中配置
- **[AI 分析精度不高]** → 产品层面可标注"仅供参考"；system prompt 中要求参考图片中文本
- **[Base64 编码增大内存占用]** → 5MB 图片 Base64 后约 6.7MB，单次请求可接受
