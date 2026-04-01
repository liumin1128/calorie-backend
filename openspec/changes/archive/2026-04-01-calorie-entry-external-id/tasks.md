## 1. Schema 层

- [x] 1.1 在 `calorie-entry.schema.ts` 中新增 `externalId` 可选字符串字段
- [x] 1.2 将唯一索引从 `{ userId, entryDate, type }` 改为 `{ userId, externalId }` 稀疏唯一索引

## 2. DTO 层

- [x] 2.1 在 `create-calorie-entry.dto.ts` 中新增 `externalId` 可选字段，`@IsString()` + `@IsOptional()`

## 3. Service 层

- [x] 3.1 重写 `calorie.service.ts` 的 `create` 方法：有 `externalId` 时走 `findOneAndUpdate` upsert，无 `externalId` 时走 `Model.create()` 直接创建

## 4. 测试

- [x] 4.1 更新 `calorie.service.spec.ts`，覆盖有/无 externalId 的创建场景、upsert 新建/更新场景
