/* ============================================================
   CYBER FRONTIER V5.0 — systems.js
   阶段0: Windows 诊断 / Python 工具制造 / Git & Markdown / Foundation Boss
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== F3 Windows 服务诊断 ==================== */
  CF.renderWindowsDiag = (container) => {
    const svcs = [
      { name: "W3SVC", display: "World Wide Web Publishing Service", status: "Stopped", startType: "Automatic", dep: "HTTP", logon: "Local System",
        problem: "依赖服务 HTTP 未启动", solution: "先启动 HTTP 服务" },
      { name: "HTTP", display: "HTTP Service", status: "Stopped", startType: "Manual", dep: null, logon: "Local System",
        problem: "被管理员手动停止", solution: "直接启动 HTTP 服务" },
      { name: "WinDefend", display: "Windows Defender", status: "Running", startType: "Automatic", dep: null, logon: "Local System" },
      { name: "EventLog", display: "Windows Event Log", status: "Running", startType: "Automatic", dep: null, logon: "Local System" },
    ];
    let selected = null;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div style="font-size:.78rem;color:var(--txt-faint);margin-bottom:10px">模拟 Windows 服务管理器 — 排查 Web 服务 (W3SVC) 无法启动的问题</div>
      <div style="border:1px solid var(--line-soft);border-radius:8px;overflow:hidden">
        <div style="display:grid;grid-template-columns:110px 1fr 90px 100px;background:var(--panel2);padding:9px 14px;font-size:.74rem;color:var(--txt-faint);font-family:var(--mono)">
          <span>名称</span><span>描述</span><span>状态</span><span>启动类型</span>
        </div>
        ${svcs.map((s, i) => `
          <div class="svc-row" data-i="${i}" style="display:grid;grid-template-columns:110px 1fr 90px 100px;padding:9px 14px;border-top:1px solid var(--line-soft);cursor:pointer;font-size:.82rem">
            <span class="mono" style="color:var(--cyan)">${s.name}</span>
            <span class="dim">${s.display}</span>
            <span style="color:${s.status === "Running" ? "var(--green)" : "var(--red)"}">${s.status}</span>
            <span class="faint">${s.startType}</span>
          </div>`).join("")}
      </div>
      <div id="svc-detail" style="display:none;margin-top:12px;padding:14px;border:1px solid var(--line-soft);border-radius:8px;background:var(--bg2)"></div>
      <div id="svc-result" style="margin-top:10px"></div>
    `;
    container.appendChild(wrap);

    let httpStarted = false, w3Started = false;
    const refresh = () => {
      wrap.querySelectorAll(".svc-row").forEach((r) => {
        const s = svcs[parseInt(r.dataset.i)];
        const st = s.name === "HTTP" && httpStarted ? "Running" : s.name === "W3SVC" && w3Started ? "Running" : s.status;
        r.children[2].textContent = st;
        r.children[2].style.color = st === "Running" ? "var(--green)" : "var(--red)";
      });
      if (w3Started) {
        document.getElementById("svc-result").innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">排查成功! W3SVC 已启动。你发现了依赖链: W3SVC → HTTP,并理解了"服务依赖"的概念。</div>`;
        CF.prog.markEvidence("f3_win", "e2");
      }
    };

    wrap.querySelectorAll(".svc-row").forEach((r) => {
      r.onclick = () => {
        selected = svcs[parseInt(r.dataset.i)];
        const d = document.getElementById("svc-detail");
        d.style.display = "block";
        d.innerHTML = `
          <div class="row" style="justify-content:space-between">
            <b>${selected.display} (${selected.name})</b>
            <div class="row">
              <button class="btn btn-sm btn-green" id="svc-start">启动</button>
              <button class="btn btn-sm btn-danger" id="svc-stop">停止</button>
            </div>
          </div>
          <div class="dim small mt">登录身份: ${selected.logon} · 启动类型: ${selected.startType}</div>
          ${selected.dep ? `<div class="small mt" style="color:var(--amber)">依赖服务: ${selected.dep}</div>` : ""}
          ${selected.problem ? `<div class="small mt" style="color:var(--red)">事件日志: 服务控制管理器报告 — ${selected.problem}</div>` : ""}
        `;
        document.getElementById("svc-start").onclick = () => {
          if (selected.name === "W3SVC" && !httpStarted) {
            $.toast("启动失败: 依赖服务 HTTP 未运行");
            document.getElementById("svc-result").innerHTML = `<div class="diag-explain">启动失败。查看事件日志: "W3SVC 服务因下列错误而无法启动: 依赖服务或组无法启动。" — 提示: 检查它依赖的 HTTP 服务。</div>`;
          } else if (selected.name === "W3SVC" && httpStarted) { w3Started = true; $.toast("W3SVC 启动成功"); }
          else if (selected.name === "HTTP") { httpStarted = true; $.toast("HTTP 服务启动成功"); }
          else $.toast(selected.name + " 已在运行");
          refresh();
        };
        document.getElementById("svc-stop").onclick = () => {
          if (selected.name === "HTTP") { httpStarted = false; if (w3Started) { w3Started = false; $.toast("W3SVC 因依赖停止而停止"); } }
          refresh();
        };
      };
    });
  };

  /* ==================== F4 Python 工具制造 ==================== */
  CF.renderPythonLab = (container) => {
    const missions = [
      {
        title: "任务 1: HTTP 客户端",
        brief: "写一个脚本: 用 requests 请求 http://target.local/api/status,打印状态码和响应长度。",
        must: ["requests", "get", "status_code"],
        sample: `import requests\nr = requests.get("http://target.local/api/status")\nprint(r.status_code)\nprint(len(r.text))`,
        output: "200\n42\n",
      },
      {
        title: "任务 2: 日志分析器",
        brief: "读取 access.log 内容(已内置),统计每个 IP 出现的次数,打印访问最多的 IP。",
        must: ["split", "for", "get"],
        sample: `log = open("access.log").read()\nips = {}\nfor line in log.split("\\n"):\n    ip = line.split()[0]\n    ips[ip] = ips.get(ip, 0) + 1\nprint(ips)`,
        output: "{'192.168.1.10': 45, '10.0.0.5': 12, '172.16.0.3': 8}\n",
      },
      {
        title: "任务 3: 端口探测器 (授权环境)",
        brief: "用 socket 尝试连接 127.0.0.1 的 22/80/443 端口,打印哪些开放。",
        must: ["socket", "connect", "for"],
        sample: `import socket\nfor port in [22, 80, 443]:\n    s = socket.socket()\n    s.settimeout(1)\n    r = s.connect_ex(("127.0.0.1", port))\n    print(port, "open" if r == 0 else "closed")`,
        output: "22 open\n80 open\n443 closed\n",
      },
      {
        title: "任务 4: 批量 URL 处理器",
        brief: "从 urls.txt 读入多个地址,逐个请求,汇总状态码和响应长度,按行输出报告。",
        must: ["for", "requests", "split"],
        sample: `import requests\nurls = open("urls.txt").read().split("\\n")\nfor u in urls:\n    if not u: continue\n    try:\n        r = requests.get(u, timeout=3)\n        print(u, r.status_code, len(r.text))\n    except Exception as e:\n        print(u, "ERROR", e)`,
        output: "http://a.local 200 5120\nhttp://b.local 404 210\nhttp://c.local ERROR timeout\n",
      },
      {
        title: "任务 5: 信息收集工具 (argparse + 正则)",
        brief: "用 argparse 接收目标 URL,抓取页面后用正则提取全部邮箱和内链,统计输出。",
        must: ["argparse", "re", "findall"],
        sample: `import requests, re, argparse\np = argparse.ArgumentParser()\np.add_argument("url")\na = p.parse_args()\nhtml = requests.get(a.url).text\nemails = re.findall(r"[\\w.]+@[\\w.]+\\.\\w+", html)\nlinks = re.findall(r'href="([^"]+)"', html)\nprint("emails:", emails)\nprint("links:", len(links))`,
        output: "emails: ['admin@corp.local', 'hr@corp.local']\nlinks: 23\n",
      },
    ];
    let cur = 0;
    const wrap = document.createElement("div");
    const render = () => {
      const m = missions[cur];
      wrap.innerHTML = `
        <div class="row" style="justify-content:space-between;margin-bottom:10px">
          <b style="color:var(--cyan)">${m.title}</b>
          <span class="tag purple">${cur + 1}/${missions.length}</span>
        </div>
        <div class="dim small mb">${m.brief}</div>
        <textarea id="py-code" class="term" style="width:100%;min-height:150px;color:#a8e6b0;resize:vertical;font-size:.82rem" spellcheck="false">${$.esc(m.sample)}</textarea>
        <div class="row mt">
          <button class="btn btn-sm btn-primary" id="py-run">▶ 运行</button>
          <button class="btn btn-sm" id="py-hint">提示</button>
          ${cur > 0 ? '<button class="btn btn-sm" id="py-prev">← 上一任务</button>' : ""}
        </div>
        <div id="py-out" class="term mt" style="display:none;font-size:.82rem"></div>
      `;
      document.getElementById("py-run").onclick = () => {
        const code = document.getElementById("py-code").value;
        const missing = m.must.filter((k) => !code.includes(k));
        const outEl = document.getElementById("py-out");
        outEl.style.display = "block";
        if (missing.length) {
          outEl.innerHTML = `<span style="color:var(--red)">代码缺少关键要素: ${missing.join(", ")}</span>\n<span class="faint">这不是背答案检查,是确认你的工具真的用了核心技术。</span>`;
        } else {
          outEl.innerHTML = `<span class="faint">$ python3 tool.py</span>\n<span style="color:var(--green)">${$.esc(m.output)}</span>`;
          $.toast("运行成功!");
          if (cur < missions.length - 1) {
            setTimeout(() => { cur++; render(); }, 1400);
          } else {
            setTimeout(() => {
              document.getElementById("py-out").innerHTML += `\n<span style="color:var(--cyan)">五个任务全部完成! HTTP 客户端 / 日志分析 / 端口探测 / 批量处理 / 信息收集 — 大纲要求的五类工具你都能写了。</span>`;
              CF.prog.markEvidence("f4_py", "e2");
            }, 800);
          }
        }
      };
      document.getElementById("py-hint").onclick = () => {
        $.modal(`<div class="panel-title">提示</div><div class="dim" style="line-height:1.8">必须使用的关键词: ${m.must.map(k => `<code style="color:var(--cyan)">${k}</code>`).join(" · ")}<br><br>关键不是背语法,而是理解: 你的脚本在代替你手动重复操作。</div>`);
      };
      const prev = document.getElementById("py-prev");
      if (prev) prev.onclick = () => { cur--; render(); };
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== F5 Git & Markdown ==================== */
  CF.renderGitLab = (container) => {
    const cmds = [
      { expect: "git init", out: "Initialized empty Git repository in /research/.git/" },
      { expect: "git add .", out: "(staged 3 files)" },
      { expect: "git commit", out: "[main (root-commit) a1b2c3d] 第一次研究笔记\n 3 files changed, 42 insertions(+)" },
      { expect: "git branch", out: "* main\n  research/sqli-lab (新建分支做实验,main 保持稳定)" },
      { expect: "git checkout research/sqli-lab", out: "Switched to branch 'research/sqli-lab'" },
      { expect: "git merge", out: "Merge made by the 'ort' strategy.\n实验笔记合并回 main,一次 commit 一份可追溯记录" },
      { expect: "git log", out: "commit e5f6a7b8\nMerge: 实验笔记合入\nday2: SQLi 靶场复盘" },
    ];
    let step = 0;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">在模拟终端中依次完成: <span class="mono" style="color:var(--cyan)">git init → add → commit → branch → checkout → merge → log</span> — 研究习惯: main 放稳定笔记,实验开分支。</div>
      <div class="term" id="git-term" style="min-height:200px;font-size:.82rem"></div>
      <div class="row mt">
        <input id="git-input" class="diag-opt" style="flex:1;padding:9px 14px;font-family:var(--mono)" placeholder="输入 git 命令..." spellcheck="false">
        <button class="btn btn-sm btn-primary" id="git-run">执行</button>
      </div>
      <div id="git-done"></div>
    `;
    container.appendChild(wrap);
    const term = wrap.querySelector("#git-term");
    const addLine = (html) => { term.innerHTML += html + "\n"; term.scrollTop = term.scrollHeight; };
    addLine(`<span class="faint">~/research $ </span><span class="faint">(等待输入)</span>`);

    const exec = () => {
      const v = document.getElementById("git-input").value.trim();
      document.getElementById("git-input").value = "";
      addLine(`<span style="color:var(--green)">~/research $</span> ${$.esc(v)}`);
      if (step >= cmds.length) { addLine(`<span class="faint">(流程已完成)</span>`); return; }
      const want = cmds[step].expect;
      if (v === want || v.startsWith(want + " ")) {
        addLine($.esc(cmds[step].out));
        step++;
        if (step === cmds.length) {
          document.getElementById("git-done").innerHTML = `<div class="diag-explain mt" style="border-color:var(--green-dim);color:var(--green)">Git 全流程完成(含分支)! 记住这个循环: 做实验 → 开分支写笔记 → merge 回 main。每周复盘 = 一份可追溯的提交历史。</div>`;
          CF.prog.markEvidence("f5_git", "e2");
          CF.prog.markEvidence("f5_git", "e3");
        }
      } else {
        addLine(`<span style="color:var(--red)">命令不正确。当前应输入: ${want}</span>`);
      }
    };
    wrap.querySelector("#git-run").onclick = exec;
    wrap.querySelector("#git-input").onkeydown = (e) => { if (e.key === "Enter") exec(); };
  };

  /* ==================== Foundation Boss ==================== */
  CF.renderFoundationBoss = (container) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="diag-explain" style="border-color:var(--red);margin-bottom:12px">
        <b>FOUNDATION TEST</b><br>
        一台 Linux 服务器上的 Web 应用完全无法访问。没有课程标签,没有提示列表。<br>
        你需要综合使用: 进程 / 服务 / 端口 / 网络 / 日志 / 权限 知识定位问题。<br>
        <span class="faint">提示只有一个: 输入 help 查看可用命令。</span>
      </div>
      <div id="boss-term"></div>
      <div id="boss-check" class="mt">
        <div class="panel-title">最终回答</div>
        <div class="dim small mb">Web 服务无法访问的根本原因是?</div>
        <div class="row">
          <button class="diag-opt btn-sm" style="width:auto" data-a="0">nginx 配置语法错误</button>
          <button class="diag-opt btn-sm" style="width:auto" data-a="1">端口 80 被 python3 进程占用,导致 nginx 启动失败</button>
          <button class="diag-opt btn-sm" style="width:auto" data-a="2">磁盘空间不足</button>
          <button class="diag-opt btn-sm" style="width:auto" data-a="3">防火墙拦截了所有流量</button>
        </div>
      </div>
    `;
    container.appendChild(wrap);
    CF.createTerminal(wrap.querySelector("#boss-term"));
    wrap.querySelectorAll("#boss-check [data-a]").forEach((b) => {
      b.onclick = () => {
        if (b.dataset.a === "1") {
          wrap.querySelector("#boss-check").innerHTML = `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">完全正确! 你独立完成了完整排查链: ps 看进程 → ss 看端口 → journalctl 看日志 → 定位 python3 占用 80 → 结论。<br><b>FOUNDATION 阶段通过。</b> 你已具备进入 Web Security 阶段的基础。</div>`;
          CF.prog.markEvidence("f_boss", "e2");
          CF.prog.markEvidence("f_boss", "e4");
          CF.prog.addXP(200);
        } else {
          $.toast("不对。回到终端继续排查 — 证据在日志里。");
        }
      };
    });
  };
})();
