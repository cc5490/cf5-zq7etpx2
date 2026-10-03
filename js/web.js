/* ============================================================
   CYBER FRONTIER V5.0 — web.js
   阶段1: HTTP Request Lab / Burp Repeater / Authentication
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== 模拟 Web 服务器 ==================== */
  // 一个虚拟的 Web 应用,根据请求返回响应。这是所有 Web 训练的"靶场"。
  const VirtualServer = {
    users: {
      "alice": { pass: "alice123", role: "user", id: 101 },
      "bob": { pass: "bob456", role: "user", id: 102 },
      "admin": { pass: "admin2024", role: "admin", id: 1 },
    },
    profiles: {
      101: { name: "Alice", email: "alice@corp.local", balance: 500 },
      102: { name: "Bob", email: "bob@corp.local", balance: 320, secret: "FLAG{1d0r_1s_3asy}" },
      1: { name: "Admin", email: "admin@corp.local", balance: 99999, secret: "FLAG{4dm1n_p4n3l}" },
    },
    sessions: {},
    handle(req) {
      const { method, path, headers, body } = req;
      const cookie = headers["Cookie"] || "";
      const sessionId = (cookie.match(/session=([a-z0-9]+)/) || [])[1];
      const session = this.sessions[sessionId];
      const R = (status, headers, bodyText) => ({ status, headers, body: bodyText });
      const json = (o) => JSON.stringify(o, null, 2);

      // 路由
      if (path === "/" || path === "/index.html") {
        return R(200, { "Content-Type": "text/html" }, `<html><body><h1>Corp Portal</h1><a href="/login">Login</a></body></html>`);
      }
      if (path === "/login" && method === "GET") {
        return R(200, { "Content-Type": "text/html" }, `<html><body><form>Login Form (POST /login)</form></body></html>`);
      }
      if (path === "/login" && method === "POST") {
        let creds = {};
        try { creds = JSON.parse(body || "{}"); } catch (e) { /* urlencoded fallback */
          (body || "").split("&").forEach((kv) => { const [k, v] = kv.split("="); creds[k] = decodeURIComponent(v || ""); });
        }
        const u = this.users[creds.username];
        if (u && u.pass === creds.password) {
          const sid = "s" + Math.random().toString(36).slice(2, 10);
          this.sessions[sid] = { user: creds.username, role: u.role, uid: u.id };
          return R(200, { "Content-Type": "application/json", "Set-Cookie": `session=${sid}; Path=/; HttpOnly` },
            json({ ok: true, msg: "登录成功", session: sid, uid: u.id }));
        }
        return R(401, { "Content-Type": "application/json" }, json({ ok: false, msg: "用户名或密码错误" }));
      }
      if (path.startsWith("/api/profile")) {
        if (!session) return R(401, { "Content-Type": "application/json" }, json({ error: "未登录" }));
        const m = path.match(/user_id=(\d+)/);
        const uid = m ? parseInt(m[1]) : session.uid;
        // ⚠️ 故意的漏洞: 只验证登录,不验证数据归属 → IDOR
        const p = this.profiles[uid];
        if (!p) return R(404, { "Content-Type": "application/json" }, json({ error: "用户不存在" }));
        return R(200, { "Content-Type": "application/json" }, json(p));
      }
      if (path === "/api/admin" || path.startsWith("/api/admin?")) {
        if (!session) return R(401, { "Content-Type": "application/json" }, json({ error: "未登录" }));
        if (session.role !== "admin") return R(403, { "Content-Type": "application/json" }, json({ error: "需要管理员权限" }));
        return R(200, { "Content-Type": "application/json" }, json({ users: Object.keys(this.users), flag: "FLAG{4dm1n_4cc3ss}" }));
      }
      if (path.startsWith("/api/search")) {
        const m = path.match(/[?&]q=([^&]*)/);
        const q = m ? decodeURIComponent(m[1]) : "";
        // ⚠️ 故意的漏洞: 模拟 SQL 注入 — 遇到 ' 报错,遇到 OR 1=1 返回全部
        if (q.includes("'")) {
          if (/'\s*or\s*'1'='1/i.test(q) || /'\s*or\s*1=1/i.test(q)) {
            return R(200, { "Content-Type": "application/json" }, json({ results: [
              { id: 1, item: "book", price: 30 }, { id: 2, item: "phone", price: 3000 },
              { id: 3, item: "hidden_admin_note", content: "FLAG{sql1_m4st3r}" }] }));
          }
          return R(500, { "Content-Type": "text/html" }, `SQL syntax error near '${$.esc(q)}' — MySQL server version 8.0.32`);
        }
        return R(200, { "Content-Type": "application/json" }, json({ results: q ? [{ id: 1, item: q, price: 30 }] : [] }));
      }
      if (path === "/robots.txt") {
        return R(200, { "Content-Type": "text/plain" }, "User-agent: *\nDisallow: /backup/\nDisallow: /api/internal/");
      }
      if (path === "/backup/" || path === "/api/internal/") {
        return R(200, { "Content-Type": "application/json" }, json({ note: "内部接口,勿外传", db_backup: "/backup/db.sql", flag: "FLAG{1nf0_d1scl0sur3}" }));
      }
      return R(404, { "Content-Type": "text/html" }, `<html><body><h1>404 Not Found</h1></body></html>`);
    },
  };
  CF.server = VirtualServer;

  /* ==================== 通用请求构造器 ==================== */
  function requestBuilder(container, opts) {
    const { preset, onResponse, history } = opts;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div>
          <div class="faint small mb">请求 Request</div>
          <div class="row mb" style="gap:6px">
            <select id="rq-method" class="diag-opt" style="width:90px;padding:7px;font-family:var(--mono)">
              ${["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => `<option ${preset && preset.method === m ? "selected" : ""}>${m}</option>`).join("")}
            </select>
            <input id="rq-path" class="diag-opt mono" style="flex:1;padding:7px 12px" value="${preset ? $.esc(preset.path) : "/"}" spellcheck="false">
          </div>
          <textarea id="rq-headers" class="term" style="width:100%;min-height:110px;color:var(--txt);font-size:.78rem;resize:vertical" spellcheck="false">${preset ? $.esc(preset.headers) : "Host: corp.local\nUser-Agent: FrontierLab/1.0"}</textarea>
          <textarea id="rq-body" class="term mt" style="width:100%;min-height:60px;color:var(--txt);font-size:.78rem;resize:vertical" placeholder="Body (POST 时填写, JSON 或 urlencoded)" spellcheck="false">${preset && preset.body ? $.esc(preset.body) : ""}</textarea>
          <button class="btn btn-primary btn-sm mt" id="rq-send">发送 →</button>
        </div>
        <div>
          <div class="faint small mb">响应 Response</div>
          <div id="rq-resp" class="term" style="min-height:200px;font-size:.78rem;white-space:pre-wrap;word-break:break-all">
            <span class="faint">点击"发送"查看响应...</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(wrap);
    wrap.querySelector("#rq-send").onclick = () => {
      const method = wrap.querySelector("#rq-method").value;
      const path = wrap.querySelector("#rq-path").value.trim() || "/";
      const headers = {};
      wrap.querySelector("#rq-headers").value.split("\n").forEach((l) => {
        const i = l.indexOf(":");
        if (i > 0) headers[l.slice(0, i).trim()] = l.slice(i + 1).trim();
      });
      const body = wrap.querySelector("#rq-body").value;
      const resp = VirtualServer.handle({ method, path, headers, body });
      const statusColor = resp.status < 300 ? "var(--green)" : resp.status < 500 ? "var(--amber)" : "var(--red)";
      wrap.querySelector("#rq-resp").innerHTML =
        `<span style="color:${statusColor};font-weight:700">HTTP/1.1 ${resp.status}</span>\n` +
        Object.entries(resp.headers).map(([k, v]) => `<span style="color:var(--purple)">${k}</span>: ${$.esc(v)}`).join("\n") +
        `\n\n${$.esc(resp.body)}`;
      if (history) history.push({ method, path, headers: wrap.querySelector("#rq-headers").value, body, status: resp.status });
      if (onResponse) onResponse(resp, { method, path, headers, body });
    };
    return wrap;
  }

  /* ==================== W0 HTTP Request Lab ==================== */
  CF.renderHttpLab = (container) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">这是一个<b>真实可用的模拟 Web 服务器</b>。试着:</div>
      <div class="small dim mb" style="line-height:1.9">
        1. GET / — 看首页<br>
        2. POST /login — Body 填 <span class="mono" style="color:var(--cyan)">{"username":"alice","password":"alice123"}</span> 登录<br>
        3. 把响应中的 session 复制到 Cookie 头,再 GET /api/profile — 看登录后的数据<br>
        4. GET /robots.txt — 看看有没有意外收获
      </div>
      <div id="http-lab"></div>
      <div id="http-task" class="mt"></div>
    `;
    container.appendChild(wrap);
    let loggedIn = false, authed = false;
    requestBuilder(wrap.querySelector("#http-lab"), {
      preset: { method: "GET", path: "/", headers: "Host: corp.local\nUser-Agent: FrontierLab/1.0" },
      onResponse: (resp, req) => {
        if (req.path === "/login" && resp.status === 200) loggedIn = true;
        if (req.path.includes("/api/profile") && /session=\S/.test(req.headers || "") && resp.status === 200) authed = true;
        const t = wrap.querySelector("#http-task");
        if (authed) {
          t.innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">完整链路跑通: 登录拿会话 → 带 Cookie 访问授权接口。你刚刚亲手走完了浏览器/Burp 里每天都在发生的事。</div>`;
          CF.prog.markEvidence("w0_http", "e2");
        } else if (loggedIn) {
          t.innerHTML = `<div class="diag-explain">登录成功! 复制响应里的 session 值,在请求头加一行 <span class="mono">Cookie: session=你的值</span>,然后请求 GET /api/profile。</div>`;
        }
      },
    });
  };

  /* ==================== W1 Burp Repeater ==================== */
  CF.renderBurpLab = (container) => {
    const history = [];
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">Burp 核心循环: <b>观察请求 → 修改请求 → 比较响应 → 建立假设 → 验证</b>。下方是你的 HTTP History 和 Repeater。</div>
      <div id="burp-builder"></div>
      <div class="panel-title mt">HTTP History</div>
      <div id="burp-history" style="max-height:160px;overflow-y:auto;font-family:var(--mono);font-size:.78rem"></div>
      <div id="burp-task" class="mt"></div>
    `;
    container.appendChild(wrap);
    const histEl = wrap.querySelector("#burp-history");
    let loggedIn = false, sawOther = false;

    requestBuilder(wrap.querySelector("#burp-builder"), {
      preset: { method: "POST", path: "/login", headers: "Host: corp.local\nContent-Type: application/json", body: '{"username":"alice","password":"alice123"}' },
      history,
      onResponse: (resp, req) => {
        histEl.innerHTML = history.slice().reverse().map((h) =>
          `<div style="padding:4px 0;border-bottom:1px solid var(--line-soft)">
            <span style="color:var(--cyan)">${h.method}</span> ${$.esc(h.path)}
            <span style="color:${h.status < 300 ? "var(--green)" : h.status < 500 ? "var(--amber)" : "var(--red)"}"> [${h.status}]</span>
          </div>`).join("");
        // 任务检测: 是否完成了 IDOR 发现
        if (req.path === "/login" && resp.status === 200) loggedIn = true;
        if (req.path.includes("user_id=102") && resp.status === 200) sawOther = true;
        const taskEl = wrap.querySelector("#burp-task");
        if (loggedIn && !sawOther) {
          taskEl.innerHTML = `<div class="diag-explain">你已登录为 Alice (uid=101)。现在试试: 用 Repeater 把 GET /api/profile 改成 /api/profile?user_id=102,带着你的 session Cookie 发送。观察响应。</div>`;
        }
        if (sawOther) {
          taskEl.innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">你拿到了 Bob 的资料和 FLAG{1d0r_1s_3asy}!<br>这就是 IDOR: 服务器验证了你"登录了",但没验证"这条数据是不是你的"。<br>记住这个手法: <b>改标识符 → 看响应 → 对照两个账号</b>。</div>`;
          CF.prog.markEvidence("w1_burp", "e2");
          CF.prog.addXP(80);
        }
      },
    });
  };

  /* ==================== W2 Authentication ==================== */
  CF.renderAuthLab = (container) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">认证失效训练。场景: 登录接口。目标: 不通过 alice 的密码登录系统。</div>
      <div id="auth-builder"></div>
      <div id="auth-task" class="mt"></div>
    `;
    container.appendChild(wrap);
    let done = false;
    requestBuilder(wrap.querySelector("#auth-builder"), {
      preset: { method: "POST", path: "/login", headers: "Host: corp.local\nContent-Type: application/json", body: '{"username":"alice","password":"wrong"}' },
      onResponse: (resp, req) => {
        const taskEl = wrap.querySelector("#auth-task");
        if (done) return;
        // 检测各种尝试
        if (req.body.includes("'") || req.body.includes("OR")) {
          taskEl.innerHTML = `<div class="diag-explain">有意思 — 你在尝试 SQL 注入登录绕过。但本系统登录用的是参数化查询,注入无效。这是"假设被证伪"的正常过程,记住: <b>验证失败的假设也是收获</b>。试试别的思路。</div>`;
        } else if (resp.status === 200 && req.body.includes("alice123")) {
          taskEl.innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">登录成功。alice 用了弱密码 alice123 — 这就是"认证失效"最常见的原因: 弱口令 + 无爆破限制。<br>真实场景中: 先查默认口令 → 再查弱口令字典 → 注意是否有锁定/验证码机制。</div>`;
          done = true;
          CF.prog.markEvidence("w2_auth", "e2");
          CF.prog.addXP(60);
          if (CF.trackVulnCount) CF.trackVulnCount("w2_auth");
        } else if (resp.status === 401) {
          taskEl.innerHTML = `<div class="diag-explain">密码错误。提示: 真实世界的弱密码长什么样? 试试 用户名+数字 的组合(比如 alice123)。</div>`;
        }
      },
    });
  };
})();
