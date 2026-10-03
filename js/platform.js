/* ============================================================
   CYBER FRONTIER V5.0 — platform.js
   实战化: SRC 项目大厅 / 去重 / 评级赏金 / 任务计时器 / 五维雷达图
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== 能力五维雷达图 ==================== */
  // 维度 E1 能解释 E2 能操作 E3 能迁移 E4 能独立发现 E5 能写报告
  CF.computeRadar = () => {
    const s = CF.store.data;
    const nodes = CF.nodes;
    const dim = { e1: [], e2: [], e3: [], e4: [], e5: [] };
    nodes.forEach((n) => {
      ["e1", "e2", "e3", "e4", "e5"].forEach((e) => {
        const node = s.progress && s.progress[n.id];
        if ((node && node.evidence && node.evidence[e]) || (n.boss && node && node.done)) dim[e].push(1);
      });
    });
    // 每个维度按"已获证据的节点占比"折算
    const total = Math.max(nodes.length, 1);
    return {
      labels: ["能解释", "能操作", "能迁移", "独立发现", "写报告"],
      vals: ["e1", "e2", "e3", "e4", "e5"].map((e) => Math.min(100, Math.round((dim[e].length / total) * 100 * 2.2))),
    };
  };
  CF.renderRadar = (container, size = 220) => {
    const { labels, vals } = CF.computeRadar();
    const c = size, cx = c / 2, cy = c / 2, R = c / 2 - 38;
    const pt = (i, r) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / labels.length;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const rings = [0.25, 0.5, 0.75, 1].map((k) =>
      labels.map((_, i) => pt(i, R * k)).map((p) => p.join(",")).join(" "));
    const dataPts = vals.map((v, i) => pt(i, R * v / 100));
    const svg = `
      <svg width="${c}" height="${c}" viewBox="0 0 ${c} ${c}">
        ${rings.map((r) => `<polygon points="${r}" fill="none" stroke="var(--line-soft)" stroke-width="1"/>`).join("")}
        ${labels.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line-soft)"/>`; }).join("")}
        <polygon points="${dataPts.map((p) => p.join(",")).join(" ")}" fill="rgba(56,225,255,.15)" stroke="var(--cyan)" stroke-width="2"/>
        ${dataPts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="var(--cyan)"/>`).join("")}
        ${labels.map((l, i) => { const [x, y] = pt(i, R + 22); return `<text x="${x}" y="${y}" fill="var(--txt-faint)" font-size="11" text-anchor="middle" font-family="var(--mono)">${l} ${vals[i]}</text>`; }).join("")}
      </svg>`;
    const div = document.createElement("div");
    div.innerHTML = svg;
    container.appendChild(div);
  };

  /* ==================== 任务计时器(3小时压力模拟) ==================== */
  CF.startTimer = (container, minutes, onDone) => {
    const bar = document.createElement("div");
    let left = minutes * 60;
    bar.innerHTML = `
      <div class="row" style="justify-content:space-between;font-family:var(--mono);font-size:.8rem">
        <span class="faint">考核计时</span>
        <b id="tm-time" style="color:var(--amber)">${minutes}:00</b>
      </div>
      <div style="height:4px;background:var(--panel2);border-radius:2px;margin-top:4px;overflow:hidden">
        <div id="tm-bar" style="height:100%;width:100%;background:var(--amber);transition:width 1s linear"></div>
      </div>`;
    container.appendChild(bar);
    const total = minutes * 60;
    const tick = setInterval(() => {
      left--;
      if (!document.body.contains(bar)) { clearInterval(tick); return; }
      const m = String(Math.floor(left / 60)).padStart(2, "0"), sec = String(left % 60).padStart(2, "0");
      const tEl = bar.querySelector("#tm-time");
      if (tEl) { tEl.textContent = `${m}:${sec}`; bar.querySelector("#tm-bar").style.width = (left / total * 100) + "%"; }
      if (left <= 300 && tEl) tEl.style.color = "var(--red)";
      if (left <= 0) { clearInterval(tick); if (onDone) onDone(); }
    }, 1000);
    return () => clearInterval(tick);
  };

  /* ==================== 通用标签页容器 ==================== */
  CF.renderTabs = (container, tabs) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="row mb" style="gap:6px">${tabs.map((t, i) => `<button class="btn btn-sm tabx" data-i="${i}">${t[0]}</button>`).join("")}</div><div class="tabx-pane"></div>`;
    container.appendChild(wrap);
    const pane = wrap.querySelector(".tabx-pane");
    const go = (i) => {
      pane.innerHTML = "";
      wrap.querySelectorAll(".tabx").forEach((b) => b.classList.toggle("btn-primary", parseInt(b.dataset.i) === i));
      tabs[i][1](pane);
    };
    wrap.querySelectorAll(".tabx").forEach((b) => { b.onclick = () => go(parseInt(b.dataset.i)); });
    go(0);
  };

  /* ==================== BOSS 3小时计时器(顶部) ==================== */
  CF.attachBossTimer = (zone) => {
    const host = zone.parentElement;
    if (!host || host.dataset.timerOn) return;
    host.dataset.timerOn = "1";
    const bar = document.createElement("div");
    host.insertBefore(bar, zone);
    CF.startTimer(bar, 180, () => {
      bar.querySelector("#tm-time").textContent = "已到 3 小时";
      CF.ui.modal(`<div class="panel-title">时间到</div><div class="dim">真实考核中此刻必须交卷。训练模式下你可以继续完成,但请反思: 时间花在了哪个环节? 侦察太慢还是验证绕路?</div><button class="btn btn-sm btn-primary mt" onclick="CF.ui.closeModal()">继续训练</button>`);
    });
  };

  /* ==================== SRC 项目大厅 ==================== */
  const PROGRAMS = [
    {
      id: "shop", name: "云购商城 (yunshop.cn)", range: "*.yunshop.cn 主站/App API",
      reward: "高危 ¥2000-8000 / 中危 ¥300-1000",
      ban: ["DoS", "爆破(有锁定)", "社工", "*.test.yunshop.cn"],
      known: ["登录接口短信轰炸", "/api/order 越权看订单(已修)", ".git 泄露(已修)"],
      hint: "重点: 新上线的优惠券和积分功能",
    },
    {
      id: "oa", name: "协同办公 OA (oasoft.com)", range: "www.oasoft.com SaaS 平台",
      reward: "严重 ¥5000+ / 高危 ¥1000-3000 / 低危 ¥50",
      ban: ["批量拉取用户数据", "任何破坏性操作", "自动化扫描器"],
      known: ["存储型 XSS(公告模块)", "任意用户注册", "JWT alg=none(已修)"],
      hint: "重点: 多租户之间的数据隔离",
    },
    {
      id: "edu", name: "教育平台 (xueke.edu.local)", range: "主站 + 学生端 API",
      reward: "公益SRC: 证书/排名,无现金",
      ban: ["访问真实学生数据", "高峰期测试"],
      known: [],
      hint: "新平台,历史报告少,机会多但奖金为 0",
    },
  ];

  CF.renderSRCBoard = (container) => {
    const wrap = document.createElement("div");
    const list = () => {
      wrap.innerHTML = `
        <div class="dim small mb">选一个合规 SRC 项目。真实世界的第一步不是开扫,而是: 读 Scope → 查历史已报漏洞(去重) → 决定打什么。</div>
        <div id="src-cards">
          ${PROGRAMS.map((p) => `
            <div class="task-item" data-p="${p.id}" style="cursor:pointer;display:block">
              <div class="row" style="justify-content:space-between">
                <b style="color:var(--cyan)">${p.name}</b>
                <span class="tag green">${p.reward}</span>
              </div>
              <div class="dim small mt">授权范围: ${p.range}</div>
              <div class="small mt" style="color:var(--red)">禁止: ${p.ban.join("、")}</div>
              <div class="small mt" style="color:var(--amber)">历史已报 ${p.known.length} 个: ${p.known.length ? p.known.join("; ") : "暂无"}</div>
              <div class="faint small mt">情报: ${p.hint}</div>
            </div>`).join("")}
        </div>
        <div class="faint small mt">点击项目进入测试。注意: 报告与历史重复 = 不计分。</div>`;
      wrap.querySelectorAll("[data-p]").forEach((card) => {
        card.onclick = () => detail(PROGRAMS.find((p) => p.id === card.dataset.p));
      });
    };
    const detail = (p) => {
      // 三个可选漏洞,其中一个与历史重复,一个越权(有效高危),一个低危信息泄露
      const findings = [
        { k: "dup", title: "/api/order 越权查看他人订单", dup: true, sev: "高危",
          note: "历史报告里已经有这个洞(已修复)。" },
        { k: "idor_coupon", title: "优惠券核销接口 /api/coupon/use?uid= 可改 uid 越权使用他人优惠券", dup: false, sev: "高危",
          note: "新功能,历史没有;有完整请求响应证据;影响他人资产。" },
        { k: "low", title: "响应头暴露 nginx 版本号", dup: false, sev: "低危(多数平台忽略)",
          note: "版本号单独提交通常评级为『忽略』。" },
      ];
      wrap.innerHTML = `
        <button class="btn btn-sm mb" id="src-back">← 返回项目列表</button>
        <div class="panel-title">${p.name}</div>
        <div class="dim small mb">你在该项目测试后有三个候选发现。<b style="color:var(--amber)">选一个写报告提交</b> — 去重和评级是赏金玩家的核心决策。</div>
        ${findings.map((f) => `
          <button class="diag-opt" data-f="${f.k}" style="text-align:left;display:block;width:100%">
            <b>${f.title}</b>
            <div class="faint small mt">${f.note}</div>
          </button>`).join("")}
        <div id="src-result" class="mt"></div>`;
      wrap.querySelector("#src-back").onclick = list;
      wrap.querySelectorAll("[data-f]").forEach((b) => {
        b.onclick = () => {
          const f = findings.find((x) => x.k === b.dataset.f);
          const out = wrap.querySelector("#src-result");
          if (f.dup) {
            out.innerHTML = `<div class="diag-explain" style="border-color:var(--red)">
              <b>审核结果: 重复(Duplicate)</b><br>该漏洞已被他人报告并修复。无奖金、无积分。<br>
              <span class="faint">教训: 提交前必查平台历史公告和感谢榜。『发现 → 去重』是 SRC 流程的独立一步,不是可选项。</span></div>`;
          } else if (f.k === "idor_coupon") {
            CF.store.data.bounty = (CF.store.data.bounty || 0) + 2000;
            CF.store.save();
            out.innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">
              <b>审核结果: 有效漏洞 — 高危</b><br>奖金 ¥2000(模拟)。理由: 越权操作他人资产 + 新攻击面 + 证据完整可复现。<br>
              <span class="dim">你走对了完整链路: 读 Scope → 查历史避开重复 → 锁定新功能 → 最小化验证 → 提交。</span></div>`;
            CF.prog.markEvidence("s_boss", "e5");
            CF.prog.markEvidence("s3_board", "e2");
            CF.prog.markEvidence("s3_board", "e4");
            CF.prog.addXP(150);
          } else {
            out.innerHTML = `<div class="diag-explain" style="border-color:var(--amber)">
              <b>审核结果: 忽略 / 低危</b><br>单独的版本号泄露通常不构成可利用风险。<br>
              <span class="faint">教训: 技术上『看到了东西』不等于值得提交;它可以作为攻击链的一环记录,但不该单独占报告。</span></div>`;
          }
        };
      });
    };
    container.appendChild(wrap);
    list();
  };
})();
