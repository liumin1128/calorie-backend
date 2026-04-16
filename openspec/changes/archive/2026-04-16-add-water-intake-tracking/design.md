## Context

用户需要追踪每日饮水量。食物中的水分由前端基于 CalorieEntry 的 water 字段自行计算，后端只需管理用户手动饮水量。要求极简：每用户每天一条记录，覆盖式更新。

## Goals / Non-Goals

**Goals:**
- 提供查询 + 设置两个 API，管理每日饮水量
- 每用户每天一条记录，upsert 模式覆盖更新
- 遵循现有 NestJS 模块化架构，复用认证体系

**Non-Goals:**
- 不聚合食物水分（前端自行计算）
- 不做饮水目标管理（客户端本地处理即可）
- 不做饮水提醒/推送通知

## Decisions

### Decision 1: 每天一条记录 + upsert 模式

**选择**: `{ userId, date }` 唯一索引，PUT 时 upsert

**理由**:
- 用户自由加减调整饮水量，最终只需存储当天总量
- upsert 天然幂等，前端无需关心是创建还是更新
- 数据量极小（每用户每天最多 1 条），查询高效

### Decision 2: WaterIntake Schema 设计

```typescript
WaterIntake {
  userId:    ObjectId   // 关联用户，必填
  date:      string     // 日期 "YYYY-MM-DD"，必填
  amount:    number     // 饮水量(ml)，必填，≥0
  updatedAt: Date       // 自动
  createdAt: Date       // 自动
}
```

唯一索引：`{ userId: 1, date: 1 }` (unique)

**设计说明**:
- `date` 用字符串 "YYYY-MM-DD" 而非 Date 类型，避免时区转换问题，查询直观
- `amount` 允许 0（用户可能清零某天的记录）
- 无 note 等额外字段，极简设计

### Decision 3: API 路由设计

```
GET  /water?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD   查询日期范围内每日饮水量
PUT  /water                                             设置某天饮水量 { date, amount }
```

- GET 返回数组 `[{ date, amount }]`
- PUT 使用 `findOneAndUpdate` + `upsert: true`，按 `{ userId, date }` 定位，覆盖 amount

## Risks / Trade-offs

- **[极简设计]** 不保留历史修改记录 → 用户场景无此需求，覆盖即可
- **[无删除 API]** 用户设置 amount=0 等效于删除 → 减少 API 数量，简化前端逻辑
