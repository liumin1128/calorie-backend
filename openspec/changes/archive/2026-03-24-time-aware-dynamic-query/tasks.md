## 1. DynamicDataService 改造

- [x] 1.1 修改 `findLatest` 方法：将查询条件从“当天范围 `$gte dayStart, $lte dayEnd`”改为“截止到该日期 `$lte dayEnd`”
- [x] 1.2 修改 `findLatestByCategories` 方法：增加可选参数 `beforeDate?: Date`，传入时在 aggregate `$match` 中添加 `recordedAt: { $lte: beforeDate }` 条件

## 2. UserService & UserController 改造

- [x] 2.1 修改 `UserService.getFullProfile` 方法：增加可选参数 `date?: Date`，透传给 `findLatestByCategories` 的 `beforeDate`（转换为当天 23:59:59.999）
- [x] 2.2 修改 `UserController.getFullProfile` 方法：增加 `@Query('date')` 可选参数，解析后传入 Service 层

## 3. DynamicDataController 适配

- [x] 3.1 确认 `DynamicDataController` 中 `findLatest` 的调用方式与新签名兼容，无需额外改动

## 4. 测试更新

- [x] 4.1 更新 `dynamic-data.service.spec.ts`：覆盖 `findLatest` 截止日期查询逻辑、`findLatestByCategories` 带 `beforeDate` 的场景
- [x] 4.2 更新 `user.service.spec.ts`：覆盖 `getFullProfile` 带 `date` 参数的时间回溯查询场景
