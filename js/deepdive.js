/* ============================================================
   CYBER FRONTIER V5.0 — deepdive.js
   L4 深度训练: Wireshark 抓包判读 / CIDR 子网 / TLS 握手 /
   DNS 全过程 / Linux 权限 SUID / 日志攻击狩猎
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;
  const $ = CF.ui;

  /* ==================== 虚拟机 vs 容器 ==================== */
  CF.renderVM = (container) => {
    const wrap = document.createElement("div");
    // 分层结构对比图
    wrap.innerHTML = `
      <div class="row mb" style="gap:14px;align-items:stretch">
        <div style="flex:1">
          <div class="faint small mb" style="text-align:center">虚拟机 (VM)</div>
          <div class="term" style="font-size:.72rem;line-height:1.9;text-align:center">
            <div style="color:var(--amber)">┌ 应用 A ┐ ┌ 应用 B ┐</div>
            <div style="color:var(--amber)">│ 客户OS │ │ 客户OS │ &lt;— 每台完整操作系统</div>
            <div style="color:var(--cyan)">│ [Hypervisor 虚拟化层] │</div>
            <div style="color:var(--green)">│ [宿主操作系统] │</div>
            <div class="faint">│ [物理硬件] │</div>
          </div>
        </div>
        <div style="flex:1">
          <div class="faint small mb" style="text-align:center">容器 (Docker)</div>
          <div class="term" style="font-size:.72rem;line-height:1.9;text-align:center">
            <div style="color:var(--amber)">┌ 应用A+库 ┐ ┌ 应用B+库 ┐</div>
            <div style="color:var(--cyan)">│ [容器引擎: 命名空间+文件系统隔离] │</div>
            <div style="color:var(--green)">│ [宿主操作系统内核(共享!)] │</div>
            <div class="faint">│ [物理硬件] │</div>
          </div>
        </div>
      </div>
      <div class="dim small mb">安全实验铁律: 靶场和攻击工具都放进隔离环境。你的真实系统永远不进 Scope。</div>
      <div id="vm-q"></div>`;
    container.appendChild(wrap);
    const qs = [
      { q: "跑一个含已知漏洞的旧版靶机,最合适的环境?", opts: ["虚拟机 — 完整 OS 隔离最彻底", "本机直接装", "手机", "路由器"], a: 0, why: "漏洞靶机会被攻破,必须假设它会失陷。VM 的客户 OS 壁垒保护宿主机。" },
      { q: "容器隔离的最大弱点?", opts: ["所有容器共享宿主内核,内核漏洞可能导致逃逸", "启动太慢", "占用内存多", "不能联网"], a: 0, why: "与 VM 不同,容器没有独立内核。共享内核 = 单点风险。" },
      { q: "在受控实验环境里快速部署 20 个一模一样的 Web 靶场,选?", opts: ["容器 — 秒级启动、模板复制", "20 台虚拟机", "20 台物理机", "一个浏览器开 20 个标签"], a: 0, why: "容器镜像的复制与销毁成本极低,适合批量靶场。" },
      { q: "VirtualBox/VMware 属于哪一类?", opts: ["Hypervisor 虚拟化(VM)", "容器", "防火墙", "编译器"], a: 0, why: "它们模拟完整硬件,客户机里跑完整操作系统。" },
      { q: "实验结束后,正确做法?", opts: ["快照回滚/销毁环境,防止残留后门", "保留环境并连着公网", "把靶机 IP 发到群里", "把账号密码存桌面"], a: 0, why: "被打穿过的靶场可能留有后门,用完即毁是基本习惯。" },
    ];
    let cur = 0, score = 0;
    const render = () => {
      if (cur >= qs.length) {
        wrap.querySelector("#vm-q").innerHTML = `<div class="diag-explain" style="border-color:${score >= 4 ? "var(--green-dim)" : "var(--amber)"}">${score}/${qs.length}。${score >= 4 ? "你已经知道什么时候用 VM、什么时候用容器 — 搭实验环境不再踩坑。" : "核心: VM 隔离彻底,容器轻量快速。"}</div>`;
        if (score >= 4) { CF.prog.markEvidence("f0b_vm", "e2"); CF.prog.addXP(50); }
        return;
      }
      const q = qs[cur];
      wrap.querySelector("#vm-q").innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">场景 ${cur + 1}/${qs.length}</b><span class="tag purple">${q.q}</span></div>
        ${q.opts.map((o, i) => `<button class="diag-opt" data-i="${i}">${o}</button>`).join("")}
        <div id="vm-fb"></div>`;
      wrap.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.i);
          if (i === q.a) score++;
          wrap.querySelectorAll("[data-i]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.i) === q.a) x.classList.add("correct"); });
          wrap.querySelector("#vm-fb").innerHTML = `<div class="diag-explain mt">${q.why}</div><button class="btn btn-sm btn-primary mt" id="vm-next">下一题 →</button>`;
          wrap.querySelector("#vm-next").onclick = () => { cur++; render(); };
        };
      });
    };
    render();
  };

  /* ==================== 网络协议全景(OSI 工具箱) ==================== */
  CF.renderProtocols = (container) => {
    const layers = [
      { name: "5 应用层", protos: "DNS · HTTP · HTTPS · DHCP · SSH", q: "网站打不开? 服务本身正常吗?" },
      { name: "4 传输层", protos: "TCP · UDP · 端口 · Socket", q: "端口通不通? TCP 可靠 / UDP 快速无连接" },
      { name: "3 网络层", protos: "IP · ICMP(ping) · 路由 · 默认网关", q: "IP 可达吗? 跨网段流量走路由" },
      { name: "2 链路层", protos: "MAC · ARP · 交换机", q: "同一局域网内,ARP 把 IP 翻译成 MAC" },
      { name: "1 物理层", protos: "网线 · 光纤 · 无线电", q: "设备连上了吗?" },
    ];
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="mb">${layers.map((l) => `
        <div class="task-item" style="display:block;padding:8px 14px">
          <div class="row" style="justify-content:space-between">
            <b class="mono" style="color:var(--cyan);font-size:.8rem">${l.name}</b>
            <span class="faint small">${l.protos}</span>
          </div>
          <div class="dim small">排障问题: ${l.q}</div>
        </div>`).join("")}
      </div>
      <div class="faint small mb">逐层挑战 — 共 10 题,答对 7 题以上通过</div>
      <div id="pr-q"></div>`;
    container.appendChild(wrap);
    const qs = [
      { q: "ping 命令依赖哪个协议?", opts: ["ICMP", "ARP", "DHCP", "TLS"], a: 0, why: "ICMP 是 IP 层的『回声』协议,ping 即 ICMP Echo Request/Reply。" },
      { q: "你的电脑如何知道 192.168.1.1 的 MAC 地址?", opts: ["发 ARP 广播查询", "查 DNS", "问 DHCP", "查路由表"], a: 0, why: "同网段通信必须先 ARP 把 IP → MAC。ARP 欺骗 = 伪造这个应答。" },
      { q: "DNS 的作用?", opts: ["域名 → IP", "IP → MAC", "自动分配 IP", "加密流量"], a: 0, why: "记住方向: DNS 管域名,ARP 管 MAC,DHCP 管自动配 IP。" },
      { q: "DHCP 的作用?", opts: ["自动分配 IP/网关/DNS", "解析域名", "传输文件", "端口映射"], a: 0, why: "连上 WiFi 就能上网,就是 DHCP 在后台给了你地址。" },
      { q: "家里的宽带只有 1 个公网 IP,为什么全家 10 台设备都能上网?", opts: ["路由器做了 NAT 地址转换", "运营商给了 10 个 IP", "设备共用一个 MAC", "WiFi 自动变 IP"], a: 0, why: "NAT 把内网私有地址(192.168.x.x)映射到唯一公网 IP 的不同端口。" },
      { q: "以下哪些是私有地址?", opts: ["10.0.0.5 / 172.16.3.1 / 192.168.1.9", "8.8.8.8 / 1.1.1.1", "93.184.216.34", "0.0.0.0"], a: 0, why: "三大私有段: 10/8, 172.16/12, 192.168/16。它们不能直接路由到公网。" },
      { q: "视频通话用 UDP 而不是 TCP 的原因?", opts: ["丢一帧无所谓,快比完整更重要", "UDP 更安全", "TCP 不支持视频", "UDP 免费"], a: 0, why: "TCP 重传会造成卡顿,UDP 牺牲可靠性换实时性。" },
      { q: "代理(Proxy)和 VPN 的关键区别?", opts: ["代理按应用转发,VPN 在系统级加密全部流量", "代理更快更安全", "VPN 只能浏览网页", "没有区别"], a: 0, why: "Burp 就是 HTTP 代理: 只拦 HTTP 流量。VPN 是虚拟网卡,全流量都走隧道。" },
      { q: "IPv6 地址的样子?", opts: ["2001:db8::1 (128位,冒号十六进制)", "192.168.1.1", "00:1A:2B:3C:4D:5E", "10.0.0.0/8"], a: 0, why: "冒号十六进制是 IPv6;第三项是 MAC 地址;第四项是 IPv4 CIDR。" },
      { q: "HTTP 状态码 500 系列意味着?", opts: ["服务器端出错", "客户端请求错误", "重定向", "认证失败"], a: 0, why: "4xx = 你的问题(404 不存在/401 未登录/403 无权限/405 方法不允许),5xx = 服务器的问题。SQL 注入常引发 500 — 这是侦察信号。" },
      { q: "攻击者把流量导入自己的服务器,会修改哪个 HTTP 头?", opts: ["Host 头", "Cookie", "User-Agent", "Content-Length"], a: 0, why: "Host 决定请求去哪台虚拟主机,Host 头注入/走私的基础。" },
    ];
    let cur = 0, score = 0;
    const render = () => {
      if (cur >= qs.length) {
        wrap.querySelector("#pr-q").innerHTML = `<div class="diag-explain" style="border-color:${score >= 7 ? "var(--green-dim)" : "var(--amber)"}">${score}/${qs.length}。${score >= 7 ? "协议全景已打通 — 你有了按层排障的思维框架。" : "复习方向: 每个协议解决什么问题(域名/IP/MAC/自动配址/跨网段)。"}</div>`;
        if (score >= 7) { CF.prog.markEvidence("f1b_protocols", "e2"); CF.prog.addXP(60); }
        return;
      }
      const q = qs[cur];
      wrap.querySelector("#pr-q").innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">协议 ${cur + 1}/${qs.length}</b><span class="tag green">得分 ${score}</span></div>
        <div class="dim small mb">${q.q}</div>
        ${q.opts.map((o, i) => `<button class="diag-opt" data-i="${i}">${o}</button>`).join("")}
        <div id="pr-fb"></div>`;
      wrap.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.i);
          if (i === q.a) score++;
          wrap.querySelectorAll("[data-i]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.i) === q.a) x.classList.add("correct"); });
          wrap.querySelector("#pr-fb").innerHTML = `<div class="diag-explain mt">${q.why}</div><button class="btn btn-sm btn-primary mt" id="pr-next">下一题 →</button>`;
          wrap.querySelector("#pr-next").onclick = () => { cur++; render(); };
        };
      });
    };
    render();
  };

  /* ==================== PowerShell 与注册表排查 ==================== */
  CF.renderPowerShell = (container) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">模拟 PowerShell。你是应急响应员: 服务器疑似被入侵。<b>按顺序执行 4 条排查命令</b>(用下方提示或自己输入)。输入命令后回车/点执行。</div>
      <div class="term mb" id="ps-term" style="min-height:160px;font-size:.78rem"></div>
      <div class="row mb">
        <input id="ps-input" class="diag-opt mono" style="flex:1;padding:9px 14px;font-family:var(--mono)" placeholder="PS C:\\&gt; 输入命令..." spellcheck="false">
        <button class="btn btn-sm btn-primary" id="ps-run">执行</button>
      </div>
      <div class="faint small mb">可用命令: Get-Service · Get-Process · Get-EventLog · Get-ItemProperty</div>
      <div id="ps-task"></div>`;
    container.appendChild(wrap);
    const term = wrap.querySelector("#ps-term");
    const addLine = (html, color) => {
      const d = document.createElement("div");
      d.style.color = color || "inherit";
      d.innerHTML = html;
      term.appendChild(d);
      term.scrollTop = term.scrollHeight;
    };
    addLine(`<span style="color:var(--cyan)">PS C:\\Users\\Responder&gt;</span> <span class="faint">服务器 CPU 异常,请排查...</span>`);
    const tasks = [
      {
        expect: /Get-Service/i,
        hint: "Get-Service | Where Status -eq Running",
        out: `<span class="faint">Status   Name               DisplayName</span>
Running  EventLog           Windows Event Log
Running  WinDefend         Windows Defender
Running  <span style="color:var(--red)">SvcUpdHelper      Windows Update Helper</span>   &lt;— 可疑: 非标准服务名
Stopped  W3SVC             World Wide Web Pub...`,
        note: "发现可疑服务 SvcUpdHelper(伪装成系统更新服务)。",
      },
      {
        expect: /Get-Process/i,
        hint: "Get-Process | Sort CPU -Desc | Select -First 5",
        out: `<span class="faint">Handles  NPM(K)  PM(K)   WS(K)  CPU(s)    Id  ProcessName</span>
    712     31  184320  210432  <span style="color:var(--red)">1844.5</span>   <span style="color:var(--red)">3872  svchost</span>   &lt;— 注意: 真正的 svchost 由 services.exe 启动
    891     35   64200   78120    42.1   1204  explorer
    512     18   31200   40120     8.2    668  lsass`,
        note: "PID 3872 的 svchost 占用异常 CPU — 真假 svchost 要看父进程。",
      },
      {
        expect: /Get-EventLog/i,
        hint: "Get-EventLog Security -Newest 10 | Where EventID -eq 4688",
        out: `<span class="faint">Index Time         EntryType   Source   EventID InstanceID Message</span>
  8841  03:41:02     Warning   Security   4688        ...新进程创建: C:\\Users\\Public\\svchost.exe(可疑路径!)
  8840  03:41:01     Warning   Security   4684        ...账户登录: 未知外部 IP 203.0.113.66 → 提权成功(SpecialPrivileges)</span>`,
        note: "事件 4688: 攻击者在 C:\\Users\\Public 下投放了伪装进程。",
      },
      {
        expect: /Get-ItemProperty/i,
        hint: "Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        out: `<span class="faint">    PSPath: HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run</span>
SvcUpdHelper    REG_SZ    <span style="color:var(--red)">C:\\Users\\Public\\svchost.exe /silent</span>   &lt;— 持久化后门!`,
        note: "注册表 Run 键 = 开机自启动。攻击者的持久化手法被你定位了。",
      },
    ];
    let step = 0;
    const exec = () => {
      const v = wrap.querySelector("#ps-input").value.trim();
      wrap.querySelector("#ps-input").value = "";
      if (!v) return;
      addLine(`<span style="color:var(--cyan)">PS C:\\Users\\Responder&gt;</span> ${$.esc(v)}`);
      if (step < tasks.length && tasks[step].expect.test(v)) {
        addLine(tasks[step].out);
        addLine(`→ <span style="color:var(--amber)">${tasks[step].note}</span>`);
        step++;
        renderTask();
        if (step === tasks.length) {
          addLine(`<span style="color:var(--green)">排查完成: 可疑服务 + 伪装进程 + 事件日志证据 + 注册表持久化,完整入侵链已还原。</span>`);
          CF.prog.markEvidence("f3b_ps", "e2");
          CF.prog.markEvidence("f3b_ps", "e4");
          CF.prog.addXP(80);
        }
      } else if (step < tasks.length) {
        addLine(`<span style="color:var(--red)">下一步应使用的命令: ${tasks[step].hint.slice(0, tasks[step].hint.indexOf(" "))}...</span>`);
      } else {
        addLine(`<span class="faint">(排查已完成)</span>`);
      }
    };
    const renderTask = () => {
      wrap.querySelector("#ps-task").innerHTML = step < tasks.length
        ? `<div class="diag-explain">任务 ${step + 1}/4: ${["列出服务找伪装项", "按 CPU 排序查可疑进程", "读安全事件日志 4688", "检查注册表 Run 自启动键"][step]} — 命令提示: <span class="mono">${tasks[step].hint.split(" ")[0]}</span></div>`
        : `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">全部完成! 你掌握了 Windows 应急排查三板斧: 服务 → 进程 → 日志 → 注册表持久化。</div>`;
    };
    wrap.querySelector("#ps-run").onclick = exec;
    wrap.querySelector("#ps-input").onkeydown = (e) => { if (e.key === "Enter") exec(); };
    renderTask();
  };

  /* ==================== Wireshark 抓包判读 ==================== */
  CF.renderPacketLab = (container) => {
    // 一次访问 https://shop.local 的完整抓包(简化版)
    const packets = [
      { no: 1, t: "0.000", proto: "DNS", info: "Standard query A shop.local", color: "var(--purple)" },
      { no: 2, t: "0.012", proto: "DNS", info: "Standard query response A 93.184.216.34", color: "var(--purple)" },
      { no: 3, t: "0.013", proto: "TCP", info: "51000 → 443 [SYN] Seq=0 Win=64240", color: "var(--amber)" },
      { no: 4, t: "0.025", proto: "TCP", info: "443 → 51000 [SYN, ACK] Seq=0 Ack=1", color: "var(--amber)" },
      { no: 5, t: "0.026", proto: "TCP", info: "51000 → 443 [ACK] Seq=1 Ack=1", color: "var(--amber)" },
      { no: 6, t: "0.028", proto: "TLSv1.3", info: "Client Hello (supported_versions)", color: "var(--cyan)" },
      { no: 7, t: "0.045", proto: "TLSv1.3", info: "Server Hello, Certificate, Server Hello Done", color: "var(--cyan)" },
      { no: 8, t: "0.060", proto: "TLSv1.3", info: "Client Key Exchange, Change Cipher Spec", color: "var(--cyan)" },
      { no: 9, t: "0.062", proto: "TLSv1.3", info: "Application Data (encrypted)", color: "var(--green)" },
      { no: 10, t: "0.120", proto: "HTTP/2", info: "GET / HTTP/2 (inside TLS)", color: "var(--green)" },
      { no: 11, t: "0.180", proto: "HTTP/2", info: "200 OK, 4821 bytes (inside TLS)", color: "var(--green)" },
    ];
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">这是访问 <span class="mono" style="color:var(--cyan)">https://shop.local</span> 的真实抓包(简化)。安全研究员要能从流量还原发生了什么。</div>
      <div class="term mb" style="font-size:.76rem;line-height:1.6">
        <div class="faint" style="display:grid;grid-template-columns:40px 70px 90px 1fr;gap:8px;border-bottom:1px solid var(--line-soft);padding-bottom:4px"><span>No.</span><span>Time</span><span>Proto</span><span>Info</span></div>
        ${packets.map((p) => `<div style="display:grid;grid-template-columns:40px 70px 90px 1fr;gap:8px;color:${p.color}"><span>${p.no}</span><span class="faint">${p.t}</span><span>${p.proto}</span><span style="color:var(--txt)">${p.info}</span></div>`).join("")}
      </div>
      <div id="pcap-q"></div>`;
    container.appendChild(wrap);
    const qs = [
      { q: "包 3-5 是什么过程?", opts: ["TCP 三次握手", "TLS 握手", "DNS 查询", "HTTP 响应"], a: 0, why: "SYN → SYN-ACK → ACK,在任何应用数据之前建立可靠连接。" },
      { q: "为什么先有 DNS(包1-2)才有 TCP(包3)?", opts: ["必须先把域名解析成 IP 才能发起连接", "DNS 比 TCP 快", "巧合,顺序无所谓", "TLS 要求"], a: 0, why: "网络层只认 IP,域名必须先经 DNS 解析。这是完整请求链的第一步。" },
      { q: "包 10 的 HTTP 内容,抓包者能直接看到明文吗?", opts: ["不能,它在 TLS 加密通道内", "能,HTTP 永远明文", "只能看到一半", "取决于浏览器"], a: 0, why: "这就是 HTTPS 的意义: Wireshark 只能看到『有加密流量』,看不到内容(除非持有会话密钥)。" },
      { q: "如果目标被劫持到伪造 IP,在抓包里哪一步最可能暴露异常?", opts: ["DNS 响应返回了陌生 IP", "包编号变化", "时间戳归零", "TCP 窗口大小"], a: 0, why: "DNS 投毒/劫持会让响应 IP 与真实服务器不符。对比 DNS 应答 IP 是基础排查手法。" },
    ];
    let cur = 0, score = 0;
    const renderQ = () => {
      if (cur >= qs.length) {
        wrap.querySelector("#pcap-q").innerHTML = `<div class="diag-explain" style="border-color:${score >= 3 ? "var(--green-dim)" : "var(--amber)"}">抓包判读 ${score}/${qs.length}。${score >= 3 ? "你能从流量还原完整请求链了 — 这是 4.2 网络 L4 的硬指标。" : "重看包序列再试。"}</div>`;
        if (score >= 3) { CF.prog.markEvidence("f9_capture", "e2"); CF.prog.addXP(60); }
        return;
      }
      const q = qs[cur];
      wrap.querySelector("#pcap-q").innerHTML = `
        <div class="panel-title">问题 ${cur + 1}/${qs.length}</div>
        <div class="dim small mb">${q.q}</div>
        ${q.opts.map((o, i) => `<button class="diag-opt" data-i="${i}">${o}</button>`).join("")}
        <div id="pcap-fb"></div>`;
      wrap.querySelectorAll("#pcap-q [data-i]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.i);
          wrap.querySelectorAll("#pcap-q [data-i]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.i) === q.a) x.classList.add("correct"); });
          if (i === q.a) score++;
          wrap.querySelector("#pcap-fb").innerHTML = `<div class="diag-explain mt">${q.why}</div><button class="btn btn-sm btn-primary mt" id="pcap-next">下一题 →</button>`;
          wrap.querySelector("#pcap-next").onclick = () => { cur++; renderQ(); };
        };
      });
    };
    renderQ();
  };

  /* ==================== CIDR 子网计算 ==================== */
  CF.renderCIDR = (container) => {
    // 固定题库,避免随机答案对不上
    const cases = [
      { ip: "192.168.1.10/24", q: "网络地址是?", opts: ["192.168.1.0", "192.168.0.0", "192.168.1.10", "192.168.1.255"], a: 0, why: "/24 = 前 24 位(前三个八位组)是网络位 → 192.168.1.0" },
      { ip: "10.20.30.40/16", q: "该子网最多容纳多少台主机?", opts: ["65534", "254", "16777214", "32"], a: 0, why: "主机位 16 位 → 2^16-2(去掉网络地址和广播)= 65534" },
      { ip: "172.16.5.20/22", q: "子网掩码是?", opts: ["255.255.252.0", "255.255.255.0", "255.255.240.0", "255.255.255.252"], a: 0, why: "/22 = 11111111.11111111.11111100.00000000 = 255.255.252.0" },
      { ip: "192.168.1.50/24", q: "192.168.1.300 存在吗? 192.168.1.200 与它同网段吗?", opts: ["300 非法(八位组最大255); 200 同网段", "都存在但不同网段", "300 存在,200 不同网段", "两个都在别的网段"], a: 0, why: "八位组 0-255; /24 下 192.168.1.x 全部同网段。" },
    ];
    let cur = 0, score = 0;
    const wrap = document.createElement("div");
    const render = () => {
      if (cur >= cases.length) {
        wrap.innerHTML = `<div class="diag-explain" style="border-color:${score >= 3 ? "var(--green-dim)" : "var(--amber)"}">CIDR ${score}/${cases.length}。${score >= 3 ? "子网划分过关。" : "记住: /24→254 主机, /16→65534, 掩码把前缀位全置 1。"}</div>`;
        if (score >= 3) { CF.prog.markEvidence("f8_subnet", "e2"); CF.prog.addXP(50); }
        return;
      }
      const c = cases[cur];
      wrap.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)" class="mono">${c.ip}</b><span class="tag purple">${cur + 1}/${cases.length}</span></div>
        <div class="dim small mb">${c.q}</div>
        ${c.opts.map((o, i) => `<button class="diag-opt" data-i="${i}">${o}</button>`).join("")}
        <div id="cidr-fb"></div>`;
      wrap.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.i);
          if (i === c.a) score++;
          wrap.querySelectorAll("[data-i]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.i) === c.a) x.classList.add("correct"); });
          wrap.querySelector("#cidr-fb").innerHTML = `<div class="diag-explain mt">${c.why}</div><button class="btn btn-sm btn-primary mt" id="cidr-next">下一题 →</button>`;
          wrap.querySelector("#cidr-next").onclick = () => { cur++; render(); };
        };
      });
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== TLS 握手排序 ==================== */
  CF.renderTLS = (container) => {
    const correct = [
      "Client Hello(支持的加密套件、随机数、TLS 版本)",
      "Server Hello(选定套件、随机数)+ Certificate(服务器证书)",
      "客户端验证证书链、域名、有效期、吊销状态",
      "密钥协商(ECDHE)生成会话密钥",
      "双方 Finished,后续全部对称加密通信",
    ];
    const shuffled = [correct[3], correct[0], correct[4], correct[2], correct[1]];
    const picked = [];
    const wrap = document.createElement("div");
    const render = () => {
      wrap.innerHTML = `
        <div class="dim small mb">按正确顺序点击 TLS 1.3 握手步骤(点错可点右侧已选取消)。</div>
        <div class="faint small mb">待选步骤</div>
        <div class="mb">${shuffled.map((s, i) =>
          `<button class="diag-opt" data-i="${i}" style="${picked.includes(i) ? "opacity:.4;pointer-events:none" : ""}">${s}</button>`).join("")}</div>
        <div class="faint small mb">你的排序 (${picked.length}/5)</div>
        <div id="tls-order">${picked.map((i) => `<div class="task-item" style="cursor:pointer" data-rm="${i}"><span class="dim mono">${picked.indexOf(i) + 1}.</span> ${correct.includes(shuffled[i]) ? shuffled[i] : ""}</div>`).join("") || '<span class="faint small">尚未选择</span>'}</div>
        <div id="tls-fb" class="mt"></div>`;
      wrap.querySelectorAll("[data-i]").forEach((b) => { b.onclick = () => { picked.push(parseInt(b.dataset.i)); render(); }; });
      wrap.querySelectorAll("[data-rm]").forEach((b) => { b.onclick = () => { const i = parseInt(b.dataset.rm); picked.splice(picked.indexOf(i), 1); render(); }; });
      if (picked.length === 5) {
        const ok = picked.every((i, n) => shuffled[i] === correct[n]);
        wrap.querySelector("#tls-fb").innerHTML = ok
          ? `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">顺序完全正确! 关键点: 证书验证在密钥协商之前 — 如果证书是假的(中间人),浏览器必须在此时报警。这就是 HTTPS 防中间人攻击的核心。</div>`
          : `<div class="diag-explain">顺序不对。想想: 谁先打招呼? 证书什么时候给? 验证在什么时候?</div>`;
        if (ok) { CF.prog.markEvidence("f9_capture", "e1"); CF.prog.addXP(30); }
      }
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== Linux 权限 + SUID ==================== */
  CF.renderChmod = (container) => {
    const cases = [
      { q: 'ls -l 显示 -rwsr-xr-x,其中的 s 是什么?', opts: ["SUID: 执行时获得文件所有者(常为 root)权限", "文件被加密", "软链接", "只读标志"], a: 0,
        why: "SUID 是提权排查第一目标: 普通用户执行该程序的瞬间拥有 owner 权限。find / -perm -4000 就是找它。" },
      { q: "chmod 755 file 后权限是?", opts: ["rwxr-xr-x", "rwxrwxrwx", "rw-r--r--", "r-xr-x---"], a: 0,
        why: "7=rwx(属主) 5=r-x(组) 5=r-x(其他人)。" },
      { q: "/tmp 目录通常带 sticky bit(t),作用是?", opts: ["任何人可写,但只能删自己的文件", "禁止任何人写入", "自动加密", "压缩文件"], a: 0,
        why: "drwxrwxrwt: 没有 sticky,任何用户都能删除他人文件。" },
      { q: "排查提权时,发现 /usr/bin/find 带 SUID 且属主 root,意味着?", opts: ["高危: find 可执行命令,可能直接获得 root shell", "正常现象无需关注", "find 无法利用", "系统损坏必须重装"], a: 0,
        why: "find 有 -exec 参数 → 以 root 身份执行任意命令。这是经典提权路径。" },
    ];
    let cur = 0, score = 0;
    const wrap = document.createElement("div");
    const render = () => {
      if (cur >= cases.length) {
        wrap.innerHTML = `<div class="diag-explain" style="border-color:${score >= 3 ? "var(--green-dim)" : "var(--amber)"}">权限 ${score}/${cases.length}。${score >= 3 ? "你已理解 SUID/sticky 和数字权限 — 这是 Linux 提权与排障的地基。" : "重点复习 SUID: -perm -4000。"}</div>`;
        if (score >= 3) { CF.prog.markEvidence("f10_perm", "e1"); CF.prog.markEvidence("f10_perm", "e2"); CF.prog.addXP(50); }
        return;
      }
      const c = cases[cur];
      wrap.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">权限训练 ${cur + 1}/${cases.length}</b></div>
        <div class="dim small mb">${c.q}</div>
        ${c.opts.map((o, i) => `<button class="diag-opt" data-i="${i}">${o}</button>`).join("")}
        <div id="chmod-fb"></div>`;
      wrap.querySelectorAll("[data-i]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.i);
          if (i === c.a) score++;
          wrap.querySelectorAll("[data-i]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.i) === c.a) x.classList.add("correct"); });
          wrap.querySelector("#chmod-fb").innerHTML = `<div class="diag-explain mt">${c.why}</div><button class="btn btn-sm btn-primary mt" id="chmod-next">下一题 →</button>`;
          wrap.querySelector("#chmod-next").onclick = () => { cur++; render(); };
        };
      });
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== 日志攻击狩猎 ==================== */
  CF.renderLogHunt = (container) => {
    const log = [
      '192.168.1.10 - - [03/Oct/2026:10:01:12] "GET /index.html HTTP/1.1" 200 4821',
      '10.0.0.66 - - [03/Oct/2026:10:02:03] "GET /api/search?q=test HTTP/1.1" 200 210',
      '10.0.0.66 - - [03/Oct/2026:10:02:08] "GET /api/search?q=test\' HTTP/1.1" 500 512',
      '10.0.0.66 - - [03/Oct/2026:10:02:15] "GET /api/search?q=phone%27%20OR%20%271%27=%271 HTTP/1.1" 200 8843',
      '192.168.1.10 - - [03/Oct/2026:10:05:44] "POST /api/transfer HTTP/1.1" 200 88',
      '203.0.113.9 - - [03/Oct/2026:10:09:01] "GET /.env HTTP/1.1" 403 210',
      '203.0.113.9 - - [03/Oct/2026:10:09:02] "GET /.git/config HTTP/1.1" 200 187',
      '203.0.113.9 - - [03/Oct/2026:10:09:30] "GET /api/file?name=../../../../etc/passwd HTTP/1.1" 200 1420',
      '192.168.1.10 - - [03/Oct/2026:10:11:00] "GET /static/app.js HTTP/1.1" 200 9920',
    ].join("\n");
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">Web 访问日志。你是应急响应员: 从正常流量里找出攻击痕迹(IP + 手法)。</div>
      <div class="term mb" style="font-size:.74rem;line-height:1.65;white-space:pre-wrap;max-height:240px;overflow-y:auto">${log.replace(/([0-9]{2}:[0-9]{2}:[0-9]{2})/g, '<span style="color:var(--amber)">$1</span>')}</div>
      <div class="faint small mb">选择日志中真实发生的攻击(多选)</div>
      <div id="log-opts">
        ${[
          ["sqli", "10.0.0.66 对 /api/search 的 SQL 注入(单引号→OR 1=1,响应暴涨到 8843 字节)"],
          ["probe", "203.0.113.9 探测 /.env、/.git/config 并成功读到文件"],
          ["trav", "203.0.113.9 路径穿越读取 /etc/passwd"],
          ["normal", "192.168.1.10 浏览首页和静态资源(正常流量)"],
        ].map(([k, t]) => `<button class="diag-opt" data-k="${k}">${t}</button>`).join("")}
      </div>
      <button class="btn btn-sm btn-primary mt" id="log-check">提交研判</button>
      <div id="log-fb" class="mt"></div>`;
    container.appendChild(wrap);
    const sel = new Set();
    wrap.querySelectorAll("[data-k]").forEach((b) => {
      b.onclick = () => { const k = b.dataset.k; if (sel.has(k)) { sel.delete(k); b.style.borderColor = ""; } else { sel.add(k); b.style.borderColor = "var(--cyan)"; } };
    });
    wrap.querySelector("#log-check").onclick = () => {
      const want = new Set(["sqli", "probe", "trav"]);
      const ok = sel.size === want.size && [...sel].every((x) => want.has(x));
      wrap.querySelector("#log-fb").innerHTML = ok
        ? `<div class="diag-explain" style="border-color:var(--green-dim);color:var(--green)">研判正确! 你区分了攻击与正常流量,并且能读懂 URL 编码的 payload(%27=') 和『响应长度暴涨』这个注入成功信号。这是真实日志分析能力(L4)。</div>`
        : `<div class="diag-explain">不对。提示: 正常流量是 192.168.1.10; 重点看 500 报错、200 但长度异常、敏感路径三类信号。</div>`;
      if (ok) { CF.prog.markEvidence("f10_perm", "e4"); CF.prog.addXP(60); }
    };
  };

  /* ==================== CVE 案例博物馆 ==================== */
  CF.renderCVEMuseum = (container) => {
    const cases = [
      { id: "CVE-2014-0160", name: "Heartbleed 心脏滴血", year: 2014, target: "OpenSSL",
        type: "内存越界读取", cause: "心跳机制没有检查请求长度,攻击者请求 64KB 数据但只发 1 字节,服务器把相邻内存(私钥/密码/会话)原样吐回。",
        impact: "全球约 17% 的 HTTPS 网站受影响,可读取服务器内存中的私钥与会话令牌。",
        lesson: "解析外部输入前先校验长度声明; 加密库代码必须经过审计。" },
      { id: "CVE-2014-6271", name: "Shellshock 破壳", year: 2014, target: "GNU Bash",
        type: "命令注入", cause: "Bash 把环境变量中以 () { 开头的内容当函数定义解析,后面的命令也被执行。CGI 把 User-Agent 等头部放进环境变量。",
        impact: "数百万台启用 CGI 的 Web 服务器可被远程执行任意命令。",
        lesson: "环境变量也是输入; 解释器解析规则里的历史包袱是深水炸弹。" },
      { id: "CVE-2017-0144", name: "EternalBlue 永恒之蓝", year: 2017, target: "Windows SMBv1",
        type: "缓冲区溢出", cause: "SMBv1 协议处理恶意 crafted 数据包时发生内核级缓冲区溢出,无需认证即可远程执行代码。",
        impact: "被 WannaCry 勒索病毒利用,一天内感染 150 个国家 20 万+ 台机器。",
        lesson: "古老协议(SMBv1)该退役就退役; 内核代码的内存安全是底线。" },
      { id: "CVE-2021-44228", name: "Log4Shell", year: 2021, target: "Apache Log4j2",
        type: "JNDI 注入/反序列化", cause: "日志框架把记录内容中的 ${jndi:ldap://...} 当表达式解析,主动向攻击者服务器发起连接并加载远程类。",
        impact: "全球数亿设备受影响,苹果 iCloud、Steam、特斯拉后台均中招。",
        lesson: "日志内容也是危险输入; 依赖组件的供应链风险必须持续跟踪。" },
      { id: "CVE-2022-22965", name: "Spring4Shell", year: 2022, target: "Spring Framework",
        type: "类绑定/属性注入", cause: "通过参数名 class.module.classLoader 链式绑定,攻击者能改写 Tomcat 的 AccessLogValve 属性,把 Webshell 写进日志路径。",
        impact: "JDK9+ + WAR 部署的 Spring 应用可被 RCE。",
        lesson: "自动数据绑定必须白名单; 深层属性链就是攻击面。" },
      { id: "CVE-2024-3094", name: "XZ Utils 后门", year: 2024, target: "xz/liblzma",
        type: "供应链投毒", cause: "维护者被长期社会工程后,在压缩库构建阶段植入混淆后门,专门劫持 sshd 的认证流程。",
        impact: "差几周就进入各大发行版稳定源; 由微软工程师偶然排查性能问题才暴露。",
        lesson: "开源依赖的信任链是真实攻击面; 关键库的异常行为值得持续监控。" },
    ];
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">点开每个案例,按『根因 → 影响 → 教训』阅读。全部读完后答题(至少 4/5)。</div>
      ${cases.map((c, i) => `
        <div class="task-item" style="flex-wrap:wrap;cursor:pointer" data-case="${i}">
          <div class="t-name" style="flex-basis:100%">[${c.year}] ${c.name} <span class="faint small mono">${c.id}</span></div>
          <span class="tag red">${c.type}</span><span class="tag purple">${c.target}</span>
        </div>`).join("")}
      <div id="cve-detail" class="mt"></div>
      <div id="cve-q" class="mt"></div>`;
    container.appendChild(wrap);
    const det = wrap.querySelector("#cve-detail");
    wrap.querySelectorAll("[data-case]").forEach((el) => {
      el.onclick = () => {
        const c = cases[parseInt(el.dataset.case)];
        det.innerHTML = `
          <div class="term" style="font-size:.78rem;line-height:1.9;padding:14px">
            <div style="color:var(--red)">根因: ${c.cause}</div>
            <div style="color:var(--amber)">影响: ${c.impact}</div>
            <div style="color:var(--green)">教训: ${c.lesson}</div>
          </div>`;
        el.style.borderColor = "var(--green-dim)";
      };
    });
    // 常见根因归纳题
    const qs = [
      { q: "Heartbleed 与 EternalBlue 的共同根因类别?", opts: ["内存安全(越界/溢出)", "弱密码", "SQL 拼接", "权限校验缺失"], a: 0, why: "都是 C/C++ 内存安全问题: 前者越界读,后者缓冲区溢出。内存安全类漏洞几乎年年占高危榜前列。" },
      { q: "Log4Shell 的第一攻击动作是什么?", opts: ["服务器主动向攻击者地址发起连接(JNDI)", "攻击者暴力破解", "上传 Webshell", "伪造 Cookie"], a: 0, why: "${jndi:ldap://} 让受害者服务器『主动外连』加载远程恶意类 — 这也是出网管控能缓解它的原因。" },
      { q: "Shellshock 给我们的输入边界启示?", opts: ["环境变量/HTTP 头也是输入,同样危险", "只有 POST body 算输入", "GET 参数无需校验", "Cookie 是安全的"], a: 0, why: "凡是能被攻击者控制、又会进入解释器/解析器的数据,都是输入。User-Agent 进了 Bash 的环境变量就被执行了。" },
      { q: "XZ Utils 后门攻击的是哪一环?", opts: ["软件供应链(构建/分发环节)", "运行时内存", "传输加密", "前端渲染"], a: 0, why: "代码还没上线就被植入后门 — 再强的 WAF 也拦不住供应链投毒。依赖治理与制品溯源是防御关键。" },
      { q: "这 6 个案例中,哪类问题你以后写代码最该先防?", opts: ["解析外部输入时的信任假设(长度/格式/属性链)", "换更新的 IDE", "加更大的服务器", "隐藏报错信息"], a: 0, why: "6 个案例 5 个归根于『对输入的信任假设出错』: 长度没校验、环境变量没当输入、表达式被解析、属性链没白名单。这就是输入验证为什么是安全第一原则。" },
    ];
    let cur = 0, score = 0;
    const holder = wrap.querySelector("#cve-q");
    const renderQ = () => {
      if (cur >= qs.length) {
        holder.innerHTML = `<div class="diag-explain" style="border-color:${score >= 4 ? "var(--green-dim)" : "var(--amber)"}">${score}/${qs.length}。${score >= 4 ? "你已能从历史重大漏洞中归纳根因 — 这就是『举一反三』的迁移能力。" : "重新点开每个案例读一遍根因,再来答题。"}</div>`;
        if (score >= 4) { CF.prog.markEvidence("f11_cve", "e2"); CF.prog.markEvidence("f11_cve", "e4"); CF.prog.addXP(60); }
        return;
      }
      const q = qs[cur];
      holder.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">归纳题 ${cur + 1}/${qs.length}</b></div>
        <div class="diag-q" style="font-size:.9rem">${q.q}</div>
        ${q.opts.map((o, i) => `<button class="diag-opt" data-qi="${i}">${o}</button>`).join("")}
        <div id="cve-fb"></div>`;
      holder.querySelectorAll("[data-qi]").forEach((b) => {
        b.onclick = () => {
          const i = parseInt(b.dataset.qi);
          if (i === q.a) score++;
          holder.querySelectorAll("[data-qi]").forEach((x) => { x.disabled = true; if (parseInt(x.dataset.qi) === q.a) x.classList.add("correct"); });
          holder.querySelector("#cve-fb").innerHTML = `<div class="diag-explain mt">${q.why}</div><button class="btn btn-sm btn-primary mt" id="cve-next">下一题 →</button>`;
          holder.querySelector("#cve-next").onclick = () => { cur++; renderQ(); };
        };
      });
    };
    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-sm btn-primary mt";
    startBtn.textContent = "开始归纳答题 →";
    startBtn.onclick = renderQ;
    wrap.appendChild(startBtn);
  };

  /* ==================== CVSS 3.1 评分训练 ==================== */
  CF.renderCVSS = (container) => {
    const W = { AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 }, AC: { L: 0.77, H: 0.44 },
      PR: { N: 0.85, L: 0.62, H: 0.27 }, UI: { N: 0.85, R: 0.62 }, CIA: { H: 0.56, L: 0.22, N: 0 } };
    const PRS = { N: 0.85, L: 0.68, H: 0.5 }; // Scope Changed 时的 PR 权重
    const LBL = { AV: "攻击途径", AC: "攻击复杂度", PR: "所需权限", UI: "用户交互", S: "影响范围", C: "机密性", I: "完整性", A: "可用性" };
    const OPTS = {
      AV: [["N", "网络(隔着互联网)"], ["A", "相邻网络(同 Wi-Fi)"], ["L", "本地(要登机器)"], ["P", "物理接触"]],
      AC: [["L", "低(直接打)"], ["H", "高(要苛刻条件)"]],
      PR: [["N", "无(匿名)"], ["L", "低(普通用户)"], ["H", "高(管理员)"]],
      UI: [["N", "不需要"], ["R", "需要受害者配合(点链接)"]],
      S: [["U", "不变(只影响本组件)"], ["C", "改变(波及其他组件)"]],
      C: [["H", "高(全部泄露)"], ["L", "低(部分泄露)"], ["N", "无"]],
      I: [["H", "高(可任意篡改)"], ["L", "低(有限篡改)"], ["N", "无"]],
      A: [["H", "高(完全瘫痪)"], ["L", "低(性能下降)"], ["N", "无"]],
    };
    const cvss = (v) => {
      const pr = v.S === "C" ? PRS[v.PR] : W.PR[v.PR];
      const iss = 1 - (1 - W.CIA[v.C]) * (1 - W.CIA[v.I]) * (1 - W.CIA[v.A]);
      const impact = v.S === "C" ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15) : 6.42 * iss;
      const expl = 8.22 * W.AV[v.AV] * W.AC[v.AC] * pr * W.UI[v.UI];
      if (impact <= 0) return 0;
      return Math.ceil(Math.min(impact + expl, 10) * 10) / 10;
    };
    const sev = (s) => s === 0 ? "无" : s < 4 ? "低危" : s < 7 ? "中危" : s < 9 ? "高危" : "严重";
    const sevColor = (s) => s === 0 ? "faint" : s < 4 ? "cyan" : s < 7 ? "amber" : s < 9 ? "red" : "red";
    // 三个真实场景(参考向量按同一公式计算,已用 Heartbleed 7.5 / 永恒之蓝 8.1 / Log4Shell 10.0 校准)
    const scen = [
      { name: "场景 1 · 电商 SQL 注入",
        desc: "匿名攻击者从公网访问商品搜索接口,注入 SQL 读取全库: 用户表(姓名/手机号/地址)、订单、支付流水,还能改管理员密码。",
        ref: { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "H", I: "H", A: "H" },
        why: "参考: AV:N(公网直达) AC:L PR:N(无需登录) UI:N S:U C:H I:H A:H(数据全遭殃)。典型的 9.8 严重级 — SRC 里这类评级争议最小。" },
      { name: "场景 2 · 反射型 XSS(需诱导点击)",
        desc: "搜索页把关键词原样输出。攻击者构造恶意链接发给受害者,受害者点击后,攻击者的脚本在受害者浏览器里执行,可窃取会话。需要诱导点击,不影响服务器组件本身。",
        ref: { AV: "N", AC: "L", PR: "N", UI: "R", S: "C", C: "L", I: "L", A: "N" },
        why: "参考: UI:R(要诱导点击) S:C(危害超出组件,波及用户浏览器) C:L I:L A:N。典型的中危反射型 XSS — 审核员最常砍的就是把 UI:R 写成 N、把 C:L 写成 H 的报告。" },
      { name: "场景 3 · 越权查看他人订单",
        desc: "普通登录用户修改 URL 里的 order_id,可以查看任意用户的订单(收货人姓名/电话/地址)。不影响服务器可用性,不能改数据。",
        ref: { AV: "N", AC: "L", PR: "L", UI: "N", S: "U", C: "H", I: "N", A: "N" },
        why: "参考: PR:L(要先有个普通账号) S:U C:H(他人隐私全泄露) I:N A:N。计算得 6.5 中危 — 这正是大量真实 SRC 平台给『水平越权泄露隐私』的标准评级。" },
    ];
    const wrap = document.createElement("div");
    let cur = 0, pass = 0;
    const render = () => {
      const s = scen[cur];
      const pick = { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "N", I: "N", A: "N" };
      wrap.innerHTML = `
        <div class="row mb" style="justify-content:space-between"><b style="color:var(--cyan)">${s.name} (${cur + 1}/${scen.length})</b>${pass > 0 ? `<span class="tag green">已通过 ${pass}/${scen.length}</span>` : ""}</div>
        <div class="diag-explain" style="line-height:1.9">${s.desc}</div>
        <div class="dim small mt mb">为它选择 CVSS 3.1 向量(每项都想: 攻击者实际处于什么位置/需要什么条件):</div>
        ${Object.keys(OPTS).map((k) => `
          <div class="task-item" style="flex-wrap:wrap">
            <div class="t-tag" style="min-width:76px">${LBL[k]}</div>
            ${OPTS[k].map(([v, t]) => `<span class="tag" data-k="${k}" data-v="${v}" style="cursor:pointer">${v} · ${t}</span>`).join("")}
          </div>`).join("")}
        <div class="row mt" style="justify-content:space-between;align-items:center">
          <button class="btn btn-sm btn-primary" id="cv-submit">提交评分</button>
          <div id="cv-score" class="mono"></div>
        </div>
        <div id="cv-result" class="mt"></div>`;
      wrap.querySelectorAll("[data-k]").forEach((t) => {
        t.onclick = () => {
          const k = t.dataset.k;
          pick[k] = t.dataset.v;
          wrap.querySelectorAll(`[data-k="${k}"]`).forEach((x) => { x.style.borderColor = ""; x.style.color = ""; });
          t.style.borderColor = "var(--cyan)"; t.style.color = "var(--cyan)";
        };
      });
      wrap.querySelector("#cv-submit").onclick = () => {
        const score = cvss(pick), refScore = cvss(s.ref);
        wrap.querySelector("#cv-score").innerHTML = `你的评分: <b style="color:var(--${sevColor(score)})">${score.toFixed(1)} ${sev(score)}</b>`;
        const ok = Math.abs(score - refScore) <= 0.5;
        if (ok) pass++;
        wrap.querySelector("#cv-result").innerHTML = `
          <div class="diag-explain" style="border-color:${ok ? "var(--green-dim)" : "var(--amber)"}">
            ${ok ? `✓ 通过(参考 ${refScore.toFixed(1)} ${sev(refScore)})` : `✗ 你的 ${score.toFixed(1)} 偏离参考值 ${refScore.toFixed(1)} ${sev(refScore)}`}
            <div class="mt small">${s.why}</div>
          </div>
          ${cur < scen.length - 1 ? `<button class="btn btn-sm btn-primary mt" id="cv-next">下一场景 →</button>` : ""}`;
        const nb = wrap.querySelector("#cv-next");
        if (nb) nb.onclick = () => { cur++; render(); };
        if (pass === scen.length) {
          CF.prog.markEvidence("s4_cvss", "e2"); CF.prog.markEvidence("s4_cvss", "e4"); CF.prog.addXP(80);
          setTimeout(() => $.toast("CVSS 评分训练完成 — 报告评级经得起推敲了"), 400);
        }
      };
    };
    container.appendChild(wrap);
    render();
  };

  /* ==================== 侦察工具模拟: 子域名枚举 + 目录爆破 ==================== */
  CF.renderReconTools = (container) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <div class="dim small mb">模拟两大侦察工具。任务: ① 找出高价值子域名 ② 从目录扫描结果里选出 3 个最危险的发现。全部完成获得『能迁移』。</div>
      <div class="panel-title" style="font-size:.9rem">① 子域名枚举(模拟 subfinder)</div>
      <div class="row mb"><span class="faint small mono">target: corp.example.com</span><button class="btn btn-sm" id="sub-run">运行枚举</button></div>
      <div id="sub-out" class="term" style="font-size:.74rem;line-height:2;min-height:60px"></div>
      <div id="sub-q" class="mt"></div>
      <hr class="sep">
      <div class="panel-title" style="font-size:.9rem">② 目录爆破(模拟 dirsearch)</div>
      <div class="row mb"><span class="faint small mono">wordlist: common.txt (10 条)</span><button class="btn btn-sm" id="dir-run">开始爆破</button></div>
      <div id="dir-out" class="term" style="font-size:.74rem;line-height:2;min-height:60px"></div>
      <div id="dir-q" class="mt"></div>`;
    container.appendChild(wrap);
    // 子域名
    const subs = [
      ["www.corp.example.com", "200", "企业官网"],
      ["api.corp.example.com", "200", "API 网关(文档公开)"],
      ["admin.corp.example.com", "403", "管理后台(IP 限制)"],
      ["vpn.corp.example.com", "200", "VPN 登录页"],
      ["dev.corp.example.com", "200", "开发环境 — 调试面板 /debug 未鉴权!"],
      ["staging.corp.example.com", "302", "预发布环境"],
    ];
    let subDone = false;
    wrap.querySelector("#sub-run").onclick = () => {
      const out = wrap.querySelector("#sub-out");
      out.innerHTML = "";
      let i = 0;
      const t = setInterval(() => {
        if (i >= subs.length) {
          clearInterval(t);
          out.innerHTML += `<div style="color:var(--cyan)">[*] 枚举完成: 发现 ${subs.length} 个子域名</div>`;
          wrap.querySelector("#sub-q").innerHTML = `
            <div class="diag-q" style="font-size:.88rem">哪个子域名最值得优先深入测试(攻击面最大)?</div>
            ${subs.map((s, ii) => `<button class="diag-opt" data-sub="${ii}" style="font-size:.8rem">${s[0]}</button>`).join("")}
            <div id="sub-fb"></div>`;
          wrap.querySelectorAll("[data-sub]").forEach((b) => {
            b.onclick = () => {
              const ok = parseInt(b.dataset.sub) === 4;
              wrap.querySelector("#sub-fb").innerHTML = `<div class="diag-explain" style="border-color:${ok ? "var(--green-dim)" : "var(--amber)"}">${ok ? "✓ 正确。dev 环境常带着调试面板/默认口令/详细报错 — 防护弱、数据真,是赏金猎人的金矿(但必须确认它在 Scope 内!)。" : "再看一眼: 找的是『防护最弱、信息最多』的那个。admin 有 IP 限制,官网没有攻击面。"}</div>`;
              if (ok) subDone = true;
            };
          });
          return;
        }
        const s = subs[i++];
        out.innerHTML += `<div>[${s[1]}] ${s[0]} — ${s[2]}</div>`;
      }, 220);
    };
    // 目录爆破
    const dirs = [
      ["/admin", "403", "禁止访问"],
      ["/.git/config", "200", "Git 仓库配置泄露!"],
      ["/backup", "200", "目录列表: db_2024.sql, site.zip"],
      ["/uploads", "403", "禁止访问"],
      ["/.env", "200", "环境变量: DB_PASSWORD=Pr0d_s3cret!"],
      ["/test", "404", "不存在"],
      ["/api-docs", "200", "API 文档(公开)"],
      ["/robots.txt", "200", "常见文件"],
      ["/.svn", "404", "不存在"],
      ["/phpinfo.php", "404", "不存在"],
    ];
    let dirDone = false;
    wrap.querySelector("#dir-run").onclick = () => {
      const out = wrap.querySelector("#dir-out");
      out.innerHTML = "";
      let i = 0;
      const t = setInterval(() => {
        if (i >= dirs.length) {
          clearInterval(t);
          out.innerHTML += `<div style="color:var(--cyan)">[*] 扫描完成: 10 条路径,6 个非 404</div>`;
          wrap.querySelector("#dir-q").innerHTML = `
            <div class="diag-q" style="font-size:.88rem">选出 3 个必须立刻报告的高危发现:</div>
            ${dirs.filter((d) => d[1] === "200").map((d) => `<span class="tag" data-dir="${d[0]}" style="cursor:pointer;margin:0 6px 6px 0">${d[0]}</span>`).join("")}
            <div class="row mt"><button class="btn btn-sm btn-primary" id="dir-check">提交选择</button></div>
            <div id="dir-fb"></div>`;
          const sel = new Set();
          wrap.querySelectorAll("[data-dir]").forEach((t2) => {
            t2.onclick = () => {
              const p = t2.dataset.dir;
              if (sel.has(p)) { sel.delete(p); t2.style.borderColor = ""; t2.style.color = ""; }
              else { sel.add(p); t2.style.borderColor = "var(--cyan)"; t2.style.color = "var(--cyan)"; }
            };
          });
          wrap.querySelector("#dir-check").onclick = () => {
            const want = new Set(["/.git/config", "/backup", "/.env"]);
            const ok = sel.size === 3 && [...sel].every((x) => want.has(x));
            wrap.querySelector("#dir-fb").innerHTML = `<div class="diag-explain" style="border-color:${ok ? "var(--green-dim)" : "var(--amber)"}">${ok ? "✓ 三个全是高危: .git/config 可还原源码、/backup 直接下载数据库、/.env 泄露生产密钥。robots.txt 和 api-docs 只是信息,谈不上高危。" : "高危的判据: 能拿到源码/数据/密钥,或能直接攻入。再想想哪三个满足。"}</div>`;
            if (ok) dirDone = true;
            if (dirDone && subDone) {
              CF.prog.markEvidence("r0_recon", "e3"); CF.prog.addXP(70);
              $.toast("侦察工具训练完成: 找到了金矿子域名和三个致命泄露");
            }
          };
          return;
        }
        const d = dirs[i++];
        out.innerHTML += `[${d[1]}] ${d[0]} — ${d[2]}\n`;
      }, 180);
    };
  };
})();
