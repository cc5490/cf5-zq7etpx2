/* ============================================================
   CYBER FRONTIER V5.0 — vulns.js
   阶段1 漏洞训练: SQLi/XSS/CSRF/上传/SSRF/命令注入/JWT/业务逻辑
   三层难度: Guided(有提示) → Semi-Blind(只说类型) → Blind(完全自主)
   注意: 字符串内中文一律用『』不用 ASCII 引号(防止解析崩溃)
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== 扩展虚拟服务器 ==================== */
  // 包装原 handle,增加漏洞端点
  const S = CF.server;
  const baseHandle = S.handle.bind(S);
  const guestbook = []; // 存储型 XSS 留言板
  const json = (o) => JSON.stringify(o, null, 2);
  const R = (status, headers, body) => ({ status, headers, body });

  S.handle = function (req) {
    const { method, path, headers, body } = req;
    const cookie = headers["Cookie"] || "";
    const sid = (cookie.match(/session=([a-z0-9]+)/) || [])[1];
    const session = S.sessions[sid];

    /* --- 反射型 XSS: /xss?q= --- */
    if (path.startsWith("/xss")) {
      const q = decodeURIComponent((path.match(/[?&]q=([^&]*)/) || [])[1] || "");
      // ⚠️ 漏洞: 输入直接拼进 HTML,无任何过滤
      return R(200, { "Content-Type": "text/html" },
        `<html><body><h1>搜索结果</h1><p>你搜索的是: ${q}</p></body></html>`);
    }
    /* --- 存储型 XSS: /guestbook --- */
    if (path === "/guestbook" && method === "GET") {
      const items = guestbook.map((g) => `<li>${g}</li>`).join("");
      return R(200, { "Content-Type": "text/html" },
        `<html><body><h1>留言板</h1><ul>${items}</ul></body></html>`);
    }
    if (path === "/guestbook" && method === "POST") {
      const msg = (body.match(/msg=(.*)/) || [])[1] || body;
      guestbook.push(decodeURIComponent(msg));
      return R(200, { "Content-Type": "application/json" }, json({ ok: true, msg: "留言成功" }));
    }
    /* --- CSRF: /api/transfer --- */
    if (path === "/api/transfer" && method === "POST") {
      if (!session) return R(401, { "Content-Type": "application/json" }, json({ error: "未登录" }));
      let p = {};
      (body || "").split("&").forEach((kv) => { const [k, v] = kv.split("="); p[k] = v; });
      // ⚠️ 漏洞: 无 CSRF Token 校验,无 Referer 检查
      return R(200, { "Content-Type": "application/json" },
        json({ ok: true, msg: `已向 ${p.to} 转账 ${p.amount} 元`, from: session.user }));
    }
    /* --- 文件上传: /api/upload --- */
    if (path === "/api/upload" && method === "POST") {
      let p = {};
      try { p = JSON.parse(body || "{}"); } catch (e) {}
      const fn = p.filename || "";
      const ct = p.content_type || "";
      const white = /\.(jpg|jpeg|png|gif)$/i;
      if (white.test(fn) && /^image\//.test(ct)) {
        return R(200, { "Content-Type": "application/json" }, json({ ok: true, msg: "上传成功(图片)", path: "/uploads/" + fn }));
      }
      // ⚠️ 漏洞: 只检查扩展名结尾,不检查中间; 或只信 Content-Type
      if (/\.(jpg|jpeg|png|gif)\./i.test(fn) || /\.php\.jpg$/i.test(fn)) {
        return R(200, { "Content-Type": "application/json" },
          json({ ok: true, msg: "上传成功", path: "/uploads/" + fn, warning: "shell.php.jpg 已被当作 PHP 解析!", flag: "FLAG{upl04d_byp4ss}" }));
      }
      if (/\.php$/i.test(fn) && /^image\//.test(ct)) {
        return R(200, { "Content-Type": "application/json" },
          json({ ok: true, msg: "Content-Type 伪造成功, webshell 已上传", flag: "FLAG{ct_f0rg3ry}" }));
      }
      return R(403, { "Content-Type": "application/json" }, json({ error: "文件类型不允许" }));
    }
    /* --- SSRF: /api/fetch?url= --- */
    if (path.startsWith("/api/fetch")) {
      if (!session) return R(401, { "Content-Type": "application/json" }, json({ error: "未登录" }));
      const url = decodeURIComponent((path.match(/[?&]url=([^&]*)/) || [])[1] || "");
      if (!url) return R(400, { "Content-Type": "application/json" }, json({ error: "缺少 url 参数" }));
      // ⚠️ 漏洞: 服务端代发请求,无内网地址过滤
      if (url.includes("169.254.169.254")) {
        return R(200, { "Content-Type": "application/json" },
          json({ fetched: url, data: { "iam-role": "admin", "access-key": "AKIA...FLAG{ssrf_cl0ud}" } }));
      }
      if (url.includes("127.0.0.1") || url.includes("localhost")) {
        return R(200, { "Content-Type": "application/json" },
          json({ fetched: url, data: "内部管理面板: /admin/debug — FLAG{ssrf_1nt3rn4l}" }));
      }
      return R(200, { "Content-Type": "application/json" }, json({ fetched: url, data: "<html>外部页面内容...</html>" }));
    }
    /* --- 命令注入: /api/ping?host= --- */
    if (path.startsWith("/api/ping")) {
      const host = decodeURIComponent((path.match(/[?&]host=([^&]*)/) || [])[1] || "");
      if (!host) return R(400, { "Content-Type": "application/json" }, json({ error: "缺少 host 参数" }));
      // ⚠️ 漏洞: host 直接拼接进 shell
      const inj = host.match(/[;&|`$]\s*(\w+)(.*)/);
      if (inj) {
        const cmd = inj[1];
        if (cmd === "id") return R(200, {}, `PING ok\nuid=33(www-data) gid=33(www-data) — FLAG{cmd_1nj3ct10n}`);
        if (cmd === "whoami") return R(200, {}, `PING ok\nwww-data — FLAG{cmd_1nj3ct10n}`);
        if (cmd === "cat" || cmd === "ls") return R(200, {}, `PING ok\n${cmd} 执行成功: flag.txt config.php index.php`);
        return R(200, {}, `PING ok\nsh: ${cmd}: 已执行(盲注场景)`);
      }
      return R(200, {}, `PING ${host}: 4 packets transmitted, 4 received`);
    }
    /* --- JWT: /api/token 登录发 JWT, /api/me 验证 --- */
    if (path === "/api/token" && method === "POST") {
      let p = {}; try { p = JSON.parse(body || "{}"); } catch (e) {}
      const u = S.users[p.username];
      if (!u || u.pass !== p.password) return R(401, {}, json({ error: "认证失败" }));
      const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "");
      const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ user: p.username, role: "user", uid: u.id })}.fakesig123`;
      return R(200, { "Content-Type": "application/json" }, json({ token: jwt }));
    }
    if (path === "/api/me") {
      const auth = headers["Authorization"] || "";
      const jwt = auth.replace(/^Bearer\s+/i, "");
      const parts = jwt.split(".");
      if (parts.length < 2) return R(401, {}, json({ error: "缺少 Bearer Token" }));
      let payload = {};
      try { payload = JSON.parse(atob(parts[1])); } catch (e) { return R(401, {}, json({ error: "Token 解析失败" })); }
      let header = {};
      try { header = JSON.parse(atob(parts[0])); } catch (e) {}
      // ⚠️ 漏洞: 接受 alg=none(不验签)
      if (header.alg === "none") {
        if (payload.role === "admin") return R(200, {}, json({ user: payload.user, role: "admin", flag: "FLAG{jwt_n0n3_4lg}" }));
        return R(200, {}, json({ user: payload.user, role: payload.role, note: "已接受无签名 token" }));
      }
      // 正常验签(模拟: 签名必须是 fakesig123)
      if (parts[2] !== "fakesig123") return R(401, {}, json({ error: "签名无效" }));
      return R(200, {}, json({ user: payload.user, role: payload.role }));
    }
    /* --- 业务逻辑: /api/order --- */
    if (path === "/api/order" && method === "POST") {
      if (!session) return R(401, {}, json({ error: "未登录" }));
      let p = {}; try { p = JSON.parse(body || "{}"); } catch (e) {}
      const qty = parseInt(p.qty || "1");
      const price = parseFloat(p.price || "100");
      // ⚠️ 漏洞: 不校验数量和价格正负
      const total = qty * price;
      if (total < 0) {
        return R(200, {}, json({ ok: true, msg: `订单创建: ${qty} × ${price} = ${total} 元(负数!已退款到余额)`, flag: "FLAG{n3g4t1v3_pr1c3}" }));
      }
      return R(200, {}, json({ ok: true, msg: `订单创建: ${qty} × ${price} = ${total} 元` }));
    }
    return baseHandle(req);
  };

  /* ==================== 通用漏洞实验室 ==================== */
  // config: { nodeId, scenario, goal, presets(请求预设), hints[], check(req,resp)→bool, flag, variantNote }
  CF.renderVulnLab = (container, config) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="row mb" style="gap:6px">
        <span class="tag red" id="vl-mode">难度: Guided</span>
        <button class="btn btn-sm" id="vl-mode-btn">切换难度</button>
      </div>
      <div class="dim small mb" id="vl-scenario">${config.scenario}</div>
      <div class="diag-explain mb" id="vl-goal">目标: ${config.goal}</div>
      <div id="vl-hints"></div>
      <div id="vl-builder"></div>
      <div id="vl-result" class="mt"></div>
    `;
    container.appendChild(wrap);

    const modes = ["Guided", "Semi-Blind", "Blind"];
    let mode = 0;
    const applyMode = () => {
      wrap.querySelector("#vl-mode").textContent = "难度: " + modes[mode];
      const hintsEl = wrap.querySelector("#vl-hints");
      const goalEl = wrap.querySelector("#vl-goal");
      if (mode === 0) { // Guided: 完整提示
        goalEl.style.display = "block";
        hintsEl.innerHTML = `<div class="small faint mb" style="line-height:1.8">${config.hints.map((h, i) => `${i + 1}. ${h}`).join("<br>")}</div>`;
      } else if (mode === 1) { // Semi-Blind: 只说类型,不给步骤
        goalEl.style.display = "block";
        hintsEl.innerHTML = `<div class="small faint mb">本场景存在 <b>${config.typeName}</b> 漏洞。不给步骤,自己定位参数和证明方法。</div>`;
      } else { // Blind: 什么都不说
        goalEl.innerHTML = "目标: 这个应用里藏着一个漏洞。类型不告诉你。找到它,证明它。";
        hintsEl.innerHTML = "";
      }
    };
    wrap.querySelector("#vl-mode-btn").onclick = () => { mode = (mode + 1) % 3; applyMode(); };
    applyMode();

    let done = false;
    let counted = false;
    // 用 web.js 暴露的请求构造器(重新实现精简版,避免跨文件私有函数)
    const builder = document.createElement("div");
    builder.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div>
          <div class="faint small mb">请求</div>
          <div class="row mb" style="gap:6px">
            <select id="vb-method" class="diag-opt" style="width:90px;padding:7px;font-family:var(--mono)">
              ${["GET", "POST"].map((m) => `<option ${config.preset.method === m ? "selected" : ""}>${m}</option>`).join("")}
            </select>
            <input id="vb-path" class="diag-opt mono" style="flex:1;padding:7px 12px" value="${$.esc(config.preset.path)}" spellcheck="false">
          </div>
          <textarea id="vb-headers" class="term" style="width:100%;min-height:80px;color:var(--txt);font-size:.78rem" spellcheck="false">${$.esc(config.preset.headers)}</textarea>
          <textarea id="vb-body" class="term mt" style="width:100%;min-height:50px;color:var(--txt);font-size:.78rem" placeholder="Body" spellcheck="false">${$.esc(config.preset.body || "")}</textarea>
          <div class="row mt">
            <button class="btn btn-primary btn-sm" id="vb-send">发送 →</button>
            <button class="btn btn-sm" id="vb-login" title="自动用 alice/alice123 登录并把 session 写入 Cookie 头">🔑 登录 Alice</button>
            <button class="btn btn-sm" id="vb-variant" title="同一原理,换个参数位置/业务场景">🎲 变体练习</button>
          </div>
        </div>
        <div>
          <div class="faint small mb">响应</div>
          <div id="vb-resp" class="term" style="min-height:180px;font-size:.78rem;white-space:pre-wrap;word-break:break-all"><span class="faint">...</span></div>
        </div>
      </div>`;
    wrap.querySelector("#vl-builder").appendChild(builder);

    // 一键登录: 自动拿 alice 会话并注入 Cookie 头(真实训练中这一步由 Burp 代劳)
    builder.querySelector("#vb-login").onclick = () => {
      const r = CF.server.handle({
        method: "POST", path: "/login",
        headers: { "Content-Type": "application/json" },
        body: '{"username":"alice","password":"alice123"}',
      });
      const sc = r.headers["Set-Cookie"] || "";
      const m = sc.match(/session=([a-z0-9]+)/);
      const ta = builder.querySelector("#vb-headers");
      if (m) {
        const cookieLine = "Cookie: session=" + m[1];
        ta.value = /Cookie:/i.test(ta.value)
          ? ta.value.replace(/^Cookie:.*$/m, cookieLine)
          : ta.value.trim() + "\n" + cookieLine;
        $.toast("已登录为 Alice,session 已写入 Cookie 头");
      } else {
        $.toast("登录失败: " + r.body.slice(0, 60));
      }
    };

    builder.querySelector("#vb-send").onclick = () => {
      const method = builder.querySelector("#vb-method").value;
      const path = builder.querySelector("#vb-path").value.trim();
      const headers = {};
      builder.querySelector("#vb-headers").value.split("\n").forEach((l) => {
        const i = l.indexOf(":"); if (i > 0) headers[l.slice(0, i).trim()] = l.slice(i + 1).trim();
      });
      const body = builder.querySelector("#vb-body").value;
      const req = { method, path, headers, body };
      const resp = S.handle(req);
      const sc = resp.status < 300 ? "var(--green)" : resp.status < 500 ? "var(--amber)" : "var(--red)";
      builder.querySelector("#vb-resp").innerHTML =
        `<span style="color:${sc};font-weight:700">HTTP/1.1 ${resp.status}</span>\n` +
        Object.entries(resp.headers).map(([k, v]) => `<span style="color:var(--purple)">${k}</span>: ${$.esc(v)}`).join("\n") +
        `\n\n${$.esc(resp.body)}`;
      // XSS 可视化: 如果响应含 HTML,渲染效果预览
      if ((resp.headers["Content-Type"] || "").includes("text/html") && /<script|<img[^>]*onerror|<svg[^>]*onload/i.test(resp.body)) {
        builder.querySelector("#vb-resp").innerHTML += `\n\n<span style="color:var(--red)">⚠ 浏览器渲染此 HTML 时,注入的脚本将执行!</span>`;
      }
      if (!done && config.check(req, resp)) {
        done = true;
        wrap.querySelector("#vl-result").innerHTML =
          `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">
            ✓ 漏洞验证成功! ${config.flag}<br>
            <span class="dim">${config.explain}</span><br>
            <span class="faint small">现在试试『变体练习』: 同一原理,不同参数位置。</span>
          </div>`;
        CF.prog.markEvidence(config.nodeId, "e2");
        CF.prog.addXP(100);
        if (CF.trackVulnCount && !counted) { CF.trackVulnCount(config.nodeId); counted = true; }
        // 显示硬指标进度(SQLi 10+/XSS 10+ 等)
        if (CF.renderVulnProgress) {
          const p = CF.renderVulnProgress();
          wrap.querySelector("#vl-result").innerHTML +=
            `<div class="faint small mt" style="line-height:1.7">硬指标累计: SQLi ${p.got.sqli||0}/10 · XSS ${p.got.xss||0}/10 · 越权 ${p.got.access||0}/10 · SSRF ${p.got.ssrf||0}/5 · 认证 ${p.got.auth||0}/5 · 上传 ${p.got.upload||0}/5 · 逻辑 ${p.got.logic||0}/5 <b style="color:var(--cyan)">(${p.pct}%)</b><br><span class="faint">同一漏洞反复用不同变体练习即可累计次数——对应真实靶场的 SQLi 10+ 硬指标。</span></div>`;
        }
        renderFiveQuestions();
        if (mode === 2) { CF.prog.markEvidence(config.nodeId, "e4"); CF.store.data.stats.blindPassed++; CF.store.save(); }
      }
    };

    /* ---- 五问训练卡: 大纲硬要求,每个漏洞必须回答五个问题 ---- */
    const FIVE_Q = [
      ["why", "① 为什么会产生这个漏洞?(根本原因)"],
      ["trust", "② 信任边界在哪里?(哪一侧的数据被当成了可信)"],
      ["flow", "③ 输入怎样流到危险点?(参数从哪进、到哪被处理)"],
      ["poc", "④ 如何在合法靶场里最小化证明影响?(不越界的 PoC)"],
      ["fix", "⑤ 如何修复/防御?(具体技术方案)"],
    ];
    function renderFiveQuestions() {
      const holder = document.createElement("div");
      holder.innerHTML = `
        <div class="panel-title mt">五问训练卡 <span class="tag amber">全部认真作答后授予「能解释」</span></div>
        <div class="faint small mb">研究能力分水岭: 会打 payload 只算 L2,能讲清五问才是 L4。用自己的话写,别复述模板。</div>
        ${FIVE_Q.map(([k, t]) => `
          <div class="mb">
            <div class="dim small mb">${t}</div>
            <textarea id="fq-${k}" class="term" style="width:100%;min-height:48px;color:var(--txt);font-size:.8rem;resize:vertical" placeholder="至少 15 个字..."></textarea>
          </div>`).join("")}
        <button class="btn btn-sm btn-primary" id="fq-submit">提交五问</button>
        <div id="fq-result" class="mt"></div>`;
      wrap.querySelector("#vl-result").appendChild(holder);
      holder.querySelector("#fq-submit").onclick = () => {
        const answers = {};
        const shorts = [];
        FIVE_Q.forEach(([k]) => {
          const v = holder.querySelector("#fq-" + k).value.trim();
          answers[k] = v;
          if (v.length < 15) shorts.push(k);
        });
        if (shorts.length) {
          holder.querySelector("#fq-result").innerHTML = `<div class="diag-explain" style="border-color:var(--amber)">还有 ${shorts.length} 问回答太简短(每问至少 15 字)。认真写 — 这是写给未来要独立作战的自己。</div>`;
          return;
        }
        holder.querySelector("#fq-result").innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">五问完成 ✓ 这份理解跟着你上真实战场。已授予「能解释」。</div>`;
        CF.prog.markEvidence(config.nodeId, "e1");
        CF.prog.addXP(30);
        // 存进研究笔记,形成知识库
        CF.store.data.notes.push({
          ts: Date.now(),
          title: `五问 — ${config.typeName}`,
          body: FIVE_Q.map(([k, t]) => `${t}\n${answers[k]}`).join("\n\n"),
        });
        CF.store.save();
      };
    }
    builder.querySelector("#vb-variant").onclick = () => {
      const variants = CF.variants[config.nodeId] || [];
      if (!variants.length) { $.toast("本节点变体即将上线"); return; }
      const v = variants[Math.floor(Math.random() * variants.length)];
      $.modal(`
        <div class="panel-title">变体练习 — ${$.esc(v.title)}</div>
        <div class="dim small" style="line-height:1.8">${$.esc(v.setup)}</div>
        <div class="diag-explain mt">${$.esc(v.task)}</div>
        <div class="faint small mt">提示: ${$.esc(v.hint)}</div>
        <div class="faint small mt">同一原理,外壳变了。如果只会背 payload,这里会卡住 — 这正是设计目的。</div>
        <button class="btn btn-sm mt" onclick="CF.ui.closeModal()">明白了</button>
      `);
      CF.prog.markEvidence(config.nodeId, "e3");
      if (CF.trackVulnCount) CF.trackVulnCount(config.nodeId); // 完成一个变体=一次新的练习量
      CF.store.data.stats.variantsPassed++;
      CF.store.save();
    };
  };

  /* ==================== 各漏洞实验配置 ==================== */
  CF.vulnLabs = {
    w4_sqli: {
      nodeId: "w4_sqli", typeName: "SQL 注入",
      scenario: "商品搜索接口 GET /api/search?q=关键词。后端把 q 直接拼进 SQL: SELECT * FROM items WHERE name='${q}'",
      goal: "证明可以注入 SQL — 让接口返回全部商品(包括不该看到的隐藏数据)。",
      preset: { method: "GET", path: "/api/search?q=phone", headers: "Host: corp.local" },
      hints: [
        "先在 q 里输入一个单引号 ',观察响应 — 500 + MySQL 报错说明输入流进了 SQL。",
        "报错证明信任边界被打破。现在构造闭合: q=phone' OR '1'='1",
        "发送后如果返回了 hidden_admin_note,说明注入成功。",
      ],
      check: (req, resp) => /'\s*or\s*'?1'?='?1/i.test(req.path) && resp.body.includes("FLAG{sql1_m4st3r}"),
      flag: "FLAG{sql1_m4st3r}",
      explain: "原理: 输入被拼接进 SQL 语句,改变了查询语义。修复: 参数化查询(预编译),永远不要拼接用户输入。",
    },
    w5_xss: {
      nodeId: "w5_xss", typeName: "XSS 跨站脚本",
      scenario: "搜索页 GET /xss?q=关键词 会把输入原样输出到 HTML。另有留言板 /guestbook (POST msg=) 存储内容并展示。",
      goal: "证明可以在页面中注入脚本 — 用 <script> 或 <img onerror> 让服务器返回包含可执行脚本的 HTML。",
      preset: { method: "GET", path: "/xss?q=test", headers: "Host: corp.local" },
      hints: [
        "先输入普通文本 test,看响应 HTML 中它出现在哪里。",
        "再输入 <b>test</b> — 如果浏览器会把它渲染成粗体,说明 HTML 注入成立。",
        "最后输入 <script>alert(1)</script> 或 <img src=x onerror=alert(1)>,看响应是否原样包含。",
      ],
      check: (req, resp) => /<script|<img[^>]*onerror|<svg[^>]*onload/i.test(req.path + (req.body || "")) && resp.body.match(/<script|<img[^>]*onerror/i),
      flag: "脚本注入成立(XSS)",
      explain: "原理: 输入未过滤直接输出到 HTML。反射型(立即返回)和存储型(存数据库后被他人浏览)是同源问题。修复: 输出编码 + CSP。",
    },
    w6_csrf: {
      nodeId: "w6_csrf", typeName: "CSRF 跨站请求伪造",
      scenario: "转账接口 POST /api/transfer (Body: to=xxx&amount=100) 只验证 Cookie 会话,不验证请求来源。",
      goal: "证明: 受害者登录状态下访问恶意页面,会在不知情时发出转账请求。先验证接口无 CSRF 防护。",
      preset: { method: "POST", path: "/api/transfer", headers: "Host: corp.local\nCookie: session=用alice登录获取", body: "to=attacker&amount=100" },
      hints: [
        "先 POST /login 用 alice/alice123 拿到 session,填入 Cookie 头。",
        "发送转账请求,观察: 服务器有没有要求 CSRF Token? 有没有检查 Referer?",
        "都没有 = CSRF 成立。恶意页面只需一个自动提交的表单即可利用。",
      ],
      check: (req, resp) => req.path === "/api/transfer" && resp.status === 200 && resp.body.includes("转账"),
      flag: "CSRF 成立(无 Token 无来源校验)",
      explain: "原理: 浏览器自动带 Cookie,服务器无法区分请求来自本站表单还是恶意页面。修复: CSRF Token + SameSite Cookie + Referer 校验。",
    },
    w7_upload: {
      nodeId: "w7_upload", typeName: "文件上传绕过",
      scenario: "上传接口 POST /api/upload (JSON: {filename, content_type})。白名单: jpg/png/gif。",
      goal: "绕过白名单上传一个 .php 文件(webshell)。至少找到一种绕过方式。",
      preset: { method: "POST", path: "/api/upload", headers: "Host: corp.local\nContent-Type: application/json", body: '{"filename":"shell.php","content_type":"application/x-php"}' },
      hints: [
        "直接传 shell.php 会被拒。观察服务器检查逻辑: 是查扩展名还是 Content-Type?",
        "尝试双扩展名: shell.php.jpg — 有些服务器解析时只看最后/第一个扩展名。",
        "尝试 Content-Type 伪造: filename=shell.php 但 content_type=image/jpeg。",
      ],
      check: (req, resp) => resp.body.includes("FLAG{upl04d_byp4ss}") || resp.body.includes("FLAG{ct_f0rg3ry}"),
      flag: "上传绕过成功",
      explain: "原理: 校验逻辑存在缝隙(只看结尾扩展名/只信客户端 Content-Type)。修复: 服务端重命名 + 白名单+内容检测 + 上传目录禁止执行。",
    },
    w8_ssrf: {
      nodeId: "w8_ssrf", typeName: "SSRF 服务端请求伪造",
      scenario: "图片抓取功能 GET /api/fetch?url=地址 — 服务器会代你请求该 URL 并返回内容。需要登录(用 alice session)。",
      goal: "让服务器去访问它自己的内网资源: 169.254.169.254 (云元数据) 或 127.0.0.1 (内部管理面板)。",
      preset: { method: "GET", path: "/api/fetch?url=http://example.com/pic.jpg", headers: "Host: corp.local\nCookie: session=用alice登录获取" },
      hints: [
        "先正常抓取一个外部 URL,确认功能: 服务器代替客户端发请求。",
        "关键问题: 服务器在内网,它能访问客户端访问不到的地址吗?",
        "把 url 改成 http://169.254.169.254/latest/meta-data/iam/ 或 http://127.0.0.1/admin 试试。",
      ],
      check: (req, resp) => resp.body.includes("FLAG{ssrf"),
      flag: "SSRF 成功(拿到内网数据)",
      explain: "原理: 服务端代发请求且未过滤内网地址。危害: 打内网、读云元数据凭证。修复: URL 白名单 + 禁止内网段 + 禁用重定向跟随。",
    },
    w9_cmdi: {
      nodeId: "w9_cmdi", typeName: "命令注入",
      scenario: "网络诊断工具 GET /api/ping?host=地址 — 后端执行: ping -c 4 ${host}。",
      goal: "证明可以在服务器上执行任意命令 — 让接口返回 id 或 whoami 的执行结果。",
      preset: { method: "GET", path: "/api/ping?host=127.0.0.1", headers: "Host: corp.local" },
      hints: [
        "正常输入 127.0.0.1,观察返回的是 ping 输出 — 说明输入流进了 shell 命令。",
        "shell 里的命令分隔符: ; | && || 都可以串联新命令。",
        "试试 host=127.0.0.1;id 或 host=127.0.0.1|whoami",
      ],
      check: (req, resp) => resp.body.includes("FLAG{cmd_1nj3ct10n}"),
      flag: "FLAG{cmd_1nj3ct10n}",
      explain: "原理: 用户输入被拼进 shell 命令字符串。修复: 不要用 shell 执行外部命令,用参数数组形式的 API; 必须用时严格白名单。",
    },
    w10_api: {
      nodeId: "w10_api", typeName: "JWT 签名绕过",
      scenario: "API 用 JWT 认证: POST /api/token 登录拿 token,GET /api/me 带 Authorization: Bearer 头访问。",
      goal: "把普通用户 token 改成 admin — 利用 alg=none 绕过签名验证。",
      preset: { method: "POST", path: "/api/token", headers: "Host: corp.local\nContent-Type: application/json", body: '{"username":"alice","password":"alice123"}' },
      hints: [
        "先登录拿 token。JWT 结构: base64(header).base64(payload).signature",
        "用 atob 解码 header 和 payload(浏览器控制台或手算),看看里面有什么。",
        "把 header 的 alg 改成 none, payload 的 role 改成 admin, 重新 base64 拼接, 签名段留空, 发给 /api/me。",
      ],
      check: (req, resp) => req.path === "/api/me" && resp.body.includes("FLAG{jwt_n0n3_4lg}"),
      flag: "FLAG{jwt_n0n3_4lg}",
      explain: "原理: 库配置错误接受了 alg=none 的无签名 token。修复: 强制指定算法白名单, 禁止 none。",
    },
    w11_logic: {
      nodeId: "w11_logic", typeName: "业务逻辑漏洞",
      scenario: "下单接口 POST /api/order (JSON: {qty, price})。需要登录。系统没有校验数量和价格的合理性。",
      goal: "创建一个『负金额订单』— 让系统反过来给你加钱。",
      preset: { method: "POST", path: "/api/order", headers: "Host: corp.local\nCookie: session=用alice登录获取\nContent-Type: application/json", body: '{"qty":1,"price":100}' },
      hints: [
        "先正常下单,理解业务流程: qty × price = 扣款金额。",
        "思考: 系统假设了 qty 和 price 是正数吗? 验证一下。",
        "试试 qty=-1 或 price=-100。",
      ],
      check: (req, resp) => resp.body.includes("FLAG{n3g4t1v3_pr1c3}"),
      flag: "FLAG{n3g4t1v3_pr1c3}",
      explain: "原理: 代码里的隐式假设(数量必为正)从未被验证。这类漏洞扫描器找不到,只能靠理解业务。SRC 中价值最高。",
    },
  };
})();
