## ADDED Requirements

### Requirement: 条形码食品查询 API
系统 SHALL 提供 `GET /food/barcode/:code` 端点，接受条形码字符串，从 Open Food Facts 查询食品信息，返回结构化的营养数据。

#### Scenario: 成功查询已有产品
- **WHEN** 用户传入有效条形码（如 `3017620422003`）
- **THEN** 系统返回 HTTP 200，响应体包含 `name`、`imageUrl`、`brand`、`quantity`、`calories`、`protein`、`carbs`、`fat`、`fiber`、`minerals` 字段

#### Scenario: 产品不存在
- **WHEN** 用户传入 Open Food Facts 中不存在的条形码
- **THEN** 系统返回 HTTP 404，错误信息为「未找到该条码对应的食品信息」

#### Scenario: 外部 API 超时或不可用
- **WHEN** Open Food Facts API 请求超时或返回错误
- **THEN** 系统返回 HTTP 502，错误信息为「食品数据库查询失败，请稍后重试」

### Requirement: 条形码格式校验
系统 SHALL 对传入的条形码进行基础格式校验，仅接受数字字符串。

#### Scenario: 有效条形码格式
- **WHEN** 用户传入纯数字条形码（4-14位）
- **THEN** 系统正常发起 Open Food Facts 查询

#### Scenario: 无效条形码格式
- **WHEN** 用户传入包含非数字字符的条形码或长度不在 4-14 位范围内
- **THEN** 系统返回 HTTP 400，错误信息为「条形码格式无效，请输入 4-14 位数字」

### Requirement: JWT 认证保护
条形码查询 API SHALL 需要有效的 JWT Token 才能访问。

#### Scenario: 未认证请求
- **WHEN** 请求未携带 JWT Token 或 Token 无效
- **THEN** 系统返回 HTTP 401

#### Scenario: 已认证请求
- **WHEN** 请求携带有效 JWT Token
- **THEN** 系统正常处理条形码查询

### Requirement: 营养数据结构化输出
系统 SHALL 从 Open Food Facts 响应中提取营养成分，统一以每 100g 为单位输出。

#### Scenario: 完整营养数据
- **WHEN** Open Food Facts 返回的产品包含完整营养信息
- **THEN** 响应中 `calories`、`protein`、`carbs`、`fat`、`fiber` 均为数值（每 100g），`minerals` 数组包含可用的微量元素（如钠、钙、铁）

#### Scenario: 部分营养数据缺失
- **WHEN** Open Food Facts 返回的产品缺少部分营养字段
- **THEN** 缺失的字段值为 `null`，不影响其他已有字段的正常返回

### Requirement: User-Agent 合规
系统 SHALL 在调用 Open Food Facts API 时设置合规的 User-Agent 头，格式为 `CalorieApp/1.0 (contact@example.com)`。

#### Scenario: 请求携带正确 User-Agent
- **WHEN** 系统向 Open Food Facts 发起 HTTP 请求
- **THEN** 请求头中 `User-Agent` 字段包含应用名称和联系方式
