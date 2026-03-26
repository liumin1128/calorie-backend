## Context

当前 Calorie 后端为标准 NestJS 应用，前端直接请求 NestJS API。本次通过 Vercel AI Gateway 引入 DeepSeek AI 模型能力：后端封装专用模块，提供通用 HTTP 客户端基础方法，对外暴露 `POST /gateway/ai/suggest` AI 健康建议端点和 `GET /gateway/ping` 连通性验证端点。

Vercel AI Gateway Token（`vck_` 开头）用于向 Vercel AI Gateway 发请求，网关负责路由到 DeepSeek 模型并返回结果，前端无需感知 AI 提供商。

## Goals / Non-Goals

**Goals:**
- 封装 Vercel AI Gateway 的 HTTP 调用基础方法（含认证头注入、错误标准化）
- 通过 `ConfigService` 安全读取 `VERCEL_AI_TOKEN`、`VERCEL_AI_GATEWAY_URL`、`VERCEL_AI_MODEL`，不硬编码
- 新增 `GET /gateway/ping` 端点，验证网关 Token 已配置就绪
- 新增 `POST /gateway/ai/suggest` 端点，后端自动提取用户健康上下文，调用 DeepSeek 返回个性化健康/饮食建议

**Non-Goals:**
- 不实现 Vercel 的路由规则或 Edge Function 逻辑
- 不替换现有 NestJS 认证体系（JWT 认证不变）
- 不做请求缓存、限流等高级功能
- 不存储 AI 对话历史（无状态建议，每次独立请求）

## Decisions

### 1. 使用 `@nestjs/axios`（HttpModule）而非原生 `fetch`

**决策**: 使用 `@nestjs/axios` 封装 HTTP 客户端。

**理由**: 项目已使用 NestJS 生态，`HttpModule` 可通过 DI 注入，天然支持拦截器、超时配置，方便单元测试 Mock；避免引入额外依赖（axios 已是 NestJS 间接依赖）。

**替代**: 原生 `fetch` → 拒绝，缺少 NestJS DI 集成和统一错误处理。

### 2. Token 通过 ConfigService 读取，不传入 Controller

**决策**: `VercelGatewayService` 在构造时通过 `ConfigService.get('VERCEL_AI_TOKEN')` 读取，Controller 不接触 Token。

**理由**: 最小权限原则，Controller 只负责路由转发，敏感配置收敛在 Service 层。

### 3. 通用基础方法封装为私有 `request()` 方法

**决策**: Service 内部提供私有 `request<T>(method, path, body?)` 方法统一处理认证头、错误映射，超时 30 秒；公开方法（如 `ping()`、`getSuggestion()`）调用它。

**理由**: 降低圈复杂度，未来扩展只需新增公开方法，无需重复认证逻辑。

### 4. `GET /gateway/ping` 只验证 Token 配置，不调用外部接口

**决策**: ping 端点仅检查 `VERCEL_AI_TOKEN` 是否已在 ConfigService 中配置，返回固定响应 `{ status: 'ok', gateway: 'vercel-ai-gateway', model: '<配置的模型名>' }`，不发起任何 AI 请求。

**理由**: Vercel AI Gateway Token 是 AI 调用凭证，不支持账户元数据查询（`/v2/user` 仅适用普通 Vercel 账户 Token）；且避免每次 ping 都消耗 AI 调用额度。

**替代**: 发送测试 prompt 验证 → 拒绝，每次 ping 消耗额度，成本过高。

### 5. Vercel AI Gateway + DeepSeek：使用 OpenAI 兼容接口

**决策**: 调用 `POST /v1/chat/completions`，model 设为 `deepseek-chat`（DeepSeek-V3），由 `VERCEL_AI_MODEL` 环境变量控制。

- **Base URL**: `https://ai-gateway.vercel.sh`（由 `VERCEL_AI_GATEWAY_URL` 配置）
- **认证**: `Authorization: Bearer <VERCEL_AI_TOKEN>`
- **格式**: 标准 OpenAI chat completions 格式

**理由**: Vercel AI Gateway 提供统一的 OpenAI 兼容接口，切换模型只需改环境变量，代码零改动。

### 6. AI 建议 Prompt：后端构造上下文，前端只传 question

**决策**: `POST /gateway/ai/suggest` 只接收 `question` 字段（最大 500 字符），后端自动从当前登录用户的 profile、动态数据和卡路里记录构造完整上下文，禁止前端传入 systemPrompt。

**理由**: 防止 prompt 注入攻击；后端以可信的结构化数据构造上下文，确保安全性和个性化质量。

**卡路里数据查询**: 查询近 7 天**所有**记录（含 intake 和 burn），分别统计：
- 摄入总量、日均摄入（kcal）+ 记录条数
- 消耗总量、日均消耗（kcal）+ 记录条数
- 日均净热量差（日均摄入 - 日均消耗）

