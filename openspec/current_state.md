# Calorie Backend — 项目全局规格文档

> **角色**: OpenSpec 单一真理来源（Single Source of Truth）
> **最后更新**: 2026-03-23

---

## 1. 技术栈概览

| 类别 | 技术 | 版本偏好 |
|------|------|----------|
| 运行时 | Node.js | ES2023 target |
| 语言 | TypeScript | ^5.7 |
| 框架 | NestJS | ^11.x |
| 数据库 | MongoDB（通过 Mongoose ODM） | Mongoose ^9.3 |
| 认证 | Passport + JWT | passport ^0.7, @nestjs/jwt ^11 |
| 密码加密 | bcrypt | ^6.0 |
| 请求验证 | class-validator + class-transformer | ^0.15 / ^0.5 |
| 配置管理 | @nestjs/config (dotenv) | ^4.0 |
| 包管理 | pnpm (workspace) | — |
| 测试 | Jest + Supertest | Jest ^30, Supertest ^7 |
| 代码规范 | ESLint (flat config) + Prettier | ESLint ^9, Prettier ^3.4 |

---

## 2. 目录结构说明

```
backend/
├── src/                        # 源代码根目录
│   ├── main.ts                 # 应用入口：创建 NestFactory，启用全局管道和 CORS
│   ├── app.module.ts           # 根模块：注册全局配置、MongoDB 连接、业务模块
│   ├── app.controller.ts       # 根控制器：健康检查 / Hello World
│   ├── app.service.ts          # 根服务
│   ├── app.controller.spec.ts  # 根控制器单元测试
│   └── auth/                   # 认证模块（按功能模块组织）
│       ├── auth.module.ts      # 模块定义：注册 Passport、JWT、User Schema
│       ├── auth.controller.ts  # 路由：POST /auth/register, POST /auth/login, GET /auth/profile
│       ├── auth.service.ts     # 业务逻辑：注册、登录、获取用户资料
│       ├── jwt.strategy.ts     # Passport JWT 策略
│       ├── constants.ts        # (已废弃，配置迁移至 .env)
│       ├── dto/                # 数据传输对象
│       │   ├── register.dto.ts # 注册请求 DTO
│       │   └── login.dto.ts    # 登录请求 DTO
│       ├── guards/             # 路由守卫
│       │   └── jwt-auth.guard.ts
│       └── schemas/            # Mongoose Schema 定义
│           └── user.schema.ts  # User 文档模型
├── test/                       # E2E 测试
├── openspec/                   # OpenSpec 工作流文件
├── nest-cli.json               # NestJS CLI 配置
├── tsconfig.json               # TypeScript 编译配置
├── tsconfig.build.json         # 生产构建 TS 配置（排除 test / spec）
├── eslint.config.mjs           # ESLint flat config
├── package.json                # 依赖与脚本
└── pnpm-workspace.yaml         # pnpm workspace 配置
```

### 模块组织原则

项目采用 **NestJS 标准模块化架构**，每个功能域（Feature Domain）独立为一个文件夹，内含：
- `*.module.ts` — 模块注册
- `*.controller.ts` — 路由 & 入参处理
- `*.service.ts` — 业务逻辑
- `dto/` — 请求/响应数据结构
- `schemas/` — Mongoose 数据模型
- `guards/` — 路由守卫

---

## 3. 架构模式

### 3.1 整体架构

```
Client → NestJS Controller → Service → Mongoose Model → MongoDB
                ↑
        ValidationPipe (全局)
        JwtAuthGuard (按路由)
```

### 3.2 数据流向

1. **请求进入** → 全局 `ValidationPipe`（`whitelist: true`）自动校验并剥离多余字段
2. **路由层** → Controller 通过装饰器绑定 HTTP 方法和路径，使用 DTO 约束入参
3. **业务层** → Service 通过 `@InjectModel` 注入 Mongoose Model，处理业务逻辑
4. **数据层** → Mongoose Schema 定义文档结构，通过 `MongooseModule.forFeature()` 注册

