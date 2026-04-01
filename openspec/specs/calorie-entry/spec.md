### Requirement: 创建卡路里条目
系统 SHALL 允许已认证用户创建卡路里条目，条目 MUST 自动关联当前用户。条目 MAY 包含可选的 `source` 和 `externalId` 字段。当传入 `externalId` 且 `userId + externalId` 匹配到已有记录时，系统 SHALL 更新该记录并返回 200；否则创建新记录并返回 201。

#### Scenario: 成功创建摄入条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-03-23T12:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，条目的 userId 为当前用户，`source` 默认为 `manual`

#### Scenario: 成功创建消耗条目
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "burn", calories: 300, title: "跑步", entryDate: "2026-03-23T18:00:00Z" }`
- **THEN** 系统创建条目并返回 201 状态码及完整条目数据，`source` 默认为 `manual`

#### Scenario: 带 externalId 的重复条目自动更新
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId` 且该用户已有相同 `externalId` 的记录
- **THEN** 系统更新已有记录并返回 200 状态码及更新后的完整条目数据

#### Scenario: 缺少必填字段
- **WHEN** 已认证用户发送 POST /calorie，body 缺少 type、calories 或 title
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 POST /calorie
- **THEN** 系统返回 401 状态码

### Requirement: 查询卡路里条目列表
系统 SHALL 允许已认证用户分页查询自己的卡路里条目，结果 MUST 仅包含当前用户的数据。支持按 `source` 筛选。

#### Scenario: 默认分页查询
- **WHEN** 已认证用户发送 GET /calorie
- **THEN** 系统返回当前用户的条目列表（默认第 1 页，每页 20 条）、总数，按 entryDate 降序排列

#### Scenario: 指定页码和每页数量
- **WHEN** 已认证用户发送 GET /calorie?page=2&pageSize=10
- **THEN** 系统返回第 2 页的 10 条数据及总数

#### Scenario: 按时间范围筛选
- **WHEN** 已认证用户发送 GET /calorie?startDate=2026-03-01&endDate=2026-03-31
- **THEN** 系统仅返回 entryDate 在指定范围内的条目

#### Scenario: 按类型筛选
- **WHEN** 已认证用户发送 GET /calorie?type=intake
- **THEN** 系统仅返回摄入类型的条目

#### Scenario: 按来源筛选
- **WHEN** 已认证用户发送 GET /calorie?source=manual
- **THEN** 系统返回 `source` 为 `manual` 或未设置 `source` 的条目

#### Scenario: 无数据
- **WHEN** 已认证用户没有任何卡路里条目
- **THEN** 系统返回空数组和 total 为 0

### Requirement: 查询单条卡路里条目
系统 SHALL 允许已认证用户查询自己的某一条卡路里条目详情。

#### Scenario: 成功查询
- **WHEN** 已认证用户发送 GET /calorie/:id，该条目属于当前用户
- **THEN** 系统返回该条目的完整数据

#### Scenario: 条目不存在
- **WHEN** 已认证用户发送 GET /calorie/:id，该 id 不存在
- **THEN** 系统返回 404 状态码

#### Scenario: 查询他人条目
- **WHEN** 已认证用户发送 GET /calorie/:id，该条目属于其他用户
- **THEN** 系统返回 404 状态码（不泄露他人数据存在性）

### Requirement: 更新卡路里条目
系统 SHALL 允许已认证用户更新自己的卡路里条目，支持部分更新。

#### Scenario: 成功更新
- **WHEN** 已认证用户发送 PATCH /calorie/:id，body 包含 `{ calories: 600 }`
- **THEN** 系统更新该字段并返回更新后的完整条目数据

#### Scenario: 更新不存在的条目
- **WHEN** 已认证用户发送 PATCH /calorie/:id，该 id 不存在
- **THEN** 系统返回 404 状态码

#### Scenario: 更新他人条目
- **WHEN** 已认证用户发送 PATCH /calorie/:id，该条目属于其他用户
- **THEN** 系统返回 404 状态码

### Requirement: 删除卡路里条目
系统 SHALL 允许已认证用户删除自己的卡路里条目。

#### Scenario: 成功删除
- **WHEN** 已认证用户发送 DELETE /calorie/:id，该条目属于当前用户
- **THEN** 系统删除该条目并返回 200 状态码

#### Scenario: 删除不存在的条目
- **WHEN** 已认证用户发送 DELETE /calorie/:id，该 id 不存在
- **THEN** 系统返回 404 状态码

#### Scenario: 删除他人条目
- **WHEN** 已认证用户发送 DELETE /calorie/:id，该条目属于其他用户
- **THEN** 系统返回 404 状态码

### Requirement: 数据校验
系统 MUST 对卡路里条目的输入数据进行严格校验。

#### Scenario: calories 为正数
- **WHEN** 用户提交 calories 为 0 或负数
- **THEN** 系统返回 400 状态码及校验错误

#### Scenario: type 枚举校验
- **WHEN** 用户提交 type 为非 "intake" / "burn" 的值
- **THEN** 系统返回 400 状态码及校验错误

#### Scenario: images 数组校验
- **WHEN** 用户提交 images 包含非 URL 字符串
- **THEN** 系统返回 400 状态码及校验错误

#### Scenario: entryDate 日期格式校验
- **WHEN** 用户提交 entryDate 为无效日期
- **THEN** 系统返回 400 状态码及校验错误

### Requirement: 卡路里条目去重
系统 SHALL 基于 `userId + externalId` 进行去重。当创建条目时传入 `externalId` 且匹配到已有记录，系统 MUST 更新该记录而非新增。未传入 `externalId` 的记录不参与去重。

