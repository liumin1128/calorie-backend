## 1. DTO 定义

- [x] 1.1 在 `src/calorie/dto/` 下创建 `query-daily-summary.dto.ts`，定义 `QueryDailySummaryDto`，包含 `startDate`（必填，YYYY-MM-DD 格式）和 `endDate`（必填，YYYY-MM-DD 格式），添加 class-validator 校验装饰器及 startDate 不晚于 endDate 的自定义校验

## 2. Service 层实现

- [x] 2.1 在 `CalorieService` 中新增 `getDailySummary(userId: string, dto: QueryDailySummaryDto)` 方法，使用 MongoDB Aggregation Pipeline 按天分组汇总 intake 和 burn 的 calories，返回 `Record<string, { totalIntake: number; totalBurn: number }>` 格式

## 3. Controller 层实现

- [x] 3.1 在 `CalorieController` 中新增 `@Get('daily-summary')` 端点，注意声明位置在 `@Get(':id')` 之前以避免路由冲突，接收 `QueryDailySummaryDto` 查询参数，调用 Service 方法并返回结果

## 4. 测试

- [x] 4.1 为 `getDailySummary` Service 方法编写单元测试，覆盖正常汇总、空数据、仅返回当前用户数据等场景
