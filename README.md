# ModelHub - AI 模型服务平台

一站式 AI 模型服务聚合平台，提供文本、图像、视频、音频等多模态 AI 模型的统一接入与管理。

## 功能特性

### 用户端
- **模型广场** — 按分类浏览所有可用 AI 模型，支持搜索筛选
- **在线体验** — 内置模型 Playground，输入参数即可调用模型 API
- **API 文档** — 每个模型配有完整的接口文档、参数说明和调用示例
- **资产中心** — 查看历史调用记录和生成结果
- **数据仪表盘** — 调用统计、成功率、热门模型排行
- **意见反馈** — 提交建议和问题，查看管理员回复

### 管理端
- **用户管理** — 查看所有注册用户，查询每个用户的模型调用统计
- **模型管理** — 模型的增删改查、上下架、排序配置
- **文档管理** — API 文档的增删改查，支持从已有文档引用复制
- **反馈管理** — 查看用户反馈，接受/拒绝建议，回复用户

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | MySQL 8 (mysql2/promise) |
| 认证 | JWT + bcrypt |
| 前端 | 原生 HTML/CSS/JavaScript（无构建工具） |
| 部署 | Docker + Jenkins CI/CD + Nginx 反向代理 |

## 项目结构

```
ModelHub/
├── server/                    # 后端服务
│   ├── index.js               # Express 入口
│   ├── db.js                  # MySQL 连接池
│   ├── schema.sql             # 数据库建表脚本
│   ├── middleware/
│   │   ├── auth.js            # JWT 认证中间件
│   │   ├── admin.js           # 管理员权限中间件
│   │   └── errorHandler.js    # 全局错误处理
│   └── routes/
│       ├── auth.js            # 登录/注册
│       ├── models.js          # 模型列表（公开）
│       ├── docs.js            # API 文档（公开）
│       ├── assets.js          # 调用记录
│       ├── users.js           # 用户信息
│       ├── feedback.js        # 用户反馈
│       └── admin/             # 管理员接口
│           ├── users.js       # 用户管理
│           ├── models.js      # 模型管理
│           ├── docs.js        # 文档管理
│           └── feedback.js    # 反馈管理
├── public/                    # 前端静态文件
│   ├── index.html             # 模型广场（首页）
│   ├── login.html             # 登录/注册页
│   ├── css/common.css         # 全局样式
│   ├── js/
│   │   ├── api.js             # API 请求封装
│   │   └── common.js          # 导航栏/认证/工具函数
│   └── pages/
│       ├── model.html         # 模型 Playground
│       ├── dashboard.html     # 数据仪表盘
│       ├── docs.html          # API 文档
│       ├── assets.html        # 资产中心
│       ├── feedback.html      # 用户反馈
│       ├── admin.html         # 管理后台首页
│       ├── admin-users.html   # 用户管理
│       ├── admin-models.html  # 模型管理
│       ├── admin-docs.html    # 文档管理
│       └── admin-feedbacks.html # 反馈管理
├── Dockerfile                 # Docker 构建配置
├── docker-compose.yml         # Docker Compose 编排
├── Jenkinsfile                # CI/CD 流水线
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 8.0

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/ModelHub.git
cd ModelHub

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接信息和密钥

# 4. 初始化数据库
mysql -u root -p < server/schema.sql

# 5. 启动服务
npm start
# 或开发模式（自动重启）
npm run dev
```

访问 `http://localhost:3000`

### 环境变量配置

```env
DB_HOST=localhost          # MySQL 主机
DB_USER=root               # MySQL 用户名
DB_PASS=your_password      # MySQL 密码
DB_NAME=modelhub           # 数据库名
JWT_SECRET=your_secret     # JWT 签名密钥
ADMIN_KEY=your_admin_key   # 管理员登录密钥
PORT=3000                  # 服务端口
```

### Docker 部署

```bash
# 配置好 .env 后
docker-compose up -d
```

## API 接口

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/models` | 获取模型列表 |
| GET | `/api/models/:id` | 获取模型详情 |
| GET | `/api/docs` | API 文档分类 |
| GET | `/api/docs/:modelId` | 模型文档详情 |

### 用户接口（需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/assets` | 调用记录 |
| GET | `/api/assets/stats` | 调用统计 |
| GET | `/api/feedbacks` | 我的反馈 |
| POST | `/api/feedbacks` | 提交反馈 |

### 管理员接口（需管理员权限）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表 |
| GET | `/api/admin/users/:id` | 用户详情 |
| CRUD | `/api/admin/models` | 模型管理 |
| CRUD | `/api/admin/docs` | 文档管理 |
| GET | `/api/admin/feedbacks` | 反馈列表 |
| PUT | `/api/admin/feedbacks/:id/status` | 处理反馈 |
| POST | `/api/admin/feedbacks/:id/reply` | 回复反馈 |

### 响应格式

```json
{
  "code": 200,
  "msg": "成功",
  "data": {}
}
```

## 管理员登录

在登录页面底部有「管理员密钥登录」入口，使用 `.env` 中配置的 `ADMIN_KEY` 即可登录管理后台。

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## License

MIT