#### Scenario: 有 externalId 且首次创建
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId: "hk-uuid-002"`，且不存在该用户下相同 `externalId` 的记录
- **THEN** 系统创建新条目并返回 201 状态码

#### Scenario: 有 externalId 且重复
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId: "hk-uuid-002"`，且已存在该用户下相同 `externalId` 的记录
- **THEN** 系统更新已有记录并返回 200 状态码

#### Scenario: 无 externalId 不去重
- **WHEN** 已认证用户发送 POST /calorie，body 不包含 `externalId`
- **THEN** 系统始终创建新条目并返回 201 状态码

### Requirement: 唯一复合索引
系统 MUST 在数据库层面对 `userId + externalId` 建立稀疏唯一复合索引，仅对包含 `externalId` 的记录生效。

#### Scenario: 并发创建相同 externalId 条目
- **WHEN** 两个并发请求尝试为同一用户创建相同 `externalId` 的记录
- **THEN** 仅一条记录被创建，另一请求执行更新

### Requirement: 卡路里条目支持外部唯一标识
系统 SHALL 支持可选的 `externalId` 字符串字段，用于标识来自外部系统的记录唯一性。

#### Scenario: 创建条目时传入 externalId
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-04-01T12:00:00Z", externalId: "hk-uuid-001" }`
- **THEN** 系统创建条目，`externalId` 字段为 `hk-uuid-001`

#### Scenario: 创建条目时不传 externalId
- **WHEN** 已认证用户发送 POST /calorie，body 不包含 `externalId` 字段
- **THEN** 系统正常创建条目，`externalId` 字段为空

#### Scenario: 基于 externalId 去重
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `externalId: "hk-uuid-001"`，且该用户已存在相同 `externalId` 的记录
- **THEN** 系统更新已有记录并返回 200 状态码

#### Scenario: 不同用户相同 externalId 不冲突
- **WHEN** 用户 A 和用户 B 分别创建 `externalId: "hk-uuid-001"` 的记录
- **THEN** 系统为两个用户各创建一条记录

### Requirement: 卡路里条目支持数据来源标识
系统 SHALL 为每条卡路里记录提供 `source` 字段，标识数据来源。`source` MUST 为枚举值：`manual`（手动录入）或 `healthkit`（iOS 健康 App 导入）。未指定时默认为 `manual`。

#### Scenario: 手动创建条目不指定 source
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "intake", calories: 500, title: "午餐", entryDate: "2026-04-01T12:00:00Z" }` 且未包含 `source` 字段
- **THEN** 系统创建条目，`source` 字段默认为 `manual`

#### Scenario: 显式指定 source 为 healthkit
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ type: "burn", calories: 300, title: "跑步", entryDate: "2026-04-01T18:00:00Z", source: "healthkit" }`
- **THEN** 系统创建条目，`source` 字段为 `healthkit`

#### Scenario: source 值非法
- **WHEN** 已认证用户发送 POST /calorie，body 包含 `{ source: "unknown" }`
- **THEN** 系统返回 400 状态码及校验错误信息

### Requirement: 按来源筛选卡路里条目
系统 SHALL 允许已认证用户按 `source` 筛选卡路里条目列表。

#### Scenario: 按 manual 筛选
- **WHEN** 已认证用户发送 GET /calorie?source=manual
- **THEN** 系统返回 `source` 为 `manual` 的条目，同时包含历史数据中无 `source` 字段的条目

#### Scenario: 按 healthkit 筛选
- **WHEN** 已认证用户发送 GET /calorie?source=healthkit
- **THEN** 系统仅返回 `source` 为 `healthkit` 的条目

#### Scenario: 不指定 source 查询
- **WHEN** 已认证用户发送 GET /calorie 不带 source 参数
- **THEN** 系统返回所有来源的条目（行为不变）

### Requirement: 查询每日卡路里摄入和消耗汇总
系统 SHALL 允许已认证用户查询指定时间范围内每天的卡路里摄入总量和消耗总量。

#### Scenario: 成功查询每日汇总
- **WHEN** 已认证用户发送 GET /calorie/daily-summary?startDate=2026-03-01&endDate=2026-03-07
- **THEN** 系统返回 200 状态码及以日期为 key 的对象，每个 value 包含 `totalIntake`（当日摄入总卡路里）和 `totalBurn`（当日消耗总卡路里），仅包含有数据的日期

#### Scenario: 返回数据格式
- **WHEN** 用户在 2026-03-01 有两条摄入（500, 300）和一条消耗（200），2026-03-02 有一条摄入（400）
- **THEN** 系统返回 `{ "2026-03-01": { "totalIntake": 800, "totalBurn": 200 }, "2026-03-02": { "totalIntake": 400, "totalBurn": 0 } }`

#### Scenario: 范围内无数据
- **WHEN** 已认证用户查询的时间范围内没有任何卡路里条目
- **THEN** 系统返回 200 状态码及空对象 `{}`

#### Scenario: 仅返回当前用户数据
- **WHEN** 已认证用户查询的时间范围内存在其他用户的卡路里条目
- **THEN** 系统 MUST 仅返回当前用户的数据，不包含其他用户的条目

### Requirement: 每日汇总查询参数校验
系统 MUST 对每日汇总查询的输入参数进行严格校验。

#### Scenario: startDate 和 endDate 均为必填
- **WHEN** 已认证用户发送 GET /calorie/daily-summary 缺少 startDate 或 endDate
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 日期格式校验
- **WHEN** 已认证用户发送的 startDate 或 endDate 不是有效的日期格式（YYYY-MM-DD）
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: startDate 不应晚于 endDate
- **WHEN** 已认证用户发送的 startDate 晚于 endDate
- **THEN** 系统返回 400 状态码及校验错误信息

#### Scenario: 未认证请求
- **WHEN** 未携带有效 JWT token 发送 GET /calorie/daily-summary
- **THEN** 系统返回 401 状态码