`CalorieService` 新增 `summarizeLast7Days(userId)` 聚合方法，避免 VercelGatewayService 跨模块直接查数据库。

**System prompt**（固定，不受用户输入影响）：
```
你是一位资深健身教练兼注册营养师，拥有超过10年的实践经验。你的风格严谨、科学、充满激励性，且始终将客户的长期健康置于首位。你将根据用户提供的个人数据，提供高度定制化的综合建议。

收到用户信息后，请按以下步骤进行：
1. 数据确认与初步评估：计算BMI，告知健康范围；基于"每周减重0.5-1公斤"估算达到目标的大致时间范围；计算日均热量差（摄入-消耗），评价与目标的关系。
2. 核心风险评估：强调建议不能替代专业医疗诊断；评估目标体重是否在健康BMI范围内；若摄入远低于基础代谢率，必须警告健康风险。
3. 分领域专业建议：运动计划（有氧+力量训练+日常活动量）；营养与饮食优化（热量目标区间、营养素分配比例、具体可操作的食物建议、饮水与习惯）；执行与心态指导（追踪调整策略、可持续性提示、激励性总结）。

安全原则：绝对不提供极端节食或过度运动方案。语言专业、清晰、充满支持感，避免令用户焦虑的词语。
```

**User message 模板**（后端填入用户数据后发送，含 question）：
```
基础信息：
身高：<latestHeight 或 "暂无记录"> cm
当前体重：<latestWeight 或 "暂无记录"> kg
目标体重：<targetWeight 或 "未设置"> kg
健康状态简述：<healthConditions.join(", ") 或 "暂无填写">

近7日饮食记录（摄入）：
<按 entryDate 降序，每条格式：- MM/DD  <title>（<calories> kcal）<若有 description 则追加：，<description>>
若无记录则填：- 暂无饮食记录>

近7日运动记录（消耗）：
<按 entryDate 降序，每条格式：- MM/DD  <title>（<calories> kcal）<若有 description 则追加：，<description>>
若无记录则填：- 暂无运动记录>

统计汇总：
- 摄入：共 <intakeTotal> kcal，日均 <intakeAvg> kcal，<intakeCount> 条记录
- 消耗：共 <burnTotal> kcal，日均 <burnAvg> kcal，<burnCount> 条记录
- 日均净热量差（摄入-消耗）：<netAvg> kcal

我的问题：<question>
```

> **实现说明**：`summarizeLast7Days` 返回值新增 `intakeEntries` 和 `burnEntries` 详细列表（各含 `title`、`calories`、`description`、`entryDate`），`getSuggestion` 在格式化 user message 时直接迭代这两个列表拼接文本。

## Risks / Trade-offs

- **Token 泄露风险**: `VERCEL_AI_TOKEN` 误提交到代码仓库会造成 AI 额度盗用 → 缓解：`.env` 加入 `.gitignore`，CI/CD 通过环境变量注入
- **AI 调用费用**: 每次 `/gateway/ai/suggest` 消耗 AI 额度 → 缓解：限制响应最大 token 数（max_tokens: 400），后续可加请求频率限制
- **响应延迟**: DeepSeek 模型响应 3~10 秒 → 缓解：前端显示加载状态；Service 超时设置 30 秒
- **Prompt 注入**: 用户 `question` 字段拼入 prompt 可能被利用 → 缓解：`question` 最大 500 字符校验，只使用已校验的结构化字段，禁止用户自定义 systemPrompt
- **`@nestjs/axios` 版本兼容**: NestJS 11 对应 `@nestjs/axios ^3.x` → 安装时确认版本

## Migration Plan

1. 安装 `@nestjs/axios`（若未安装：`pnpm add @nestjs/axios axios`）
2. 在 `.env` 中新增：
   - `VERCEL_AI_TOKEN=<your-vercel-ai-gateway-token>`
   - `VERCEL_AI_GATEWAY_URL=https://ai-gateway.vercel.sh`
   - `VERCEL_AI_MODEL=deepseek-chat`
3. 创建 `SuggestDto`（question 字段校验）
4. 创建 `VercelGatewayModule`，注册到 `AppModule`
5. 实现 `VercelGatewayService`（通用基础方法 + `ping()` + `getSuggestion()`）
6. 实现 `VercelGatewayController`（`GET /gateway/ping` + `POST /gateway/ai/suggest`）
7. 回滚：从 `AppModule.imports` 移除 `VercelGatewayModule` 即可，不影响其他模块

## Open Questions

（已解答）
- Base URL: `https://ai-gateway.vercel.sh`，由 `VERCEL_AI_GATEWAY_URL` 配置
- Token: Vercel AI Gateway Token（`vck_` 开头），用于 AI 调用，不适用 `/v2/user`
- ping 行为: 仅验证 Token 已配置，不发起实际 AI 请求
- 模型: DeepSeek-V3 (`deepseek-chat`)