### 3.3 配置管理

- 使用 `@nestjs/config` 的 `ConfigModule.forRoot({ isGlobal: true })` 全局注入环境变量
- 敏感配置（`MONGODB_URI`, `JWT_SECRET`）通过 `.env` 文件管理
- 各模块通过 `ConfigService` 注入读取配置，使用 `registerAsync` / `forRootAsync` 模式

### 3.4 认证模式

- **策略**: Bearer Token（JWT）
- **流程**: 注册/登录 → 返回 `access_token` → 后续请求 Header 携带 `Authorization: Bearer <token>`
- **JWT 有效期**: 7 天
- **密码处理**: bcrypt hash（salt rounds = 10）
- **守卫方式**: `@UseGuards(JwtAuthGuard)` 按路由保护

### 3.5 数据库连接

- 通过 `MongooseModule.forRootAsync` 异步初始化，依赖 `ConfigService` 读取连接字符串
- Mongoose 作为 ODM 层，Schema 使用装饰器风格定义（`@Schema`, `@Prop`）

---

## 4. 编码规范

### 4.1 TypeScript 配置

- **Target**: ES2023
- **Module**: NodeNext（ESM 兼容）
- **严格模式**: 启用 `strictNullChecks`，但 `noImplicitAny: false`
- **装饰器**: 启用 `experimentalDecorators` + `emitDecoratorMetadata`

### 4.2 ESLint 规则

- 基于 `typescript-eslint/recommendedTypeChecked`
- `@typescript-eslint/no-explicit-any`: **off**（允许 any）
- `@typescript-eslint/no-floating-promises`: **warn**
- `@typescript-eslint/no-unsafe-argument`: **warn**
- Prettier 集成（`endOfLine: auto`）

### 4.3 代码风格约定

| 约定 | 说明 |
|------|------|
| 类风格 | 使用 NestJS 装饰器模式（`@Injectable`, `@Controller` 等） |
| DTO 校验 | 使用 `class-validator` 装饰器，全局 `whitelist: true` 防止注入 |
| 错误处理 | 使用 NestJS 内置异常类（`ConflictException`, `UnauthorizedException`） |
| 密码安全 | 返回结果中始终排除密码字段（`.select('-password')`） |
| 命名风格 | 文件名 kebab-case，类名 PascalCase，方法名 camelCase |
| 异步风格 | 统一使用 async/await |
| 中文提示 | 业务错误信息使用中文（如 "该邮箱已注册"、"邮箱或密码错误"） |

### 4.4 API 注释规范

每个 API 端点（Controller 方法）**必须**包含详细的参数接口注释，使用 JSDoc 风格：

```typescript
/**
 * 用户注册
 * @description 通过邮箱和密码创建新用户，返回 JWT 令牌
 * @param dto - 注册请求体
 * @param dto.email - 用户邮箱（唯一）
 * @param dto.password - 密码（最少 6 位）
 * @param dto.nickname - 昵称（可选，默认取邮箱前缀）
 * @returns { access_token: string, user: { id, email, nickname } }
 * @throws ConflictException 该邮箱已注册
 */
@Post('register')
register(@Body() dto: RegisterDto) { ... }
```

**要求**:
- 说明接口用途（`@description`）
- 列出所有入参及含义（`@param`）
- 标明返回结构（`@returns`）
- 标明可能抛出的异常（`@throws`）

### 4.5 代码拆分与解耦规范

| 原则 | 说明 |
|------|------|
| 单一职责 | Service 中每个方法只做一件事，复杂业务拆分为多个私有方法 |
| 逻辑分层 | Controller 只负责路由和入参转发，**禁止**在 Controller 中编写业务逻辑 |
| 工具方法隔离 | 通用工具放 `src/common/utils/`，模块级工具放 `src/<module>/utils/` |
| 复用优先 | 相同逻辑出现两次及以上时必须提取为共享方法或服务 |
| 依赖注入 | 模块间通信通过 NestJS DI 注入 Service，**禁止**跨模块直接 import 内部实现 |

