/* 通过 GitHub Git Data API 推送网站文件（单次提交）
 * 用法: GH_TOKEN=<token> node deploy-github.js
 * 背景: github.com:443 间歇性被阻断, 但 api.github.com 可达, 故走 API
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const OWNER = "lyl20250610";
const REPO = "embedded-learning";
const BRANCH = "main";
const TOKEN = process.env.GH_TOKEN;
const FILES = [
  "index.html", "courses.html", "course.html", "quiz.html", "resources.html",
  "css/style.css", "js/data.js", "js/app.js",
  "server.js", "start-public.bat", "README.md", ".gitignore", "deploy-github.js",
];

if (!TOKEN) { console.error("缺少 GH_TOKEN"); process.exit(1); }

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: "api.github.com",
      path: urlPath,
      method,
      headers: {
        "Authorization": "token " + TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "embedded-learning-deployer",
        "Content-Type": "application/json",
        "Content-Length": data ? Buffer.byteLength(data) : 0,
      },
      timeout: 30000,
    }, res => {
      let buf = "";
      res.on("data", d => buf += d);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(buf); } catch {}
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
        else reject(new Error(`HTTP ${res.statusCode} ${method} ${urlPath}: ${buf.slice(0, 300)}`));
      });
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const root = __dirname;

  // 0. 空仓库需先用 Contents API 初始化一个提交 (Git Data API 在空仓库上 409)
  try {
    await api("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
    console.log("branch exists, skip init");
  } catch {
    const readme = fs.readFileSync(path.join(root, "README.md"));
    await api("PUT", `/repos/${OWNER}/${REPO}/contents/README.md`, {
      message: "init", content: readme.toString("base64"),
    });
    console.log("repo initialized with README.md");
  }

  // 1. 创建 blobs
  const tree = [];
  for (const rel of FILES) {
    const content = fs.readFileSync(path.join(root, rel));
    const blob = await api("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: content.toString("base64"), encoding: "base64",
    });
    tree.push({ path: rel.replace(/\\/g, "/"), mode: "100644", type: "blob", sha: blob.sha });
    console.log("blob ok:", rel);
  }

  // 2. 创建 tree
  const treeRes = await api("POST", `/repos/${OWNER}/${REPO}/git/trees`, { tree });
  console.log("tree ok:", treeRes.sha);

  // 3. 创建 commit
  const commit = await api("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
    message: "嵌入式学习平台: 5门课程/26节课/自测题库/进度记录",
    tree: treeRes.sha,
  });
  console.log("commit ok:", commit.sha);

  // 4. 创建分支引用 (仓库为空, 首次创建 main)
  try {
    await api("POST", `/repos/${OWNER}/${REPO}/git/refs`, { ref: `refs/heads/${BRANCH}`, sha: commit.sha });
    console.log("branch created:", BRANCH);
  } catch (e) {
    // 分支已存在则强制更新
    await api("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, { sha: commit.sha, force: true });
    console.log("branch updated:", BRANCH);
  }

  // 5. 开启 GitHub Pages (deploy from branch: main /)
  try {
    const pages = await api("POST", `/repos/${OWNER}/${REPO}/pages`, {
      source: { branch: BRANCH, path: "/" },
    });
    console.log("pages enabled:", pages.html_url || "(building)");
  } catch (e) {
    if (String(e).includes("409")) console.log("pages already enabled");
    else throw e;
  }

  console.log(`\n站点地址: https://${OWNER}.github.io/${REPO}/`);
  console.log("首次构建需要 1-2 分钟");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
