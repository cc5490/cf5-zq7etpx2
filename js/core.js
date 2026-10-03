/* ============================================================
   CYBER FRONTIER V5.0 — core.js
   存档系统 / 路由 / UI 工具
   纯前端,localStorage 持久化,双击 index.html 即可运行
   ============================================================ */
(function () {
  "use strict";
  const CF = (window.CF = {});

  /* ---------------- 存档 ---------------- */
  const SAVE_KEY = "cyber_frontier_v5_save";

  const defaultSave = () => ({
    ver: 5,
    created: Date.now(),
    player: { name: "RESEARCHER", rank: "见习研究员", xp: 0 },
    diagDone: false,
    diag: {},            // { domainKey: 0~100 }
    path: [],            // 诊断生成的推荐路线 [nodeId]
    progress: {},        // { nodeId: { steps:{s1..s7:bool}, evidence:{e1..e5:bool}, done:bool } }
    notes: [],           // 研究笔记 [{ts, title, body}]
    reports: [],         // 漏洞报告 [{ts, target, title, body, status, feedback}]
    stats: { labsDone: 0, variantsPassed: 0, blindPassed: 0, wrongLog: [] },
    daily: { date: "", tasks: [] },
  });

  CF.store = {
    data: null,
    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        this.data = raw ? Object.assign(defaultSave(), JSON.parse(raw)) : defaultSave();
      } catch (e) {
        this.data = defaultSave();
      }
      return this.data;
    },
    save() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); },
    reset() {
      if (confirm("确定要清空全部进度,重新入学吗?此操作不可恢复。")) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
      }
    },
    export() {
      const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "cyber_frontier_save.json";
      a.click();
    },
  };

  /* ---------------- 进度辅助 ---------------- */
  CF.prog = {
    node(id) {
      const d = CF.store.data;
      if (!d.progress[id]) d.progress[id] = { steps: {}, evidence: {}, done: false };
      return d.progress[id];
    },
    markStep(id, stepKey) {
      const n = this.node(id);
      n.steps[stepKey] = true;
      CF.store.save();
    },
    markEvidence(id, eKey) {
      const n = this.node(id);
      n.evidence[eKey] = true;
      // 完成标准: 报告类节点(S1/S2/S_BOSS)要求五维全齐;
      // 其余知识/实验节点要求前四维(解释/操作/迁移/独立发现),E5 写报告不作硬性要求
      const needReport = ["s1_report", "s2_review", "s_boss"].includes(id);
      const required = needReport ? ["e1", "e2", "e3", "e4", "e5"] : ["e1", "e2", "e3", "e4"];
      if (required.every((k) => n.evidence[k])) n.done = true;
      CF.store.save();
    },
    isDone(id) { return !!(CF.store.data.progress[id] || {}).done; },
    evidencePct(id) {
      const n = CF.store.data.progress[id];
      if (!n) return 0;
      const needReport = ["s1_report", "s2_review", "s_boss"].includes(id);
      const keys = needReport ? ["e1", "e2", "e3", "e4", "e5"] : ["e1", "e2", "e3", "e4"];
      const got = keys.filter((k) => n.evidence[k]).length;
      return Math.round((got / keys.length) * 100);
    },
    domainPct(domainKey, nodes) {
      const list = nodes.filter((n) => n.domain === domainKey);
      if (!list.length) return 0;
      const sum = list.reduce((s, n) => s + this.evidencePct(n.id), 0);
      return Math.round(sum / list.length);
    },
    overallPct(nodes) {
      if (!nodes.length) return 0;
      const sum = nodes.reduce((s, n) => s + this.evidencePct(n.id), 0);
      return Math.round(sum / nodes.length);
    },
    addXP(n) {
      CF.store.data.player.xp += n;
      const xp = CF.store.data.player.xp;
      const ranks = [
        [0, "见习研究员"], [200, "初级研究员"], [600, "研究员"],
        [1400, "高级研究员"], [3000, "FRONTIER RESEARCHER"],
      ];
      let r = ranks[0][1];
      for (const [th, name] of ranks) if (xp >= th) r = name;
      CF.store.data.player.rank = r;
      CF.store.save();
    },
  };

  /* ---------------- 路由 ---------------- */
  const routes = {};
  CF.route = (path, fn) => { routes[path] = fn; };
  CF.go = (path) => { location.hash = "#/" + path; };
  CF.startRouter = () => {
    const run = () => {
      const path = (location.hash.replace(/^#\//, "") || "home").split("?")[0];
      const arg = location.hash.split("?")[1];
      window.scrollTo(0, 0);
      (routes[path] || routes["home"])(arg ? decodeURIComponent(arg) : undefined);
      // 导航高亮
      document.querySelectorAll(".nav a").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("href") === "#/" + path);
      });
    };
    window.addEventListener("hashchange", run);
    run();
  };

  /* ---------------- UI 工具 ---------------- */
  CF.ui = {
    el(html) {
      const t = document.createElement("template");
      t.innerHTML = html.trim();
      return t.content.firstElementChild;
    },
    mount(html) {
      const m = document.getElementById("main");
      m.innerHTML = "";
      if (typeof html === "string") m.innerHTML = html;
      else m.appendChild(html);
    },
    toast(msg, ms = 2600) {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(this._tt);
      this._tt = setTimeout(() => t.classList.remove("show"), ms);
    },
    modal(html) {
      const mask = document.getElementById("modal-mask");
      const box = document.getElementById("modal-box");
      box.innerHTML = html;
      mask.classList.add("show");
      mask.onclick = (e) => { if (e.target === mask) CF.ui.closeModal(); };
    },
    closeModal() { document.getElementById("modal-mask").classList.remove("show"); },
    esc(s) {
      return String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    },
    // 打字机效果(用于叙事文本)
    typewrite(el, text, speed = 14) {
      return new Promise((res) => {
        let i = 0;
        el.textContent = "";
        const t = setInterval(() => {
          el.textContent += text[i++];
          if (i >= text.length) { clearInterval(t); res(); }
        }, speed);
      });
    },
    pctClass(p) { return p >= 80 ? "green" : p >= 40 ? "amber" : "red"; },
    today() { return new Date().toISOString().slice(0, 10); },
  };
})();