### 4.6 工具方法目录结构

```
src/
├── common/                     # 全局共享层
│   ├── utils/                  # 全局工具方法（如日期格式化、字符串处理）
│   ├── decorators/             # 自定义装饰器
│   ├── filters/                # 全局异常过滤器
│   ├── interceptors/           # 全局拦截器
│   └── pipes/                  # 全局管道
├── <module>/                   # 业务模块
│   ├── utils/                  # 模块级工具方法（仅本模块使用）
│   └── ...                     # controller, service, dto, schemas 等
```

**分级原则**:
- **全局工具** (`common/utils/`): 被 2 个及以上模块引用的工具方法
- **模块工具** (`<module>/utils/`): 仅被当前模块使用的辅助方法
- 工具方法应为**纯函数**，无副作用，便于单元测试

### 4.7 业务代码结构规范

- **业务流程清晰**: Service 方法按「校验 → 处理 → 持久化 → 响应构建」的顺序组织
- **早返回模式**: 异常情况优先处理并抛出，减少嵌套层级
- **圈复杂度控制**: 单个方法圈复杂度不超过 10，超过时拆分子方法
- **命名语义化**: 方法名应明确表达行为（如 `validateEmailUnique` 而非 `check`）

### 4.8 测试规范

- 单元测试: `*.spec.ts`（与源文件同目录）
- E2E 测试: `test/` 目录，使用 `jest-e2e.json` 独立配置
- 测试框架: Jest + `@nestjs/testing`

---

## 5. 核心逻辑点

### 5.1 身份验证（Auth）

| API | 方法 | 守卫 | 说明 |
|-----|------|------|------|
| `/auth/register` | POST | 无 | 邮箱唯一校验 → bcrypt 加密 → 创建用户 → 返回 JWT |
| `/auth/login` | POST | 无 | 邮箱查找 → bcrypt 比对 → 返回 JWT |
| `/auth/profile` | GET | JwtAuthGuard | 从 JWT payload 提取 userId → 查询用户（排除密码） |

**JWT Payload 结构**: `{ sub: userId, email: userEmail }`

### 5.2 User Schema

```typescript
{
  email:    string  // required, unique, trim
  password: string  // required (bcrypt hash)
  nickname: string  // trim, 默认取 email @ 前缀
  // timestamps: true → 自动生成 createdAt, updatedAt
}
```

### 5.3 全局中间件 / 管道

| 组件 | 类型 | 作用域 | 说明 |
|------|------|--------|------|
| `ValidationPipe` | 管道 | 全局 | `whitelist: true`，自动校验 DTO 并剥离未声明字段 |
| CORS | 中间件 | 全局 | `app.enableCors()` 开启跨域 |

### 5.4 环境变量

| 变量名 | 用途 |
|--------|------|
| `PORT` | 服务端口（默认 3001） |
| `MONGODB_URI` | MongoDB 连接字符串 |
| `JWT_SECRET` | JWT 签名密钥 |

---

## 6. 常用命令

```bash
pnpm start:dev      # 开发模式（热重载）
pnpm build          # 生产构建
pnpm start:prod     # 生产运行
pnpm lint           # ESLint 检查 + 修复
pnpm test           # 单元测试
pnpm test:e2e       # E2E 测试
pnpm format         # Prettier 格式化
```

---

## 7. 待扩展方向（已知空白）

- [ ] 缺少 Swagger/OpenAPI 文档集成
- [ ] 缺少日志系统（推荐 NestJS Logger 或 Pino）
- [ ] 缺少统一响应格式封装（Interceptor）
- [ ] 缺少统一异常过滤器（ExceptionFilter）
- [ ] 缺少角色/权限控制（RBAC）
- [ ] 缺少速率限制（Rate Limiting）
- [ ] 缺少健康检查端点（@nestjs/terminus）
- [ ] 业务模块尚未创建（如：食物管理、卡路里记录等核心域）
