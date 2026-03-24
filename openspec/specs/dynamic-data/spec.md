### Requirement: 录入动态数据
系统 SHALL 提供 `POST /dynamic-data` 接口，允许已认证用户录入动态健康数据。

请求参数：
- `category` (string, 必填): 数据类别，如 `height`、`weight`
- `value` (number, 必填): 数据值
- `recordedAt` (Date, 可选): 记录时间，默认为当前时间

系统 SHALL 将数据存入独立的 `DynamicData` Collection，采用追加模式（不修改已有记录）。

#### Scenario: 成功录入身高数据
- **WHEN** 已认证用户发送 `POST /dynamic-data`，包含 `{ category: "height", value: 175.5 }`
- **THEN** 系统创建一条记录，`recordedAt` 默认为当前时间，返回创建的记录

#### Scenario: 指定录入时间
- **WHEN** 已认证用户发送 `POST /dynamic-data`，包含 `{ category: "weight", value: 70.2, recordedAt: "2026-03-20T08:00:00Z" }`
- **THEN** 系统创建一条记录，`recordedAt` 为指定时间

#### Scenario: 缺少必填字段
- **WHEN** 请求缺少 `category` 或 `value`
- **THEN** 系统返回 400 Bad Request，提示缺少必填字段

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

### Requirement: 时间段趋势查询动态数据
系统 SHALL 提供 `GET /dynamic-data/trend` 接口，查询指定类别在指定时间段内每天最新数据的趋势。

查询参数：
- `category` (string, 必填): 数据类别
- `startDate` (Date, 必填): 起始日期
- `endDate` (Date, 必填): 结束日期

查询逻辑：在时间段内按天分组，每天取 `recordedAt` 最晚的一条记录，返回按日期升序排列的列表。

响应结构：
```json
[
  { "date": "2026-03-15", "value": 70.5, "recordedAt": "ISO DateTime" },
  { "date": "2026-03-16", "value": 70.2, "recordedAt": "ISO DateTime" }
]
```

#### Scenario: 查询一周体重趋势
- **WHEN** 已认证用户访问 `GET /dynamic-data/trend?category=weight&startDate=2026-03-17&endDate=2026-03-23`
- **THEN** 系统返回该时间段内每天最新的体重记录列表，按日期升序

#### Scenario: 时间段内部分日期无数据
- **WHEN** 时间段内某些天没有录入数据
- **THEN** 这些天不出现在返回列表中（仅返回有数据的天）

#### Scenario: 时间段无任何数据
- **WHEN** 整个时间段内该类别没有任何数据
- **THEN** 系统返回空数组 `[]`

#### Scenario: startDate 晚于 endDate
- **WHEN** 传入的 `startDate` 晚于 `endDate`
- **THEN** 系统返回 400 Bad Request

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
