/* ==================== 嵌入式学习平台 · 页面逻辑 ==================== */
"use strict";

/* ---------- 工具 ---------- */
const $  = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function getCourse(id)   { return COURSES.find(c => c.id === id); }
function lessonCount(c)  { return c.lessons.length; }

/* localStorage 进度: { "courseId": [lessonIdx,...] } */
const PROGRESS_KEY = "embedded-site-progress-v1";
function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
  catch { return {}; }
}
function saveProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
function isLessonDone(courseId, idx) {
  return (loadProgress()[courseId] || []).includes(idx);
}
function courseProgress(courseId) {
  const c = getCourse(courseId);
  if (!c) return 0;
  const done = (loadProgress()[courseId] || []).length;
  return Math.round(done / c.lessons.length * 100);
}
function toggleLessonDone(courseId, idx) {
  const p = loadProgress();
  const arr = p[courseId] || [];
  const i = arr.indexOf(idx);
  if (i >= 0) arr.splice(i, 1); else arr.push(idx);
  p[courseId] = arr;
  saveProgress(p);
}

/* ---------- 简易C代码高亮(单遍扫描, 先转义再染色, 安全) ---------- */
function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
const C_TOKEN_RE = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|(#[^\n]*)|("(?:[^"\\\n]|\\.)*")|('(?:[^'\\\n]|\\.)*')|\b(0[xX][0-9a-fA-F]+u?|\d+u?)\b|\b(void|int|char|float|double|long|short|unsigned|signed|const|static|volatile|extern|inline|register|struct|union|enum|typedef|sizeof|if|else|for|while|do|switch|case|break|continue|return|goto)\b|\b(uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t|BaseType_t|UBaseType_t|StackType_t|TickType_t|EventBits_t|bit|sbit)\b/g;
const SH_TOKEN_RE = /(\#[^\n]*)|("(?:[^"\\\n]|\\.)*")|(\$(?:\{[^}]*\}|\([^)]*\)|\w+))/g;

function highlightCode(code, lang) {
  const re = (lang === "c") ? C_TOKEN_RE : (lang === "bash" || lang === "makefile") ? SH_TOKEN_RE : null;
  if (!re) return escHtml(code);

  let out = "", last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(code)) !== null) {
    out += escHtml(code.slice(last, m.index));
    const esc = escHtml(m[0]);
    if (lang === "c") {
      const cls = m[1] ? "tok-com" : m[2] ? "tok-pre"
        : (m[3] || m[4]) ? "tok-str" : m[5] ? "tok-num"
        : m[6] ? "tok-kw" : "tok-type";
      out += '<span class="' + cls + '">' + esc + "</span>";
    } else {
      const cls = m[1] ? "tok-com" : m[2] ? "tok-str" : "tok-num";
      out += '<span class="' + cls + '">' + esc + "</span>";
    }
    last = m.index + m[0].length;
  }
  out += escHtml(code.slice(last));
  return out;
}

/* 把内容里的 <codeblock lang title>...</codeblock> 渲染成代码块 */
function renderContent(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  $$("codeblock", div).forEach(cb => {
    const lang  = cb.getAttribute("lang") || "text";
    const title = cb.getAttribute("title") || "";
    const pre = document.createElement("div");
    pre.className = "code-block";
    pre.innerHTML =
      '<div class="code-head"><span>' + escHtml(title) +
      '</span><span>' + escHtml(lang.toUpperCase()) + '</span></div>' +
      '<pre>' + highlightCode(cb.textContent, lang) + '</pre>';
    cb.replaceWith(pre);
  });
  return div.innerHTML;
}

/* ---------- 公共: 导航高亮 + 移动端菜单 ---------- */
function initNav() {
  const page = document.body.dataset.page;
  $$(".nav-links a").forEach(a => {
    if (a.dataset.page === page) a.classList.add("active");
  });
  const btn = $(".menu-btn"), links = $(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", () => links.classList.toggle("open"));
  }
}

