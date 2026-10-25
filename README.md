# 嵌入式学习平台

纯静态学习网站（HTML/CSS/JS，零依赖，零构建）。学习进度保存在访客浏览器本地。

**线上地址：https://lyl20250610.github.io/embedded-learning/**

## 内容

- 5 门课程 26 节课：C语言嵌入式基础 → 51单片机 → STM32实战 → FreeRTOS → 嵌入式Linux
- 18 道自测题（随机抽题、即时判分、错题解析）
- 学习进度 localStorage 记录

## 更新网站内容

修改文件后任选其一：

```bash
# 方式一: 走 GitHub API 推送 (推荐, 不受 github.com 间歇性阻断影响)
GH_TOKEN=<你的token> node deploy-github.js

# 方式二: 普通 git 推送 (github.com 可达时)
git push origin main
```

`deploy-github.js` 会把列在 FILES 中的文件以单次提交推送到 main 分支，Pages 自动重新构建（约 1 分钟）。

## 本地预览

```bash
node server.js 8080     # http://localhost:8080
```

## 备用公网入口（免费隧道）

电脑开机期间可用，作为 GitHub Pages 的临时补充：

```bash
lt --port 8080 --subdomain embedded-learn     # https://embedded-learn.loca.lt (首次需输本机公网IP)
ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run   # 随机 *.lhr.life 地址, 无提醒页
```

一键启动：双击 `start-public.bat`。

## 关于腾讯云 EdgeOne

已实测（2026-10）：EdgeOne CLI 部署成功，但其免费默认域名（`*.edgeone.cool`）是带签名 token 的临时预览链接（约 2 小时过期、国内与海外访问均需有效 token）；CLI 创建的项目固定为全球区。**要在 EdgeOne 获得永久公开地址需绑定自定义域名（约几十元/年，全球区免备案）**，故本项目改用 GitHub Pages。
