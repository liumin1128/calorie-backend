## Context

当前用户 Schema（`user.schema.ts`）已包含基础个人信息字段（nickname、gender、birthday、signature），通过 `PUT /user/profile` 更新，通过 `GET /user/full-profile` 查询。本次变更在此基础上新增两个可选字段，用于支持后续 AI 个性化推荐。

## Goals / Non-Goals

**Goals:**
- 在 User Schema 中新增 `targetWeight`（目标体重，kg）和 `healthConditions`（健康标签数组）字段
- 更新更新接口和查询接口以支持这两个字段
- 为后续 AI 接入提供用户健康背景数据

**Non-Goals:**
- 不做健康状况的枚举值强制校验（允许自由文本标签，灵活性更高）
- 不做目标体重的业务逻辑处理（仅存储，AI 模块负责使用）
- 不涉及 AI 接入本身

## Decisions

### 1. `healthConditions` 使用 `string[]` 而非枚举

**决策**: 健康状况字段使用字符串数组，不限定枚举值。

**理由**: 健康状况的分类在不同 AI 应用场景下差异较大，使用自由标签（如 "高血压"、"糖尿病"、"乳糖不耐受"）灵活性更强，避免频繁修改 Schema。AI 模块可以基于标签做语义理解，不需要后端强约束。

**替代方案**: 定义 `enum HealthCondition` → 拒绝，维护成本高，且 AI 输入不需要强类型约束。

### 2. 字段均为可选，无默认值

**决策**: `targetWeight` 和 `healthConditions` 在 Schema 层均不设默认值，空值时字段不存在（MongoDB sparse 行为）。

**理由**: 与现有的 nickname、birthday 等字段保持一致的可选语义，旧用户数据无需迁移。

### 3. 复用现有 `PUT /user/profile` 接口

**决策**: 不新增接口，直接在现有更新接口的 DTO 和 Schema 中扩展字段。

**理由**: 变更最小化，与现有架构一致，前端改动量最小。

## Risks / Trade-offs

- **健康数据隐私风险**: `healthConditions` 属于敏感个人健康信息 → 缓解：仅已认证用户可读写自己的数据，JWT 认证已覆盖；后续可考虑字段加密
- **无数据迁移**: 旧用户无 `targetWeight` 和 `healthConditions` 字段，查询时为 `undefined` → 响应层统一处理为 `null`

## Migration Plan

1. 更新 `user.schema.ts`，新增字段定义
2. 更新 `update-profile.dto.ts`，新增校验规则
3. 更新 `GET /user/full-profile` 响应，包含新字段
4. 无需数据库迁移脚本（MongoDB schema-less，旧文档不受影响）
5. 回滚：移除 DTO 新增字段即可，旧数据已存储但接口不再暴露

## Open Questions

- 目标体重是否需要合理范围校验（如 30~300 kg）？→ 建议加入基础范围校验，防止异常数据干扰 AI
