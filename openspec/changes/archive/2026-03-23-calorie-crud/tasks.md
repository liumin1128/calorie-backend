## 1. 数据模型层

- [x] 1.1 创建 `src/calorie/schemas/calorie-entry.schema.ts`，定义 CalorieEntry Schema（userId、type、calories、title、description、images、entryDate），添加 `{ userId: 1, entryDate: -1 }` 复合索引
- [x] 1.2 创建 `src/calorie/dto/create-calorie-entry.dto.ts`，定义创建 DTO 及 class-validator 校验规则
- [x] 1.3 创建 `src/calorie/dto/update-calorie-entry.dto.ts`，使用 PartialType 继承创建 DTO
- [x] 1.4 创建 `src/calorie/dto/query-calorie-entry.dto.ts`，定义分页和筛选参数 DTO（page、pageSize、startDate、endDate、type）

## 2. Service 层

- [x] 2.1 创建 `src/calorie/calorie.service.ts`，注入 CalorieEntry Model
- [x] 2.2 实现 `create` 方法：创建条目，自动绑定 userId
- [x] 2.3 实现 `findAll` 方法：分页查询 + 时间范围筛选 + 类型筛选，按 entryDate 降序，返回 data + total
- [x] 2.4 实现 `findOne` 方法：按 id + userId 查询单条，不存在抛 NotFoundException
- [x] 2.5 实现 `update` 方法：按 id + userId 查询并更新，不存在抛 NotFoundException
- [x] 2.6 实现 `remove` 方法：按 id + userId 删除，不存在抛 NotFoundException

## 3. Controller 层

- [x] 3.1 创建 `src/calorie/calorie.controller.ts`，使用 `@UseGuards(JwtAuthGuard)` 保护所有路由
- [x] 3.2 实现 POST /calorie 端点，从 `@Request()` 获取 userId 传递给 Service
- [x] 3.3 实现 GET /calorie 端点，接收查询参数 DTO
- [x] 3.4 实现 GET /calorie/:id 端点
- [x] 3.5 实现 PATCH /calorie/:id 端点
- [x] 3.6 实现 DELETE /calorie/:id 端点

## 4. 模块注册

- [x] 4.1 创建 `src/calorie/calorie.module.ts`，注册 Schema、Service、Controller
- [x] 4.2 在 `src/app.module.ts` 中导入 CalorieModule
