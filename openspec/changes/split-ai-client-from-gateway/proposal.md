## Why

当前 `VercelGatewayService` 同时承担 HTTP 基础通信（Token 认证、请求封装、错误处理）和 AI 健康建议业务逻辑两种职责，导致两者高度耦合。若未来新增 AI 相关功能（如 AI 食物识别、AI 运动规划），无法直接复用已有的 AI 网关客户端，须重复实现基础通信层。

## What Changes

- 新增 `VercelAiClient` 可注入 Provider：封装对 Vercel AI Gateway 的基础 HTTP 通信（Token 管理、请求构造、错误处理），对外暴露通用 `chat()` 方法
- 重构 `VercelGatewayService`：移除内部基础通信代码，改为依赖注入 `VercelAiClient`，只保留业务逻辑（构造 prompt、调用 client、格式化返回）
- 更新 `VercelGatewayModule`：将 `VercelAiClient` 注册为 Provider 并 export，供其他模块按需复用
- 外部 API（`GET /gateway/ping`、`POST /gateway/ai/suggest`）行为不变

## Capabilities

### New Capabilities

- `ai-client`: 可复用的 Vercel AI Gateway HTTP 客户端，封装认证、请求、错误处理，对外暴露标准 `chat()` 接口

### Modified Capabilities

<!-- 无规格层级的行为变更，仅内部实现重构 -->

## Impact

- `src/vercel-gateway/vercel-gateway.service.ts`：移除基础通信代码，注入 `VercelAiClient`
- 新增 `src/vercel-gateway/vercel-ai.client.ts`：基础 HTTP 通信层
- `src/vercel-gateway/vercel-gateway.module.ts`：注册并 export `VercelAiClient`
- 无数据库 Schema 变更，无外部 API 变更
