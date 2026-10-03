/* ============================================================
   CYBER FRONTIER V5.0 — finale.js
   第6步: WEB BOSS / Research 阶段 / SRC 报告系统 / UNKNOWN TARGET 毕业认证
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== 通用请求构造器(精简复用) ==================== */
  function builder(container, preset, onResp) {
    const w = document.createElement("div");
    w.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div>
          <div class="row mb" style="gap:6px">
            <select class="b-method diag-opt" style="width:90px;padding:7px;font-family:var(--mono)">
              ${["GET","POST","PUT","DELETE"].map((m)=>`<option ${preset.method===m?"selected":""}>${m}</option>`).join("")}
            </select>
            <input class="b-path diag-opt mono" style="flex:1;padding:7px 12px" value="${$.esc(preset.path)}" spellcheck="false">
          </div>
          <textarea class="b-headers term" style="width:100%;min-height:80px;color:var(--txt);font-size:.78rem" spellcheck="false">${$.esc(preset.headers)}</textarea>
          <textarea class="b-body term mt" style="width:100%;min-height:50px;color:var(--txt);font-size:.78rem" placeholder="Body" spellcheck="false">${$.esc(preset.body||"")}</textarea>
          <button class="btn btn-primary btn-sm mt b-send">发送 →</button>
        </div>
        <div><div class="b-resp term" style="min-height:180px;font-size:.78rem;white-space:pre-wrap;word-break:break-all"><span class="faint">...</span></div></div>
      </div>`;
    container.appendChild(w);
    w.querySelector(".b-send").onclick = () => {
      const headers = {};
      w.querySelector(".b-headers").value.split("\n").forEach((l) => {
        const i = l.indexOf(":"); if (i > 0) headers[l.slice(0,i).trim()] = l.slice(i+1).trim();
      });
      const req = { method: w.querySelector(".b-method").value, path: w.querySelector(".b-path").value.trim(), headers, body: w.querySelector(".b-body").value };
      const resp = CF.server.handle(req);
      const sc = resp.status < 300 ? "var(--green)" : resp.status < 500 ? "var(--amber)" : "var(--red)";
      w.querySelector(".b-resp").innerHTML =
        `<span style="color:${sc};font-weight:700">HTTP/1.1 ${resp.status}</span>\n` +
        Object.entries(resp.headers).map(([k,v])=>`<span style="color:var(--purple)">${k}</span>: ${$.esc(v)}`).join("\n") +
        `\n\n${$.esc(resp.body)}`;
      if (onResp) onResp(req, resp);
    };
  }

  /* ==================== W_BOSS: 3小时未知靶场 ==================== */
  // 目标: shop.local 藏有 3 个漏洞(IDOR + SQLi + 信息泄露),不限顺序,找到任意 2 个并写报告
  CF.renderWebBoss = (container) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="diag-explain" style="border-color:var(--red);margin-bottom:12px">
        <b>WEB BOSS — 未知靶场考核</b><br>
        目标: <span class="mono" style="color:var(--cyan)">corp.local</span> 的完整 Web 应用。<br>
        规则: 不告诉你漏洞类型、位置、参数。已知信息只有: 存在 alice/alice123 测试账号。<br>
        通过标准: 找到至少 <b>2 个不同类别的漏洞</b> 并各写出证明。下方会记录你的发现。
      </div>
      <div class="row mb" style="gap:8px">
        <span class="tag cyan">侦察提示: GET / → /robots.txt → 登录 → 探索功能</span>
        <span class="tag" id="boss-found">已发现: 0 / 2</span>
      </div>
      <div id="wb-builder"></div>
      <div id="wb-findings" class="mt"></div>
      <div id="wb-pass"></div>
    `;
    container.appendChild(wrap);
    const found = new Set();
    const recheck = () => {
      wrap.querySelector("#boss-found").textContent = `已发现: ${found.size} / 2`;
      const labels = { idor: "IDOR 越权", sqli: "SQL 注入", info: "敏感信息泄露", ssrf: "SSRF", cmdi: "命令注入", logic: "业务逻辑" };
      wrap.querySelector("#wb-findings").innerHTML = [...found].map((f) =>
        `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green);margin-bottom:6px">✓ ${labels[f]} — 已记录证据</div>`).join("");
      if (found.size >= 2) {
        wrap.querySelector("#wb-pass").innerHTML = `
          <div class="diag-explain" style="border-color:var(--amber);color:var(--amber)">
            <b>WEB BOSS 通过!</b> 你在未知目标上独立发现了 ${found.size} 类漏洞。<br>
            下一步: 进入 SRC 阶段,学会写出让审核员无法拒绝的报告。
          </div>`;
        CF.prog.markEvidence("w_boss", "e2"); CF.prog.markEvidence("w_boss", "e4");
        CF.prog.addXP(300);
      }
    };
    builder(wrap.querySelector("#wb-builder"),
      { method: "GET", path: "/", headers: "Host: corp.local\nUser-Agent: FrontierLab/1.0" },
      (req, resp) => {
        if (resp.body.includes("FLAG{1d0r_1s_3asy}")) found.add("idor");
        if (resp.body.includes("FLAG{sql1_m4st3r}")) found.add("sqli");
        if (resp.body.includes("FLAG{1nf0_d1scl0sur3}")) found.add("info");
        if (resp.body.includes("FLAG{ssrf")) found.add("ssrf");
        if (resp.body.includes("FLAG{cmd_1nj3ct10n}")) found.add("cmdi");
        if (resp.body.includes("FLAG{n3g4t1v3_pr1c3}")) found.add("logic");
        recheck();
      });
  };

  /* ==================== R0-R3: Research 场景判断 ==================== */
  // 误报判断训练: 给响应,让玩家判断 漏洞/低风险/误报
  CF.renderFpTrainer = (container) => {
    const cases = [
      { title: "案例1", resp: "GET /api/profile?user_id=102 → 200,返回了 Bob 的姓名和邮箱(你登录为 Alice)", q: "这是什么?", opts: ["有效漏洞(高危越权)", "误报", "低风险信息", "正常现象"], a: 0,
        why: "他人 PII 数据可被任意读取 = 有效越权漏洞,高危。" },
      { title: "案例2", resp: "GET /static/logo.png → 响应头 Server: nginx/1.18.0", q: "这是什么?", opts: ["有效漏洞", "低风险信息泄露(版本号)", "误报", "高危漏洞"], a: 1,
        why: "版本号泄露是低危信息泄露,多数 SRC 评为『忽略』或『低危』。不能单独作为高危报告。" },
      { title: "案例3", resp: "GET /api/search?q=test' → 200,正常返回空结果,无报错", q: "这是什么?", opts: ["确认 SQL 注入", "正常现象 — 单引号未引起异常,注入可能不存在", "高危漏洞", "命令注入"], a: 1,
        why: "单引号没有引发任何异常,说明输入可能被参数化处理了。这是『假设被证伪』— 应换参数或换位置,不能写报告。" },
      { title: "案例4", resp: "POST /api/transfer 无 CSRF Token → 200 转账成功,但该接口只在 localhost 内部网络可达", q: "这是什么?", opts: ["有效漏洞", "技术上成立但无实际影响(内网接口,浏览器无法触发)", "误报", "高危"], a: 1,
        why: "漏洞成立需要『可被攻击者触发』。内网接口无法被恶意页面触达,影响不成立 — 这是影响评估能力。" },
    ];
    let cur = 0, score = 0;
    const wrap = document.createElement("div");
    const render = () => {
      if (cur >= cases.length) {
        wrap.innerHTML = `<div class="diag-explain" style="border-color:${score >= 3 ? "var(--green-dim)" : "var(--amber)"}">
          完成 ${score}/${cases.length}。${score >= 3 ? "你已具备区分漏洞与误报的能力 — 这是 SRC 不浪费审核员时间的关键。" : "建议重做一次,误报判断是研究员的核心竞争力。"}</div>`;
        if (score >= 3) { CF.prog.markEvidence("r3_fp", "e1"); CF.prog.markEvidence("r3_fp", "e4"); CF.prog.addXP(80); }
        return;
      }
      const c = cases[cur];
      wrap.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">${c.title}</b><span class="tag purple">${cur+1}/${cases.length}</span></div>
        <div class="term mb" style="font-size:.8rem">${$.esc(c.resp)}</div>
        <div class="dim small mb">${c.q}</div>
        ${c.opts.map((o,i)=>`<button class="diag-opt" data-i="${i}">${o}</button>`).join("")}
        <div id="fp-why"></div>`;
      wrap.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.i);
          wrap.querySelectorAll("[data-i]").forEach((x) => {
            x.disabled = true;
            if (parseInt(x.dataset.i) === c.a) x.classList.add("correct");
            else if (x === b) x.classList.add("wrong");
          });
          if (i === c.a) score++;
          wrap.querySelector("#fp-why").innerHTML = `<div class="diag-explain mt">${c.why}</div>
            <button class="btn btn-sm btn-primary mt" id="fp-next">下一案例 →</button>`;
          wrap.querySelector("#fp-next").onclick = () => { cur++; render(); };
        };
      });
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== R0: 攻击面标注 ==================== */
  CF.renderReconLab = (container) => {
    const items = [
      { text: "GET /api/profile?user_id=101 (需登录)", tags: ["input", "boundary"] },
      { text: "POST /login (任何人可访问)", tags: ["input"] },
      { text: "Cookie: session=xxx (浏览器自动携带)", tags: ["identity"] },
      { text: "数据库查询 users WHERE id=?", tags: ["dataflow"] },
      { text: "响应头 Server: nginx", tags: [] },
    ];
    const legend = { input: "输入点", boundary: "信任边界", identity: "身份关系", dataflow: "数据流" };
    let marked = {};
    const wrap = document.createElement("div");
    const render = () => {
      wrap.innerHTML = `
        <div class="dim small mb">给每个系统元素标注它在攻击面中的角色(可多选)。全部标对即完成。</div>
        <div class="row mb" style="gap:6px">${Object.entries(legend).map(([k,v])=>`<span class="tag cyan">${v}</span>`).join("")}</div>
        ${items.map((it, ii) => `
          <div class="task-item" style="flex-wrap:wrap">
            <div class="t-name mono" style="font-size:.8rem;flex-basis:100%">${$.esc(it.text)}</div>
            ${Object.entries(legend).map(([k,v]) => `
              <span class="tag" data-ii="${ii}" data-k="${k}" style="cursor:pointer;${(marked[ii]||[]).includes(k) ? "border-color:var(--cyan);color:var(--cyan)" : ""}">${v}</span>`).join("")}
          </div>`).join("")}
        <button class="btn btn-sm btn-primary" id="recon-check">提交标注</button>
        <div id="recon-result" class="mt"></div>`;
      wrap.querySelectorAll("[data-ii]").forEach((t) => {
        t.onclick = () => {
          const ii = t.dataset.ii, k = t.dataset.k;
          marked[ii] = marked[ii] || [];
          marked[ii] = marked[ii].includes(k) ? marked[ii].filter((x) => x !== k) : [...marked[ii], k];
          render();
        };
      });
      wrap.querySelector("#recon-check").onclick = () => {
        const ok = items.every((it, ii) => {
          const got = (marked[ii] || []).sort().join(",");
          const want = it.tags.slice().sort().join(",");
          return got === want;
        });
        const r = wrap.querySelector("#recon-result");
        if (ok) {
          r.innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">全部正确! 攻击面建模完成: 输入点=用户可控的地方, 信任边界=权限变化处, 身份关系=谁是谁, 数据流=输入流向哪里。</div>`;
          CF.prog.markEvidence("r0_recon", "e1"); CF.prog.markEvidence("r0_recon", "e2"); CF.prog.addXP(60);
        } else {
          r.innerHTML = `<div class="diag-explain">有标注不对。提示: nginx 版本号只是信息,不是输入点也不是信任边界。</div>`;
        }
      };
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== S1: 报告写作器 ==================== */
  CF.renderReportWriter = (container, preset) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">SRC 报告 = 让审核员不看代码也能复现并认可影响。字段不全或空洞会被打回。</div>
      ${[
        ["title", "标题(资产+漏洞类型+影响,一句话)"],
        ["asset", "受影响资产(URL/接口/参数)"],
        ["cause", "漏洞原因(为什么产生,信任边界在哪)"],
        ["steps", "复现步骤(编号,精确到每个请求)"],
        ["poc", "PoC / 证据(请求+响应,关键部分截图描述)"],
        ["impact", "影响(攻击者能做什么,危害有多大)"],
        ["fix", "修复建议(具体到技术方案)"],
      ].map(([k, label]) => `
        <div class="mb">
          <div class="faint small mb" style="font-size:.74rem">${label}</div>
          <textarea id="rp-${k}" class="term" style="width:100%;min-height:${k==="title"||k==="asset" ? "40px" : "70px"};color:var(--txt);font-size:.8rem;resize:vertical">${preset && preset[k] ? $.esc(preset[k]) : ""}</textarea>
        </div>`).join("")}
      <button class="btn btn-primary" id="rp-submit">提交审核</button>
      <div id="rp-result" class="mt"></div>
    `;
    container.appendChild(wrap);
    wrap.querySelector("#rp-submit").onclick = () => {
      const get = (k) => wrap.querySelector("#rp-" + k).value.trim();
      const report = {
        ts: Date.now(), target: get("asset").slice(0, 60), title: get("title"),
        body: `## 原因\n${get("cause")}\n\n## 复现\n${get("steps")}\n\n## PoC\n${get("poc")}\n\n## 影响\n${get("impact")}\n\n## 修复\n${get("fix")}`,
        status: "待审核", feedback: "",
      };
      // 审核规则: 逐项检查
      const fails = [];
      if (get("title").length < 10) fails.push("标题太笼统,看不出资产和漏洞类型");
      if (get("asset").length < 5) fails.push("缺少明确的受影响资产");
      if (get("cause").length < 20) fails.push("信息不足: 漏洞原因解释不清");
      if (get("steps").length < 30 || !/1[.、]|第一步/i.test(get("steps"))) fails.push("复现步骤不完整: 需要编号步骤,审核员要能照做");
      if (get("poc").length < 20) fails.push("证据不足: PoC 部分需要具体的请求和响应");
      if (get("impact").length < 15) fails.push("影响说明不足: 要说清攻击者实际能造成什么危害");
      if (get("fix").length < 10) fails.push("缺少可落地的修复建议");
      if (fails.length) {
        report.status = "返修";
        report.feedback = "审核员打回:\n" + fails.map((f) => "· " + f).join("\n");
        $.toast("报告被打回,查看反馈");
      } else {
        report.status = "有效";
        report.feedback = "审核通过。报告结构完整、可复现、影响明确。+300 XP";
        CF.prog.markEvidence("s1_report", "e5"); CF.prog.markEvidence("s2_review", "e5");
        CF.prog.addXP(300);
      }
      CF.store.data.reports.push(report);
      CF.store.save();
      wrap.querySelector("#rp-result").innerHTML = `<div class="diag-explain" style="border-color:${fails.length ? "var(--red)" : "var(--green-dim)"};color:${fails.length ? "var(--txt)" : "var(--green)"};white-space:pre-wrap">${report.feedback}</div>`;
    };
  };

  /* ==================== S_BOSS: UNKNOWN TARGET 毕业考核 ==================== */
  CF.renderFinalBoss = (container) => {
    const wrap = document.createElement("div");
    const phase = CF.store.data.finalPhase || "gate";
    wrap.innerHTML = `
      <div class="diag-explain" style="border-color:var(--red);margin-bottom:12px">
        <b>UNKNOWN TARGET — 毕业考核</b><br>
        这是最后的测试。没有课程标签、没有漏洞提示、没有步骤。<br>
        流程: <b>1.读 Scope → 2.侦察 → 3.建模 → 4.定位 → 5.验证 → 6.报告 → 7.审核通过</b>
      </div>
      <div id="fb-body"></div>`;
    container.appendChild(wrap);
    const body = wrap.querySelector("#fb-body");
    const setPhase = (p) => { CF.store.data.finalPhase = p; CF.store.save(); renderPhase(p); };

    function renderPhase(p) {
      if (p === "gate") {
        const vp = CF.renderVulnProgress ? CF.renderVulnProgress() : { have: 0, total: 50, pct: 0, got: {} };
        const radar = CF.computeRadar ? CF.computeRadar() : { vals: [0,0,0,0,0], labels: [] };
        // 前四维(解释/操作/迁移/独立发现)阈值 10; E5 写报告单独要求至少 1 份审核通过的报告
        const weakDims = radar.labels.slice(0, 4).filter((_, i) => radar.vals[i] < 10);
        const validReports = CF.store.data.reports.filter((r) => r.status === "有效").length;
        const checks = [vp.have >= vp.total, weakDims.length === 0, validReports >= 1];
        const ready = checks.every(Boolean);
        body.innerHTML = `
          <div class="panel-title">毕业资格审查</div>
          <div class="dim small mb">UNKNOWN TARGET 是终极考核。进入前系统审查三项硬条件。</div>
          <div class="task-item ${checks[0] ? "" : "task-locked"}">
            <div class="t-name">① 漏洞练习硬指标: ${vp.have}/${vp.total} ${checks[0] ? "✓" : ""}</div>
            <div class="faint small">SQLi ${vp.got.sqli||0}/10 · XSS ${vp.got.xss||0}/10 · 越权 ${vp.got.access||0}/10 · SSRF ${vp.got.ssrf||0}/5 · 认证 ${vp.got.auth||0}/5 · 上传 ${vp.got.upload||0}/5 · 逻辑 ${vp.got.logic||0}/5</div>
          </div>
          <div class="task-item ${checks[1] ? "" : "task-locked"}">
            <div class="t-name">② 核心四维无短板: ${checks[1] ? "✓" : "✗ " + weakDims.join("、")}</div>
            <div id="gate-radar" style="display:flex;justify-content:center"></div>
          </div>
          <div class="task-item ${checks[2] ? "" : "task-locked"}">
            <div class="t-name">③ 至少 1 份审核通过的报告: ${validReports} 份 ${checks[2] ? "✓" : ""}</div>
            <div class="faint small">在 SRC → 报告写作 节点完成七要素报告并通过审核。</div>
          </div>
          ${ready
            ? `<button class="btn btn-primary mt" id="gate-go">资格通过,进入考核 →</button>`
            : `<div class="diag-explain" style="border-color:var(--amber)">资格不足。练习量靠变体实验累计; 能力维度靠完成七步+交互; 报告在 S1 节点写。</div>`}
        `;
        if (CF.renderRadar) CF.renderRadar(body.querySelector("#gate-radar"), 200);
        const go = body.querySelector("#gate-go");
        if (go) go.onclick = () => setPhase("scope");
        return;
      }
      if (p === "scope") {
        body.innerHTML = `
          <div class="panel-title">第 1 关: Scope 确认</div>
          <div class="term mb" style="font-size:.8rem">授权范围: corp.local 及其子系统
测试账号: alice / alice123
允许: 手工测试、Repeater 修改请求、越权/注入/XSS/逻辑类验证
禁止: DoS、社会工程、对非 corp.local 资产的任何测试</div>
          <div class="dim small mb">确认你已读懂 Scope 才能继续:</div>
          <div class="row">
            <button class="diag-opt btn-sm" style="width:auto" data-ok="1">我已阅读并理解授权范围</button>
            <button class="diag-opt btn-sm" style="width:auto" data-ok="0">跳过,直接开测</button>
          </div>`;
        body.querySelectorAll("[data-ok]").forEach((b) => {
          b.onclick = () => {
            if (b.dataset.ok === "1") setPhase("hunt");
            else $.toast("真实 SRC 中,不读 Scope 可能导致法律责任。再想想。");
          };
        });
      } else if (p === "hunt") {
        const found = new Set(CF.store.data.finalFound || []);
        body.innerHTML = `
          <div class="panel-title">第 2 关: 漏洞狩猎 <span class="tag cyan">已发现 ${found.size}/2</span></div>
          <div class="faint small mb">目标 corp.local 完全未知。从 GET / 开始你的侦察。</div>
          <div id="fb-builder"></div>
          <div class="row mt">
            <button class="btn btn-sm btn-primary" id="fb-report" ${found.size >= 2 ? "" : "disabled"}>证据足够,去写报告 →</button>
          </div>`;
        builder(body.querySelector("#fb-builder"),
          { method: "GET", path: "/", headers: "Host: corp.local" },
          (req, resp) => {
            const flagMap = { "FLAG{1d0r_1s_3asy}": "idor", "FLAG{sql1_m4st3r}": "sqli", "FLAG{1nf0_d1scl0sur3}": "info", "FLAG{ssrf": "ssrf", "FLAG{cmd_1nj3ct10n}": "cmdi", "FLAG{n3g4t1v3_pr1c3}": "logic", "FLAG{jwt_n0n3_4lg}": "jwt" };
            for (const [k, v] of Object.entries(flagMap)) if (resp.body.includes(k)) found.add(v);
            CF.store.data.finalFound = [...found]; CF.store.save();
            if (found.size >= 2) { body.querySelector("#fb-report").disabled = false; $.toast("已发现 2 类漏洞,可以进入报告阶段"); }
            body.querySelector(".panel-title").innerHTML = `第 2 关: 漏洞狩猎 <span class="tag cyan">已发现 ${found.size}/2</span>`;
          });
        body.querySelector("#fb-report").onclick = () => setPhase("report");
      } else if (p === "report") {
        body.innerHTML = `<div class="panel-title">第 3 关: 毕业报告</div><div id="fb-writer"></div>`;
        CF.renderReportWriter(body.querySelector("#fb-writer"));
        // 轮询报告状态
        const check = setInterval(() => {
          const last = CF.store.data.reports[CF.store.data.reports.length - 1];
          if (last && last.status === "有效" && document.body.contains(body)) {
            clearInterval(check);
            setTimeout(() => setPhase("graduate"), 1500);
          }
          if (!document.body.contains(body)) clearInterval(check);
        }, 1200);
      } else if (p === "graduate") {
        const s = CF.store.data;
        body.innerHTML = `
          <div style="text-align:center;padding:40px 20px">
            <div style="font-family:var(--mono);font-size:.75rem;letter-spacing:4px;color:var(--txt-faint)">CYBER FRONTIER V5.0 · CERTIFICATE</div>
            <div style="font-size:2rem;color:var(--cyan);margin:16px 0;text-shadow:0 0 20px rgba(56,225,255,.5)">🏅 FRONTIER RESEARCHER</div>
            <div class="dim" style="line-height:2">
              已完成: 计算机基础 → 网络 → Linux/Windows → Python 工具<br>
              Web 原理 → Burp 手法 → 漏洞知识树 → 误报判断 → 报告写作<br>
              最终在未知目标上独立完成: 侦察 → 建模 → 定位 → 验证 → 报告 → 审核通过
            </div>
            <hr class="sep">
            <div class="stat-row" style="max-width:560px;margin:0 auto">
              <div class="stat"><div class="num">${s.player.xp}</div><div class="lbl">总经验</div></div>
              <div class="stat"><div class="num green">${s.stats.variantsPassed}</div><div class="lbl">变体通过</div></div>
              <div class="stat"><div class="num amber">${s.stats.blindPassed}</div><div class="lbl">盲测通过</div></div>
              <div class="stat"><div class="num">${s.reports.filter((r)=>r.status==="有效").length}</div><div class="lbl">有效报告</div></div>
            </div>
            <div class="diag-explain mt" style="text-align:left;border-color:var(--green-dim)">
              <b>毕业后的真实世界路线:</b><br>
              1. 用真实 PortSwigger Web Security Academy 巩固(你已理解原理,只是换成真实靶场)<br>
              2. 注册合规 SRC 平台(补天/漏洞盒子/HackerOne),先读 Scope<br>
              3. 优先方向: 越权 → 业务逻辑 → 信息泄露 → SQLi/SSRF<br>
              4. 记住: 第一目标是持续有效报告能力,不是首次奖励金额
            </div>
          </div>`;
        ["e1","e2","e3","e4","e5"].forEach((k) => CF.prog.markEvidence("s_boss", k));
        CF.prog.addXP(1000);
      }
    }
    renderPhase(phase);
  };

  /* ==================== S0: Scope Reader 交互实验室 ==================== */
  CF.renderScopeReader = (container) => {
    const doc = `【云购商城 SRC 测试规则 v3.2】
一、测试范围(Scope)
  *.yunshop.cn(含 www/api/mall 等所有子域名)
  App API: https://app-api.yunshop.cn
二、明确排除(Out of Scope)
  *.internal.yunshop.cn(内部系统,禁止触碰)
  vpn.yunshop.cn、mail.yunshop.cn(第三方托管)
  任何物理设施、员工个人账号、社会工程
三、测试方法限制
  禁止: 高并发扫描/压测、拒绝服务、自动化爆破、
        下载大量用户数据、植入持久化后门
  允许: 手工验证、低频探测、概念性证明(PoC)
四、报告要求
  必须包含复现步骤 + 影响说明;重复漏洞不重复奖励`;
    const cases = [
      { q: "你在 mall.yunshop.cn 发现存储型 XSS,是否在测试范围内?", opts: ["在 — mall 是 *.yunshop.cn 的子域", "不在", "需先问客服", "只在周末在"], a: 0,
        why: "*.yunshop.cn 覆盖全部一级及以下子域,mall.yunshop.cn 明确在 Scope 内,可以测试并提交。" },
      { q: "你在 dev.internal.yunshop.cn 发现未授权访问,正确做法?", opts: ["立即停止,不测试不提交(internal 明确排除)", "赶紧提交拿首报", "测完只报高危", "发到群里讨论"], a: 0,
        why: "Scope 明确排除 *.internal.yunshop.cn — 越界测试可能导致法律责任。正确做法: 停止,若已误测,如实说明。" },
      { q: "发现 SQL 注入可导出全库,如何做符合规则的概念性证明?", opts: ["只取 1-2 条记录证明数据可读,不批量下载", "全库拖下来当证据", "删库证明危害", "改成管理员密码"], a: 0,
        why: "『下载大量用户数据』被明确禁止。最小化证明 = 取最少数据证明影响成立,这是合规与技术的双重要求。" },
      { q: "想用 sqlmap 跑注入点,规则允许吗?", opts: ["不允许 — 自动化爆破/扫描被禁止,只能手工验证", "允许,开着就行", "允许但限速", "看心情"], a: 0,
        why: "规则禁止自动化爆破与高并发。sqlmap 默认多线程且行为激进,超出『手工验证+低频探测』边界。" },
      { q: "vpn.yunshop.cn 登录页有弱口令,能报吗?", opts: ["不能 — vpn 在排除清单(第三方托管)", "能,弱口令谁都能报", "能,但奖金减半", "先测了再说"], a: 0,
        why: "排除清单里的资产无论有什么漏洞都不收 — 这是对接第三方与法律边界的基本尊重。" },
    ];
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">先读这份模拟 SRC 规则,再回答 5 道范围判断题(至少 4 题对)。</div>
      <div class="term mb" style="font-size:.76rem;line-height:1.9;white-space:pre-wrap">${$.esc(doc)}</div>
      <div id="scope-q"></div>`;
    container.appendChild(wrap);
    const holder = wrap.querySelector("#scope-q");
    let cur = 0, score = 0;
    const render = () => {
      if (cur >= cases.length) {
        holder.innerHTML = `<div class="diag-explain" style="border-color:${score >= 4 ? "var(--green-dim)" : "var(--amber)"}">${score}/${cases.length}。${score >= 4 ? "你已经能独立读懂 Scope — 这一步做错,后面全白干。" : "重新读一遍规则里『排除』和『禁止』两节,再答一次。"}</div>`;
        if (score >= 4) { CF.prog.markEvidence("s0_scope", "e1"); CF.prog.markEvidence("s0_scope", "e2"); CF.prog.markEvidence("s0_scope", "e4"); CF.prog.addXP(70); }
        return;
      }
      const c = cases[cur];
      holder.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">判断 ${cur + 1}/${cases.length}</b></div>
        <div class="diag-q" style="font-size:.9rem">${c.q}</div>
        ${c.opts.map((o, i) => `<button class="diag-opt" data-si="${i}">${o}</button>`).join("")}
        <div id="scope-why"></div>`;
      holder.querySelectorAll("[data-si]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.si);
          if (i === c.a) score++;
          holder.querySelectorAll("[data-si]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.si) === c.a) x.classList.add("correct"); });
          holder.querySelector("#scope-why").innerHTML = `<div class="diag-explain mt">${c.why}</div><button class="btn btn-sm btn-primary mt" id="scope-next">下一题 →</button>`;
          holder.querySelector("#scope-next").onclick = () => { cur++; render(); };
        };
      });
    };
    render();
  };

  /* ==================== R1: 假设构建实验室 ==================== */
  CF.renderHypothesisLab = (container) => {
    const wrap = document.createElement("div");
    const tasks = [
      {
        endpoint: "GET /api/orders?order_id=1001 (登录用户 Alice)",
        good: ["把 order_id 改成 1002 看是否返回他人订单(IDOR)", "把 order_id 改成负数/字符串看报错是否泄露信息", "去掉 order_id 参数看默认行为"],
        bad: ["这个系统可能有问题", "把整个订单表都下载下来看看", "对服务器发起高并发请求测试"],
        whyGood: "每条都是『具体动作 + 可观察结果』,一次请求就能证伪。",
        whyBad: "要么不可验证(可能有问题),要么违反最小化原则(拖库/压测)。",
      },
      {
        endpoint: "POST /api/profile/update (JSON: {\"nickname\":\"...\"})",
        good: ["在 nickname 里放 <script> 看是否被过滤(存储 XSS)", "多加一个 \"role\":\"admin\" 字段看服务端是否接受( mass assignment )", "把请求重放两次看是否幂等"],
        bad: ["系统应该有过滤吧", "试试把数据库删了", "扫全站端口"],
        whyGood: "分别验证输出编码、字段白名单、幂等性 — 三个可证伪的安全假设。",
        whyBad: "『应该有吧』不是假设;破坏性动作与无目标扫描都不是研究方法。",
      },
    ];
    let cur = 0, solved = 0;
    const render = () => {
      if (cur >= tasks.length) {
        wrap.innerHTML = `<div class="diag-explain" style="border-color:${solved === tasks.length ? "var(--green-dim)" : "var(--amber)"}">${solved}/${tasks.length} 关通过。${solved === tasks.length ? "你已能从任意端点直接产出可验证假设清单 — 这是研究效率的来源。" : "记住公式: 具体动作 + 可观察结果 = 好假设。"}</div>`;
        if (solved === tasks.length) { CF.prog.markEvidence("r1_model", "e1"); CF.prog.markEvidence("r1_model", "e2"); CF.prog.markEvidence("r1_model", "e4"); CF.prog.addXP(80); }
        return;
      }
      const t = tasks[cur];
      const all = [...t.good.map((g, i) => ({ txt: g, ok: true, k: "g" + i })), ...t.bad.map((b, i) => ({ txt: b, ok: false, k: "b" + i }))]
        .sort(() => Math.random() - 0.5);
      wrap.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">端点 ${cur + 1}/${tasks.length}</b>${solved ? `<span class="tag green">已通过 ${solved}</span>` : ""}</div>
        <div class="term mb" style="font-size:.8rem">${$.esc(t.endpoint)}</div>
        <div class="dim small mb">选出全部 3 条『好假设』(具体、可验证、不越界),不要选坏假设:</div>
        <div id="hyp-list">${all.map((o) => `<div class="task-item" data-k="${o.k}" style="cursor:pointer"><div class="t-name" style="font-size:.82rem">${$.esc(o.txt)}</div></div>`).join("")}</div>
        <button class="btn btn-sm btn-primary mt" id="hyp-check">提交选择</button>
        <div id="hyp-fb" class="mt"></div>`;
      const sel = new Set();
      wrap.querySelectorAll("[data-k]").forEach((el) => {
        el.onclick = () => {
          const k = el.dataset.k;
          if (sel.has(k)) { sel.delete(k); el.style.borderColor = ""; }
          else { sel.add(k); el.style.borderColor = "var(--cyan)"; }
        };
      });
      wrap.querySelector("#hyp-check").onclick = () => {
        const want = new Set(t.good.map((_, i) => "g" + i));
        const ok = sel.size === want.size && [...sel].every((x) => want.has(x));
        wrap.querySelector("#hyp-fb").innerHTML = `<div class="diag-explain" style="border-color:${ok ? "var(--green-dim)" : "var(--amber)"}">
          ${ok ? `✓ 全对。${t.whyGood}` : `✗ ${t.whyBad} 再想想: 哪些是一次请求就能验证的?`}
        </div>
        ${ok ? `<button class="btn btn-sm btn-primary mt" id="hyp-next">下一端点 →</button>` : `<button class="btn btn-sm mt" id="hyp-retry">重新选择</button>`}`;
        if (ok) {
          solved++;
          wrap.querySelector("#hyp-next").onclick = () => { cur++; render(); };
        } else {
          wrap.querySelector("#hyp-retry").onclick = () => render();
        }
      };
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== R2: 最小化验证实验室 ==================== */
  CF.renderVerifyLab = (container) => {
    const cases = [
      {
        title: "场景 1 · 疑似水平越权",
        finding: "GET /api/orders?order_id=1001 返回了你的订单。你怀疑改 order_id 能看别人的。",
        opts: [
          { txt: "只把 order_id 改成相邻的一个值(如 1002),确认返回他人姓名/手机号即停", ok: true },
          { txt: "写脚本遍历全部 order_id,把所有用户订单保存为证据", ok: false },
          { txt: "顺手把他人订单状态改成已发货,证明可篡改", ok: false },
          { txt: "什么都不做,直接报告『可能存在越权』", ok: false },
        ],
        why: "最小化证明 = 用一条他人记录证明越权成立。批量拖取与篡改数据都超出『证明』需要,属于违规。",
      },
      {
        title: "场景 2 · 疑似 SQL 注入",
        finding: "GET /api/search?q=phone' 返回 500 + MySQL 报错,你怀疑存在注入。",
        opts: [
          { txt: "用 q=phone' OR '1'='1 确认能返回异常数据集(如隐藏商品),截图后停止", ok: true },
          { txt: "用 sqlmap --dump 全自动脱库,证据更充分", ok: false },
          { txt: "尝试 UNION 提取管理员密码并登录后台", ok: false },
          { txt: "只报 500 报错,不进一步验证", ok: false },
        ],
        why: "OR 1=1 返回隐藏数据已完整证明注入+影响,且不触碰真实用户数据。脱库与登录后台都属越界。",
      },
      {
        title: "场景 3 · 疑似存储型 XSS",
        finding: "留言板把昵称原样输出。你怀疑能存 XSS。",
        opts: [
          { txt: "提交 <img src=x onerror=alert(document.domain)>,在自己的浏览器看到弹窗即停", ok: true },
          { txt: "写盗取 Cookie 的 payload,等其他用户触发后收集会话", ok: false },
          { txt: "注入挖矿脚本证明危害", ok: false },
          { txt: "提交 <b>test</b> 看到粗体就报告存储型 XSS", ok: false },
        ],
        why: "alert(document.domain) 是标准概念性证明。真实盗取他人会话、影响其他用户,是攻击不是研究。只证明 HTML 注入(<b>)则证据不足。",
      },
    ];
    const wrap = document.createElement("div");
    let cur = 0, score = 0;
    const render = () => {
      if (cur >= cases.length) {
        wrap.innerHTML = `<div class="diag-explain" style="border-color:${score >= 3 ? "var(--green-dim)" : "var(--amber)"}">${score}/${cases.length}。${score >= 3 ? "你已经内化了『证明影响,但不造成伤害』— 这是白帽与攻击者的分界线。" : "核心口诀: 概念性证明(PoC),最小数据,及时停止。"}</div>`;
        if (score >= 3) { CF.prog.markEvidence("r2_verify", "e1"); CF.prog.markEvidence("r2_verify", "e2"); CF.prog.markEvidence("r2_verify", "e4"); CF.prog.addXP(80); }
        return;
      }
      const c = cases[cur];
      wrap.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">${c.title}</b><span class="tag purple">${cur + 1}/${cases.length}</span></div>
        <div class="term mb" style="font-size:.8rem">${$.esc(c.finding)}</div>
        <div class="dim small mb">选择唯一符合『最小化验证』原则的做法:</div>
        ${c.opts.map((o, i) => `<button class="diag-opt" data-vi="${i}" style="text-align:left;font-size:.84rem">${$.esc(o.txt)}</button>`).join("")}
        <div id="ver-why"></div>`;
      wrap.querySelectorAll("[data-vi]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.vi);
          const ok = c.opts[i].ok;
          if (ok) score++;
          wrap.querySelectorAll("[data-vi]").forEach((x) => { x.disabled = true; if (c.opts[parseInt(x.dataset.vi)].ok) x.classList.add("correct"); else if (x === b) x.classList.add("wrong"); });
          wrap.querySelector("#ver-why").innerHTML = `<div class="diag-explain mt" style="border-color:${ok ? "var(--green-dim)" : "var(--amber)"}">${c.why}</div>
            <button class="btn btn-sm btn-primary mt" id="ver-next">${cur < cases.length - 1 ? "下一场景 →" : "查看结果"}</button>`;
          wrap.querySelector("#ver-next").onclick = () => { cur++; render(); };
        };
      });
    };
    container.appendChild(wrap);
    render();
  };
})();
