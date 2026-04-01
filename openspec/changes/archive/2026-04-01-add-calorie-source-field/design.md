## Context

当前 CalorieEntry Schema 没有来源字段，所有记录默认为手动创建。随着后续计划对接 iOS HealthKit 数据导入，需要在数据模型层面区分不同来源的记录。

现有 Schema 字段：`userId`, `type`, `calories`, `title`, `description`, `images`, `entryDate`。

## Goals / Non-Goals

**Goals:**
- 新增 `source` 枚举字段标识数据来源
- 向后兼容：现有 API 不传 `source` 时默认为 `manual`
- 查询接口支持按 `source` 过滤
- 历史数据无需迁移

**Non-Goals:**
- 不实现 HealthKit 数据导入逻辑（后续独立 change）
- 不新增模块，所有改动在现有 calorie 模块内完成
- 不修改每日汇总 API 的 source 过滤（后续按需扩展）

## Decisions

### 1. source 字段使用枚举类型

定义 `EntrySource` 枚举，值为 `manual` 和 `healthkit`。使用枚举而非自由字符串，保证数据一致性，便于后续扩展新来源时统一管理。

**替代方案**: 使用自由字符串 → 数据一致性差，查询不可控，放弃。

### 2. 字段设为可选，默认值 `manual`

Schema 层设置 `default: EntrySource.MANUAL`，DTO 层设为 `@IsOptional()`。这样：
- 现有客户端无需修改
- 历史数据查询时 `source` 为 `undefined` 的记录等同于 `manual`

### 3. 查询时兼容历史数据

按 `source=manual` 查询时，需同时匹配 `source: 'manual'` 和 `source: { $exists: false }`，确保历史数据可被正确检索。

## Risks / Trade-offs

- **[风险] 历史数据无 source 字段** → 查询时使用 `$or` 条件兼容，或运行一次批量更新补充默认值。推荐查询兼容方案，避免大规模数据迁移。
- **[风险] 枚举扩展** → 新增来源只需在 `EntrySource` 枚举中添加值，影响范围可控。
