## Why

当前系统仅存储用户的邮箱、密码和昵称，缺少个人信息管理能力。前端需要让用户完善个人资料（性别、生日、签名等），同时身高、体重等动态健康数据需要支持时间维度的趋势追踪，这是卡路里管理应用的核心基础数据。登录时也应返回用户的完整画像（基础信息 + 最新身高体重），提升前端体验。

## What Changes

- 扩展 User Schema，新增 `gender`、`birthday`、`signature` 等基础个人信息字段
- 新增 `PUT /user/profile` 接口，用于更新用户基础个人信息（性别、昵称、生日、签名）
- 新增**动态数据模块**（`dynamic-data`），独立 Collection 存储身高、体重等随时间变化的数据，使用 `category` 字段区分不同类型
- 动态数据支持两种查询模式：
  - 时间点查询：传入日期（默认当天），返回当天最新一条记录
  - 时间段查询：传入起止日期，返回每天最新数据的趋势列表
- 修改登录接口（`POST /auth/login`）的响应，在返回基础信息的同时附带最新身高、体重
- 新增 `GET /user/full-profile` 接口，返回完整用户信息（基础资料 + 最新身高体重）

## Capabilities

### New Capabilities
- `user-profile`: 用户基础个人信息的更新与查询（性别、昵称、生日、签名）
- `dynamic-data`: 动态健康数据（身高、体重等）的录入、时间点查询和时间段趋势查询

### Modified Capabilities
- `auth`: 登录接口响应结构变更——新增最新身高、体重字段返回

## Impact

- **数据模型**: User Schema 新增字段；新建 DynamicData Collection
- **API 变更**: 新增 3 个端点（`PUT /user/profile`、`GET /user/full-profile`、动态数据 CRUD）；修改 `POST /auth/login` 响应结构
- **模块依赖**: 新建 `user` 模块和 `dynamic-data` 模块，`auth` 模块需注入 `user` 和 `dynamic-data` 的 Service 以组装登录响应
- **数据库**: MongoDB 新增 `dynamicdata` Collection
