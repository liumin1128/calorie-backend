## MODIFIED Requirements

### Requirement: 时间点查询动态数据
系统 SHALL 提供 `GET /dynamic-data/latest` 接口，查询指定类别在**截止到指定日期**时的最新一条数据。

查询参数：
- `category` (string, 必填): 数据类别
- `date` (Date, 可选): 截止日期，默认为当天

查询逻辑：取 `recordedAt <= 目标日期结束时间（23:59:59.999）` 范围内按 `recordedAt` 降序排列的第一条记录。

#### Scenario: 查询当前最新体重
- **WHEN** 已认证用户访问 `GET /dynamic-data/latest?category=weight`
- **THEN** 系统返回截止到当天结束时间的最新一条体重记录

#### Scenario: 查询截止到指定日期的数据
- **WHEN** 已认证用户访问 `GET /dynamic-data/latest?category=height&date=2026-03-15`
- **THEN** 系统返回 `recordedAt <= 2026-03-15T23:59:59.999` 的最新一条身高记录（可能是 3月15日当天或更早的记录）

#### Scenario: 指定日期及之前均无数据
- **WHEN** 查询的截止日期之前没有对应类别的任何数据
- **THEN** 系统返回 `null`

### Requirement: 批量查询多类别最新值支持时间截止
系统 SHALL 在 `findLatestByCategories` 方法中支持可选的 `beforeDate` 参数，限制查询范围为 `recordedAt <= beforeDate`。

#### Scenario: 不传 beforeDate 时查询全局最新
- **WHEN** 调用 `findLatestByCategories(userId, ['height', 'weight'])` 不传 `beforeDate`
- **THEN** 返回各类别的全局最新记录（行为不变）

#### Scenario: 传入 beforeDate 时查询历史最新
- **WHEN** 调用 `findLatestByCategories(userId, ['height', 'weight'], new Date('2026-03-15T23:59:59.999'))`
- **THEN** 返回各类别在 `recordedAt <= 2026-03-15T23:59:59.999` 范围内的最新记录

#### Scenario: beforeDate 之前无数据
- **WHEN** 调用 `findLatestByCategories(userId, ['height'], veryEarlyDate)`，该日期之前无任何身高记录
- **THEN** 对应类别不出现在返回的 Map 中
