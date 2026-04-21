## 1. 共享 AI 依赖整理

- [x] 1.1 抽出独立的共享 AI 模块，承载 `VercelAiClient` provider，并更新 `VercelGatewayModule` / `CalorieModule` 的导入关系以避免循环依赖
- [x] 1.2 保持现有 `VercelAiClient` 能力兼容，并新增单条点评场景所需的固定模型调用常量或封装
- [x] 1.3 回归验证现有 `/gateway/ping` 与 `/gateway/ai/suggest` 路径在模块调整后仍可正常工作

## 2. 卡路里记录点评接口实现

- [x] 2.1 在 `src/calorie/dto/` 下新增单条点评响应 DTO，定义返回字段并保持接口注释完整
- [x] 2.2 在 `CalorieService` 中新增单条记录点评方法，完成记录归属校验、饮食/运动 prompt 组装、AI 调用与输出规范化
- [x] 2.3 在 `CalorieController` 中新增 `POST /calorie/:id/comment` 端点，仅做鉴权、参数转发和响应返回，并补充完整 JSDoc

## 3. 错误处理与文本约束

- [x] 3.1 为点评流程补充 404/502 错误处理，确保记录不存在、AI 返回空文本或网关失败时返回明确错误
- [x] 3.2 实现点评文本轻量规范化，处理空白、换行、寒暄和超过 40 字的情况，统一返回直接点评文本

## 4. 测试与验证

- [x] 4.1 为 `CalorieService` 单条点评方法编写单元测试，覆盖 intake、burn、404、AI 失败和文本规范化场景
- [x] 4.2 为模块重组后的 AI 共享能力补充回归测试，确保现有 AI 建议能力未被破坏
- [x] 4.3 运行与点评接口相关的测试命令，确认 change 对应需求达到可实现状态