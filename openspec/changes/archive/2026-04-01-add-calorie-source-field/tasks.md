## 1. Schema 层

- [x] 1.1 在 `calorie-entry.schema.ts` 中新增 `EntrySource` 枚举（`manual`, `healthkit`）
- [x] 1.2 在 `CalorieEntry` Schema 中新增 `source` 字段，类型为枚举，默认值 `manual`，可选

## 2. DTO 层

- [x] 2.1 在 `create-calorie-entry.dto.ts` 中新增 `source` 可选字段，使用 `@IsOptional()` + `@IsEnum(EntrySource)`
- [x] 2.2 在 `update-calorie-entry.dto.ts` 中确认 `source` 字段被 PartialType 继承（无需额外改动则跳过）
- [x] 2.3 在 `query-calorie-entry.dto.ts` 中新增 `source` 可选查询参数

## 3. Service 层

- [x] 3.1 在 `calorie.service.ts` 的查询方法中增加 `source` 过滤逻辑，`source=manual` 时兼容历史数据（`$or` 匹配 `manual` 和 `$exists: false`）

## 4. 测试

- [x] 4.1 更新 `calorie.service.spec.ts` 单元测试，覆盖 source 字段默认值、枚举校验、查询过滤场景
