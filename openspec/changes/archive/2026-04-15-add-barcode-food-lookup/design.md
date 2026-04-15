## Context

Calorie 应用目前依赖用户手动输入或 AI 图片识别来录入食物营养数据。对于有条形码的预包装食品，可以通过扫码从 Open Food Facts（全球最大开源食品数据库，300万+产品）直接获取准确的营养信息，显著提升录入效率和准确性。

当前系统已有 `vercel-gateway` 模块（封装外部 AI API 调用），新模块 `food` 将遵循同样的模块化架构，独立封装 Open Food Facts 的 HTTP 调用。

## Goals / Non-Goals

**Goals:**
- 提供通过条形码查询食品信息的 REST API
- 从 Open Food Facts 响应中提取并结构化：名称、封面图、热量、蛋白质、碳水、脂肪、膳食纤维、微量元素
- 合理处理产品不存在、API 超时等异常场景
- 遵循 Open Food Facts User-Agent 规范

**Non-Goals:**
- 不做本地数据缓存/数据库存储（首版不引入 MongoDB Schema）
- 不做批量条码查询
- 不做条码图片识别（前端负责扫码解码，后端只接收条码字符串）
- 不与现有 calorie-entry 自动关联（后续迭代）

## Decisions

### 1. 独立 `food` 模块 vs 放入 `vercel-gateway`

**选择**: 新建独立 `food` 模块

**理由**: Open Food Facts 是纯 REST API 查询，与 Vercel AI SDK 无关。独立模块职责清晰，符合 NestJS 单一职责原则。

**备选方案**: 放入 `vercel-gateway` — 会让该模块职责膨胀，与 AI 能力无关的代码混入。

### 2. HTTP 客户端选型

**选择**: 使用 `@nestjs/axios`（HttpModule + HttpService）

**理由**: NestJS 官方推荐的 HTTP 客户端封装，支持依赖注入、超时配置、拦截器，与框架深度集成。

**备选方案**: 原生 `fetch` — 不支持 DI，不利于测试和统一配置。

### 3. API 版本选择

**选择**: Open Food Facts API v2（`/api/v2/product/[barcode].json`）

**理由**: v2 是当前最新稳定版本，支持字段筛选（`fields` 参数），可减少响应体积。

### 4. 营养数据字段映射策略

**选择**: 提取 `nutriments` 对象中的 `_100g` 后缀字段，标准化为每 100g 的数值

**理由**: Open Food Facts 的 `nutriments` 包含 `_100g`、`_serving`、`_value` 多种规格，统一使用 `_100g` 保证数据可比性。

关键字段映射：
| Open Food Facts 字段 | 输出字段 |
|---|---|
| `product_name` | `name` |
| `image_front_url` | `imageUrl` |
| `nutriments.energy-kcal_100g` | `calories` |
| `nutriments.proteins_100g` | `protein` |
| `nutriments.carbohydrates_100g` | `carbs` |
| `nutriments.fat_100g` | `fat` |
| `nutriments.fiber_100g` | `fiber` |
| `nutriments.sodium_100g` / `salt_100g` / `calcium_100g` 等 | `minerals[]` |
| `brands` | `brand` |
| `quantity` | `quantity` |

### 5. 认证策略

**选择**: 使用现有 `JwtAuthGuard`，与其他业务 API 保持一致

**理由**: 食品查询属于业务功能，应要求用户登录后使用。

## Risks / Trade-offs

- **[外部 API 不可用]** → 设置合理超时（5s），返回明确的错误信息（502），前端可降级为手动输入
- **[产品数据缺失]** → Open Food Facts 部分产品营养信息不完整，API 返回时对缺失字段填 `null`，前端判断展示
- **[中文数据有限]** → 优先取 `product_name`（默认语言），如无中文则返回原始语言名称，前端可二次编辑
- **[请求频率]** → Open Food Facts 无硬性限流，但要求设置合规 User-Agent（`CalorieApp/1.0`），避免被误判为爬虫
