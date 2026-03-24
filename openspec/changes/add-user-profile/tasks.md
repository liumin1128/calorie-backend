## 1. User Schema 扩展与 User 模块搭建

- [x] 1.1 扩展 `src/auth/schemas/user.schema.ts`，新增 `gender`（enum: male/female/other）、`birthday`（Date）、`signature`（string, maxlength 200）可选字段
- [x] 1.2 创建 `src/user/` 模块基础结构：`user.module.ts`、`user.controller.ts`、`user.service.ts`
- [x] 1.3 创建 `src/user/dto/update-profile.dto.ts`，使用 class-validator 校验 `nickname`、`gender`、`birthday`、`signature`，所有字段均为可选
- [x] 1.4 在 `UserService` 中实现 `updateProfile(userId, dto)` 方法，部分更新用户基础信息并返回更新后的用户（排除密码）
- [x] 1.5 在 `UserController` 添加 `PUT /user/profile` 端点，使用 `JwtAuthGuard` 保护，包含完整 JSDoc 注释

## 2. DynamicData 模块搭建

- [x] 2.1 创建 `src/dynamic-data/schemas/dynamic-data.schema.ts`，定义 `DynamicData` Schema（userId, category, value, recordedAt），添加 `{ userId, category, recordedAt }` 复合索引
- [x] 2.2 创建 `src/dynamic-data/` 模块基础结构：`dynamic-data.module.ts`、`dynamic-data.controller.ts`、`dynamic-data.service.ts`
- [x] 2.3 创建 `src/dynamic-data/dto/create-dynamic-data.dto.ts`，校验 `category`（必填 string）、`value`（必填 number）、`recordedAt`（可选 Date）
- [x] 2.4 创建 `src/dynamic-data/dto/query-latest.dto.ts`，校验 `category`（必填）、`date`（可选 Date）
- [x] 2.5 创建 `src/dynamic-data/dto/query-trend.dto.ts`，校验 `category`（必填）、`startDate`（必填）、`endDate`（必填），含 startDate ≤ endDate 自定义校验

## 3. DynamicData 业务逻辑实现

- [x] 3.1 在 `DynamicDataService` 中实现 `create(userId, dto)` 方法——录入动态数据
- [x] 3.2 在 `DynamicDataService` 中实现 `findLatest(userId, category, date)` 方法——时间点查询，取当天最新一条
- [x] 3.3 在 `DynamicDataService` 中实现 `findTrend(userId, category, startDate, endDate)` 方法——时间段趋势查询，使用 MongoDB Aggregation Pipeline 按天分组取每天最新
- [x] 3.4 在 `DynamicDataService` 中实现 `findLatestByCategories(userId, categories)` 方法——批量查询多个类别的最新值（供登录和 full-profile 使用）
- [x] 3.5 在 `DynamicDataController` 添加 `POST /dynamic-data` 端点，包含完整 JSDoc 注释
- [x] 3.6 在 `DynamicDataController` 添加 `GET /dynamic-data/latest` 端点，包含完整 JSDoc 注释
- [x] 3.7 在 `DynamicDataController` 添加 `GET /dynamic-data/trend` 端点，包含完整 JSDoc 注释

## 4. Full-Profile 接口

- [x] 4.1 在 `UserService` 中实现 `getFullProfile(userId)` 方法，聚合用户基础信息 + 最新身高体重（注入 `DynamicDataService`）
- [x] 4.2 在 `UserController` 添加 `GET /user/full-profile` 端点，使用 `JwtAuthGuard` 保护，包含完整 JSDoc 注释

## 5. Auth 模块登录响应改造

- [x] 5.1 修改 `AuthModule`，导入 `UserModule` 和 `DynamicDataModule`
- [x] 5.2 修改 `AuthService.buildResponse()`，注入 `DynamicDataService`，在响应中附加最新身高体重
- [x] 5.3 更新 `AuthService.register()` 的响应，与新的 `buildResponse` 保持一致
- [x] 5.4 为修改后的 `AuthController` 登录端点补充更新后的 JSDoc 注释

## 6. 模块注册与集成

- [x] 6.1 在 `AppModule` 中注册 `UserModule` 和 `DynamicDataModule`
- [x] 6.2 确保模块间 `exports` / `imports` 依赖正确（`UserModule` export `UserService`，`DynamicDataModule` export `DynamicDataService`）

## 7. 测试

- [x] 7.1 为 `UserService.updateProfile()` 编写单元测试
- [x] 7.2 为 `DynamicDataService` 的 `create`、`findLatest`、`findTrend` 编写单元测试
- [x] 7.3 为 `AuthService.buildResponse()` 修改后的逻辑编写单元测试
