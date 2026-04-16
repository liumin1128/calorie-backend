## 1. WaterIntake Schema 与模块结构

- [x] 1.1 创建 `src/water/schemas/water-intake.schema.ts`，定义 WaterIntake Mongoose Schema（userId, date, amount），添加 `{ userId: 1, date: 1 }` 唯一索引
- [x] 1.2 创建 `src/water/water.module.ts`，注册 WaterIntake Schema
- [x] 1.3 创建 `src/water/water.service.ts` 和 `src/water/water.controller.ts` 骨架

## 2. DTO 校验层

- [x] 2.1 创建 `src/water/dto/set-water.dto.ts`：date（必填, YYYY-MM-DD 格式）、amount（必填, ≥0）
- [x] 2.2 创建 `src/water/dto/query-water.dto.ts`：startDate（必填）、endDate（必填）

## 3. WaterService 实现

- [x] 3.1 实现 `setWater(userId, dto)` — upsert 模式设置某天饮水量，按 `{ userId, date }` 定位，覆盖 amount
- [x] 3.2 实现 `getWater(userId, query)` — 查询日期范围内每日饮水量，按 date 升序返回

## 4. WaterController 路由

- [x] 4.1 实现 PUT /water 路由，接入 JwtAuthGuard，调用 setWater
- [x] 4.2 实现 GET /water 路由，接入 JwtAuthGuard，调用 getWater

## 5. 模块注册

- [x] 5.1 在 `app.module.ts` 中注册 WaterModule
- [x] 5.2 运行 lint 检查确认无错误

## 6. 单元测试

- [x] 6.1 编写 `water.service.spec.ts` — 覆盖 setWater 和 getWater 逻辑
