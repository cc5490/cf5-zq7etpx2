/* ============================================================
   CYBER FRONTIER V5.0 — app.js
   页面路由 + 首页工作台 + 诊断流程 + 七步学习单元渲染
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== 初始化 ==================== */
  CF.store.load();
  const S = CF.store.data;

  // 每日任务初始化
  if (!S.daily.date || S.daily.date !== $.today()) {
    S.daily.date = $.today();
    S.daily.tasks = CF.dailyTemplates.map((t, i) => ({
      id: i, text: t.t, type: t.type, xp: t.xp, done: false,
    }));
    CF.store.save();
  }

  /* ==================== 路由注册 ==================== */
  CF.route("home", renderHome);
  CF.route("diagnosis", renderDiagnosis);
  CF.route("node", renderNode);
  CF.route("research", renderResearchNotes);
  CF.route("reports", renderReports);
  CF.route("help", renderHelp);

  /* ==================== 首页工作台 ==================== */
  function renderHome() {
    const doneNodes = CF.nodes.filter((n) => CF.prog.isDone(n.id)).length;
    const totalNodes = CF.nodes.length;
    const overallPct = CF.prog.overallPct(CF.nodes);
    const xp = S.player.xp;

    // 推荐学习节点
    const nextNode = CF.nodes.find((n) => CF.unlocked(n.id) && !CF.prog.isDone(n.id));
    const domainStats = ["foundation", "web", "research", "src"].map((d) => {
      const label = { foundation: "FOUNDATION", web: "WEB SECURITY", research: "RESEARCH", src: "SRC" }[d];
      return { key: d, label, pct: CF.prog.domainPct(d, CF.nodes) };
    });

    const dailyList = S.daily.tasks.map((t) => `
      <div class="task-item ${t.done ? "done" : ""}" data-task="${t.id}">
        <div class="tick">${t.done ? "✓" : ""}</div>
        <div class="t-name">${$.esc(t.text)}</div>
        <div class="t-tag">${t.type}</div>
        <span class="tag cyan">+${t.xp} XP</span>
      </div>`).join("");

    const domainBars = domainStats.map((d) => `
      <div class="bar-line">
        <div class="bl-name">${d.label}</div>
        <div class="bar"><i class="${$.pctClass(d.pct)}" style="width:${d.pct}%"></i></div>
        <div class="bl-pct">${d.pct}%</div>
      </div>`).join("");

    const weakDomains = domainStats.filter((d) => d.pct < 40).map((d) => d.label);
    const recentNotes = S.notes.slice(-3).reverse().map((n) => `
      <div class="task-item"><div class="t-name">${$.esc(n.title)}</div>
      <span class="faint small mono">${new Date(n.ts).toLocaleDateString()}</span></div>`).join("") || "<div class='faint small'>暂无研究笔记</div>";

    $.mount(`
      <div class="hero">
        <h1>CYBER <span class="accent">FRONTIER</span> <span style="font-size:1rem;color:var(--txt-faint)">V5.0</span></h1>
        <p>安全研究工作台 — 不是 RPG,是真实能力训练器</p>
        <p class="motto">学 → 看 → 做 → 解释 → 变体 → 迁移 → 未知场景 → 报告 → 毕业</p>
      </div>

      <div class="stat-row">
        <div class="stat"><div class="num">${doneNodes}<span style="font-size:.85rem;color:var(--txt-faint)">/${totalNodes}</span></div><div class="lbl">已完成节点</div></div>
        <div class="stat"><div class="num green">${overallPct}%</div><div class="lbl">总体进度</div></div>
        <div class="stat"><div class="num amber">${xp}</div><div class="lbl">经验值 XP</div></div>
        <div class="stat"><div class="num" style="font-size:1.1rem">${S.player.rank}</div><div class="lbl">当前职级</div></div>
      </div>

      ${!S.diagDone ? `
        <div class="panel" style="border-color:var(--amber);background:rgba(255,194,71,.04)">
          <div class="panel-title" style="color:var(--amber)">入学诊断</div>
          <p class="dim">首次进入训练,建议先完成 <b>入学诊断</b>(约 20-30 分钟)。系统会根据你的薄弱项生成个性化学习路线,跳过你已掌握的内容。</p>
          <button class="btn btn-primary mt" onclick="CF.go('diagnosis')">开始入学诊断</button>
        </div>` : ""}

      <div class="grid2">
        <div>
          <div class="panel">
            <div class="panel-title">今日任务</div>
            ${dailyList}
            <button class="btn btn-sm btn-block" onclick="CF.dailyComplete()">标记全部完成</button>
          </div>
          <div class="panel">
            <div class="panel-title">推荐下一步</div>
            ${nextNode ? `
              <div style="padding:6px 0">
                <div style="font-weight:700;font-size:1.05rem">${$.esc(nextNode.name)}</div>
                <div class="dim small" style="margin:6px 0">${$.esc(nextNode.desc)}</div>
                <div class="row">${nextNode.tags.map(t => `<span class="tag cyan">${t}</span>`).join("")}
                  <span class="tag amber">${nextNode.time} min</span>
                  <span class="tag ${nextNode.boss ? "red" : "purple"}">${nextNode.boss ? "BOSS" : "L" + nextNode.level}</span></div>
                <button class="btn btn-primary mt" onclick="CF.go('node?${nextNode.id}')">开始训练</button>
              </div>` : `<p class="dim">所有节点已完成。恭喜毕业。</p>`}
          </div>
          <div class="panel">
            <div class="panel-title">研究笔记</div>
            ${recentNotes}
            <button class="btn btn-sm btn-block" onclick="CF.go('research')">查看全部笔记</button>
          </div>
        </div>
        <div>
          <div class="panel">
            <div class="panel-title">训练进度</div>
            ${domainBars}
            <hr class="sep">
            <div id="home-radar" style="display:flex;justify-content:center"></div>
            <div class="faint small" style="font-family:var(--mono);text-align:center">
              能力五维:能解释 · 能操作 · 能迁移 · 独立发现 · 写报告
            </div>
          </div>
          <div class="panel">
            <div class="panel-title">薄弱能力</div>
            ${weakDomains.length ? weakDomains.map(d => `<span class="tag red" style="margin:0 6px 6px 0">${d}</span>`).join("") : "<p class='dim'>暂无薄弱项</p>"}
            <div class="small faint mt">系统建议优先补充这些领域的训练</div>
          </div>
          <div class="panel">
            <div class="panel-title">快速入口</div>
            <div class="row">
              <button class="btn btn-sm" onclick="CF.go('node?w_boss')">UNKNOWN TARGET</button>
              <button class="btn btn-sm" onclick="CF.go('node?f2_linux')">Training Lab</button>
              <button class="btn btn-sm" onclick="CF.go('node?s_boss')">Research Simulator</button>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-note">CYBER FRONTIER V5.0 · 本地存档 · 所有训练均在授权环境进行 · 遵守 Scope</div>
    `);
    const radarEl = document.getElementById("home-radar");
    if (radarEl && CF.renderRadar) CF.renderRadar(radarEl, 200);
  }

  /* ==================== 入学诊断 ==================== */
  function renderDiagnosis() {
    let idx = 0;
    const answers = {};

    function next() {
      if (idx >= CF.diag.length) return showResult();
      const q = CF.diag[idx];
      const domainPct = CF.prog.domainPct("foundation", CF.nodes); // placeholder
      $.mount(`
        <div class="panel">
          <div class="diag-progress">QUESTION ${idx + 1} / ${CF.diag.length} · ${q.domain}</div>
          <div class="diag-q"><span class="q-domain">${q.domain}</span>${$.esc(q.q)}</div>
          <div id="opts">
            ${q.opts.map((o, i) => `<button class="diag-opt" data-i="${i}">${$.esc(o)}</button>`).join("")}
          </div>
          <div id="explain-area"></div>
        </div>
      `);
      document.querySelectorAll(".diag-opt").forEach((btn) => {
        btn.onclick = () => {
          const i = parseInt(btn.dataset.i);
          answers[q.domain] = answers[q.domain] || { total: 0, correct: 0 };
          answers[q.domain].total++;
          const correct = i === q.a;
          if (correct) answers[q.domain].correct++;
          document.querySelectorAll(".diag-opt").forEach((b) => {
            b.disabled = true;
            if (parseInt(b.dataset.i) === q.a) b.classList.add("correct");
            else if (parseInt(b.dataset.i) === i && !correct) b.classList.add("wrong");
          });
          document.getElementById("explain-area").innerHTML = `<div class="diag-explain">${$.esc(q.explain)}</div>`;
          setTimeout(() => { idx++; next(); }, 1800);
        };
      });
    }

    function showResult() {
      // 计算各域得分
      const domains = ["Computer", "Network", "Linux", "Windows", "Python", "HTTP", "Security"];
      const pcts = {};
      domains.forEach((d) => {
        const a = answers[d];
        pcts[d] = a && a.total ? Math.round((a.correct / a.total) * 100) : 0;
      });
      S.diag = pcts;
      S.diagDone = true;

      // 生成学习路线
      const order = ["f0_cpu","f0b_vm","f1_net","f1b_protocols","f2_linux","f3_win","f3b_ps","f4_py","f5_git","f11_cve","f_boss",
        "w0_http","w1_burp","w2_auth","w3_ac","w4_sqli","w5_xss","w6_csrf","w7_upload","w8_ssrf","w9_cmdi","w10_api","w11_logic","w25_sms","w_boss",
        "r0_recon","r1_model","r2_verify","r3_fp","s0_scope","s1_report","s2_review","s4_cvss","s3_board","s_boss"];
      const skip = [];
      if (pcts.Computer >= 75) skip.push("f0_cpu");
      if (pcts.Network >= 75) skip.push("f1_net");
      if (pcts.Linux >= 75) skip.push("f2_linux");
      if (pcts.Windows >= 75) skip.push("f3_win");
      if (pcts.Python >= 75) skip.push("f4_py");
      if (pcts.HTTP >= 75) skip.push("w0_http");
      if (pcts.Security >= 75) skip.push("w2_auth");
      S.path = order.filter((id) => !skip.includes(id));
      CF.store.save();

      const bars = domains.map((d) => `
        <div class="bar-line"><div class="bl-name">${d}</div>
        <div class="bar"><i class="${$.pctClass(pcts[d])}" style="width:${pcts[d]}%"></i></div>
        <div class="bl-pct">${pcts[d]}%</div></div>`).join("");

      $.mount(`
        <div class="panel">
          <div class="panel-title">入学诊断结果</div>
          ${bars}
          <hr class="sep">
          <div class="dim small">已根据你的薄弱项生成个性化路线。<b>${skip.length}</b> 个节点被标记为"已掌握"并跳过,节省时间集中到真正需要学习的内容上。</div>
          <div class="mt">
            <button class="btn btn-primary" onclick="CF.go('home')">进入工作台</button>
            <button class="btn" onclick="CF.store.reset()">重新诊断</button>
          </div>
        </div>
      `);
    }
    next();
  }

  /* ==================== 节点学习单元 ==================== */
  const viewStepMap = {}; // 节点步骤回看位置(不持久化,不影响完成状态)
  function renderNode(arg) {
    const id = arg;
    const n = CF.nodes.find((x) => x.id === id);
    if (!n) { $.toast("节点不存在"); CF.go("home"); return; }
    if (!CF.unlocked(id)) { $.toast("该节点尚未解锁,请先完成前置节点"); CF.go("home"); return; }

    const content = CF.nodeContent(id);
    const prog = CF.prog.node(id);

    if (!content) {
      // 没有内容 = 简单完成节点(后续步骤补充详细内容)
      $.mount(`
        <div class="panel">
          <div class="panel-title">${n.name}</div>
          <p class="dim">${n.desc}</p>
          <div class="stepflow">${n.reqs.length ? "" : ""}
            ${["s1","s2","s3","s4","s5","s6","s7"].map((k,i) => `<span class="sf ${prog.steps[k] ? "ok" : ""}">${["极短理论","可视化","跟做","半独立","解释","变体","迁移"][i]}</span>`).join("")}
          </div>
          <div class="term">// 本节点的详细训练内容将在后续步骤中加载
// 当前为占位模式,点击"标记完成"可暂时通过
// 后续会替换为真实的交互式训练</div>
          <button class="btn btn-primary mt" onclick="CF.quickDone('${id}')">标记完成 (临时)</button>
        </div>
      `);
      return;
    }

    // 七步学习单元
    const steps = content.steps;
    const firstUndone = steps.findIndex((s) => !prog.steps[s.key]);
    // activeStep: 允许回看已完成步骤(纯导航,不改变完成状态)
    if (viewStepMap[id] === undefined || viewStepMap[id] >= steps.length) {
      viewStepMap[id] = firstUndone === -1 ? steps.length - 1 : firstUndone;
    }
    const activeStep = viewStepMap[id];
    const allStepsDone = firstUndone === -1;
    const step = steps[activeStep];

    // 证据标签(只读: 由系统根据你的实际操作授予,不可自行勾选)
    const evLabels = { e1: "能解释", e2: "能操作", e3: "能迁移", e4: "能独立发现", e5: "能写报告" };
    const evRequired = ["s1_report", "s2_review", "s_boss"].includes(id)
      ? ["e1", "e2", "e3", "e4", "e5"] : ["e1", "e2", "e3", "e4"];
    const evHtml = Object.entries(evLabels).map(([k, v]) => {
      const got = prog.evidence[k];
      const optional = !evRequired.includes(k);
      return `<span class="tag ${got ? "green" : ""}" title="由系统根据实际表现授予" style="opacity:${got ? 1 : optional ? .25 : .45};cursor:default">${got ? "✓ " : ""}${v}${optional ? "" : ""}</span>`;
    }).join("");

    $.mount(`
      <div class="panel">
        <div class="row" style="justify-content:space-between">
          <div class="panel-title" style="margin-bottom:0">${n.name}</div>
          <div class="row">
            ${n.tags.map(t => `<span class="tag cyan">${t}</span>`).join("")}
            <span class="tag amber">${n.time} min</span>
            ${n.boss ? '<span class="tag red">BOSS</span>' : ""}
          </div>
        </div>
        <p class="dim mt">${n.desc}</p>
        <div class="stepflow">${steps.map((s, i) => {
          const done = prog.steps[s.key];
          const cur = i === activeStep;
          return `<span class="sf ${done ? "ok" : ""} ${cur ? "cur" : ""}" style="cursor:pointer" onclick="CF.viewStep('${id}',${i})">${i + 1}. ${s.name}</span>`;
        }).join("")}</div>
        <div class="panel" style="background:var(--bg2);margin-bottom:0">
          <div style="font-size:.8rem;color:var(--cyan);letter-spacing:2px;margin-bottom:10px">STEP ${activeStep + 1} — ${step.name} ${prog.steps[step.key] ? '<span class="tag green" style="margin-left:8px">已完成</span>' : ""}</div>
          <div style="line-height:1.9;font-size:.92rem">${step.body}</div>
          <div id="interactive-zone" class="mt"></div>
          ${activeStep === 4 ? `
            <div class="mt">
              <textarea id="explanation" class="term" style="width:100%;min-height:80px;color:var(--txt);resize:vertical"
                placeholder="用自己的话解释...(在脑中或纸上完成,这是把知识变成你自己的关键一步)"></textarea>
            </div>` : ""}
        </div>
        <div class="row mt" style="justify-content:space-between">
          <div class="row">
            ${activeStep > 0 ? `<button class="btn btn-sm" onclick="CF.viewStep('${id}',${activeStep - 1})">← 上一步</button>` : ""}
            ${!prog.steps[step.key] ? `<button class="btn btn-sm btn-primary" onclick="CF.completeStep('${id}','${step.key}')">完成本步骤 →</button>`
              : activeStep < steps.length - 1 ? `<button class="btn btn-sm btn-primary" onclick="CF.viewStep('${id}',${activeStep + 1})">下一步 →</button>`
              : allStepsDone ? `<button class="btn btn-sm btn-green" onclick="CF.finishNode('${id}')">✓ 提交节点完成</button>`
              : `<button class="btn btn-sm" onclick="CF.viewStep('${id}',${firstUndone})">前往未完成步骤 →</button>`}
          </div>
          <div class="row">${evHtml}</div>
        </div>
        ${content.verify && allStepsDone ? `
          <hr class="sep"><div class="panel-title">节点验证 ${(prog.verifyAll ? '<span class="tag green">已通过</span>' : '<span class="tag amber">全部答对才算完成</span>')}</div>
          ${content.verify.map((v, vi) => `
            <div style="margin-bottom:14px">
              <div class="dim small">${$.esc(v.q)} ${prog.verify && prog.verify[vi] ? '<span style="color:var(--green)">✓</span>' : ""}</div>
              <div class="row mt">${v.opts.map((o, oi) => `<button class="diag-opt btn-sm ${prog.verify && prog.verify[vi] && oi === v.a ? "correct" : ""}" style="width:auto;padding:8px 14px" onclick="CF.checkVerify('${id}',${vi},${oi})">${$.esc(o)}</button>`).join("")}</div>
            </div>`).join("")}` : ""}
      </div>
    `);

    // 插入交互式可视化
    const zone = document.getElementById("interactive-zone");
    if (zone) {
      const showMap = {
        "f0_cpu": [1,2], "f1_net": [1,2], "f2_linux": [1,2,3],
        "f3_win": [1,2], "f4_py": [1,2,3], "f5_git": [1,2],
        "f_boss": [1,2,3], "w0_http": [1,2], "w1_burp": [1,2,3],
        "w2_auth": [1,2,3], "w3_ac": [1,2,3],
        "w4_sqli": [1,2,3], "w5_xss": [1,2,3], "w6_csrf": [1,2,3],
        "w7_upload": [1,2,3], "w8_ssrf": [1,2,3], "w9_cmdi": [1,2,3],
        "w10_api": [1,2,3], "w11_logic": [1,2,3],
        "w12_traversal": [1,2,3], "w13_xxe": [1,2,3], "w14_ssti": [1,2,3],
        "w15_nosqli": [1,2,3], "w16_deser": [1,2,3], "w17_oauth": [1,2,3],
        "w18_race": [1,2,3], "w19_proto": [1,2,3], "w20_graphql": [1,2,3],
        "w21_misconfig": [1,2,3], "w22_sensitive": [1,2,3], "w23_session": [1,2,3],
        "w24_llm": [1,2,3], "w25_sms": [1,2,3],
        "f6_eng": [1,2,3], "f7_nmap": [1,2,3],
        "f8_subnet": [1,2,3], "f9_capture": [1,2,3], "f10_perm": [1,2,3],
        "f0b_vm": [1,2,3], "f1b_protocols": [1,2,3], "f3b_ps": [1,2,3], "f11_cve": [1,2,3],
        "s3_board": [1,2,3], "s4_cvss": [1,2,3],
        "w_boss": [1,2,3,4,5,6], "r0_recon": [1,2,3], "r3_fp": [1,2,3],
        "s0_scope": [1,2,3], "s1_report": [1,2,3], "s2_review": [1,2,3],
        "s_boss": [1,2,3,4,5,6],
      };
      if (showMap[id] && showMap[id].includes(activeStep)) {
        if (id === "f0_cpu") CF.renderProgramTrace(zone);
        else if (id === "f0b_vm") CF.renderVM(zone);
        else if (id === "f1_net") CF.renderPacketJourney(zone);
        else if (id === "f1b_protocols") CF.renderProtocols(zone);
        else if (id.startsWith("f2")) CF.createTerminal(zone, null, id);
        else if (id === "f3_win") CF.renderWindowsDiag(zone);
        else if (id === "f3b_ps") CF.renderPowerShell(zone);
        else if (id === "f11_cve") CF.renderCVEMuseum(zone);
        else if (id === "s4_cvss") CF.renderCVSS(zone);
        else if (id === "f4_py") CF.renderPythonLab(zone);
        else if (id === "f5_git") CF.renderGitLab(zone);
        else if (id === "f6_eng") CF.renderEnglish(zone);
        else if (id === "f7_nmap") CF.renderNmap(zone);
        else if (id === "f8_subnet") CF.renderCIDR(zone);
        else if (id === "f9_capture") CF.renderTabs(zone, [
          ["抓包判读", CF.renderPacketLab], ["TLS 握手", CF.renderTLS],
        ]);
        else if (id === "f10_perm") CF.renderTabs(zone, [
          ["权限/SUID", CF.renderChmod], ["日志狩猎", CF.renderLogHunt],
        ]);
        else if (id === "s3_board") CF.renderSRCBoard(zone);
        else if (id === "f_boss") CF.renderFoundationBoss(zone);
        else if (id === "w0_http") CF.renderHttpLab(zone);
        else if (id === "w1_burp") CF.renderBurpSuite(zone);
        else if (id === "w2_auth") CF.renderAuthLab(zone);
        else if (CF.vulnLabs && CF.vulnLabs[id]) CF.renderVulnLab(zone, CF.vulnLabs[id]);
        else if (id === "w_boss") { CF.renderWebBoss(zone); CF.attachBossTimer(zone); }
        else if (id === "r0_recon") CF.renderTabs(zone, [["攻击面建模", CF.renderReconLab], ["侦察工具", CF.renderReconTools]]);
        else if (id === "r3_fp") CF.renderFpTrainer(zone);
        else if (id === "s1_report" || id === "s2_review") CF.renderReportWriter(zone);
        else if (id === "s_boss") CF.renderFinalBoss(zone);
      }
    }
  }

  /* ==================== 全局函数 ==================== */
  CF.viewStep = (id, idx) => {
    viewStepMap[id] = idx;
    renderNode(id);
  };
  CF.completeStep = (id, key) => {
    // 实验型节点: 完成"跟做(s3)"前必须真正完成本页交互实验(系统已授予 E2 能操作)
    const BOSS = { f_boss: 1, w_boss: 1, s_boss: 1 };
    const needLabBeforeS3 = new Set([
      "f0_cpu","f1_net","f2_linux","f3_win","f4_py","f5_git","f6_eng","f7_nmap",
      "f8_subnet","f9_capture","f10_perm","w0_http","w1_burp","w2_auth",
      "w3_ac","w4_sqli","w5_xss","w6_csrf","w7_upload","w8_ssrf","w9_cmdi","w10_api","w11_logic",
      "w12_traversal","w13_xxe","w14_ssti","w15_nosqli","w16_deser","w17_oauth","w18_race",
      "w19_proto","w20_graphql","w21_misconfig","w22_sensitive","w23_session","w24_llm","w25_sms",
      "r0_recon","r3_fp","s3_board","f11_cve","s4_cvss",
    ]);
    if (key === "s3" && needLabBeforeS3.has(id) && !BOSS[id]) {
      const p = CF.prog.node(id);
      if (!p.evidence.e2) {
        $.toast("先完成本页的交互实验(看到绿色成功判定),再标记本步骤");
        return;
      }
    }
    CF.prog.markStep(id, key);
    const content = CF.nodeContent(id);
    const keys = content.steps.map((s) => s.key);
    const prog = CF.prog.node(id);
    const nextIdx = keys.findIndex((k) => !prog.steps[k]);
    viewStepMap[id] = nextIdx === -1 ? keys.length - 1 : nextIdx;
    $.toast("本步骤完成");
    renderNode(id);
  };
  CF.quickDone = (id) => {
    // 占位节点兜底: 直接授予前四维并完成
    ["e1", "e2", "e3", "e4"].forEach((k) => CF.prog.markEvidence(id, k));
    CF.prog.addXP(50);
    $.toast("节点已完成");
    CF.go("home");
  };
  CF.finishNode = (id) => {
    const content = CF.nodeContent(id);
    const prog = CF.prog.node(id);
    // 条件 1: 七步全部完成
    const allDone = content.steps.every((s) => prog.steps[s.key]);
    if (!allDone) { $.toast("还有步骤未完成"); return; }
    // 条件 2: 验证题全部答对(没有验证题的节点跳过)
    if (content.verify && content.verify.length) {
      const ok = content.verify.every((_, vi) => prog.verify && prog.verify[vi]);
      if (!ok) { $.toast("请先在下方『节点验证』中答对全部题目"); return; }
    }
    // 条件 3: 报告类节点必须已有 E5(由报告写作/审核系统授予)
    const needReport = ["s1_report", "s2_review", "s_boss"].includes(id);
    if (needReport && !prog.evidence.e5) {
      $.toast("报告类节点必须先通过下方的报告写作/审核训练");
      return;
    }
    // 条件 3b: BOSS 节点必须先在考核中拿到 E4(独立发现): f_boss 排障通关 / w_boss 找到 2 类漏洞
    const bossPass = { f_boss: true, w_boss: true };
    if (bossPass[id] && !prog.evidence.e4) {
      $.toast("BOSS 考核未通过: 在下方考核环境中达成目标后才能完成");
      return;
    }
    // 依据实际完成的步骤授予证据
    if (prog.steps.s5) CF.prog.markEvidence(id, "e1");        // 解释
    if (prog.steps.s3 || prog.steps.s4) CF.prog.markEvidence(id, "e2"); // 操作
    if (prog.steps.s6) CF.prog.markEvidence(id, "e3");        // 迁移(变体)
    if (prog.steps.s7) CF.prog.markEvidence(id, "e4");        // 独立发现
    CF.prog.addXP(50);
    const finished = CF.prog.isDone(id);
    $.toast(finished ? "节点完成! +50 XP" : "证据已记录,继续完成交互实验即可集齐");
    if (finished) CF.go("home"); else renderNode(id);
  };
  CF.checkVerify = (id, vi, oi) => {
    const content = CF.nodeContent(id);
    const v = content.verify[vi];
    const prog = CF.prog.node(id);
    prog.verify = prog.verify || {};
    if (oi === v.a) {
      prog.verify[vi] = true;
      prog.verifyAll = content.verify.every((_, i) => prog.verify[i]);
      CF.store.save();
      $.toast(prog.verifyAll ? "全部验证通过,可以提交节点完成" : "回答正确");
    } else {
      $.toast("回答错误,回到步骤内容重新思考");
    }
    renderNode(id);
  };
  CF.dailyComplete = () => {
    S.daily.tasks.forEach((t) => (t.done = true));
    CF.prog.addXP(S.daily.tasks.reduce((s, t) => s + t.xp, 0));
    CF.store.save();
    $.toast("今日任务全部完成!");
    renderHome();
  };

  /* ==================== 研究笔记 ==================== */
  function renderResearchNotes() {
    const list = S.notes.slice().reverse().map((n, i) => `
      <div class="panel">
        <div class="row" style="justify-content:space-between">
          <div style="font-weight:700">${$.esc(n.title)}</div>
          <span class="faint small mono">${new Date(n.ts).toLocaleString()}</span>
        </div>
        <div class="term mt" style="white-space:pre-wrap;font-size:.8rem">${$.esc(n.body)}</div>
      </div>`).join("");
    $.mount(`
      <div class="panel">
        <div class="panel-title">Research Notes</div>
        <div class="row mb">
          <input id="note-title" class="diag-opt" style="width:260px;padding:10px 14px" placeholder="笔记标题">
          <button class="btn btn-primary btn-sm" onclick="CF.saveNote()">保存笔记</button>
        </div>
        <textarea id="note-body" class="term" style="width:100%;min-height:100px;color:var(--txt)" placeholder="## 观察\n\n## 实验\n\n## 结论\n\n"></textarea>
      </div>
      ${list || '<div class="panel faint">暂无笔记</div>'}
    `);
  }
  CF.saveNote = () => {
    const title = document.getElementById("note-title").value.trim();
    const body = document.getElementById("note-body").value.trim();
    if (!title || !body) { $.toast("请填写标题和内容"); return; }
    S.notes.push({ ts: Date.now(), title, body });
    CF.store.save();
    $.toast("笔记已保存");
    renderResearchNotes();
  };

  /* ==================== 报告 ==================== */
  function renderReports() {
    const list = S.reports.slice().reverse().map((r) => `
      <div class="panel">
        <div class="row" style="justify-content:space-between">
          <div style="font-weight:700">${$.esc(r.title)}</div>
          <span class="tag ${r.status === "有效" ? "green" : r.status === "待审核" ? "amber" : "red"}">${r.status}</span>
        </div>
        <div class="faint small mono">${new Date(r.ts).toLocaleString()} · ${$.esc(r.target)}</div>
        <div class="term mt" style="white-space:pre-wrap;font-size:.8rem">${$.esc(r.body)}</div>
        ${r.feedback ? `<div class="diag-explain mt">${$.esc(r.feedback)}</div>` : ""}
      </div>`).join("");
    $.mount(`
      <div class="panel">
        <div class="panel-title">漏洞报告</div>
        <p class="dim small">模拟 SRC 报告提交流程。每份报告将经过审核(Review),审核结果可能是:信息不足 / 证据不足 / 影响不足 / 复现失败 / 重复问题 / 分类错误 / 需要补充 / 有效。</p>
      </div>
      ${list || '<div class="panel faint">暂无报告</div>'}
    `);
  }

  /* ==================== 帮助 ==================== */
  function renderHelp() {
    $.mount(`
      <div class="panel">
        <div class="panel-title">使用指南</div>
        <div class="dim" style="line-height:2">
          <b>核心理念:</b>这不是刷题游戏,而是能力训练器。目标是让零基础玩家最终能独立在授权环境完成完整研究闭环。<br><br>
          <b>七步学习法:</b>每个知识点按 学→看→做→解释→变体→迁移→复盘 的顺序训练。<br>
          <b>五维证据:</b>能解释(E1) 能操作(E2) 能迁移(E3) 能独立发现(E4) 能写清报告(E5)。<br>
          <b>三层难度:</b>Guided(有提示) → Semi-Blind(只告诉漏洞类型) → Blind(完全自主)。<br>
          <b>反背答案:</b>同一原理会以不同参数位置、不同业务场景、不同技术栈出现。<br><br>
          <b>每日任务:</b>保持每日 15-30 分钟训练节奏。<br>
          <b>研究笔记:</b>每完成重要实验,用 Markdown 记录观察、实验、结论。<br>
          <b>报告写作:</b>最终目标是写出完整、可复现、证据充分、影响明确、范围合规的漏洞报告。
        </div>
        <hr class="sep">
        <div class="row">
          <button class="btn btn-sm" onclick="CF.store.export()">导出存档</button>
          <button class="btn btn-sm btn-danger" onclick="CF.store.reset()">重置进度</button>
        </div>
      </div>
    `);
  }

  /* ==================== 启动 ==================== */
  document.addEventListener("DOMContentLoaded", () => {
    // 顶部导航
    document.getElementById("topbar").innerHTML = `
      <div class="logo" onclick="CF.go('home')">CYBER FRONTIER<small>V5.0 · 安全研究工作台</small></div>
      <div class="nav">
        <a href="#/home">工作台</a>
        <a href="#/research">研究笔记</a>
        <a href="#/reports">漏洞报告</a>
        <a href="#/help">指南</a>
      </div>
      <div class="topbar-right">
        <span class="rank-badge">${S.player.rank}</span>
        <span>${S.player.xp} XP</span>
      </div>
    `;
    CF.startRouter();
  });
})();