/* ---------- 首页: 学习路径卡片 & 统计 ---------- */
function renderHome() {
  const grid = $("#pathGrid");
  if (!grid) return;
  const paths = [
    { no: "01", icon: "🇨", name: "语言基础", desc: "把C学成嵌入式该有的样子",
      steps: ["C语言与嵌入式编程基础"], link: "#course-c-basics" },
    { no: "02", icon: "🔌", name: "单片机入门", desc: "点亮LED, 听懂中断",
      steps: ["51单片机从零入门"], link: "#course-mcu51" },
    { no: "03", icon: "⚙️", name: "外设实战", desc: "串口/总线/采集一条龙",
      steps: ["STM32开发实战"], link: "#course-stm32" },
    { no: "04", icon: "🧵", name: "系统升级", desc: "从轮询到实时多任务",
      steps: ["FreeRTOS实时操作系统"], link: "#course-rtos" },
    { no: "05", icon: "🐧", name: "系统级开发", desc: "走进Linux的世界",
      steps: ["嵌入式Linux基础"], link: "#course-embedded-linux" },
  ];
  grid.innerHTML = paths.map(p => `
    <a class="card path-card" href="${p.link}">
      <span class="step-no">${p.no}</span>
      <div class="icon">${p.icon}</div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <ul>${p.steps.map(s => `<li>${s}</li>`).join("")}</ul>
    </a>`).join("");

  /* 课程卡片(带进度) */
  const courseGrid = $("#courseGrid");
  courseGrid.innerHTML = COURSES.map(c => `
    <a class="card course-card" href="course.html?id=${c.id}">
      <div class="course-cover" style="background:${c.gradient}">
        <span class="big-icon">${c.icon}</span>
        <span class="level">${c.level}</span>
      </div>
      <div class="body">
        <h3>${c.title}</h3>
        <p class="desc">${c.desc}</p>
        <div class="course-meta">
          <span>📚 ${c.lessons.length} 节课</span>
          <span>⏱ 约 ${c.lessons.reduce((s, l) => s + l.minutes, 0)} 分钟</span>
          <span>${courseProgress(c.id)}%</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${courseProgress(c.id)}%"></div></div>
      </div>
    </a>`).join("");

  /* 学习总进度 */
  const totalLessons = COURSES.reduce((s, c) => s + c.lessons.length, 0);
  const doneTotal = COURSES.reduce((s, c) => s + (loadProgress()[c.id] || []).length, 0);
  const overall = Math.round(doneTotal / totalLessons * 100);
  const statDone = $("#statDone");
  if (statDone) statDone.textContent = doneTotal;
  const overallBar = $("#overallBar");
  if (overallBar) {
    overallBar.style.width = overall + "%";
    $("#overallPct").textContent = overall + "%";
  }
}

/* 首页路径锚点 → 课程页 */
function handlePathLinks() {
  $$('a[href^="#course-"]').forEach(a => {
    a.addEventListener("click", () => {
      location.href = "course.html?id=" + a.getAttribute("href").slice(8);
    });
  });
}

/* ---------- 课程列表页 ---------- */
function renderCoursesPage() {
  const grid = $("#courseGrid");
  if (!grid) return;
  grid.innerHTML = COURSES.map(c => {
    const pct = courseProgress(c.id);
    return `
    <a class="card course-card" href="course.html?id=${c.id}">
      <div class="course-cover" style="background:${c.gradient}">
        <span class="big-icon">${c.icon}</span>
        <span class="level">${c.level}</span>
      </div>
      <div class="body">
        <h3>${c.title}</h3>
        <p class="desc">${c.desc}</p>
        <div class="tag-row">${c.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="course-meta">
          <span>📚 ${c.lessons.length} 节课</span>
          <span>⏱ 约 ${c.lessons.reduce((s, l) => s + l.minutes, 0)} 分钟</span>
          <span>${pct}% 已完成</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </a>`;
  }).join("");
}

