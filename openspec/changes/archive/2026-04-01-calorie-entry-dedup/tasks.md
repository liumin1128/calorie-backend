## 1. Schema 层

- [x] 1.1 在 `calorie-entry.schema.ts` 中新增 `{ userId: 1, entryDate: 1, type: 1 }` 唯一复合索引，替换原有的 `{ userId: 1, entryDate: -1 }` 非唯一索引

## 2. Service 层

- [x] 2.1 将 `calorie.service.ts` 的 `create` 方法改为 `findOneAndUpdate` + `upsert: true`，以 `{ userId, entryDate, type }` 为匹配条件
- [x] 2.2 `create` 方法返回 `{ data, isNew }` 结构，通过 `upsertedId` 判断是新建还是更新

## 3. Controller 层

- [x] 3.1 修改 `calorie.controller.ts` 的 create 端点，根据 `isNew` 返回 201（新建）或 200（更新）

## 4. 测试

- [x] 4.1 更新 `calorie.service.spec.ts`，覆盖 upsert 新建、upsert 更新、不同 type/entryDate 不去重的场景
