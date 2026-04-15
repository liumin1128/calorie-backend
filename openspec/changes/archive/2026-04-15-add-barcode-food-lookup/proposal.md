## Why

目前用户手动输入食物名称和营养数据，操作繁琐且容易出错。Open Food Facts 是全球最大的开源食品数据库（300万+产品），支持通过条形码免费查询详细营养信息。接入该数据源后，用户只需扫码即可自动填充食物名称、封面图、营养成分和微量元素，大幅提升录入效率和数据准确性。

## What Changes

- 新增 Open Food Facts API 对接工具方法，封装 HTTP 请求和数据提取逻辑
- 新增条形码食品查询 REST API 端点（`GET /food/barcode/:code`），接受条码号，返回结构化的食品营养信息
- 新增独立的 `food` 模块，遵循现有 NestJS 模块化架构
- 返回数据包含：食品名称、封面图 URL、热量、蛋白质、碳水、脂肪、膳食纤维、微量元素等

## Capabilities

### New Capabilities
- `barcode-food-lookup`: 通过条形码查询 Open Food Facts 开源数据库，获取食品基本信息和营养成分，返回结构化数据给前端

### Modified Capabilities

（无需修改现有 spec）

## Impact

- **新增模块**: `src/food/` — 包含 controller、service、module、DTO
- **新增依赖**: 使用 NestJS 内置 `HttpModule`（`@nestjs/axios`）发起外部 HTTP 请求
- **API 变更**: 新增 `GET /food/barcode/:code`，需 JWT 认证
- **外部依赖**: Open Food Facts API（`https://world.openfoodfacts.org/api/v2/product/`），免费无限次调用，需设置合规 User-Agent
- **现有代码无改动**: 完全独立的新模块，不影响现有功能