/* ---------- 课程详情页 ---------- */
function renderCoursePage() {
  const params = new URLSearchParams(location.search);
  const course = getCourse(params.get("id")) || COURSES[0];
  document.title = course.title + " · 嵌入式学习平台";

  let curIdx = parseInt(params.get("l") || "0", 10);
  if (isNaN(curIdx) || curIdx < 0 || curIdx >= course.lessons.length) curIdx = 0;

  const sidebar = $("#lessonList");
  sidebar.innerHTML = `
    <a class="back" href="courses.html">← 返回课程列表</a>
    <h2>${course.icon} ${course.title}</h2>
    <p class="sub">${course.lessons.length} 节课 · 每节 ${course.lessons.reduce((s, l) => s + l.minutes, 0)} 分钟以内</p>
    <ul class="lesson-list">
      ${course.lessons.map((l, i) => `
        <li class="lesson-item${i === curIdx ? " active" : ""}${isLessonDone(course.id, i) ? " done" : ""}" data-i="${i}">
          <span class="no">${isLessonDone(course.id, i) ? "✓" : i + 1}</span>
          <span>${l.title}</span>
        </li>`).join("")}
    </ul>`;

  const lesson = course.lessons[curIdx];
  const content = $("#lessonContent");
  content.innerHTML = `
    <h1>${lesson.title}</h1>
    <div class="lesson-meta">
      <span>📖 ${course.title}</span>
      <span>⏱ 阅读约 ${lesson.minutes} 分钟</span>
      <span>第 ${curIdx + 1} / ${course.lessons.length} 节</span>
    </div>
    ${renderContent(lesson.content)}
    <div class="lesson-nav">
      <button class="nav-btn" id="prevBtn" ${curIdx === 0 ? "disabled" : ""}>← 上一节</button>
      <button class="complete-btn${isLessonDone(course.id, curIdx) ? " done" : ""}" id="doneBtn">
        ${isLessonDone(course.id, curIdx) ? "✓ 已完成" : "标记完成"}
      </button>
      <button class="nav-btn primary" id="nextBtn" ${curIdx === course.lessons.length - 1 ? "disabled" : ""}>下一节 →</button>
    </div>`;

  function goto(i) {
    location.href = "course.html?id=" + course.id + "&l=" + i;
  }
  $("#prevBtn").addEventListener("click", () => goto(curIdx - 1));
  $("#nextBtn").addEventListener("click", () => goto(curIdx + 1));
  $("#doneBtn").addEventListener("click", function () {
    toggleLessonDone(course.id, curIdx);
    const done = isLessonDone(course.id, curIdx);
    this.classList.toggle("done", done);
    this.textContent = done ? "✓ 已完成" : "标记完成";
    /* 更新侧栏 */
    const item = $('.lesson-item[data-i="' + curIdx + '"]');
    item.classList.toggle("done", done);
    $(".no", item).textContent = done ? "✓" : curIdx + 1;
  });
  $$(".lesson-item").forEach(item => {
    item.addEventListener("click", () => goto(parseInt(item.dataset.i, 10)));
  });
}

