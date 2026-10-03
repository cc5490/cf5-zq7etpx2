/* ============================================================
   CYBER FRONTIER V5.0 — foundation.js
   阶段0 交互式训练：程序追踪 / Packet Journey / Linux 终端
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== F0 程序追踪可视化 ==================== */
  CF.renderProgramTrace = (container) => {
    const stages = [
      { id: "file", name: "程序文件", icon: "📄", detail: "存储在磁盘上的可执行文件(如 .exe / ELF)。它本身不会运行,只是静态数据。" },
      { id: "load", name: "加载", icon: "⬇", detail: "操作系统将程序从磁盘读入内存,解析文件头,分配内存空间,准备执行环境。" },
      { id: "proc", name: "进程", icon: "⚙", detail: "进程是操作系统分配资源(CPU 时间、内存、文件句柄)的基本单位。每个进程有独立的地址空间。" },
      { id: "mem", name: "内存", icon: "💾", detail: "进程的代码段、数据段、堆、栈都存放在内存中。CPU 只能直接访问内存中的数据。" },
      { id: "thread", name: "线程", icon: "🧵", detail: "线程是 CPU 调度的基本单位。一个进程可以有多个线程,它们共享进程的内存空间,但各自有独立的执行流。" },
      { id: "syscall", name: "系统调用", icon: "🔑", detail: "用户态程序不能直接接触硬件。线程通过系统调用(如 socket())请求内核提供服务。" },
      { id: "socket", name: "Socket", icon: "🔌", detail: "内核创建的 Socket 是网络通信的端点。它抽象了 TCP/UDP 连接,让程序像读写文件一样发送/接收数据。" },
      { id: "port", name: "端口", icon: "🚪", detail: "端口(0-65535)用于区分同一主机上的不同网络服务。Socket 绑定到特定端口后,其他主机才能定向连接。" },
      { id: "server", name: "服务器", icon: "🖥", detail: "服务器是监听特定端口、等待客户端连接并处理请求的进程。客户端通过 IP:Port 找到它。" },
    ];

    let active = -1;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px;max-width:520px;margin:0 auto">
        <div style="text-align:center;color:var(--txt-faint);font-size:.78rem;margin-bottom:6px">点击每个阶段查看详情</div>
        ${stages.map((s, i) => `
          <div class="trace-stage" data-i="${i}" style="
            display:flex;align-items:center;gap:14px;padding:12px 16px;
            border:1px solid var(--line-soft);border-radius:8px;cursor:pointer;
            background:var(--panel);transition:.2s;
          ">
            <div style="font-size:1.4rem;width:32px;text-align:center">${s.icon}</div>
            <div style="font-weight:700;font-size:.92rem">${s.name}</div>
            <div style="margin-left:auto;font-family:var(--mono);font-size:.7rem;color:var(--txt-faint)">#${i + 1}</div>
          </div>
          <div class="trace-detail" data-i="${i}" style="display:none;padding:12px 16px 12px 62px;color:var(--txt-dim);font-size:.85rem;line-height:1.7;border-left:3px solid var(--cyan-dim);margin-bottom:8px">
            ${s.detail}
          </div>
        `).join("")}
        <div id="trace-summary" style="display:none;margin-top:10px;padding:14px;border:1px dashed var(--cyan-dim);border-radius:8px;color:var(--cyan);font-size:.88rem;text-align:center">
          你已理解完整路径！现在请用自己的话解释：为什么一个程序启动以后能够访问网络？
        </div>
      </div>
    `;
    container.appendChild(wrap);

    wrap.querySelectorAll(".trace-stage").forEach((el) => {
      el.onclick = () => {
        const i = parseInt(el.dataset.i);
        const detail = wrap.querySelector(`.trace-detail[data-i="${i}"]`);
        const wasOpen = detail.style.display === "block";
        // close all
        wrap.querySelectorAll(".trace-detail").forEach((d) => (d.style.display = "none"));
        wrap.querySelectorAll(".trace-stage").forEach((s) => (s.style.borderColor = "var(--line-soft)"));
        if (!wasOpen) {
          detail.style.display = "block";
          el.style.borderColor = "var(--cyan)";
          if (i > active) active = i;
          if (active >= stages.length - 1) {
            document.getElementById("trace-summary").style.display = "block";
            CF.prog.markEvidence("f0_cpu", "e2");
          }
        }
      };
    });
  };

  /* ==================== F1 Packet Journey 动画 ==================== */
  CF.renderPacketJourney = (container) => {
    const hops = [
      { id: "browser", name: "浏览器", icon: "🌐", desc: "用户在地址栏输入 https://example.com" },
      { id: "dns", name: "DNS", icon: "📇", desc: "查询域名对应的 IP 地址(如 93.184.216.34)" },
      { id: "tcp", name: "TCP 三次握手", icon: "🤝", desc: "SYN → SYN-ACK → ACK,确认双方收发能力正常" },
      { id: "tls", name: "TLS 握手", icon: "🔒", desc: "协商加密算法,交换密钥,建立安全通道" },
      { id: "http", name: "HTTP 请求", icon: "📨", desc: "发送 GET / HTTP/1.1 + Host 头" },
      { id: "server", name: "Web 服务器", icon: "🖥", desc: "Nginx/Apache 接收请求,路由到对应应用" },
      { id: "app", name: "应用程序", icon: "⚙", desc: "后端代码处理业务逻辑" },
      { id: "db", name: "数据库", icon: "🗄", desc: "查询/写入数据(如 SELECT * FROM users WHERE id=1)" },
      { id: "response", name: "HTTP 响应", icon: "📬", desc: "状态码 200 + HTML/JSON 数据沿原路返回" },
    ];

    let current = 0;
    let timer = null;

    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:6px;max-width:540px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:.78rem;color:var(--txt-faint)">Packet Journey 动画演示</span>
          <div class="row">
            <button class="btn btn-sm" id="pj-prev">←</button>
            <button class="btn btn-sm btn-primary" id="pj-play">▶ 播放</button>
            <button class="btn btn-sm" id="pj-next">→</button>
          </div>
        </div>
        <div id="pj-hops">
          ${hops.map((h, i) => `
            <div class="pj-hop" data-i="${i}" style="
              display:flex;align-items:center;gap:12px;padding:10px 14px;
              border:1px solid var(--line-soft);border-radius:8px;
              background:var(--panel);opacity:.35;transition:.4s;
            ">
              <div style="font-size:1.3rem;width:30px;text-align:center">${h.icon}</div>
              <div>
                <div style="font-weight:700;font-size:.88rem">${h.name}</div>
                <div style="font-size:.78rem;color:var(--txt-dim);margin-top:2px">${h.desc}</div>
              </div>
            </div>
          `).join("")}
        </div>
        <div id="pj-status" style="text-align:center;color:var(--cyan);font-family:var(--mono);font-size:.8rem;margin-top:8px;height:22px"></div>
      </div>
    `;
    container.appendChild(wrap);

    function update() {
      wrap.querySelectorAll(".pj-hop").forEach((el) => {
        const i = parseInt(el.dataset.i);
        if (i <= current) {
          el.style.opacity = "1";
          el.style.borderColor = i === current ? "var(--cyan)" : "var(--line-soft)";
          el.style.background = i === current ? "rgba(56,225,255,.06)" : "var(--panel)";
        } else {
          el.style.opacity = ".35";
          el.style.borderColor = "var(--line-soft)";
          el.style.background = "var(--panel)";
        }
      });
      document.getElementById("pj-status").textContent = current < hops.length
        ? `阶段 ${current + 1}/${hops.length}: ${hops[current].name}`
        : " journey 完成 — 现在请自己解释整个过程";
      if (current >= hops.length - 1) CF.prog.markEvidence("f1_net", "e2");
    }

    document.getElementById("pj-prev").onclick = () => { if (current > 0) { current--; update(); } };
    document.getElementById("pj-next").onclick = () => { if (current < hops.length - 1) { current++; update(); } };
    document.getElementById("pj-play").onclick = () => {
      if (timer) { clearInterval(timer); timer = null; document.getElementById("pj-play").textContent = "▶ 播放"; return; }
      document.getElementById("pj-play").textContent = "⏸ 暂停";
      timer = setInterval(() => {
        if (current >= hops.length - 1) { clearInterval(timer); timer = null; document.getElementById("pj-play").textContent = "▶ 重播"; }
        else { current++; update(); }
      }, 1400);
    };
    update();
  };

  /* ==================== F2 Linux 模拟终端 ==================== */
  CF.createTerminal = (container, scenario, nodeId) => {
    nodeId = nodeId || "f2_linux";
    const usedCmds = new Set();
    // 虚拟文件系统
    const vfs = {
      "/": { type: "dir", children: ["etc", "var", "home", "usr", "tmp", "proc", "opt"] },
      "/etc": { type: "dir", children: ["nginx", "passwd", "hosts", "ssh"] },
      "/etc/nginx": { type: "dir", children: ["nginx.conf", "sites-available"] },
      "/etc/nginx/nginx.conf": { type: "file", content: "user www-data;\nworker_processes auto;\npid /run/nginx.pid;\n\nevents { worker_connections 768; }\n\nhttp {\n  server {\n    listen 80;\n    root /var/www/html;\n    index index.html;\n  }\n}\n" },
      "/var": { type: "dir", children: ["log", "www"] },
      "/var/log": { type: "dir", children: ["nginx", "syslog", "auth.log"] },
      "/var/log/nginx": { type: "dir", children: ["access.log", "error.log"] },
      "/var/log/nginx/error.log": { type: "file", content: "2024/01/15 10:23:45 [error] 1234#1234: *1 connect() failed (111: Connection refused) while connecting to upstream\n2024/01/15 10:24:12 [warn] 1234#1234: *2 upstream server temporarily disabled\n" },
      "/var/log/nginx/access.log": { type: "file", content: "192.168.1.10 - - [15/Jan/2024:10:20:01 +0800] \"GET / HTTP/1.1\" 502 157\n192.168.1.10 - - [15/Jan/2024:10:20:15 +0800] \"GET /favicon.ico HTTP/1.1\" 502 157\n" },
      "/var/www": { type: "dir", children: ["html"] },
      "/var/www/html": { type: "dir", children: ["index.html"] },
      "/var/www/html/index.html": { type: "file", content: "<html><body><h1>Hello Frontier</h1></body></html>\n" },
      "/home": { type: "dir", children: ["alice", "bob"] },
      "/home/alice": { type: "dir", children: ["notes.txt"] },
      "/home/alice/notes.txt": { type: "file", content: "Web 服务排查记录:\n1. nginx 进程不存在\n2. 端口 80 被另一个进程占用\n3. 需要检查 /etc/nginx/nginx.conf\n" },
      "/proc": { type: "dir", children: [] },
    };
    // 动态填充 /proc
    const procs = [
      { pid: 1, cmd: "systemd", user: "root" },
      { pid: 512, cmd: "sshd: /usr/sbin/sshd", user: "root" },
      { pid: 1024, cmd: "python3 app.py", user: "www-data" },
      { pid: 2048, cmd: "python3 -m http.server 80", user: "root" },
    ];
    procs.forEach((p) => {
      vfs[`/proc/${p.pid}`] = { type: "dir", children: ["cmdline", "status"] };
      vfs[`/proc/${p.pid}/cmdline`] = { type: "file", content: p.cmd };
      vfs[`/proc/${p.pid}/status`] = { type: "file", content: `Name:\t${p.cmd.split(" ")[0]}\nPid:\t${p.pid}\nUid:\t1000\n` };
    });

    let cwd = "/home/alice";
    let history = [];
    let histIdx = -1;

    const term = document.createElement("div");
    term.className = "term";
    term.style.cssText = "min-height:320px;max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;font-size:.82rem";
    container.appendChild(term);

    function prompt() {
      const p = document.createElement("div");
      p.className = "prompt-line";
      p.innerHTML = `<span style="color:var(--green)">${$.esc("alice@frontier")}</span>:<span style="color:var(--cyan)">${$.esc(cwd)}</span>$ `;
      const input = document.createElement("span");
      input.contentEditable = true;
      input.style.cssText = "outline:none;caret-color:var(--cyan);min-width:10px;display:inline-block;white-space:pre";
      p.appendChild(input);
      term.appendChild(p);
      term.scrollTop = term.scrollHeight;
      input.focus();

      input.onkeydown = (e) => {
        if (e.key === "Enter") { e.preventDefault(); runCmd(input.textContent.trim(), p); }
        else if (e.key === "ArrowUp") { e.preventDefault(); if (histIdx < history.length - 1) { histIdx++; input.textContent = history[history.length - 1 - histIdx]; } }
        else if (e.key === "ArrowDown") { e.preventDefault(); if (histIdx > 0) { histIdx--; input.textContent = history[history.length - 1 - histIdx]; } else { histIdx = -1; input.textContent = ""; } }
        else if (e.key === "Tab") { e.preventDefault(); autoComplete(input); }
        else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); term.innerHTML = ""; prompt(); }
      };
      input.onblur = () => { input.contentEditable = false; };
    }

    function out(html, isErr) {
      const d = document.createElement("div");
      d.style.color = isErr ? "var(--red)" : "inherit";
      d.innerHTML = html;
      term.appendChild(d);
      term.scrollTop = term.scrollHeight;
    }

    function resolve(p) {
      if (p.startsWith("/")) return p;
      const parts = cwd.split("/").filter(Boolean);
      p.split("/").forEach((part) => {
        if (part === "..") parts.pop();
        else if (part && part !== ".") parts.push(part);
      });
      return "/" + parts.join("/");
    }

    function lookup(path) {
      const p = resolve(path);
      return { path: p, node: vfs[p] || null };
    }

    function listDir(p) {
      const r = lookup(p);
      if (!r.node) return { err: `ls: cannot access '${p}': No such file or directory` };
      if (r.node.type !== "dir") return { err: `ls: cannot access '${p}': Not a directory` };
      return { items: r.node.children };
    }

    function runCmd(cmd, promptEl) {
      promptEl.querySelector("span[contenteditable]").contentEditable = false;
      history.push(cmd);
      histIdx = -1;
      const args = cmd.trim().split(/\s+/);
      const c = args[0];

      if (!c) { prompt(); return; }

      // 记录实际使用过的核心命令,用够 6 种授予"能操作"证据
      const coreCmds = ["ls","cd","pwd","cp","mv","rm","cat","grep","find","awk","sed","chmod","chown","ps","top","kill","ss","ip","curl","wget","ssh","scp","tar","systemctl","journalctl"];
      if (coreCmds.includes(c)) {
        usedCmds.add(c);
        if (usedCmds.size >= 6) CF.prog.markEvidence(nodeId, "e2");
      }

      switch (c) {
        case "ls": {
          const target = args[1] || ".";
          const r = listDir(target);
          if (r.err) out(r.err, true);
          else {
            const colored = r.items.map((n) => {
              const cp = resolve(target + "/" + n);
              const isDir = (vfs[cp] || {}).type === "dir";
              return isDir ? `<span style="color:var(--cyan)">${n}/</span>` : n;
            }).join("  ");
            out(colored);
          }
          break;
        }
        case "cd": {
          const target = args[1] || "/home/alice";
          const r = lookup(target);
          if (!r.node) out(`bash: cd: ${target}: No such file or directory`, true);
          else if (r.node.type !== "dir") out(`bash: cd: ${target}: Not a directory`, true);
          else cwd = r.path;
          break;
        }
        case "pwd": out($.esc(cwd)); break;
        case "cat": {
          if (!args[1]) { out("cat: missing operand", true); break; }
          const r = lookup(args[1]);
          if (!r.node) out(`cat: ${args[1]}: No such file or directory`, true);
          else if (r.node.type !== "file") out(`cat: ${args[1]}: Is a directory`, true);
          else out(`<pre style="margin:0">${$.esc(r.node.content)}</pre>`);
          break;
        }
        case "grep": {
          if (!args[1]) { out("Usage: grep [pattern] [file]", true); break; }
          const pat = args[1];
          const file = args[2];
          if (!file) { out("grep: missing file operand", true); break; }
          const r = lookup(file);
          if (!r.node || r.node.type !== "file") { out(`grep: ${file}: No such file`, true); break; }
          const lines = r.node.content.split("\n").filter((l) => l.includes(pat));
          if (!lines.length) out(`(no matches)`);
          else out(lines.map((l) => $.esc(l).replace(new RegExp($.esc(pat).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), (m) => `<span style="color:var(--red);background:rgba(255,93,108,.12)">${m}</span>`)).join("<br>"));
          break;
        }
        case "ps": {
          let txt = "  PID  USER     COMMAND\n";
          procs.forEach((p) => { txt += `${String(p.pid).padStart(6)}  ${p.user.padEnd(8)} ${p.cmd}\n`; });
          out(`<pre style="margin:0">${$.esc(txt)}</pre>`);
          break;
        }
        case "ss": case "netstat": {
          out(`<pre style="margin:0">State    Recv-Q  Send-Q  Local Address:Port  Peer Address:Process
LISTEN   0       128     0.0.0.0:22          0.0.0.0:*    users:(("sshd",pid=512,fd=3))
LISTEN   0       128     0.0.0.0:80          0.0.0.0:*    users:(("python3",pid=2048,fd=3))
</pre>`);
          break;
        }
        case "curl": {
          if (!args[1]) { out("curl: try 'curl http://localhost/'", true); break; }
          const url = args[1];
          if (url.includes("localhost") || url.includes("127.0.0.1")) {
            if (url.includes(":80")) {
              out(`<pre style="margin:0">HTTP/1.0 200 OK\nServer: SimpleHTTP/0.6 Python/3.10\n\n&lt;html&gt;&lt;body&gt;&lt;h1&gt;Hello Frontier&lt;/h1&gt;&lt;/body&gt;&lt;/html&gt;</pre>`);
            } else {
              out(`curl: (7) Failed to connect to localhost port 81: Connection refused`, true);
            }
          } else {
            out(`curl: (6) Could not resolve host: ${url}`, true);
          }
          break;
        }
        case "systemctl": {
          if (args[1] === "status" && args[2] === "nginx") {
            out(`<pre style="margin:0;color:var(--red)">○ nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: inactive (dead) since Mon 2024-01-15 10:20:00 CST
   Main PID: 0
        CPU: 0

Hint: 服务没有运行。试试 systemctl start nginx</pre>`);
          } else if (args[1] === "start" && args[2] === "nginx") {
            out(`<pre style="margin:0;color:var(--green)">Job for nginx.service failed.
See "systemctl status nginx.service" and "journalctl -xe" for details.

Hint: 端口 80 已被占用。先用 ss -tlnp 查看哪个进程占用了 80 端口。</pre>`);
          } else {
            out("Usage: systemctl status/start [service]", true);
          }
          break;
        }
        case "journalctl": {
          out(`<pre style="margin:0">Jan 15 10:20:00 frontier systemd[1]: Starting A high performance web server...
Jan 15 10:20:00 frontier nginx[1234]: nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)
Jan 15 10:20:00 frontier systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE
Jan 15 10:20:00 frontier systemd[1]: nginx.service: Failed with result 'exit-code'.

Hint: 日志显示 nginx 无法启动,因为端口 80 被占用。</pre>`);
          break;
        }
        case "clear": term.innerHTML = ""; break;
        case "help": case "?": {
          out(`可用命令: ls cd pwd cat grep ps ss curl systemctl journalctl clear`);
          out(`排查任务: Web 服务无法访问,请找出原因。`);
          out(`排查思路: 进程 → 服务 → 端口 → 网络 → 配置 → 权限 → 日志`);
          break;
        }
        case "find": case "awk": case "sed": case "chmod": case "chown": case "top": case "kill": case "ip": case "wget": case "ssh": case "scp": case "tar": {
          out(`[模拟器提示] ${c} 命令在本简化环境中尚未实现。实际 Linux 中可使用 man ${c} 查看用法。`, true);
          break;
        }
        default: out(`${c}: command not found`, true);
      }
      prompt();
    }

    function autoComplete(input) {
      const text = input.textContent;
      const last = text.split(" ").pop();
      const r = listDir(".");
      if (r.err) return;
      const matches = r.items.filter((n) => n.startsWith(last));
      if (matches.length === 1) {
        const prefix = text.substring(0, text.lastIndexOf(" ") + 1);
        input.textContent = prefix + matches[0];
      } else if (matches.length > 1) {
        out(matches.join("  "));
      }
    }

    out(`<div style="color:var(--txt-faint);margin-bottom:8px">CYBER FRONTIER Linux Simulator v1.0
输入 help 查看可用命令。任务: Web 服务无法访问,请找出原因。</div>`);
    prompt();
    return term;
  };

})();
