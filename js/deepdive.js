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
})();
