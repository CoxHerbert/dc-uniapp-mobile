# BIP Mobile H5

一个基于 **Vue 3 · Vite · Vant 4** 的移动端管理后台，聚焦招聘、考勤等业务场景，内置账号中心、应用广场、招聘流程等页面模块，开箱即可二次开发。

## 特性概览

- ⚙️ **现代技术栈**：Vue 3 组合式 API、Vite 5、Pinia、Vue Router 4、Vue I18n、Vant 4、Day.js。
- 🌐 **国际化支持**：内置中/英双语，提供全局 `LanguageSelector` 组件，统一的 `changeLocale` 辅助方法以及语言持久化逻辑。
- 🧭 **全局组件**：`LanguageSelector`、`Dict`、`RecruitForm`、`Uploader` 等常用能力一次注册全局复用。
- 🔐 **认证体系**：`store/user` 负责令牌、用户信息管理以及密码修改，配合权限指令与路由守卫实现细粒度控制。
- 📡 **网络层增强**：基于 Axios 的请求封装，支持刷新 Token、取消重复请求、失败重试、上传等高级能力。
- 🧰 **开发体验**：ESLint + Prettier + Vitest，内置常用工具函数、常量、组合式函数，提高业务迭代效率。

## 快速开始

```bash
npm install
npm run dev
```

访问 `http://localhost:5173` 即可预览。

## 常用脚本

| 指令              | 说明                     |
| ----------------- | ------------------------ |
| `npm run dev`     | 本地开发，支持热更新     |
| `npm run build`   | 构建生产包               |
| `npm run preview` | 预览构建产物             |
| `npm run lint`    | 使用 ESLint 检查代码质量 |
| `npm run test`    | 运行 Vitest 单元测试     |

## 目录结构

```
src
├── api/                # Axios 实例与接口封装
├── components/         # 全局组件，已通过 registerComponents 挂载
├── composables/        # 组合式函数（含 useScrollHide 等）
├── constants/          # 业务常量（如 keys、user-types）
├── layouts/            # 布局相关组件
├── locales/            # 语言包与 changeLocale 工具
├── router/             # 路由与导航守卫
├── store/              # Pinia 状态管理（user、permission 等）
├── styles/             # 全局样式与主题变量
├── utils/              # 工具函数与辅助类
└── views/              # 业务页面（Home、Apps、Recruit、Account 等）
```

## 核心模块详解

- **入口与应用生命周期**：`src/main.js` 负责实例化应用，挂载路由、Pinia、国际化、权限守卫以及 `src/plugins` 中的业务插件；`src/App.vue` 管理全局布局骨架。
- **权限与导航**：`src/permission.js` 借助 Vue Router 守卫、`nprogress` 以及国际化文案更新页面标题，并在守卫内部完成登录态检测与 URL token 白名单处理。
- **网络层**：`src/utils/http.js` 对 Axios 进行了深度封装，覆盖 BaseURL 拼接、Basic/Token 头注入、数据加密、重复请求取消、401 刷新与自动重试、错误提示等能力；`src/axios/index.js` 输出统一实例供 `src/api` 调用。
- **状态管理**：`src/store` 内含 `auth`、`user`、`permission` 等模块，负责令牌刷新、用户信息缓存和权限粒度控制。
- **全局插件体系**：`src/plugins/index.js` 将字典、GraphQL 客户端以及工具方法注入全局属性，`dict-plugin`/`dict-client` 组合完成业务字典拉取与缓存。
- **自定义指令**：`src/directives` 提供如防重复点击 (`anti-click`) 与权限指令 (`perm`)；`src/directives/index.js` 会在应用初始化阶段注册这些指令。
- **配置项**：`src/config/website.js` 存放 OAuth、菜单、租户等全局配置，`src/config/env.js` 读取 `VITE_APP_API` 并作为网络层默认域名前缀。
- **样式与主题**：`src/styles` 包含基础变量、Vant 自定义主题以及混入文件，配合 `src/styles/index.scss` 统一注入。
- **国际化**：`src/locales` 收录中英双语文案与 `translate` 辅助方法，`LanguageSelector` 组件通过全局注册可在任意页面触发语言切换。
- **页面视图**：`src/views` 细分首页、应用广场、招聘流程、账号中心等业务场景，同时复用 `components` 与 `composables` 中的通用能力。

## 配置与运行时

- `.env.*` 文件控制 `VITE_APP_API`、`VITE_APP_BASE_URL` 等环境变量；`vite.config.js` 将别名 `@` 指向 `src` 目录，便于模块引用。
- `src/permission.js` 与 `src/utils/http.js` 通过当前路由信息处理登录态恢复逻辑，避免刷新后丢失上下文。
- `src/plugins/wiki-graphql.js` 暴露 Apollo Client，可在组件中通过 `app.config.globalProperties.apolloClient` 直接访问。
- `public/` 目录承载静态资源、SVG 与图标，构建时会被原样复制到产物根目录。

## 国际化语言选择

- `src/components/LanguageSelector.vue` 提供固定文案的底部弹出选择器。
- `changeLocale` 会同步更新 `vue-i18n` 的语言与本地持久化。
- `LanguageSelector` 已在 `registerComponents` 中全局注册，可直接在任意页面模板中使用。

## 常量管理

- `src/constants/keys.js`：统一维护本地/会话存储键值（令牌、用户信息、语言偏好、SOP Token 等），避免魔法字符串分散各处。
- `src/constants/user-types.js`：统一维护业务端用户类型枚举，按需扩展。

## 测试与质量

- 使用 ESLint@9 + `eslint-plugin-vue` 约束代码风格。
- 使用 Vitest + Vue Test Utils 进行单元测试。
- 推荐在提交代码前执行 `npm run lint` 与 `npm run test`。
- `tests/http.spec.js` 演示了利用 `axios-mock-adapter` 对网络层进行单元验证，可作为扩展其它接口测试的模板。

## 贡献指南

1. Fork & Clone 项目。
2. 新建分支进行开发，确保通过必要的检查。
3. 提交 Pull Request，并描述改动内容与测试情况。

欢迎反馈问题或提交改进建议，共同完善移动端业务脚手架。

## 指令文件

仓库根目录新增 `AGENTS.md`，记录 Codex 执行前必须遵循的操作须知。后续任务在动手前请先阅读该文件，以确保改动与项目规范保持一致。
