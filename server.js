/* 嵌入式学习平台 · 零依赖静态服务器
 * 用法: node server.js [端口]   默认 8000
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = parseInt(process.argv[2], 10) || 8000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".md":   "text/markdown; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
  ".woff2":"font/woff2",
};

const server = http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Bad Request");
    return;
  }
  if (urlPath.endsWith("/")) urlPath += "index.html";

  // 防目录穿越
  const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, ""));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA 兜底: 未知路径回首页 (可选保留404提示)
      if (!path.extname(urlPath)) {
        fs.readFile(path.join(ROOT, "index.html"), (e2, index) => {
          if (e2) { res.writeHead(500).end("Server Error"); return; }
          res.writeHead(200, { "Content-Type": MIME[".html"], "Cache-Control": "no-cache" });
          res.end(index);
        });
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found: " + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("✅ 嵌入式学习平台已开放:  http://localhost:" + PORT);
  console.log("   目录: " + ROOT);
  console.log("   停止: Ctrl + C");
});
