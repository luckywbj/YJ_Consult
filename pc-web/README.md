# 岩值咨询 · PC 端顾问/助教交付后台（复用微信云开发）

本目录为桌面端交付管理系统，严格对照《IP实战陪跑营流程》设计 **10 步运营录取流水线 + 12 大驾驶舱板块（42 个交付节点）+ 1V1 咨询纪要/反馈闭环 + 交付文档与战果看板**，并与微信小程序共享同一套微信云开发（CloudBase）数据库。

---

## 一、本地快速预览（内置演示模式，开箱即用）

无需构建工具，直接运行 Node 启动静态服务：

```bash
node pc-web/server.js
```

浏览器打开：`http://127.0.0.1:3280`

默认演示账号：
- 主管理员（首席顾问）：`yanjie` / 密码 `888888`
- 交付助教：`assistant` / 密码 `666666`

---

## 二、连接真实微信云开发（免费支持「微信体验版」实时互通 · 推荐）

`pc-web/server.js` 内置了微信官方 `tcb/invokecloudfunction` 服务端代理（`/api/cloud`），**无需开通收费公网 HTTP 访问服务**，2 分钟即可打通手机端和 PC 端数据：

1. **上传并部署云函数**
   - 在微信开发者工具中右键 `cloudfunctions/consultApi`，点击「上传并部署：云端安装依赖」。
2. **确认环境 ID 并获取 AppSecret**
   - 打开微信开发者工具「云开发控制台 -> 设置」，确认环境 ID 与 `pc-web/.env.local` 中的 `WX_CLOUD_ENV`（默认 `cloud1-d7gf2c2g59cc2a156`）一致。
   - 登录微信公众平台（`mp.weixin.qq.com`）→ **开发管理 -> 开发设置** → 获取小程序的 `AppSecret`（如开启了 IP 白名单，顺手把本机公网 IP 加入白名单）。
3. **填写本地配置文件并重启**
   - 打开 `pc-web/.env.local`（已被 `.gitignore` 忽略，不会上传 Git），填入你的 `WX_APP_SECRET`：
     ```env
     WX_APP_ID=wx3aa3136395317b1f
     WX_APP_SECRET=这里填你的真实AppSecret
     WX_CLOUD_ENV=cloud1-d7gf2c2g59cc2a156
     WX_CLOUD_FUNCTION=consultApi
     ```
   - 重启 `node pc-web/server.js`，终端看到 `☁️ 微信云开发官方 API 代理已就绪` 后刷新浏览器登录，即可看到手机端最新注册学员。

---

## 三、可选：部署 PC 端到云开发静态网站托管（线上访问）

如果未来升级了 CloudBase 付费环境并希望团队成员不通过本机 Node 代理也能公网访问：
1. 在腾讯云 CloudBase 控制台为 `consultApi` 开通「HTTP 访问服务」并复制 HTTPS 地址；
2. 将 `pc-web/` 静态文件（无需 `server.js` 和 `.env.local`）上传至云开发「静态网站托管」；
3. 在登录页或「云开发连接设置 -> 方式二」填入该 HTTPS 地址即可。
