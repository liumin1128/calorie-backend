# image-nutrition-analysis Spec

## Requirements

### Requirement: 图片营养分析端点
系统 SHALL 提供 `POST /gateway/ai/image-nutrition` 端点，接收用户上传的食物图片（multipart/form-data, field name: `image`），调用 AI 多模态模型分析图片中的食物并返回结构化营养数据。

该端点 SHALL 需要 JWT 认证。
上传图片 SHALL 限制最大 5MB，仅允许 JPEG、PNG、WebP、GIF 格式。
后端 SHALL 将图片转为 Base64 data URL，构造多模态消息调用 AI Gateway。
模型 SHALL 固定使用 `openai/gpt-5-nano`。
system prompt SHALL 指示 AI：识别图片中的食物，估算营养成分；若图片中包含文本信息（如营养标签），SHALL 参考文本辅助分析。
响应 SHALL 使用 `response_format: { type: "json_object" }` 确保 AI 返回 JSON。
响应 SHALL 包含结构化字段：`foods`（食物数组，每项含 `name`, `calories`, `protein`, `carbs`, `fat`, `fiber`, `unit`, `quantity`）、`summary`（整体分析描述）、`model`（使用的模型名称）。

#### Scenario: 成功分析食物图片
- **WHEN** 已认证用户上传一张食物照片到 `POST /gateway/ai/image-nutrition`
- **THEN** 系统返回 200，响应体包含 `{ foods: [...], summary: "...", model: "openai/gpt-5-nano" }`

#### Scenario: 图片中包含营养标签文本
- **WHEN** 已认证用户上传包含营养成分表文字的食品包装图片
- **THEN** AI 分析结果 SHALL 参考图片中的文本信息，返回的营养数据与标签一致或接近

#### Scenario: 未上传图片
- **WHEN** 已认证用户请求 `POST /gateway/ai/image-nutrition` 但未附带 image 文件
- **THEN** 系统返回 400 Bad Request

#### Scenario: 图片格式不支持
- **WHEN** 已认证用户上传非 JPEG/PNG/WebP/GIF 格式的文件
- **THEN** 系统返回 400 Bad Request，提示不支持的文件格式

#### Scenario: 图片超过大小限制
- **WHEN** 已认证用户上传超过 5MB 的图片
- **THEN** 系统返回 400 Bad Request，提示文件过大

#### Scenario: AI 返回非法 JSON
- **WHEN** AI Gateway 返回无法解析的 JSON 内容
- **THEN** 系统返回 502 Bad Gateway

#### Scenario: 未认证用户被拒绝
- **WHEN** 未携带有效 JWT 的请求访问 `POST /gateway/ai/image-nutrition`
- **THEN** 系统返回 401 Unauthorized