/* ---------- 测验页 ---------- */
function renderQuizPage() {
  const box = $("#quizBox");
  let order = [], cur = 0, correct = 0, wrongList = [];

  function startQuiz() {
    order = QUIZ_QUESTIONS.map((q, i) => i).sort(() => Math.random() - 0.5).slice(0, 10);
    cur = 0; correct = 0; wrongList = [];
    showQuestion();
  }

  function showQuestion() {
    const q = QUIZ_QUESTIONS[order[cur]];
    const course = getCourse(q.course);
    box.innerHTML = `
      <div class="quiz-card">
        <div class="quiz-progress">
          <span>第 ${cur + 1} / ${order.length} 题</span>
          <span>答对 ${correct} 题</span>
        </div>
        <div class="quiz-bar"><div style="width:${cur / order.length * 100}%"></div></div>
        <div class="quiz-q">
          <span class="qtag">${course ? course.title : "综合"}</span><br>${q.q}
        </div>
        ${q.options.map((opt, i) => `
          <div class="option" data-i="${i}">
            <span class="key">${"ABCD"[i]}</span><span>${opt}</span>
          </div>`).join("")}
        <div class="explain" id="explain" style="display:none"></div>
        <div class="quiz-actions">
          <button class="nav-btn primary" id="nextQ" style="display:none">
            ${cur === order.length - 1 ? "查看结果" : "下一题 →"}
          </button>
        </div>
      </div>`;

    let answered = false;
    $$(".option", box).forEach(el => {
      el.addEventListener("click", function () {
        if (answered) return;
        answered = true;
        const pick = parseInt(this.dataset.i, 10);
        const isRight = pick === q.answer;
        if (isRight) correct++; else wrongList.push(q);
        $$(".option", box).forEach(o => {
          const i = parseInt(o.dataset.i, 10);
          if (i === q.answer) o.classList.add("correct");
          else if (i === pick) o.classList.add("wrong");
          else o.classList.add("dim");
        });
        const ex = $("#explain");
        ex.style.display = "block";
        ex.innerHTML = (isRight ? "✅ <b>回答正确！</b>" : "❌ <b>答错了。</b>") + " " + q.explain;
        $("#nextQ").style.display = "inline-flex";
      });
    });
    $("#nextQ").addEventListener("click", () => {
      cur++;
      if (cur < order.length) showQuestion(); else showResult();
    });
  }

  function showResult() {
    const pct = Math.round(correct / order.length * 100);
    const grade = pct >= 90 ? "🏆 优秀！可以进入下一阶段的学习了"
                : pct >= 70 ? "👍 不错！查漏补缺后会更扎实"
                : pct >= 50 ? "📖 基础已建立，建议回到对应课程复习"
                : "🌱 别灰心，从第一门课重新梳理一遍吧";
    box.innerHTML = `
      <div class="quiz-card" style="text-align:center">
        <div style="font-size:15px;color:var(--text-2);margin-bottom:8px">本次成绩</div>
        <div class="result-score">${pct}<span style="font-size:22px;color:var(--text-3)">分</span></div>
        <p style="margin:10px 0 0;color:var(--text-2)">${grade}</p>
        <div class="result-grid">
          <div class="stat"><b>${order.length}</b><span>总题数</span></div>
          <div class="stat"><b style="color:var(--ok)">${correct}</b><span>答对</span></div>
          <div class="stat"><b style="color:var(--bad)">${order.length - correct}</b><span>答错</span></div>
        </div>
        ${wrongList.length ? `
          <div style="text-align:left;margin-top:6px">
            <b style="font-size:15px">📕 错题回顾</b>
            ${wrongList.map(q => `
              <div style="margin:10px 0;padding:12px 16px;background:var(--chip);border-radius:10px;font-size:14px">
                <b>${q.q}</b><br>
                <span style="color:var(--ok)">正确答案：${q.options[q.answer]}</span><br>
                <span style="color:var(--text-2)">${q.explain}</span>
              </div>`).join("")}
          </div>` : ""}
        <div style="margin-top:20px;display:flex;gap:12px;justify-content:center">
          <button class="nav-btn" onclick="location.reload()">再来一轮</button>
          <a class="nav-btn primary" href="courses.html" style="color:#fff">返回课程</a>
        </div>
      </div>`;
  }

  /* 初始界面 */
  box.innerHTML = `
    <div class="quiz-start">
      <div style="font-size:44px;margin-bottom:14px">🎯</div>
      <h2 style="font-size:24px;margin-bottom:10px">嵌入式知识自测</h2>
      <p style="color:var(--text-2);margin-bottom:6px">从题库中随机抽取 10 题，覆盖 C语言 / 单片机 / STM32 / RTOS / 嵌入式Linux</p>
      <p style="color:var(--text-3);font-size:14px;margin-bottom:28px">每题作答后立即显示答案与解析 · 共 ${QUIZ_QUESTIONS.length} 道题在库</p>
      <button class="btn btn-primary" id="startBtn" style="color:#fff">开始测试</button>
    </div>`;
  $("#startBtn").addEventListener("click", startQuiz);
}

