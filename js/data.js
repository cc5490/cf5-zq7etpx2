/* ============================================================
   CYBER FRONTIER V5.0 — data.js
   所有游戏数据：技能树 / 入学诊断 / 每日任务 / 节点内容
   ============================================================ */
(function () {
  "use strict";
  const CF = window.CF;

  /* ---------- 技能树节点 ---------- */
  // domain: foundation | web | research | src
  // level: 1-4 (L1 识别 -> L2 理解 -> L3 操作 -> L4 迁移)
  CF.nodes = [
    /* --- FOUNDATION --- */
    { id: "f0_cpu", name: "程序追踪", domain: "foundation", level: 1,
      desc: "理解程序→进程→内存→线程→系统调用→Socket→端口→服务器的完整路径。",
      reqs: [], time: 15, tags: ["F0"], },
    { id: "f0b_vm", name: "虚拟机与容器", domain: "foundation", level: 1,
      desc: "虚拟机 vs 容器: 为什么安全实验必须隔离环境,两者隔离的是什么。",
      reqs: ["f0_cpu"], time: 15, tags: ["F0B"], },
    { id: "f1_net", name: "Packet Journey", domain: "foundation", level: 1,
      desc: "DNS → IP → Route → TCP → TLS → HTTP → Server → Application → Database → Response。",
      reqs: ["f0b_vm"], time: 25, tags: ["F1"], },
    { id: "f1b_protocols", name: "网络协议全景", domain: "foundation", level: 2,
      desc: "OSI 分层 / MAC与ARP / DHCP / NAT / UDP与ICMP / 代理与VPN / IPv6 / HTTP 状态码。",
      reqs: ["f1_net"], time: 30, tags: ["F1B"], },
    { id: "f2_linux", name: "Linux 诊断", domain: "foundation", level: 2,
      desc: "Web 服务无法访问时,能从进程→服务→端口→网络→配置→权限→日志逐层排查。",
      reqs: ["f1_net"], time: 30, tags: ["F2"], },
    { id: "f3_win", name: "Windows 诊断", domain: "foundation", level: 2,
      desc: "服务启动失败时,能定位用户/权限/进程/配置/Event Log。",
      reqs: ["f2_linux"], time: 20, tags: ["F3"], },
    { id: "f3b_ps", name: "PowerShell 与注册表", domain: "foundation", level: 3,
      desc: "Get-Service / Get-Process / Get-EventLog / 注册表路径 / 权限继承,在模拟 PowerShell 里排查提权。",
      reqs: ["f3_win"], time: 25, tags: ["F3B"], },
    { id: "f4_py", name: "Python 工具制造", domain: "foundation", level: 3,
      desc: "写一个 100-200 行的安全辅助工具(HTTP 客户端 / 日志分析器 / 端口扫描器)。",
      reqs: ["f2_linux"], time: 40, tags: ["F4"], },
    { id: "f5_git", name: "Git & Markdown", domain: "foundation", level: 1,
      desc: "每次完成实验后用 Git commit + Markdown Research Note 记录。",
      reqs: ["f4_py"], time: 10, tags: ["F5"], },
    { id: "f6_eng", name: "英语技术阅读", domain: "foundation", level: 2,
      desc: "读懂真实英文安全公告/CVE 的核心段落: 端点、参数、影响、分类。",
      reqs: ["f5_git"], time: 15, tags: ["F6"], },
    { id: "f7_nmap", name: "Nmap 实操", domain: "foundation", level: 2,
      desc: "授权环境端口扫描与服务识别,能解读结果并判断风险。",
      reqs: ["f1_net"], time: 20, tags: ["F7"], },
    { id: "f8_subnet", name: "CIDR 与子网划分", domain: "foundation", level: 2,
      desc: "看懂 IP/掩码/CIDR,能算网络地址、主机数、判断两台主机是否同网段。",
      reqs: ["f1_net"], time: 20, tags: ["F8"], },
    { id: "f9_capture", name: "Wireshark 流量判读", domain: "foundation", level: 3,
      desc: "从抓包还原 DNS→TCP→TLS→HTTP 全过程,理解 HTTPS 加密了什么。",
      reqs: ["f8_subnet"], time: 30, tags: ["F9"], },
    { id: "f10_perm", name: "Linux 权限与日志狩猎", domain: "foundation", level: 3,
      desc: "SUID/SGID/sticky/数字权限 + 从访问日志中识别真实攻击痕迹。",
      reqs: ["f2_linux"], time: 30, tags: ["F10"], },
    { id: "f11_cve", name: "CVE 案例博物馆", domain: "foundation", level: 2,
      desc: "心脏滴血/破壳/永恒之蓝/Log4Shell/Spring4Shell/XZ后门: 根因、影响、教训。",
      reqs: ["f6_eng"], time: 25, tags: ["F11"], },
    { id: "f_boss", name: "FOUNDATION BOSS", domain: "foundation", level: 4,
      desc: "综合 Linux Server + Web Service + Network + Logs + Permissions + Python。不提供课程标签。",
      reqs: ["f3_win", "f3b_ps", "f5_git", "f6_eng", "f7_nmap", "f9_capture", "f10_perm", "f11_cve"], time: 60, tags: ["BOSS"], boss: true },

    /* --- WEB SECURITY --- */
    { id: "w0_http", name: "HTTP Request Lab", domain: "web", level: 1,
      desc: "能够修改 Method / Header / Cookie / Parameter / Body,观察响应变化。",
      reqs: ["f_boss"], time: 20, tags: ["W0"], },
    { id: "w1_burp", name: "Burp 风格 Repeater", domain: "web", level: 2,
      desc: "观察请求 → 修改请求 → 比较响应 → 建立假设 → 验证假设。",
      reqs: ["w0_http"], time: 25, tags: ["W1"], },
    { id: "w2_auth", name: "Authentication", domain: "web", level: 2,
      desc: "理解认证失效的常见场景：弱密码、会话固定、多因素绕过。",
      reqs: ["w1_burp"], time: 20, tags: ["W2"], },
    { id: "w3_ac", name: "Access Control / IDOR", domain: "web", level: 3,
      desc: "不同身份访问同一对象的对照实验。理解为什么信任边界会失效。",
      reqs: ["w2_auth"], time: 30, tags: ["W3"], },
    { id: "w4_sqli", name: "SQL Injection", domain: "web", level: 3,
      desc: "理解输入如何流到危险点,并在靶场里最小化证明影响。",
      reqs: ["w1_burp"], time: 30, tags: ["W4"], },
    { id: "w5_xss", name: "XSS", domain: "web", level: 3,
      desc: "反射型、存储型、DOM 型。理解输入输出信任边界。",
      reqs: ["w4_sqli"], time: 25, tags: ["W5"], },
    { id: "w6_csrf", name: "CSRF", domain: "web", level: 2,
      desc: "理解为什么浏览器会『帮你』发送恶意请求,以及 SameSite 的作用。",
      reqs: ["w2_auth"], time: 15, tags: ["W6"], },
    { id: "w7_upload", name: "File Upload", domain: "web", level: 3,
      desc: "文件类型白名单、扩展名欺骗、内容检测绕过。",
      reqs: ["w5_xss"], time: 20, tags: ["W7"], },
    { id: "w8_ssrf", name: "SSRF", domain: "web", level: 3,
      desc: "服务器端请求伪造：让服务器替你访问不该访问的内部资源。",
      reqs: ["w4_sqli"], time: 20, tags: ["W8"], },
    { id: "w9_cmdi", name: "Command Injection", domain: "web", level: 3,
      desc: "输入流进操作系统命令执行点。", reqs: ["w7_upload"], time: 20, tags: ["W9"], },
    { id: "w10_api", name: "API & JWT", domain: "web", level: 2,
      desc: "JWT 签名验证、密钥混淆、OAuth 基础流程。", reqs: ["w3_ac"], time: 25, tags: ["W10"], },
    { id: "w11_logic", name: "Business Logic", domain: "web", level: 4,
      desc: "业务流程中的安全漏洞：负价格、越权操作、状态机绕过。", reqs: ["w3_ac", "w10_api"], time: 30, tags: ["W11"], },
    { id: "w12_traversal", name: "Path Traversal", domain: "web", level: 3,
      desc: "文件路径穿越: 用 ../ 读取服务器上任意文件。", reqs: ["w4_sqli"], time: 20, tags: ["W12"], },
    { id: "w13_xxe", name: "XXE", domain: "web", level: 3,
      desc: "XML 外部实体: 让 XML 解析器读取本地文件或发起外部请求。", reqs: ["w4_sqli"], time: 20, tags: ["W13"], },
    { id: "w14_ssti", name: "SSTI", domain: "web", level: 3,
      desc: "模板注入: 用户输入被模板引擎当代码执行。", reqs: ["w5_xss"], time: 20, tags: ["W14"], },
    { id: "w15_nosqli", name: "NoSQL Injection", domain: "web", level: 3,
      desc: "NoSQL 注入: 用对象操作符绕过 MongoDB 等查询。", reqs: ["w4_sqli"], time: 20, tags: ["W15"], },
    { id: "w16_deser", name: "Insecure Deserialization", domain: "web", level: 4,
      desc: "反序列化用户控制的数据,实例化危险对象。", reqs: ["w15_nosqli"], time: 25, tags: ["W16"], },
    { id: "w17_oauth", name: "OAuth / OIDC", domain: "web", level: 3,
      desc: "OAuth redirect_uri 校验不严导致授权码泄露。", reqs: ["w10_api"], time: 20, tags: ["W17"], },
    { id: "w18_race", name: "Race Condition", domain: "web", level: 4,
      desc: "并发窗口导致同一优惠券被多次使用等资源竞争问题。", reqs: ["w11_logic"], time: 25, tags: ["W18"], },
    { id: "w19_proto", name: "Prototype Pollution", domain: "web", level: 4,
      desc: "递归合并时不过滤 __proto__,污染 JavaScript 原型链。", reqs: ["w14_ssti"], time: 25, tags: ["W19"], },
    { id: "w20_graphql", name: "GraphQL Security", domain: "web", level: 3,
      desc: "GraphQL 内省、无字段级权限、无查询深度限制导致敏感数据泄露。", reqs: ["w3_ac"], time: 20, tags: ["W20"], },
    { id: "w21_misconfig", name: "Security Misconfiguration", domain: "web", level: 2,
      desc: "生产环境暴露调试接口、敏感文件、默认配置。", reqs: ["w0_http"], time: 15, tags: ["W21"], },
    { id: "w22_sensitive", name: "Sensitive Data Exposure", domain: "web", level: 2,
      desc: "密钥、密码、凭据通过 .env / config / backup 泄露。", reqs: ["w21_misconfig"], time: 15, tags: ["W22"], },
    { id: "w23_session", name: "Session / Cookie 安全", domain: "web", level: 2,
      desc: "会话可预测、未绑定、无过期、无 HttpOnly/Secure。", reqs: ["w2_auth"], time: 15, tags: ["W23"], },
    { id: "w24_llm", name: "Web LLM Security", domain: "web", level: 3,
      desc: "提示词注入让 LLM 泄露系统提示词或执行非预期操作。", reqs: ["w5_xss"], time: 20, tags: ["W24"], },
    { id: "w25_sms", name: "短信轰炸与验证码绕过", domain: "web", level: 3,
      desc: "无频率限制的短信接口 + 可复用验证码: 资损与账号安全的经典组合。", reqs: ["w11_logic"], time: 25, tags: ["W25"], },
    { id: "w_boss", name: "WEB BOSS", domain: "web", level: 4,
      desc: "在陌生靶场中 3 小时内完成侦察→建模→漏洞定位→验证→影响说明→报告。",
      reqs: ["w9_cmdi", "w11_logic", "w25_sms", "w12_traversal", "w13_xxe", "w14_ssti", "w15_nosqli",
             "w16_deser", "w17_oauth", "w18_race", "w19_proto", "w20_graphql",
             "w21_misconfig", "w22_sensitive", "w23_session", "w24_llm"],
      time: 180, tags: ["BOSS"], boss: true },

    /* --- RESEARCH --- */
    { id: "r0_recon", name: "Recon & 攻击面", domain: "research", level: 2,
      desc: "快速建立陌生系统的输入、信任边界、身份关系、数据流模型。", reqs: ["w_boss"], time: 30, tags: ["R0"], },
    { id: "r1_model", name: "建模 & 假设", domain: "research", level: 3,
      desc: "基于攻击面提出可验证的安全假设。", reqs: ["r0_recon"], time: 20, tags: ["R1"], },
    { id: "r2_verify", name: "验证 & 影响", domain: "research", level: 4,
      desc: "最小化验证,判断漏洞成立与否,分析实际影响。", reqs: ["r1_model"], time: 40, tags: ["R2"], },
    { id: "r3_fp", name: "False Positive", domain: "research", level: 3,
      desc: "区分正常现象、低风险、无影响、误报和真正漏洞。", reqs: ["r2_verify"], time: 25, tags: ["R3"], },

    /* --- SRC --- */
    { id: "s0_scope", name: "Scope Reader", domain: "src", level: 2,
      desc: "读懂什么能测、什么不能测。答错禁止进入测试。", reqs: ["r2_verify"], time: 15, tags: ["S0"], },
    { id: "s1_report", name: "报告写作", domain: "src", level: 3,
      desc: "标题 + 概述 + 资产 + 前置条件 + 复现步骤 + PoC + 影响 + 修复建议。", reqs: ["s0_scope"], time: 30, tags: ["S1"], },
    { id: "s2_review", name: "审核 & 返修", domain: "src", level: 4,
      desc: "模拟审核员反馈(信息不足/证据不足/影响不足/重复/分类错误),返修报告。", reqs: ["s1_report"], time: 30, tags: ["S2"], },
    { id: "s3_board", name: "SRC 项目大厅", domain: "src", level: 4,
      desc: "读 Scope、查历史漏洞去重、选择目标、提交并接受真实评级(有效/重复/忽略)与赏金。", reqs: ["s2_review"], time: 40, tags: ["S3"], },
    { id: "s4_cvss", name: "CVSS 3.1 评分训练", domain: "src", level: 3,
      desc: "用标准向量给漏洞定级: 你的报告评级是否经得起审核员推敲。", reqs: ["s1_report"], time: 30, tags: ["S4"], },
    { id: "s_boss", name: "UNKNOWN TARGET", domain: "src", level: 4,
      desc: "完全不告诉漏洞类型、位置、参数。自行完成完整研究闭环并提交报告。",
      reqs: ["s3_board", "s4_cvss"], time: 240, tags: ["BOSS"], boss: true },
  ];

  /* ---------- 解锁检查 ---------- */
  CF.unlocked = (id) => {
    const n = CF.nodes.find((x) => x.id === id);
    if (!n) return false;
    if (!n.reqs.length) return true;
    return n.reqs.every((rid) => CF.prog.isDone(rid));
  };

  /* ---------- 入学诊断题目 ---------- */
  CF.diag = [
    /* Computer */
    { domain: "Computer", q: "一个程序文件被双击执行后,最先被操作系统加载到哪里?",
      opts: ["CPU 寄存器", "内存", "磁盘交换区", "网卡缓存"], a: 1,
      explain: "程序文件先被从磁盘读入内存,形成进程。CPU 执行的是内存中的指令。" },
    { domain: "Computer", q: "进程和线程的关系是什么?",
      opts: ["一个进程只能有一个线程", "一个线程可以包含多个进程", "一个进程可以包含多个线程,它们共享地址空间", "进程是硬件概念,线程是软件概念"], a: 2,
      explain: "进程是资源分配单位,线程是执行单位。同一进程内的多个线程共享该进程的内存空间。" },
    { domain: "Computer", q: "“程序能访问网络”最关键的一步发生在哪两者之间?",
      opts: ["程序文件和磁盘", "进程和内存", "线程和系统调用", "应用程序和数据库"], a: 2,
      explain: "线程通过系统调用请求内核创建 Socket,Socket 绑定端口后,才能通过网络发送数据。" },
    { domain: "Computer", q: "当操作系统需要读取文件时,最底层实际发生的是?",
      opts: ["CPU 直接读取磁盘", "内核通过系统调用向磁盘驱动发请求", "内存自动从磁盘搬运", "网卡代为读取"], a: 1,
      explain: "应用程序不能直接接触硬件,只能通过系统调用陷入内核,由内核驱动硬件完成读取。" },
    /* Network */
    { domain: "Network", q: "当你在浏览器输入 https://example.com 后,最先发生的是什么?",
      opts: ["建立 TCP 连接", "TLS 握手", "DNS 查询", "发送 HTTP 请求"], a: 2,
      explain: "必须先通过 DNS 把域名解析成 IP 地址,后续才能建立 TCP 连接。" },
    { domain: "Network", q: "TCP 三次握手的主要目的是?",
      opts: ["交换数据", "确认双方的发送和接收能力都正常", "传输文件", "关闭连接"], a: 1,
      explain: "SYN → SYN-ACK → ACK 的目的是让通信双方确认彼此都能正常收发数据,并同步初始序列号。" },
    { domain: "Network", q: "某主机 IP 为 192.168.1.10/24,它的子网掩码是?",
      opts: ["255.255.0.0", "255.255.255.0", "255.0.0.0", "255.255.255.255"], a: 1,
      explain: "/24 表示前 24 位是网络位,对应子网掩码 255.255.255.0。" },
    { domain: "Network", q: "NAT 在网络中的作用最准确的描述是?",
      opts: ["加速网络传输", "让私有地址能访问公网,同时节省公网 IP", "阻止所有外部连接", "自动分配 IP"], a: 1,
      explain: "NAT(网络地址转换) 将私有地址转换为公网地址,使局域网内设备能共享少量公网 IP 访问互联网。" },
    { domain: "Network", q: "HTTPS 比 HTTP 多出的关键安全层是?",
      opts: ["DNS", "TCP", "TLS", "ARP"], a: 2,
      explain: "HTTPS = HTTP over TLS。TLS 提供加密、身份验证和完整性保护。" },
    /* Linux */
    { domain: "Linux", q: "Linux 中查看当前所在路径的命令是?",
      opts: ["ls", "cd", "pwd", "cat"], a: 2,
      explain: "pwd(print working directory) 输出当前完整路径。" },
    { domain: "Linux", q: "文件权限 rwxr-xr-x 表示?",
      opts: ["只有文件所有者可执行", "所有者读写执行,组和其他人只读", "所有者读写执行,组和其他人读执行", "所有人都有全部权限"], a: 2,
      explain: "rwx(7) 给所有者, r-x(5) 给所属组, r-x(5) 给其他人。" },
    { domain: "Linux", q: "服务无法访问时,最合理的排查顺序是?",
      opts: ["重装系统 → 换网卡 → 换服务器", "进程 → 服务 → 端口 → 网络 → 配置 → 权限 → 日志",
        "重启电脑 → 祈祷 → 重试", "直接看代码找 bug"], a: 1,
      explain: "从外到内、从快到慢：先看进程在不在,再看服务状态,再看端口监听,再看网络,再看配置和权限,最后看日志。" },
    /* Windows */
    { domain: "Windows", q: "Windows 中查看正在运行的服务的最佳工具是?",
      opts: ["记事本", "任务管理器 / services.msc", "画图", "计算器"], a: 1,
      explain: "services.msc 或服务标签页可以查看、启动、停止、配置 Windows 服务。" },
    /* Python */
    { domain: "Python", q: "Python 中 requests.get(url) 返回的对象包含什么?",
      opts: ["只有 HTML 文本", "HTTP 响应的所有信息(状态码、头、体等)", "DNS 记录", "CPU 使用率"], a: 1,
      explain: "Response 对象包含 status_code、headers、text/content 等完整响应信息。" },
    { domain: "Python", q: "用 Python 批量处理 URL 列表,最适合的数据结构是?",
      opts: ["int", "str", "list", "None"], a: 2,
      explain: "list 可以按顺序存储任意数量的 URL,然后使用 for 循环逐个处理。" },
    /* HTTP */
    { domain: "HTTP", q: "HTTP 状态码 403 的含义是?",
      opts: ["未找到", "服务器内部错误", "禁止访问(没有权限)", "重定向"], a: 2,
      explain: "403 Forbidden 表示服务器理解了请求,但拒绝授权访问。" },
    { domain: "HTTP", q: "Cookie 的主要安全问题是?",
      opts: ["太大占内存", "被服务器用来挖矿", "可能被窃取或伪造,导致身份冒充", "导致 CPU 过热"], a: 2,
      explain: "Cookie 存储会话标识,若被窃取(如通过 XSS)或伪造,攻击者可以冒充用户身份。" },
    /* Security Basics */
    { domain: "Security", q: "授权(Authorization)和认证(Authentication)的区别是?",
      opts: ["没有区别,是同一个词", "认证=你是谁,授权=你能做什么", "认证=加密,授权=解密", "认证是硬件,授权是软件"], a: 1,
      explain: "Authentication 验证身份(你是谁),Authorization 决定权限(你能访问什么)。" },
    { domain: "Security", q: "最小权限原则的核心思想是?",
      opts: ["给所有人管理员权限方便协作", "只授予完成任务所必需的最小权限", "权限越小越不安全", "只给权限不给账号"], a: 1,
      explain: "最小权限原则(Principle of Least Privilege)要求任何实体只拥有完成工作所必需的最小权限,降低风险面。" },
    { domain: "Security", q: "当你发现一个网站返回了不该返回的敏感数据时,第一步应该做什么?",
      opts: ["发到社交媒体炫耀", "在群里讨论细节", "停止扩大测试,整理证据,判断影响,准备报告", "继续下载全部数据"], a: 2,
      explain: "发现异常后应立即停止扩大测试,整理证据,判断影响,准备合规报告。扩大测试可能违反授权范围。" },
  ];

  /* ---------- 每日任务模板 ---------- */
  CF.dailyTemplates = [
    { t: "完成 1 个能力节点(任意领域)", type: "lab", xp: 30 },
    { t: "回顾 1 个已完成的节点,口述关键原理", type: "review", xp: 20 },
    { t: "阅读 1 篇英文安全文档并记录术语", type: "english", xp: 15 },
    { t: "整理 1 份 Research Note (Markdown)", type: "note", xp: 20 },
    { t: "完成 1 道变体练习题(不提示漏洞类型)", type: "variant", xp: 35 },
  ];

  /* ---------- 节点内容生成器(简短,用于引擎) ---------- */
  CF.nodeContent = (id) => {
    const C = {
      /* FOUNDATION */
      f0_cpu: {
        title: "程序追踪：为什么程序能访问网络？",
        theory: "程序文件被加载进内存成为进程,进程内的线程通过系统调用让内核创建 Socket,Socket 绑定端口,才能通过网络收发数据。",
        steps: [
          { key:"s1", name:"极短理论", body:"程序→加载→进程→内存→线程→系统调用→Socket→端口→服务器" },
          { key:"s2", name:"可视化", body:"观察一个简单 HTTP 客户端从启动到发送请求的内部过程。" },
          { key:"s3", name:"跟做", body:"跟随系统引导,点击每个阶段,确认程序、进程、端口之间的关系。" },
          { key:"s4", name:"半独立", body:"不给步骤提示,只给目标：说明为什么文件和端口是两个不同的概念。" },
          { key:"s5", name:"解释", body:"用自己的话解释：线程为什么需要系统调用才能创建 Socket？" },
          { key:"s6", name:"变体", body:"如果程序运行在容器里,路径会有什么不同？容器有自己独立的端口空间吗？" },
          { key:"s7", name:"迁移", body:"面对一个你从未见过的程序,如何快速判断它监听了哪些端口？" },
        ],
        verify: [
          { q:"程序文件本身能直接访问网络吗？", a:0, opts:["不能,必须先加载成进程","能,只要文件存在就能联网","取决于文件扩展名","只有 .exe 才能联网"] },
          { q:"系统调用的作用是什么？", a:0, opts:["让应用程序请求内核服务","直接操作硬件","加速 CPU","加密数据"] },
        ],
      },
      f1_net: {
        title: "Packet Journey：一次完整的 Web 请求",
        theory: "从浏览器地址栏输入 URL 到收到响应,数据经历了 DNS→TCP→TLS→HTTP→应用→数据库→返回的完整链路。",
        steps: [
          { key:"s1", name:"极短理论", body:"DNS 解析域名 → TCP 三次握手 → TLS 协商 → HTTP 请求 → 服务器处理 → 数据库查询 → HTTP 响应。" },
          { key:"s2", name:"可视化", body:"观看 Packet Journey 动画,观察每个阶段的数据包变化。" },
          { key:"s3", name:"跟做", body:"跟随动画,依次点击每个节点,确认数据流转方向。" },
          { key:"s4", name:"半独立", body:"目标：描述当 DNS 解析失败时,浏览器和操作系统分别做了什么。" },
          { key:"s5", name:"解释", body:"用自己的话解释：为什么 TCP 握手是三次而不是两次？" },
          { key:"s6", name:"变体", body:"如果是 HTTP/2 或 HTTP/3,哪些阶段会不同？" },
          { key:"s7", name:"迁移", body:"给定一个陌生的 Web 应用,你如何确认它的后端数据库类型？" },
        ],
        verify: [
          { q:"如果 DNS 返回了错误 IP,后面的 TLS 和 HTTP 还能正常进行吗？", a:1, opts:["能,因为 TLS 不依赖 DNS","不能,连接会发到错误主机","TLS 会自动纠正 IP","取决于浏览器品牌"] },
          { q:"三次握手完成后,通信双方已经确认了哪些能力？", a:0, opts:["双方都能正常收发","只有客户端能发","只有服务器能收","确认了带宽大小"] },
        ],
      },
      f2_linux: {
        title: "Linux 诊断：Web 服务无法访问",
        theory: "当服务无法访问时,按照固定顺序排查:进程→服务→端口→网络→配置→权限→日志。",
        steps: [
          { key:"s1", name:"极短理论", body:"排查顺序:进程在吗?服务在吗?端口在听吗?网络通吗?配置对吗?权限够吗?日志说什么?" },
          { key:"s2", name:"可视化", body:"打开模拟终端,用 ps aux 查看进程,用 ss -tlnp 查看端口监听,用 journalctl -xe 查看日志。" },
          { key:"s3", name:"跟做", body:"跟随提示:先 ps aux 找 nginx,再 ss -tlnp 看 80 端口,再 journalctl -xe 看日志。" },
          { key:"s4", name:"半独立", body:"目标:找出 Web 服务无法访问的根本原因。不给步骤,你自己用命令排查。" },
          { key:"s5", name:"解释", body:"用自己的话解释:为什么 systemctl status nginx 显示 inactive,但 ss 显示 80 端口被监听?" },
          { key:"s6", name:"变体", body:"如果日志显示 Permission denied 而不是 Address already in use,排查方向会有什么不同?" },
          { key:"s7", name:"迁移", body:"给你一台全新的 Linux 服务器,SSH 登录后发现 8080 端口的应用无法访问。写出你的排查命令序列。" },
        ],
        verify: [
          { q:"nginx 服务无法启动,最可能的原因是?", a:0, opts:["端口 80 被其他进程占用","DNS 解析失败","磁盘满了","CPU 过热"] },
          { q:"ss -tlnp 输出中 0.0.0.0:80 表示什么?", a:0, opts:["监听在所有网卡的 80 端口","只监听回环地址","端口被防火墙阻止","服务已崩溃"] },
        ],
      },
      f3_win: {
        title: "Windows 诊断：服务启动失败",
        theory: "Windows 服务有依赖关系。理解服务→进程→权限→配置→Event Log 的排查链。",
        steps: [
          { key:"s1", name:"极短理论", body:"服务无法启动通常因为:依赖服务未运行、权限不足、配置错误、端口被占用。" },
          { key:"s2", name:"可视化", body:"打开 Windows 服务管理器,观察 W3SVC 和 HTTP 服务的状态与依赖关系。" },
          { key:"s3", name:"跟做", body:"跟随引导:启动 HTTP 服务,再启动 W3SVC。" },
          { key:"s4", name:"半独立", body:"目标:让 W3SVC 运行。不给步骤,自己排查。" },
          { key:"s5", name:"解释", body:"用自己的话解释:为什么 W3SVC 启动失败时,先看依赖服务而不是直接重装 IIS?" },
          { key:"s6", name:"变体", body:"如果 HTTP 服务启动时也报错,下一步应该检查什么?(提示: 查看 Event Log)" },
          { key:"s7", name:"迁移", body:"给你一台 Windows Server,SQL Server 服务无法启动。写出你的排查思路。" },
        ],
        verify: [
          { q:"W3SVC 启动失败,日志显示'依赖服务或组无法启动',首先应该?", a:0, opts:["检查依赖服务 HTTP 是否运行","重装 IIS","重启电脑","格式化磁盘"] },
          { q:"Event Log 的主要作用是?", a:0, opts:["记录系统事件和错误,帮助排查","美化桌面","加速启动","备份文件"] },
        ],
      },
      f4_py: {
        title: "Python 工具制造",
        theory: "Python 不是背语法,而是用来自动化重复操作。写一个安全辅助工具,代替手动点击。",
        steps: [
          { key:"s1", name:"极短理论", body:"安全研究中,Python 常用于:批量请求、日志分析、端口扫描、信息收集。" },
          { key:"s2", name:"可视化", body:"观察三个任务: HTTP 客户端 / 日志分析器 / 端口探测器,理解每个工具替代了什么手动操作。" },
          { key:"s3", name:"跟做", body:"跟随示例,修改代码并运行,观察输出。" },
          { key:"s4", name:"半独立", body:"目标:完成三个任务。不给完整代码,只给必须包含的关键词。" },
          { key:"s5", name:"解释", body:"用自己的话解释:为什么 requests.get() 比手动开浏览器快? 批量处理的优势是什么?" },
          { key:"s6", name:"变体", body:"把端口探测器改成扫描 192.168.1.0/24 网段,需要改哪几行?" },
          { key:"s7", name:"迁移", body:"给你一个包含 1000 行日志的文件,用 Python 找出所有返回 500 错误的请求。" },
        ],
        verify: [
          { q:"Python 在安全研究中的核心价值是?", a:0, opts:["自动化重复操作,把人力解放出来做判断","替代所有其他工具","让电脑变慢","只能写 Web 网站"] },
          { q:"写端口探测器时,为什么必须设置 timeout?", a:0, opts:["防止脚本因连接无响应而永久卡住","让结果更准确","节省内存","法律要求"] },
        ],
      },
      f5_git: {
        title: "Git & Markdown",
        theory: "每次实验后,用 Markdown 记录观察、实验、结论,然后用 Git commit 保存。这是研究员的基本功。",
        steps: [
          { key:"s1", name:"极短理论", body:"Git 记录代码和笔记的历史版本;Markdown 让笔记结构化、易读。" },
          { key:"s2", name:"可视化", body:"观察 git init → git add → git commit → git log 的完整流程。" },
          { key:"s3", name:"跟做", body:"在模拟终端中依次执行 git 命令。" },
          { key:"s4", name:"半独立", body:"目标:完成一次完整的 Git 提交流程。" },
          { key:"s5", name:"解释", body:"用自己的话解释:为什么 git add 和 git commit 是两步而不是一步?" },
          { key:"s6", name:"变体", body:"如果误提交了一个包含密码的文件,如何从历史中删除?" },
          { key:"s7", name:"迁移", body:"给你一个新项目,写出从初始化到第一次提交的完整命令序列。" },
        ],
        verify: [
          { q:"git add 的作用是?", a:0, opts:["把文件放入暂存区,准备提交","直接提交","删除文件","重命名文件"] },
          { q:"Markdown 的主要优势是?", a:0, opts:["纯文本、易读、易版本控制、可转成 HTML","只能用来看小说","必须安装 Office","比 Word 慢"] },
        ],
      },
      f_boss: {
        title: "FOUNDATION BOSS — 综合排障",
        theory: "没有课程标签,没有提示列表。一台 Linux 服务器上的 Web 应用无法访问,你自己定位。",
        steps: [
          { key:"s1", name:"极短理论", body:"综合运用: 进程、服务、端口、网络、配置、权限、日志、Python。" },
          { key:"s2", name:"可视化", body:"观察系统状态: 哪些进程在运行? 哪些端口在监听? 日志说了什么?" },
          { key:"s3", name:"跟做", body:"使用模拟终端,按照你自己的思路排查。" },
          { key:"s4", name:"半独立", body:"目标: 找出 Web 服务无法访问的根本原因。" },
          { key:"s5", name:"解释", body:"向系统提交你的排查报告: 你做了什么? 发现了什么? 结论是什么?" },
          { key:"s6", name:"变体", body:"如果问题变成'服务间歇性断开',排查思路会有什么不同?" },
          { key:"s7", name:"迁移", body:"给你一台生产环境服务器(只读权限),如何在不修改任何东西的情况下诊断问题?" },
        ],
        verify: [
          { q:"排查 Web 服务无法访问时,第一步应该?", a:0, opts:["确认服务进程是否在运行","直接查看代码","重启服务器","检查显示器"] },
          { q:"journalctl -xe 的作用是?", a:0, opts:["查看系统日志,定位错误","安装软件","压缩文件","发送邮件"] },
        ],
      },
      /* WEB */
      w0_http: {
        title: "HTTP Request Lab",
        theory: "HTTP 是 Web 通信的基石。理解 Method、Header、Body、Cookie 如何组合成请求,以及服务器如何响应。",
        steps: [
          { key:"s1", name:"极短理论", body:"HTTP 请求 = Method + URL + Headers + Body。服务器返回 Status + Headers + Body。" },
          { key:"s2", name:"可视化", body:"观察一个 GET 请求和一个 POST 请求的结构差异。" },
          { key:"s3", name:"跟做", body:"跟随引导,修改 User-Agent 和 Cookie,观察服务器响应变化。" },
          { key:"s4", name:"半独立", body:"目标：让服务器返回 403 Forbidden,只告诉你需要修改 Authorization 头。" },
          { key:"s5", name:"解释", body:"用自己的话解释：为什么修改 Content-Type 可能导致服务器行为改变？" },
          { key:"s6", name:"变体", body:"同样的请求,改用 JSON Body 发送,观察服务器是否以不同方式解析。" },
          { key:"s7", name:"迁移", body:"面对一个陌生的 API 文档,你如何快速判断哪个字段用于认证,哪个用于授权？" },
        ],
        verify: [
          { q:"HTTP 状态码 401 和 403 的区别是？", a:0, opts:["401=未认证,403=已认证但无权限","401=服务器错误,403=客户端错误","两者完全相同","401=禁止,403=需要登录"] },
          { q:"Cookie 的 SameSite=Lax 在什么情况下会阻止跨站发送？", a:0, opts:["POST 等不安全请求","所有请求","GET 请求","仅图片请求"] },
        ],
      },
      w1_burp: {
        title: "Burp 风格 Repeater",
        theory: "Repeater 肌肉记忆: 观察请求 → 修改一个参数 → 发送 → 比较响应差异 → 建立假设 → 再验证。",
        steps: [
          { key:"s1", name:"极短理论", body:"Burp 不是扫描器,是'请求编辑器'。核心动作: 抓到一个正常请求,改一处,看响应哪里变了。" },
          { key:"s2", name:"可视化", body:"观察下方模拟的 Burp 界面: 左边改请求,右边看响应,下面是历史记录。" },
          { key:"s3", name:"跟做", body:"先 POST /login 用 alice 登录,把返回的 session 加进 Cookie 头,再 GET /api/profile。" },
          { key:"s4", name:"半独立", body:"目标: 用 Repeater 证明 /api/profile 存在 IDOR — 修改 user_id 拿到不属于自己的数据。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么'比较两个请求的响应差异'比'盯着单个响应看'更容易发现问题?" },
          { key:"s6", name:"变体", body:"如果 user_id 换成 UUID,你还能用同样思路测试吗? 需要先做什么?" },
          { key:"s7", name:"迁移", body:"面对任何陌生 API,写出你的前 3 个测试动作。" },
        ],
        verify: [
          { q:"Repeater 的核心价值是?", a:0, opts:["精确控制单个请求的每个字节并反复发送","自动扫描所有漏洞","加速网络","加密流量"] },
          { q:"测试 IDOR 时最可靠的证据是?", a:0, opts:["用户A的会话拿到用户B的数据","返回 200 状态码","响应时间变长","页面样式变化"] },
        ],
      },
      w2_auth: {
        title: "Authentication 认证失效",
        theory: "认证回答'你是谁'。常见失效: 弱口令、无爆破限制、会话管理缺陷、凭据可预测。",
        steps: [
          { key:"s1", name:"极短理论", body:"认证失效 = 系统无法可靠确认'你是谁'。最常见入口: 登录接口。" },
          { key:"s2", name:"可视化", body:"观察登录请求的结构: 用户名+密码如何被验证? 错误时返回什么?" },
          { key:"s3", name:"跟做", body:"先用错误密码登录看 401,再用弱密码 alice123 登录看 200。" },
          { key:"s4", name:"半独立", body:"目标: 不使用 SQL 注入,想办法登录 alice 账号。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么'限制登录失败次数'能有效防御密码爆破?" },
          { key:"s6", name:"变体", body:"如果系统有验证码但验证码可复用,防御还有效吗?" },
          { key:"s7", name:"迁移", body:"面对一个 API 登录接口(返回 JWT),你的测试清单是什么?" },
        ],
        verify: [
          { q:"防御密码爆破最有效的措施是?", a:0, opts:["失败次数限制 + 验证码 + 延迟","把密码框隐藏","使用 HTTPS","把登录页改名"] },
          { q:"会话 Cookie 设置 HttpOnly 是为了防什么?", a:0, opts:["防止 XSS 窃取 Cookie","防止 CSRF","防止 SQL 注入","防止 DDoS"] },
        ],
      },
      w3_ac: {
        title: "Access Control / IDOR",
        theory: "访问控制失效发生在:系统只验证了『你能访问某个功能』,但没有验证『你能访问这条具体数据』。",
        steps: [
          { key:"s1", name:"极短理论", body:"IDOR = Insecure Direct Object Reference。攻击者通过修改对象标识符(如 user_id=123)访问他人数据。" },
          { key:"s2", name:"可视化", body:"观察一个电商订单接口：Alice 登录后看到 /api/order?id=1001,Bob 的订单是 1002。" },
          { key:"s3", name:"跟做", body:"跟随引导,先以 Alice 身份获取订单,再修改 id 参数观察是否能拿到 Bob 的订单。" },
          { key:"s4", name:"半独立", body:"目标：证明存在 IDOR。只给你目标,不给具体参数名。" },
          { key:"s5", name:"解释", body:"用自己的话解释:为什么后端应该在每次数据查询时验证『这条数据是否属于当前用户』?" },
          { key:"s6", name:"变体", body:"参数从 URL 查询改为 JSON Body 中的 order_id,攻击面是否改变？" },
          { key:"s7", name:"迁移", body:"一个 REST API 使用 UUID 作为标识符,是否就能避免 IDOR？为什么不一定？" },
        ],
        verify: [
          { q:"IDOR 的根本原因是？", a:0, opts:["未对每次数据访问做权限校验","密码太弱","使用了 HTTPS","前端隐藏了按钮"] },
          { q:"将数字 ID 替换为 UUID 就能完全防御 IDOR 吗？", a:1, opts:["能,UUID 不可猜测","不能,如果后端仍不校验归属,攻击者拿到 UUID 后仍然有效","取决于 UUID 长度","只在 REST API 中有效"] },
        ],
      },
      /* RESEARCH */
      r0_recon: {
        title: "Recon & 攻击面建模",
        theory: "面对陌生系统,先建立模型：有哪些输入点？信任边界在哪里？身份关系是什么？数据流怎么走？",
        steps: [
          { key:"s1", name:"极短理论", body:"Recon 不是扫描,而是理解系统。先识别功能、角色、数据流,再定位攻击面。" },
          { key:"s2", name:"可视化", body:"观察一个陌生电商系统的功能地图和用户角色关系。" },
          { key:"s3", name:"跟做", body:"跟随引导,依次标记输入点、信任边界、身份关系、数据流。" },
          { key:"s4", name:"半独立", body:"只告诉你系统有 3 种用户角色,请自行推断可能的权限边界。" },
          { key:"s5", name:"解释", body:"解释:为什么『先扫描再分析』的效率通常低于『先建模再定向验证』?" },
          { key:"s6", name:"变体", body:"把 Web 应用换成纯 API 服务,攻击面模型会有什么不同？" },
          { key:"s7", name:"迁移", body:"面对一个完全陌生的内部管理系统,你如何在 10 分钟内画出攻击面草图？" },
        ],
        verify: [
          { q:"攻击面(Attack Surface)指的是？", a:0, opts:["所有可能被攻击者利用的输入点和信任边界","服务器的物理表面积","防火墙规则数量","代码行数"] },
          { q:"Recon 阶段最应该避免的错误是？", a:1, opts:["使用自动化工具","在理解系统功能前就开始盲目测试","记录笔记","阅读 API 文档"] },
        ],
      },
      /* SRC */
      s0_scope: {
        title: "Scope Reader",
        theory: "SRC 的第一步永远是读懂 Scope。什么能测、什么不能测、允许的方法、禁止的方法,违反 Scope 可能导致法律责任。",
        steps: [
          { key:"s1", name:"极短理论", body:"Scope 包含：目标域名/IP、允许测试资产、禁止测试资产、测试时间窗口、允许的方法、禁止的方法、注意事项。" },
          { key:"s2", name:"可视化", body:"阅读右侧模拟 SRC 测试规则文档,圈出『范围/排除/禁止』三节。" },
          { key:"s3", name:"跟做", body:"完成实验室 5 道 Scope 判断题(至少 4 题对): mall/internal/最小PoC/sqlmap/vpn 各一题。" },
          { key:"s4", name:"半独立", body:"给你一份 Scope 文档,自行判断某个子域名是否在测试范围内。" },
          { key:"s5", name:"解释", body:"解释：为什么即使技术上能找到漏洞,如果它不在 Scope 内也不应该提交？" },
          { key:"s6", name:"变体", body:"Scope 中『禁止自动化扫描』和『禁止导致服务中断』分别意味着什么实际操作限制?" },
          { key:"s7", name:"迁移", body:"面对一份你用母语写成的 SRC 规则,列出 3 个必须在开始测试前确认的关键问题。" },
        ],
        verify: [
          { q:"Scope 中列出的 *.example.com 是否包含 api.internal.example.com？", a:1, opts:["一定包含","不一定,internal 子域名可能不在范围内","取决于 HTTP 状态码","取决于服务器类型"] },
          { q:"“禁止导致服务中断”意味着？", a:0, opts:["不能进行拒绝服务攻击或高并发压测","不能访问网站","不能修改请求","只能在工作日测试"] },
        ],
      },
      w4_sqli: {
        title: "SQL Injection",
        theory: "输入被拼接进 SQL 语句,改变查询语义。信任边界: 用户输入不该成为代码。",
        steps: [
          { key:"s1", name:"极短理论", body:"SQLi 核心: 单引号测试 → 报错确认 → 闭合注入 → 提取数据。输入流进了 SQL 解释器。" },
          { key:"s2", name:"可视化", body:"观察 GET /api/search?q=phone 正常返回,改成 q=phone' 后 500 报 MySQL 语法错误。" },
          { key:"s3", name:"跟做", body:"跟随提示: 先单引号测试,再用 OR '1'='1 闭合,观察返回全部数据。" },
          { key:"s4", name:"半独立", body:"目标: 证明 SQLi。只告诉你参数是 q,不给 payload。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么参数化查询(预编译)能根治 SQL 注入?" },
          { key:"s6", name:"变体", body:"点『变体练习』: 数字型参数(无引号闭合)怎么注入?" },
          { key:"s7", name:"迁移", body:"POST JSON 接口 {\"name\":\"test\"} 也可能有 SQLi 吗? 测试思路是什么?" },
        ],
        verify: [
          { q:"SQLi 的根本原因?", a:0, opts:["用户输入被拼接进 SQL 语句","密码太弱","用了 HTTP 不是 HTTPS","服务器太慢"] },
          { q:"根治 SQLi 的正确修复?", a:0, opts:["参数化查询/预编译语句","过滤单引号","换个数据库","限制请求频率"] },
        ],
      },
      w5_xss: {
        title: "XSS 跨站脚本",
        theory: "输入未过滤直接输出到 HTML,浏览器把用户输入当代码执行。反射型(立即返回)与存储型(存库后他人触发)同源。",
        steps: [
          { key:"s1", name:"极短理论", body:"XSS 核心: 输入 → 输出到 HTML → 浏览器执行。测试链: 普通文本 → <b> 标签 → <script>。" },
          { key:"s2", name:"可视化", body:"观察 /xss?q=test 的响应 HTML,找到输入出现在页面哪个位置。" },
          { key:"s3", name:"跟做", body:"跟随提示逐级测试: 文本 → HTML 标签 → 脚本标签。" },
          { key:"s4", name:"半独立", body:"目标: 让响应包含可执行脚本。再试试存储型: POST /guestbook 留言,然后 GET 查看。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 存储型 XSS 为什么比反射型危害更大?" },
          { key:"s6", name:"变体", body:"点『变体练习』: DOM 型 XSS(前端 JS 处理 URL)怎么测?" },
          { key:"s7", name:"迁移", body:"如果输出位置在 <input value=\"...\"> 的属性里,怎么闭合注入?" },
        ],
        verify: [
          { q:"XSS 的修复核心是?", a:0, opts:["输出编码 + CSP","过滤 <script> 关键字","禁用 JavaScript","换浏览器"] },
          { q:"HttpOnly Cookie 防的是?", a:0, opts:["XSS 窃取 Cookie","CSRF","SQLi","中间人攻击"] },
        ],
      },
      w6_csrf: {
        title: "CSRF 跨站请求伪造",
        theory: "浏览器自动带 Cookie,服务器无法区分请求来自本站还是恶意页面。信任边界: 来源验证。",
        steps: [
          { key:"s1", name:"极短理论", body:"CSRF 成立三条件: 依赖 Cookie 认证 + 无 Token + 无来源校验。" },
          { key:"s2", name:"可视化", body:"观察 POST /api/transfer 的请求头: 有没有 CSRF Token? 有没有 Referer 检查?" },
          { key:"s3", name:"跟做", body:"用 alice session 直接发转账请求,确认无任何防护。" },
          { key:"s4", name:"半独立", body:"目标: 证明 CSRF 成立。思考: 恶意页面如何自动提交这个请求?" },
          { key:"s5", name:"解释", body:"用自己的话解释: SameSite=Lax 为什么能缓解 CSRF? 它对 POST 跨站请求做了什么?" },
          { key:"s6", name:"变体", body:"如果接口只接受 JSON Content-Type,简单表单 CSRF 还有效吗?" },
          { key:"s7", name:"迁移", body:"内网管理后台的 CSRF 为什么更危险?(提示: 攻击者浏览器可以直连内网)" },
        ],
        verify: [
          { q:"防御 CSRF 最可靠的组合?", a:0, opts:["CSRF Token + SameSite Cookie","只检查 Referer","HTTPS","隐藏接口地址"] },
          { q:"CSRF 利用的前提是受害者?", a:0, opts:["处于登录状态且访问恶意页面","使用了弱密码","开了摄像头","用了手机"] },
        ],
      },
      w7_upload: {
        title: "File Upload 文件上传",
        theory: "上传校验的缝隙: 只看结尾扩展名、只信客户端 Content-Type、上传目录可执行脚本。",
        steps: [
          { key:"s1", name:"极短理论", body:"上传漏洞核心: 让服务器保存并『执行』你上传的文件。绕过点: 扩展名/Content-Type/内容检测。" },
          { key:"s2", name:"可视化", body:"观察直接传 shell.php 被拒,分析服务器检查了什么。" },
          { key:"s3", name:"跟做", body:"跟随提示尝试: 双扩展名 shell.php.jpg 和 Content-Type 伪造。" },
          { key:"s4", name:"半独立", body:"目标: 找到至少一种绕过方式拿到 FLAG。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么『上传目录禁止脚本执行』是兜底防御?" },
          { key:"s6", name:"变体", body:"如果服务器还检查文件内容(图片头),如何构造『图片马』?" },
          { key:"s7", name:"迁移", body:"目标站点用对象存储(OSS)存上传文件,上传漏洞的危害会变化吗?" },
        ],
        verify: [
          { q:"最安全的文件上传方案是?", a:0, opts:["服务端重命名+白名单+内容检测+目录禁执行","只查扩展名","只信 Content-Type","前端 JS 校验"] },
        ],
      },
      w8_ssrf: {
        nodeId: "w8_ssrf",
        title: "SSRF 服务端请求伪造",
        theory: "服务器代发请求且未过滤目标地址 → 攻击者借服务器之手访问内网。信任边界: URL 目标。",
        steps: [
          { key:"s1", name:"极短理论", body:"SSRF 核心: 找『服务器代发请求』的功能(图片抓取/URL预览/Webhook),改成内网地址。" },
          { key:"s2", name:"可视化", body:"观察 /api/fetch?url= 正常抓取外部 URL,理解『代发』的含义。" },
          { key:"s3", name:"跟做", body:"跟随提示把 url 改成 169.254.169.254(云元数据)和 127.0.0.1(内部面板)。" },
          { key:"s4", name:"半独立", body:"目标: 拿到内网数据 FLAG。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 云环境 169.254.169.254 为什么是 SSRF 的黄金目标?" },
          { key:"s6", name:"变体", body:"如果服务器过滤了 127.0.0.1 字符串,可以用什么绕过?(提示: 0177.0.0.1、0x7f.1、DNS 重绑定)" },
          { key:"s7", name:"迁移", body:"PDF 生成器(输入 URL 转 PDF)可能存在什么漏洞?" },
        ],
        verify: [
          { q:"SSRF 修复的正确做法是?", a:0, opts:["URL 白名单+禁内网段+禁重定向","过滤 localhost 字符串","限制响应大小","换 HTTPS"] },
        ],
      },
      w9_cmdi: {
        title: "Command Injection 命令注入",
        theory: "输入拼进 shell 命令字符串,; | && 等分隔符可串联任意命令。",
        steps: [
          { key:"s1", name:"极短理论", body:"命令注入核心: 找『输入流进系统命令』的功能(ping/dns查询/文件转换),用分隔符串联命令。" },
          { key:"s2", name:"可视化", body:"观察 /api/ping?host= 返回 ping 输出格式,确认输入进了 shell。" },
          { key:"s3", name:"跟做", body:"跟随提示: host=127.0.0.1;id 观察返回中的 uid=33(www-data)。" },
          { key:"s4", name:"半独立", body:"目标: 拿到 FLAG{cmd_1nj3ct10n}。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么 exec(array) 形式比 exec(string) 安全?" },
          { key:"s6", name:"变体", body:"如果无回显(盲注),如何确认命令执行了?(提示: sleep/dnslog)" },
          { key:"s7", name:"迁移", body:"日志分析功能把文件名拼进 grep 命令,可能存在什么漏洞?" },
        ],
        verify: [
          { q:"命令注入与 SQL 注入的共同本质是?", a:0, opts:["用户输入被当作代码执行","都只能用 GET","都需要管理员权限","只存在于 PHP"] },
        ],
      },
      w10_api: {
        title: "API & JWT",
        theory: "JWT = base64(header).base64(payload).signature。常见失效: alg=none、弱密钥、不校验过期。",
        steps: [
          { key:"s1", name:"极短理论", body:"JWT 认证核心: 服务器验签名 → 信 payload。如果验签有缝,payload 可任意伪造。" },
          { key:"s2", name:"可视化", body:"登录拿 token,用浏览器控制台 atob() 解码三段,看清结构。" },
          { key:"s3", name:"跟做", body:"跟随提示构造 alg=none 的 admin token,访问 /api/me。" },
          { key:"s4", name:"半独立", body:"目标: 拿到 FLAG{jwt_n0n3_4lg}。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么『客户端可改 payload』本身不是漏洞,『服务端接受改过的 payload』才是?" },
          { key:"s6", name:"变体", body:"HS256 密钥弱到能被字典爆破时,攻击链是什么?" },
          { key:"s7", name:"迁移", body:"OAuth 授权码模式中,redirect_uri 未严格校验会导致什么?" },
        ],
        verify: [
          { q:"防御 alg=none 攻击,库应该?", a:0, opts:["强制算法白名单,拒绝 none","用更长密钥","加密 payload","缩短过期时间"] },
        ],
      },
      w11_logic: {
        title: "Business Logic 业务逻辑",
        theory: "代码里的隐式假设从未被验证。扫描器找不到,只能靠理解业务。SRC 高价值方向。",
        steps: [
          { key:"s1", name:"极短理论", body:"业务逻辑漏洞核心: 开发者假设了『正常用户不会这么做』,但没有任何校验。" },
          { key:"s2", name:"可视化", body:"观察下单流程: qty × price = 扣款。系统假设了什么?" },
          { key:"s3", name:"跟做", body:"跟随提示构造负数订单,观察余额反增。" },
          { key:"s4", name:"半独立", body:"目标: 拿到 FLAG{n3g4t1v3_pr1c3}。" },
          { key:"s5", name:"解释", body:"用自己的话解释: 为什么这类漏洞自动化工具发现不了?" },
          { key:"s6", name:"变体", body:"优惠券叠加、库存并发、提现手续费 — 分别可能有什么逻辑漏洞?" },
          { key:"s7", name:"迁移", body:"面对任何涉及『钱/数量/状态流转』的功能,你的测试清单?" },
        ],
        verify: [
          { q:"业务逻辑漏洞测试的核心能力是?", a:0, opts:["理解业务流程+质疑隐式假设","背更多 payload","用更贵的扫描器","更快的网速"] },
        ],
      },
      w_boss: {
        title: "WEB BOSS — 未知靶场考核",
        theory: "不告诉漏洞类型。3 小时内: 侦察 → 建模 → 定位 → 验证 → 报告。",
        steps: [
          { key:"s1", name:"极短理论", body:"完整研究闭环: Recon(功能地图) → Model(攻击面) → Hypothesize → Verify → Report。" },
          { key:"s2", name:"可视化", body:"进入靶场,先用 GET / 和 /robots.txt 建立功能地图。" },
          { key:"s3", name:"跟做", body:"用 alice/alice123 登录,逐个功能探索: 个人资料/搜索/留言/转账/上传。" },
          { key:"s4", name:"半独立", body:"目标: 找到至少 2 个不同类别的漏洞并记录证据。" },
          { key:"s5", name:"解释", body:"向自己解释每个发现: 为什么产生? 信任边界在哪? 输入怎样流到危险点?" },
          { key:"s6", name:"变体", body:"找到的每个漏洞,想一个『同一原理换外壳』的变体场景。" },
          { key:"s7", name:"迁移", body:"写一份完整报告(后续 SRC 阶段会教你如何写)。" },
        ],
        verify: [
          { q:"面对未知目标,最高效的第一步是?", a:0, opts:["建立功能地图和攻击面模型","直接跑漏洞扫描器","先爆破密码","发拒绝服务攻击"] },
        ],
      },
      r0_recon: {
        title: "Recon & 攻击面建模",
        theory: "Recon 不是扫描,是理解系统: 输入点、信任边界、身份关系、数据流。",
        steps: [
          { key:"s1", name:"极短理论", body:"四要素: 输入点(用户可控) → 信任边界(权限变化) → 身份关系(谁是谁) → 数据流(输入去哪)。" },
          { key:"s2", name:"可视化", body:"观察下方的攻击面标注练习。" },
          { key:"s3", name:"跟做", body:"给每个系统元素标注角色: 输入点/信任边界/身份关系/数据流。" },
          { key:"s4", name:"半独立", body:"全部标对即通过。" },
          { key:"s5", name:"解释", body:"解释: 为什么响应头 Server: nginx 不算攻击面要素?" },
          { key:"s6", name:"变体", body:"纯 API 系统(无前端页面)的攻击面标注会有什么不同?" },
          { key:"s7", name:"迁移", body:"10 分钟内为一个陌生系统画出攻击面草图,写出你的顺序。" },
        ],
        verify: [
          { q:"攻击面建模的输出物是?", a:0, opts:["输入点+信任边界+身份关系+数据流的清单","端口列表","子域名列表","漏洞列表"] },
        ],
      },
      r1_model: {
        title: "建模 & 假设",
        theory: "基于攻击面提出『可验证』的安全假设: 这个输入会被校验吗? 这个边界会被绕过吗?",
        steps: [
          { key:"s1", name:"极短理论", body:"好假设 = 可证伪 + 有明确验证方法。『这里可能有 IDOR』不如『改 user_id 能否拿到他人数据』。" },
          { key:"s2", name:"可视化", body:"打开假设构建实验室,观察: 面对 /api/orders?order_id=1001,如何区分好假设与坏假设。" },
          { key:"s3", name:"跟做", body:"完成实验室两关: 从 6 个候选中选出全部『好假设』(具体动作 + 可观察结果)。" },
          { key:"s4", name:"半独立", body:"面对任意参数,写出至少 3 个可验证假设。" },
          { key:"s5", name:"解释", body:"解释『可证伪』的含义: 为什么『这个系统可能有漏洞』不是好假设?" },
          { key:"s6", name:"变体", body:"对 JSON Body 参数和路径参数,假设列表有何异同?" },
          { key:"s7", name:"迁移", body:"面对文件下载接口 /download?file=report.pdf,列出你的假设清单。" },
        ],
        verify: [
          { q:"最好的安全假设特征是?", a:0, opts:["具体、可验证、可证伪","越模糊越安全","越多越好不用验证","只假设高危漏洞"] },
        ],
      },
      r2_verify: {
        title: "验证 & 影响分析",
        theory: "最小化验证: 用最小的改动证明漏洞成立。影响分析: 攻击者实际能做什么。",
        steps: [
          { key:"s1", name:"极短理论", body:"验证原则: 最小化(不扩大测试) + 对照(正常 vs 异常) + 证据(可复现)。" },
          { key:"s2", name:"可视化", body:"打开最小化验证实验室,观察三个真实场景: 越权/注入/XSS 各自的『最小证明』长什么样。" },
          { key:"s3", name:"跟做", body:"完成实验室三个场景: 每次选出唯一符合最小化原则的做法(3/3)。" },
          { key:"s4", name:"半独立", body:"给你『能读取他人订单』的能力,写出最小化验证方案。" },
          { key:"s5", name:"解释", body:"解释: 为什么『最小化验证』既是道德要求也是技术要求?" },
          { key:"s6", name:"变体", body:"SQLi 的最小化证明: 为什么 OR 1=1 比脱库更合适?" },
          { key:"s7", name:"迁移", body:"发现一个接口能删他人数据,如何在『不真的删除』前提下证明?" },
        ],
        verify: [
          { q:"证明漏洞时最不应该做的是?", a:0, opts:["下载大量真实用户数据作为证据","记录请求响应","对照测试","写复现步骤"] },
        ],
      },
      r3_fp: {
        title: "False Positive 误报判断",
        theory: "区分: 有效漏洞 / 低风险 / 无影响 / 误报。SRC 中浪费审核员时间 = 信誉下降。",
        steps: [
          { key:"s1", name:"极短理论", body:"判断框架: 能复现吗? 有影响吗? 攻击者能触发吗? 影响值得修吗?" },
          { key:"s2", name:"可视化", body:"完成 4 个真实案例的误报判断训练。" },
          { key:"s3", name:"跟做", body:"逐案分析,选对答案并理解为什么。" },
          { key:"s4", name:"半独立", body:"目标: 4 题至少对 3 题。" },
          { key:"s5", name:"解释", body:"解释: 为什么『技术上成立』不等于『值得提交』?" },
          { key:"s6", name:"变体", body:"self-XSS(只能弹自己)是漏洞吗? 为什么多数 SRC 不收?" },
          { key:"s7", name:"迁移", body:"写一个你自己的『提交前检查清单』(至少 5 条)。" },
        ],
        verify: [
          { q:"提交 SRC 报告前最该问自己的是?", a:0, opts:["审核员能复现吗?影响明确吗?","payload 够酷吗?","能拿多少钱?","能发朋友圈吗?"] },
        ],
      },
      s1_report: {
        title: "报告写作",
        theory: "好报告 = 别人只看你写的就能复现并认可影响。七要素: 标题/资产/原因/复现/证据/影响/修复。",
        steps: [
          { key:"s1", name:"极短理论", body:"审核员视角: 30 秒内看懂是什么洞、在哪、多严重、怎么修。" },
          { key:"s2", name:"可视化", body:"观察报告写作器的七个字段,理解每个字段的作用。" },
          { key:"s3", name:"跟做", body:"用你在 Burp Lab 找到的 IDOR,写一份完整报告。" },
          { key:"s4", name:"半独立", body:"提交审核,根据反馈返修,直到通过。" },
          { key:"s5", name:"解释", body:"解释: 为什么『影响』字段决定赏金等级,而不是『利用难度』?" },
          { key:"s6", name:"变体", body:"同一 IDOR,影响是『读取公开昵称』vs『读取身份证号的』报告写法差异?" },
          { key:"s7", name:"迁移", body:"为 SQLi 写报告: 如何在不泄露真实数据的前提下证明危害?" },
        ],
        verify: [
          { q:"报告被『信息不足』打回,通常是缺?", a:0, opts:["复现步骤和证据","更多形容词","更长的标题","更多截图数量"] },
        ],
      },
      s2_review: {
        title: "审核 & 返修",
        theory: "审核反馈类型: 信息不足/证据不足/影响不足/复现失败/重复/分类错误/需要补充/有效。返修是常态。",
        steps: [
          { key:"s1", name:"极短理论", body:"返修 ≠ 失败。理解每类反馈背后的含义,精准补充,不整篇重写。" },
          { key:"s2", name:"可视化", body:"在报告写作器中提交,观察审核反馈。" },
          { key:"s3", name:"跟做", body:"根据反馈逐项补充,重新提交。" },
          { key:"s4", name:"半独立", body:"目标: 写出一份一次通过的报告。" },
          { key:"s5", name:"解释", body:"解释: 『重复』反馈意味着什么? 如何避免?" },
          { key:"s6", name:"变体", body:"如果审核员说『分类错误: 这是 CSRF 不是 XSS』,你该怎么改?" },
          { key:"s7", name:"迁移", body:"真实 SRC 中,报告 3 天未响应,正确做法是什么?" },
        ],
        verify: [
          { q:"收到『重复』反馈说明?", a:0, opts:["有人先报了同一问题,正常,继续找新点","审核员刁难你","平台有 bug","你的工具坏了"] },
        ],
      },
      s_boss: {
        title: "UNKNOWN TARGET — 毕业考核",
        theory: "最终测试: 未知目标,无提示。Scope → 侦察 → 建模 → 定位 → 验证 → 报告 → 审核通过。",
        steps: [
          { key:"s1", name:"极短理论", body:"完整闭环,全程自主。通过后获得 FRONTIER RESEARCHER 认证。" },
          { key:"s2", name:"可视化", body:"读 Scope,确认授权范围。" },
          { key:"s3", name:"跟做", body:"从 GET / 开始侦察,建立功能地图。" },
          { key:"s4", name:"半独立", body:"找到至少 2 类漏洞并记录证据。" },
          { key:"s5", name:"解释", body:"写一份完整毕业报告。" },
          { key:"s6", name:"变体", body:"根据审核反馈返修(如有)。" },
          { key:"s7", name:"迁移", body:"审核通过 → 毕业 → 进入真实 SRC 世界。" },
        ],
        verify: [
          { q:"毕业考核的核心标准是?", a:0, opts:["独立完成完整研究闭环并产出有效报告","找到最多漏洞","速度最快","payload 最复杂"] },
        ],
      },
    };
    /* ---------- 新节点的七步内容自动生成(覆盖扩展包全部漏洞) ---------- */
    const vulnTheory = {
      w12_traversal: ["路径穿越", "../ 未过滤,文件名被拼接进真实文件路径", "用白名单文件名 + 路径规范化 + chroot 沙箱"],
      w13_xxe: ["XXE", "XML 解析器默认允许外部实体,ENTITY 可指向 file://", "禁用 DTD 与外部实体,升级解析库配置"],
      w14_ssti: ["SSTI", "用户输入进入模板引擎,{{}} 被当表达式求值", "不让用户输入做模板,沙箱模板,自动转义"],
      w15_nosqli: ["NoSQL 注入", "JSON 对象(如 {$ne:null})直接进入 MongoDB 查询", "强制标量类型校验,拒绝对象/数组输入"],
      w16_deser: ["反序列化", "反序列化用户可控数据,可实例化任意类触发链", "白名单类,用 JSON 替代原生序列化,签名校验"],
      w17_oauth: ["OAuth 缺陷", "redirect_uri 前缀匹配,授权码可被发往攻击者域", "精确匹配注册的 redirect_uri 白名单"],
      w18_race: ["竞争条件", "检查与使用不是原子操作,并发请求都能通过检查", "数据库原子更新/行锁/幂等键/乐观锁"],
      w19_proto: ["原型污染", "递归合并不过滤 __proto__,写入对象原型", "Object.create(null) 建表,过滤 __proto__/constructor"],
      w20_graphql: ["GraphQL", "生产环境内省开启 + 无字段级鉴权 + 无深度限制", "关闭内省,字段级授权,查询成本/深度限制"],
      w21_misconfig: ["安全配置错误", "生产暴露调试接口/默认配置/管理端点", "最小化暴露面,环境隔离,基线检查"],
      w22_sensitive: ["敏感数据泄露", "密钥文件可公开访问,凭据写进前端或备份", "禁访敏感文件,密钥进 KMS,定期轮换"],
      w23_session: ["会话安全", "会话 ID 可预测/不绑定/不失效", "高熵随机 ID + HttpOnly/Secure/SameSite + 过期 + 绑定"],
      w24_llm: ["LLM 提示词注入", "用户输入与系统指令无隔离,可覆盖系统指令", "输入输出审查,敏感信息不放提示词,工具调用白名单"],
      w25_sms: ["短信轰炸与验证码绕过", "敏感操作接口无频率限制且验证码可复用", "手机号+IP 双维度限流、图形验证前置、验证码一次一用并绑定具体操作"],
    };
    const auto = (id) => {
      if (vulnTheory[id]) {
        const [name, cause, fix] = vulnTheory[id];
        return {
          title: name,
          theory: `${name}: ${cause}。`,
          steps: [
            { key: "s1", name: "极短理论", body: `${name} 的本质: ${cause}。先回答五个问题的前两个: 为什么产生? 信任边界在哪里?` },
            { key: "s2", name: "可视化", body: "打开实验室,先发送预设的『正常请求』,观察正常响应长什么样。" },
            { key: "s3", name: "跟做", body: "按 Guided 提示逐步操作,每改一次参数就比较一次响应。" },
            { key: "s4", name: "半独立", body: "切到 Semi-Blind(只告诉你类型),独立找到参数位置和证明方法拿到 FLAG。" },
            { key: "s5", name: "五问解释", body: `用自己的话回答五问: 为什么产生? 信任边界在哪? 输入怎样流到危险点? 如何最小化证明? 如何修复(${fix})?` },
            { key: "s6", name: "变体", body: "切到 Blind 或点『变体练习』: 同一原理换参数位置/换业务外壳,再次独立证明。" },
            { key: "s7", name: "迁移", body: `换技术栈: 用一句话说出 ${name} 在不同语言/框架中的共同根因,并写出你在陌生系统的测试清单。` },
          ],
          verify: [
            { q: `${name} 的根本原因是?`, a: 0, opts: [cause, "网络没有加密", "服务器性能不足", "使用了开源软件"] },
            { q: `修复 ${name} 的正确方向是?`, a: 0, opts: [fix, "增加更多防火墙规则", "把接口改个名字", "要求用户用复杂密码"] },
          ],
        };
      }
      if (id === "f6_eng") return {
        title: "英语技术阅读", theory: "安全世界的一手资料都是英文。抓四要素: 端点/参数、影响、漏洞分类、版本。",
        steps: [
          { key: "s1", name: "极短理论", body: "英文公告套路: 某端点 + 某参数 + 未做某校验 + 导致某影响 + 归类为某缩写。" },
          { key: "s2", name: "可视化", body: "阅读右侧模拟 CVE 公告原文。" },
          { key: "s3", name: "跟做", body: "逐句找关键词: endpoint / parameter / validate / attacker / classified as。" },
          { key: "s4", name: "半独立", body: "完成 3 道理解题。" },
          { key: "s5", name: "解释", body: "用中文复述这段公告,不查词典。" },
          { key: "s6", name: "变体", body: "换一段修复建议(Remediation)段落,还能读懂吗?" },
          { key: "s7", name: "迁移", body: "以后读 PortSwigger/官方 advisory,按四要素做笔记。" },
        ],
        verify: [{ q: "读英文安全公告先抓什么?", a: 0, opts: ["受影响端点/参数 + 影响 + 漏洞分类", "作者名字", "发布日期", "排版样式"] }],
      };
      if (id === "f7_nmap") return {
        title: "Nmap 实操", theory: "端口开放=该端口有进程监听并接受连接;不意味着服务一定有漏洞。",
        steps: [
          { key: "s1", name: "极短理论", body: "nmap -sV 探测端口+服务版本。先有授权,再扫描——这是法律红线。" },
          { key: "s2", name: "可视化", body: "观察扫描输出: PORT / STATE / SERVICE / VERSION 四列。" },
          { key: "s3", name: "跟做", body: "运行 nmap -sV 192.168.1.100。" },
          { key: "s4", name: "半独立", body: "根据结果判断哪一项是高危配置,完成解读题。" },
          { key: "s5", name: "解释", body: "解释: 端口开放意味着什么、不意味着什么?" },
          { key: "s6", name: "变体", body: "加 -p 1-65535 全端口、加 -O 猜系统,输出会多什么?" },
          { key: "s7", name: "迁移", body: "真实环境里用 Nmap 做授权枚举,并对照服务版本查已知 CVE。" },
        ],
        verify: [{ q: "对目标执行 Nmap 前必须先确认?", a: 0, opts: ["已获得明确授权(在 Scope 内)", "目标在线", "自己网速够快", "安装了最新版 Nmap"] }],
      };
      if (id === "f0b_vm") return {
        title: "虚拟机与容器", theory: "虚拟机隔离的是整台计算机,容器隔离的是进程环境。",
        steps: [
          { key: "s1", name: "极短理论", body: "VM: 每台跑完整客户操作系统(Hypervisor 层)。容器: 共享宿主内核,只隔离文件系统/进程/网络命名空间。安全实验用 VM 更彻底。" },
          { key: "s2", name: "可视化", body: "观察 VM 与容器的分层结构对比图。" },
          { key: "s3", name: "跟做", body: "完成对比训练: 判断哪些场景用 VM、哪些用容器。" },
          { key: "s4", name: "半独立", body: "至少答对 4 题。" },
          { key: "s5", name: "解释", body: "解释: 为什么在自己电脑上直接跑靶场是危险的?" },
          { key: "s6", name: "变体", body: "Docker 容器逃逸和 VM 逃逸,哪个通常更难防? 为什么?" },
          { key: "s7", name: "迁移", body: "以后搭实验环境: VMware/VirtualBox 装攻击机 Kali,靶场按需选 VM 或容器。" },
        ],
        verify: [{ q: "安全实验环境最彻底的隔离方式?", a: 0, opts: ["虚拟机(完整客户操作系统)", "容器(共享内核)", "直接本机运行", "浏览器标签页"] }],
      };
      if (id === "f1b_protocols") return {
        title: "网络协议全景", theory: "把 OSI 七层变成工具箱: 每层回答一类问题,排障时逐层定位。",
        steps: [
          { key: "s1", name: "极短理论", body: "分层思维: 物理层通不通 → 链路层(MAC/ARP) → 网络层(IP/ICMP/路由) → 传输层(TCP/UDP 端口) → 应用层(DNS/HTTP)。" },
          { key: "s2", name: "可视化", body: "打开协议全景图,逐层阅读每层的关键协议与排障问题。" },
          { key: "s3", name: "跟做", body: "完成协议挑战: DHCP、NAT、ARP、UDP/ICMP、代理/VPN、IPv6、状态码,共 10+ 题。" },
          { key: "s4", name: "半独立", body: "正确率 70% 以上。" },
          { key: "s5", name: "解释", body: "解释: ping 用什么协议? 家里路由器做的 NAT 是什么? HTTP 403 和 401 区别?" },
          { key: "s6", name: "变体", body: "目标网站打不开,你按什么顺序检查每一层?" },
          { key: "s7", name: "迁移", body: "真实排障: ipconfig/ifconfig → ping 网关 → nslookup → curl -v,逐层验证。" },
        ],
        verify: [
          { q: "ARP 协议的作用?", a: 0, opts: ["把 IP 地址解析成 MAC 地址", "把域名解析成 IP", "自动分配 IP", "加密传输"] },
          { q: "HTTP 401 与 403 的区别?", a: 0, opts: ["401 未认证(未登录),403 已认证但无权限", "两者相同", "403 是服务器宕机", "401 是被封禁"] },
        ],
      };
      if (id === "f3b_ps") return {
        title: "PowerShell 与注册表", theory: "Windows 三大排障入口: 服务(Get-Service)、进程(Get-Process)、日志(Get-EventLog)。",
        steps: [
          { key: "s1", name: "极短理论", body: "PowerShell = 命令返回对象而非文本。注册表是 Windows 配置数据库: HKLM(机器级)/HKCU(用户级)。权限继承沿 NTFS ACL 树向下传播。" },
          { key: "s2", name: "可视化", body: "打开模拟 PowerShell,浏览可用命令。" },
          { key: "s3", name: "跟做", body: "按任务单排查: 找可疑服务 → 查可疑进程 → 读事件日志 → 定位注册表持久化项。" },
          { key: "s4", name: "半独立", body: "独立完成全部 4 个排查命令。" },
          { key: "s5", name: "解释", body: "解释: 攻击者为什么把后门写进注册表 Run 键? 权限继承出错如何导致提权?" },
          { key: "s6", name: "变体", body: "Get-Service 与 Linux systemctl 的对应关系? Get-EventLog 对应哪个?" },
          { key: "s7", name: "迁移", body: "真实 Windows: 用 PowerShell 审计自启动项(Get-ItemProperty HKLM:...\\Run)。" },
        ],
        verify: [{ q: "注册表 Run 键被写入可疑程序意味着?", a: 0, opts: ["开机自启动持久化后门", "系统已损坏", "正常软件更新", "网络配置变更"] }],
      };
      if (id === "f8_subnet") return {
        title: "CIDR 与子网划分", theory: "CIDR 用前缀长度表示网络位; /24=254 主机, /16=65534。",
        steps: [
          { key: "s1", name: "极短理论", body: "IPv4=32 位。/24 表示前 24 位是网络位,剩 8 位是主机位 → 2^8-2=254 台主机。" },
          { key: "s2", name: "可视化", body: "看题目中 IP/掩码的二进制结构。" },
          { key: "s3", name: "跟做", body: "完成 4 道计算题。" },
          { key: "s4", name: "半独立", body: "至少对 3 题。" },
          { key: "s5", name: "解释", body: "解释: 为什么主机数要减 2?" },
          { key: "s6", name: "变体", body: "/26 是多少台主机? 掩码是什么?" },
          { key: "s7", name: "迁移", body: "拿到目标 10.10.0.0/20,说出它的地址范围和网关常见位置。" },
        ],
        verify: [{ q: "192.168.1.0/24 可用主机数?", a: 0, opts: ["254", "256", "255", "128"] }],
      };
      if (id === "f9_capture") return {
        title: "Wireshark 流量判读", theory: "抓包是网络 L4 的落地能力: 从包序列还原 DNS→TCP→TLS→HTTP。",
        steps: [
          { key: "s1", name: "极短理论", body: "抓包三件事: 谁在和谁通信(IP:端口)、什么协议、什么顺序。" },
          { key: "s2", name: "可视化", body: "观察完整 HTTPS 抓包序列。" },
          { key: "s3", name: "跟做", body: "完成抓包判读 4 题 + TLS 握手排序。" },
          { key: "s4", name: "半独立", body: "不看笔记,独立说出每个包的作用。" },
          { key: "s5", name: "解释", body: "解释: 为什么 Wireshark 看不到 HTTPS 明文? 什么情况下能看到?" },
          { key: "s6", name: "变体", body: "如果抓包里出现重复 ACK 和大量重传,说明什么?" },
          { key: "s7", name: "迁移", body: "真实环境用 Wireshark/tcpdump 抓自己浏览器的流量并过滤 DNS/TCP 443。" },
        ],
        verify: [{ q: "HTTPS 抓包中 Wireshark 默认能看到?", a: 0, opts: ["加密的应用数据和 TLS 握手,看不到 HTTP 明文", "完整明文", "只能看到 DNS", "什么都看不到"] }],
      };
      if (id === "f10_perm") return {
        title: "Linux 权限与日志狩猎", theory: "SUID 提权 + 日志分析是攻防两端的共同地基。",
        steps: [
          { key: "s1", name: "极短理论", body: "rwx=421; SUID(4xxx)让执行者获得 owner 权限; 日志里找 500/敏感路径/异常长度。" },
          { key: "s2", name: "可视化", body: "观察权限训练题和攻击日志样本。" },
          { key: "s3", name: "跟做", body: "完成权限 4 题,再做日志多选研判。" },
          { key: "s4", name: "半独立", body: "权限对 3+ 且正确找出全部攻击 IP。" },
          { key: "s5", name: "解释", body: "解释: 为什么 find 带 SUID 且属主 root 是高危?" },
          { key: "s6", name: "变体", body: "日志里出现 bash -c 或 && id 的 URL 编码,如何快速识别?" },
          { key: "s7", name: "迁移", body: "在真实 Linux 上跑 find / -perm -4000 并审计每个 SUID 程序。" },
        ],
        verify: [{ q: "查找 SUID 文件的命令?", a: 0, opts: ["find / -perm -4000 2>/dev/null", "ls -la /tmp", "chmod 777 /", "ps aux | grep root"] }],
      };
      if (id === "s3_board") return {
        title: "SRC 项目大厅", theory: "赏金决策: Scope → 历史去重 → 新攻击面 → 证据完整 → 评级。",
        steps: [
          { key: "s1", name: "极短理论", body: "SRC 不是『挖到就给钱』。重复=0,低危=忽略,高危+新面+完整证据=赏金。" },
          { key: "s2", name: "可视化", body: "浏览三个项目的 Scope、赏金范围、历史漏洞。" },
          { key: "s3", name: "跟做", body: "进入项目,分析三个候选发现。" },
          { key: "s4", name:"半独立", body: "独立选出最该提交的发现并接受评级。" },
          { key: "s5", name:"解释", body:"解释: 为什么新上线功能是赏金猎人的首选?" },
          { key: "s6", name:"变体", body:"如果三个发现全部在历史报告里,正确行动是什么?" },
          { key: "s7", name:"迁移", body:"真实平台: 注册补天/漏洞盒子,先只做『读 Scope+查历史』练习一周再出手。" },
        ],
        verify: [{ q: "提交前必须独立完成的一步?", a: 0, opts: ["查历史已报漏洞,确认不重复", "先写奖金期望", "截图首页", "测试 DDoS"] }],
      };
      if (id === "s4_cvss") return {
        title: "CVSS 3.1 评分训练", theory: "评级不是拍脑袋: 攻击途径/复杂度/权限/交互/范围/影响(C-I-A) 八个维度决定分值。",
        steps: [
          { key: "s1", name: "极短理论", body: "CVSS 3.1 八指标: AV 攻击途径(N 网络/A 相邻/L 本地/P 物理)、AC 复杂度、PR 权限、UI 交互、S 范围(U/C)、C/I/A 机密性-完整性-可用性(各 H/L/N)。" },
          { key: "s2", name: "可视化", body: "打开评分器,观察每个指标选择如何实时改变分数与等级。" },
          { key: "s3", name: "跟做", body: "给场景 1(SQL 注入脱库)选向量并提交,对照参考解析。" },
          { key: "s4", name: "半独立", body: "独立完成场景 2(XSS)和场景 3(越权),误差 ≤0.5 才算通过。" },
          { key: "s5", name: "解释", body: "解释: 为什么反射型 XSS 通常只有中危(UI:R + C:L)? 哪些情况能到高危?" },
          { key: "s6", name: "变体", body: "存储型 XSS(无需点击,S:U,C:H) 该评多少? 和反射型差在哪两项?" },
          { key: "s7", name: "迁移", body: "以后每份报告都附 CVSS 向量串(AV:N/AC:L/...) — 审核员最先看的就是它。" },
        ],
        verify: [
          { q: "CVSS 中 PR:L 表示?", a: 0, opts: ["攻击者需要普通用户权限", "攻击者无需任何权限", "攻击者需要管理员权限", "目标系统打了补丁"] },
          { q: "反射型 XSS 相比 SQL 注入脱库,通常少了哪两项的权重?", a: 0, opts: ["UI(需诱导点击)和 C(只泄露部分信息)", "AV 和 AC", "PR 和 S", "I 和 A"] },
        ],
      };
      if (id === "f11_cve") return {
        title: "CVE 案例博物馆", theory: "历史重大漏洞是最好的教材: 每个都对应一类至今仍在复发的根因。",
        steps: [
          { key: "s1", name: "极短理论", body: "看 CVE 三要素: 根因(哪类信任假设被打破)、影响(危害有多大)、教训(防御该建在哪一层)。" },
          { key: "s2", name: "可视化", body: "点开右侧 6 个案例卡,逐个阅读根因/影响/教训。" },
          { key: "s3", name: "跟做", body: "完成 5 道根因归纳题(至少对 4 题)。" },
          { key: "s4", name: "半独立", body: "不看卡片,独立说出 Heartbleed 和 EternalBlue 的共同根因类别。" },
          { key: "s5", name: "解释", body: "解释: 为什么说『6 个案例里 5 个归根于对输入的信任假设出错』?" },
          { key: "s6", name: "变体", body: "Log4Shell 的 JNDI 外连,和你练过的 SSRF 有什么家族相似性?" },
          { key: "s7", name: "迁移", body: "以后每看到新 CVE,先自己归因(内存/注入/信任边界),再看官方分析对照。" },
        ],
        verify: [
          { q: "Log4Shell 属于哪类根因?", a: 0, opts: ["把输入当表达式解析(JNDI 注入)", "弱密码", "缓冲区溢出", "权限校验缺失"] },
          { q: "XZ Utils 后门给防御者的最大启示?", a: 0, opts: ["开源供应链的信任链本身可能被攻击", "SSH 该淘汰", "压缩算法不安全", "个人电脑不会被后门"] },
        ],
      };
      return null;
    };
    return C[id] || auto(id);
  };

  /* ---------- 变体题库(反背答案) ---------- */
  CF.variants = {
    "w3_ac": [
      { title: "IDOR 变体 · URL 参数", setup: "用户 Alice 登录后访问 /api/profile?user_id=101 能看到自己的资料。", task: "尝试访问其他 user_id,找到属于 Bob 的资料。", param: "user_id", flag: "user_id=102", hint: "URL 中的数字标识符可能是连续的。" },
      { title: "IDOR 变体 · JSON Body", setup: "POST /api/profile 请求 Body 为 {\"user_id\":101}。", task: "修改 Body 中的 user_id 访问他人资料。", param: "user_id", flag: "{\"user_id\":102}", hint: "参数位置变了,但原理没变。" },
      { title: "IDOR 变体 · 路径参数", setup: "GET /api/users/101/orders 返回 Alice 的订单。", task: "修改路径中的用户 ID。", param: "user_id", flag: "/api/users/102/orders", hint: "路径中的数字也可能是对象标识符。" },
    ],
    "w4_sqli": [
      { title: "SQLi 变体 · 数字型", setup: "GET /api/item?id=1 正常返回商品。", task: "证明可以通过 id 参数注入 SQL。", param: "id", flag: "1 OR 1=1", hint: "尝试让查询返回全部记录。" },
      { title: "SQLi 变体 · 单引号闭合", setup: "GET /api/search?name=test 正常返回搜索结果。", task: "通过 name 参数注入 SQL。", param: "name", flag: "test' OR '1'='1", hint: "需要闭合字符串的单引号。" },
      { title: "SQLi 变体 · 报错注入", setup: "搜索功能在 SQL 语法错误时会返回数据库错误信息。", task: "利用报错信息判断数据库类型。", param: "name", flag: "test' AND 1=CONVERT(int,@@version)--", hint: "故意制造类型转换错误来获取信息。" },
    ],
    "w5_xss": [
      { title: "XSS 变体 · 反射型", setup: "搜索框输入内容会原样显示在结果页。", task: "让页面执行 alert(1)。", param: "q", flag: "<script>alert(1)</script>", hint: "输入的内容被直接输出到 HTML。" },
      { title: "XSS 变体 · DOM 型", setup: "URL hash 中的内容被 JavaScript 直接写入页面,不经过服务器。", task: "通过 URL hash 触发 XSS。", param: "hash", flag: "#<img src=x onerror=alert(1)>", hint: "关注前端 JavaScript 如何处理 URL 参数。" },
      { title: "XSS 变体 · WAF 拦截 script 标签", setup: "WAF 拦截所有包含 <script 的请求。页面仍原样输出其他内容。", task: "不使用 <script> 标签,仍然注入可执行脚本。", param: "q", flag: "<img src=x onerror=alert(1)>", hint: "HTML 事件属性(onerror/onload)不依赖 script 标签。" },
      { title: "XSS 变体 · 大小写绕过精确匹配", setup: "WAF 精确匹配小写 <img src=x onerror=alert(1)>,大小写敏感。", task: "改变大小写绕过精确匹配。", param: "q", flag: "<ImG SrC=x OnErRoR=alert(1)>", hint: "HTML 标签和属性名不区分大小写,WAF 的精确匹配区分。" },
    ],
  };

})();
