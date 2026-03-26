## 1. Schema 更新

- [x] 1.1 在 `src/auth/schemas/user.schema.ts` 中新增 `targetWeight` 字段（Number, 可选）
- [x] 1.2 在 `src/auth/schemas/user.schema.ts` 中新增 `healthConditions` 字段（[String], 可选）

## 2. DTO 更新

- [x] 2.1 在 `src/user/dto/update-profile.dto.ts` 中新增 `targetWeight` 可选字段，添加 `@IsNumber()`、`@Min(30)`、`@Max(300)` 校验装饰器
- [x] 2.2 在 `src/user/dto/update-profile.dto.ts` 中新增 `healthConditions` 可选字段，添加 `@IsArray()`、`@IsString({ each: true })`、`@MaxLength(50, { each: true })`、`@ArrayMaxSize(20)` 校验装饰器

## 3. 接口响应更新

- [x] 3.1 更新 `src/user/user.service.ts` 中 `getFullProfile` 方法返回值，包含 `targetWeight` 和 `healthConditions` 字段（未设置时返回 null）
- [x] 3.2 确认 `PUT /user/profile` 接口无需额外修改（Mongoose 部分更新已支持新字段透传）

## 4. 验证与联调

- [x] 4.1 启动服务，使用 PUT /user/profile 更新 targetWeight 和 healthConditions，确认字段正确写入 MongoDB
- [x] 4.2 使用 GET /user/full-profile 确认新字段出现在响应中
- [x] 4.3 测试 targetWeight 边界值（30、300）和越界值（29、301），确认校验规则生效
- [x] 4.4 测试旧用户（无新字段）的 GET /user/full-profile，确认返回 null 而非 undefined