/* ---------- 资源页数据 ---------- */
const RESOURCES = [
  { group: "开发工具", icon: "🛠", items: [
    { name: "STM32CubeMX + CubeIDE", desc: "图形化配置外设并生成初始化代码，官方IDE免费", note: "ST官网" },
    { name: "Keil MDK5", desc: "嵌入式C/C++编译调试环境，51与STM32教程生态最全", note: "社区版限制32KB代码" },
    { name: "VS Code + EIDE / PlatformIO", desc: "轻量编辑器 + 嵌入式插件，跨平台开源工具链", note: "免费" },
    { name: "PulseView + 24M USB逻辑分析仪", desc: "15元硬件+开源软件，抓I2C/SPI/UART波形必备", note: "调试神器" },
    { name: "MobaXterm / PuTTY", desc: "串口终端与SSH工具，看日志、连Linux板子", note: "免费" },
  ]},
  { group: "推荐书籍", icon: "📚", items: [
    { name: "《C和指针》《C专家编程》", desc: "啃透指针与声明语法，嵌入式C的分水岭", note: "进阶必读" },
    { name: "《嵌入式C语言自我修养》", desc: "国内作者，专门讲嵌入式场景下的C技巧", note: "入门友好" },
    { name: "《STM32库开发实战指南》", desc: "野火出品，寄存器与库双线讲解，配开发板", note: "配板学习" },
    { name: "《FreeRTOS内核实现与应用开发实战指南》", desc: "手写迷你RTOS理解调度器，再来用FreeRTOS", note: "深刻" },
    { name: "《鸟哥的Linux私房菜》", desc: "嵌入式Linux前置：先把Linux本身用起来", note: "基础" },
  ]},
  { group: "硬件平台", icon: "🔬", items: [
    { name: "STC89C52 / STM32F103C8T6 最小系统板", desc: "几元到十几元，配杜邦线+面包板即可开跑", note: "入门" },
    { name: "正点原子 / 野火 i.MX6ULL 开发板", desc: "嵌入式Linux教学经典平台，资料极其丰富", note: "进阶" },
    { name: "树莓派 / 香橙派", desc: "标准Linux环境+强大社区，适合应用层与网关开发", note: "通用" },
    { name: "ESP32", desc: "WiFi+蓝牙双核MCU，物联网项目首选，Arduino/ESP-IDF双生态", note: "物联网" },
  ]},
  { group: "在线资源", icon: "🌐", items: [
    { name: "FreeRTOS 官方文档", desc: "《Mastering the FreeRTOS Real Time Kernel》官方免费电子书", note: "freertos.org" },
    { name: "Bootlin 嵌入式Linux/内核培训材料", desc: "免费公开的 slides+lab，内核驱动开发体系化教材", note: "bootlin.com/docs" },
    { name: "elixir.bootlin.com", desc: "在线交叉检索内核源码，LXR引擎，读内核必备", note: "源码浏览器" },
    { name: "江协科技 / 正点原子 B站视频", desc: "51与STM32视频教程，跟着敲一遍比看书快", note: "B站" },
    { name: "电子工程专辑 / EEVblog 论坛", desc: "硬件设计问题检索与讨论", note: "社区" },
  ]},
];

function renderResourcesPage() {
  const wrap = $("#resWrap");
  if (!wrap) return;
  wrap.innerHTML = RESOURCES.map(g => `
    <div class="section-head" style="text-align:left;margin:38px 0 18px">
      <h2 style="font-size:22px">${g.icon} ${g.group}</h2>
    </div>
    <div class="grid grid-2">
      ${g.items.map(it => `
        <div class="card res-item">
          <span class="res-icon">▸</span>
          <div>
            <h4>${it.name}</h4>
            <p>${it.desc}</p>
            <span class="note">${it.note}</span>
          </div>
        </div>`).join("")}
    </div>`).join("");
}

/* ---------- 路由分发 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  switch (document.body.dataset.page) {
    case "home":       renderHome(); handlePathLinks(); break;
    case "courses":    renderCoursesPage(); break;
    case "course":     renderCoursePage(); break;
    case "quiz":       renderQuizPage(); break;
    case "resources":  renderResourcesPage(); break;
  }
});
