## 1. 项目依赖与模块骨架

- [x] 1.1 安装 `@nestjs/axios` 和 `axios` 依赖（已存在于 package.json）
- [x] 1.2 创建 `src/food/food.module.ts`，注册 HttpModule（配置超时 5s 和 User-Agent）
- [x] 1.3 创建 `src/food/food.controller.ts`，定义 `GET /food/barcode/:code` 路由，使用 JwtAuthGuard
- [x] 1.4 创建 `src/food/food.service.ts`，注入 HttpService
- [x] 1.5 在 `app.module.ts` 中注册 FoodModule

## 2. DTO 定义

- [x] 2.1 创建 `src/food/dto/barcode-param.dto.ts`，对 `:code` 参数做正则校验（4-14 位数字）
- [x] 2.2 创建 `src/food/dto/barcode-food-response.dto.ts`，定义响应结构（name, imageUrl, brand, quantity, calories, protein, carbs, fat, fiber, minerals）

## 3. 核心业务逻辑

- [x] 3.1 实现 `FoodService.lookupByBarcode(code: string)` 方法：调用 Open Food Facts API，提取并映射营养数据
- [x] 3.2 处理产品不存在场景（404）
- [x] 3.3 处理外部 API 异常场景（502）
- [x] 3.4 实现微量元素（minerals）提取逻辑：从 nutriments 中提取钠、钙、铁等含量较高的微量元素

## 4. Controller 路由实现

- [x] 4.1 实现 `FoodController.getByBarcode()` 方法，调用 Service 并返回响应，添加 JSDoc 注释

## 5. 测试

- [x] 5.1 编写 `food.service.spec.ts` 单元测试，覆盖成功查询、产品不存在、API 异常三种场景
