## Why

前端应用需要一个统一的 API 入口，通过 Vercel API Gateway 将请求代理到后端服务。当前前端直连 NestJS 后端，缺少统一的请求拦截、路由管理和凭证校验层；引入 Vercel API Gateway 后可在边缘层做统一代理，简化前端的跨域、鉴权和请求管理。

## What Changes

- 新增 `src/vercel-gateway/` 模块，封装 Vercel API Gateway 调用的通用基础方法（发起请求、错误处理、认证头注入）
- 新增至少一个示例 API 端点（`GET /gateway/ping`），前端可通过该端点验证网关连通性并作为调用范例
- Token 通过环境变量 `VERCEL_API_TOKEN` 注入，不得硬编码

## Capabilities

### New Capabilities

- `vercel-gateway`：Vercel API Gateway 客户端模块，包含通用基础方法和示例 API 端点

### Modified Capabilities

（无现有 capability 变更）

## Impact

- **新增**: `src/vercel-gateway/vercel-gateway.module.ts`、`vercel-gateway.service.ts`、`vercel-gateway.controller.ts`
- **环境变量**: 新增 `VERCEL_API_TOKEN`，需在 `.env` 和部署环境中配置
- **依赖**: 使用 NestJS 内置 `HttpModule`（`@nestjs/axios`），无需额外第三方 HTTP 库
- **安全**: Token 仅在 Service 层通过 `ConfigService` 读取，不暴露到 Controller 或响应体
- **无破坏性变更**，现有模块不受影响
