# CYBER FRONTIER V5 端到端自动验证 (CDP over WebSocket, 标准库实现)
import base64, hashlib, json, os, random, socket, struct, subprocess, sys, time, urllib.request

PORT = 9222
URL = "http://localhost:8765/index.html"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE):
    EDGE = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"

prof = os.path.join(os.environ["TEMP"], "cf_test_profile")
import shutil
shutil.rmtree(prof, ignore_errors=True)  # 清缓存,避免旧 JS 被缓存
proc = subprocess.Popen([EDGE, "--headless=new", "--disable-gpu", "--no-first-run",
                         f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}", URL],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def cdp_ws():
    for _ in range(40):
        try:
            tabs = json.load(urllib.request.urlopen(f"http://localhost:{PORT}/json"))
            page = [t for t in tabs if t.get("type") == "page"][0]
            return page["webSocketDebuggerUrl"]
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("CDP not ready")

class CDP:
    def __init__(self, ws_url):
        host, port, path = self._parse(ws_url)
        self.s = socket.create_connection((host, port), timeout=10)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (f"GET {path} HTTP/1.1\r\nHost: {host}:{port}\r\nUpgrade: websocket\r\n"
               f"Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n")
        self.s.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.next_id = 0

    @staticmethod
    def _parse(u):
        rest = u.split("://", 1)[1]
        hp, path = rest.split("/", 1)
        host, port = hp.split(":")
        return host, int(port), "/" + path

    def _send_frame(self, payload):
        data = payload.encode()
        mask = os.urandom(4)
        h = bytearray([0x81])
        n = len(data)
        if n < 126:
            h.append(0x80 | n)
        elif n < 65536:
            h.append(0x80 | 126); h += struct.pack(">H", n)
        else:
            h.append(0x80 | 127); h += struct.pack(">Q", n)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        self.s.sendall(bytes(h) + mask + masked)

    def _recv_frame(self):
        def rd(n):
            d = b""
            while len(d) < n:
                d += self.s.recv(n - len(d))
            return d
        b1, b2 = rd(2)
        n = b2 & 0x7F
        if n == 126: n = struct.unpack(">H", rd(2))[0]
        elif n == 127: n = struct.unpack(">Q", rd(8))[0]
        payload = rd(n) if n else b""
        return b1 & 0x0F, payload

    def eval(self, expr, await_promise=False):
        self.next_id += 1
        mid = self.next_id
        msg = {"id": mid, "method": "Runtime.evaluate",
               "params": {"expression": expr, "returnByValue": True,
                          "awaitPromise": await_promise}}
        self._send_frame(json.dumps(msg))
        while True:
            opcode, data = self._recv_frame()
            if opcode == 8:
                raise RuntimeError("ws closed")
            if not data:
                continue
            m = json.loads(data)
            if m.get("id") == mid:
                r = m.get("result", {}).get("result", {})
                if "exceptionDetails" in m.get("result", {}):
                    return {"__error__": m["result"]["exceptionDetails"].get("text", "error")}
                return r.get("value")

    def close(self):
        try: self.s.close()
        except Exception: pass

time.sleep(3)
c = CDP(cdp_ws())
time.sleep(1)

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS" if cond else "FAIL"), name, detail)

# ---------- 重置存档 ----------
c.eval("""localStorage.setItem('cyber_frontier_v5_save', JSON.stringify({ver:5,created:Date.now(),
  player:{name:'T',rank:'见习研究员',xp:0},diagDone:true,diag:{},path:[],progress:{},
  notes:[],reports:[],stats:{labsDone:0,variantsPassed:0,blindPassed:0,wrongLog:[]},
  daily:{date:'',tasks:[]}})); CF.store.load(); CF.go('home'); 'ok'""")
time.sleep(0.5)

# ---------- 测试 A: s3 实验门槛拦截 ----------
c.eval("CF.go('node?f0_cpu')")
time.sleep(0.8)
c.eval("CF.prog.markStep('f0_cpu','s1'); CF.prog.markStep('f0_cpu','s2'); CF.viewStep('f0_cpu',2); 'ok'")
time.sleep(0.5)
n_stages = c.eval("document.querySelectorAll('.trace-stage').length")
check("A0 STEP3 渲染出交互(9阶段)", n_stages == 9, f"stages={n_stages}")
c.eval("CF.completeStep('f0_cpu','s3'); 'ok'")
s3 = c.eval("!!CF.prog.node('f0_cpu').steps.s3")
check("A1 s3 未做实验被拦截", s3 is False, f"s3={s3}")

# ---------- 测试 B: 点完 9 阶段后放行 ----------
c.eval("document.querySelectorAll('.trace-stage').forEach(el=>el.click()); 'ok'")
e2 = c.eval("CF.prog.node('f0_cpu').evidence.e2 === true")
check("B1 实验后授予 e2", e2 is True)
c.eval("CF.completeStep('f0_cpu','s3'); 'ok'")
s3b = c.eval("CF.prog.node('f0_cpu').steps.s3 === true")
check("B2 s3 实验后可完成", s3b is True)

# ---------- 走完 s4-s7 并渲染验证区 ----------
for k in ["s4", "s5", "s6", "s7"]:
    c.eval(f"CF.prog.markStep('f0_cpu','{k}'); 'ok'")
c.eval("CF.viewStep('f0_cpu',6); 'ok'")
time.sleep(0.4)
verify_visible = c.eval("document.body.innerText.includes('节点验证')")
check("B3 七步完出现节点验证", verify_visible is True)

# ---------- 测试 C: 验证题 gate ----------
answers = c.eval("CF.nodeContent('f0_cpu').verify.map(v=>v.a)")
for i, a in enumerate(answers):
    c.eval(f"CF.checkVerify('f0_cpu',{i},99); 'ok'")  # 故意错
wrong_blocked = c.eval(f"CF.prog.node('f0_cpu').verify[{0}] !== true")
check("C1 错误选项不计入", wrong_blocked is True)
for i, a in enumerate(answers):
    c.eval(f"CF.checkVerify('f0_cpu',{i},{a}); 'ok'")
vall = c.eval("CF.prog.node('f0_cpu').verifyAll === true")
check("C2 全部答对 verifyAll", vall is True)

# ---------- 测试 D: finishNode 完成节点 ----------
c.eval("CF.finishNode('f0_cpu'); 'ok'")
time.sleep(0.5)
done = c.eval("CF.prog.isDone('f0_cpu')")
check("D1 节点可正常完成(无死锁)", done is True)

# 证据标签只读: 新节点 w4_sqli, 直接点标签不应变化
c.eval("CF.go('node?w4_sqli')")
time.sleep(0.8)
c.eval("""const el=[...document.querySelectorAll('[title]')].find(e=>e.textContent.includes('能解释'));
  if(el) el.click(); 'ok'""")
ev_changed = c.eval("!!(CF.prog.node('w4_sqli').evidence || {}).e1")
check("D2 证据标签点击无效(防作弊)", ev_changed is False)

# ---------- 测试 F: BOSS 前置锁(未完成前不可达) ----------
boss_locked = c.eval("CF.unlocked('w_boss') === false")
check("F1 WEB BOSS 新存档下锁定", boss_locked is True)
boss_reqs = c.eval("CF.nodes.find(n=>n.id==='w_boss').reqs.length")
check("F2 WEB BOSS 前置覆盖全部知识类别", boss_reqs >= 15, f"reqs={boss_reqs}")

# ---------- 测试 E: 漏洞实验核心链路(注入前置解锁) ----------
c.eval("""CF.nodes.forEach(n=>{
  if(!['w_boss','f_boss','s_boss'].includes(n.id)) CF.prog.node(n.id).done=true;
}); CF.go('node?w4_sqli'); CF.viewStep('w4_sqli',2); 'ok'""")
time.sleep(0.8)
has_builder = c.eval("document.querySelectorAll('#vb-login').length")
check("E0 漏洞实验 builder 已渲染", has_builder == 1, f"login btns={has_builder}")
# 一键登录
c.eval("document.querySelector('#vb-login').click(); 'ok'")
cookie_set = c.eval("document.querySelector('#vb-headers').value.includes('Cookie: session=')")
check("E1 一键登录注入 Cookie", cookie_set is True)
# SQLi payload
c.eval("""document.querySelector('#vb-path').value='/api/search?q=phone\\' OR \\'1\\'=\\'1';
  document.querySelector('#vb-send').click(); 'ok'""")
time.sleep(0.5)
sqli_e2 = c.eval("CF.prog.node('w4_sqli').evidence.e2 === true")
resp_txt = c.eval("document.querySelector('#vb-resp').innerText.slice(0,200)")
check("E2 SQLi 实验成功授予 e2", sqli_e2 is True, str(resp_txt)[:80])

# ---------- 测试 G: 雷达图与 gate 数据可用 ----------
radar = c.eval("JSON.stringify(CF.computeRadar().vals)")
check("G1 雷达数据可计算", radar is not None and len(json.loads(radar)) == 5, radar)
vp = c.eval("JSON.stringify({have:CF.renderVulnProgress().have,total:CF.renderVulnProgress().total})")
check("G2 硬指标计数器可用", json.loads(vp)["total"] == 50, vp)  # 漏洞练习硬指标: SQLi10+XSS10+越权10+SSRF5+认证5+上传5+逻辑5

# ---------- 测试 H: BOSS 不能只靠点步骤通关 ----------
c.eval("""['s1','s2','s3','s4','s5','s6','s7'].forEach(k=>CF.prog.markStep('w_boss',k));
  CF.prog.node('w_boss').verifyAll=true; 'ok'""")
c.eval("CF.finishNode('w_boss'); 'ok'")
boss_no_pass = c.eval("CF.prog.isDone('w_boss') === false")
check("H1 WEB BOSS 未找到漏洞前无法完成", boss_no_pass is True)

# ---------- 测试 I: 新节点(大纲补齐)渲染与授予 ----------
new_nodes = c.eval("JSON.stringify(['f0b_vm','f1b_protocols','f3b_ps'].map(id=>!!CF.nodeContent(id)))")
check("I1 三个新节点课程就绪", new_nodes.count("true") == 3, new_nodes)
boss_f_reqs = c.eval("CF.nodes.find(n=>n.id==='f_boss').reqs.includes('f3b_ps')")
check("I2 FOUNDATION BOSS 含 PowerShell 前置", boss_f_reqs is True)

# 通用: 循环点当前题第一个选项(正确答案位置固定 0),点"下一题"直到出结果
def run_quiz(sel):
    for _ in range(15):
        done = c.eval(f"document.querySelector('{sel} .diag-explain') !== null && document.querySelector('{sel} .diag-explain').textContent.length > 20 && !document.querySelector('#vm-next') && !document.querySelector('#pr-next') ? 1 : 0")
        opt = c.eval(f"document.querySelector('{sel} .diag-opt') ? 1 : 0")
        if not opt:
            break
        c.eval(f"document.querySelector('{sel} .diag-opt').click(); 'ok'")
        time.sleep(0.05)
        c.eval("(document.querySelector('#vm-next')||document.querySelector('#pr-next')||{}).click ? (document.querySelector('#vm-next')||document.querySelector('#pr-next')).click() : 0; 'ok'")
        time.sleep(0.05)

# f0b_vm: 虚拟机容器 5 题
c.eval("CF.nodes.forEach(n=>{ if(!['f_boss','w_boss','s_boss'].includes(n.id)) CF.prog.node(n.id).done=true; }); CF.go('node?f0b_vm'); CF.viewStep('f0b_vm',2); 'ok'")
time.sleep(0.8)
vm_opts = c.eval("document.querySelectorAll('#vm-q .diag-opt').length")
check("I3 虚拟机实验题渲染", vm_opts == 4, f"opts={vm_opts}")
run_quiz("#vm-q")
time.sleep(0.3)
vm_e2 = c.eval("CF.prog.node('f0b_vm').evidence.e2 === true")
check("I4 虚拟机实验通过授予 e2", vm_e2 is True)

# f1b_protocols: 协议 11 题
c.eval("CF.go('node?f1b_protocols'); CF.viewStep('f1b_protocols',2); 'ok'")
time.sleep(0.8)
run_quiz("#pr-q")
time.sleep(0.3)
pr_e2 = c.eval("CF.prog.node('f1b_protocols').evidence.e2 === true")
check("I5 协议全景通过授予 e2", pr_e2 is True)

# f3b_ps: PowerShell 四步排查
c.eval("CF.go('node?f3b_ps'); CF.viewStep('f3b_ps',2); 'ok'")
time.sleep(0.8)
for cmd in ["Get-Service", "Get-Process | Sort CPU -Desc", "Get-EventLog Security -Newest 5", "Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"]:
    c.eval(f"document.querySelector('#ps-input').value='{cmd}'; document.querySelector('#ps-run').click(); 'ok'")
    time.sleep(0.15)
ps_done = c.eval("CF.prog.node('f3b_ps').evidence.e2 === true && CF.prog.node('f3b_ps').evidence.e4 === true")
check("I6 PowerShell 排查四步完成", ps_done is True)

# 五问训练卡: SQLi 实验成功后填五问
c.eval("CF.go('node?w4_sqli'); CF.viewStep('w4_sqli',2); 'ok'")
time.sleep(0.8)
c.eval("document.querySelector('#vb-login').click(); 'ok'")
c.eval("""document.querySelector('#vb-path').value='/api/search?q=phone\\' OR \\'1\\'=\\'1';
  document.querySelector('#vb-send').click(); 'ok'""")
time.sleep(0.5)
has_fq = c.eval("document.querySelectorAll('#fq-submit').length")
check("J1 实验成功出现五问卡", has_fq == 1)
c.eval("""(()=>{ const ans='输入被拼接进SQL改变查询语义导致全表数据泄露';
  ['why','trust','flow','poc','fix'].forEach(k=>{ document.querySelector('#fq-'+k).value=ans; });
  document.querySelector('#fq-submit').click(); return 'ok';})()""")
time.sleep(0.3)
fq_e1 = c.eval("CF.prog.node('w4_sqli').evidence.e1 === true")
fq_note = c.eval("CF.store.data.notes.some(n=>n.title && n.title.includes('五问'))")
check("J2 五问答完授予 e1", fq_e1 is True)
check("J3 五问存入研究笔记", fq_note is True)

# Python 5 任务: 每个任务点运行,等待切换
c.eval("CF.go('node?f4_py'); CF.viewStep('f4_py',2); 'ok'")
time.sleep(0.8)
for i in range(5):
    c.eval("document.querySelector('#py-run').click(); 'ok'")
    time.sleep(1.8)
py_e2 = c.eval("CF.prog.node('f4_py').evidence.e2 === true")
check("K1 Python 五任务链路通", py_e2 is True)

c.eval("CF.go('node?f5_git'); CF.viewStep('f5_git',2); 'ok'")
time.sleep(0.8)
for gcmd in ["git init", "git add .", "git commit -m note", "git branch research/sqli-lab", "git checkout research/sqli-lab", "git merge research/sqli-lab", "git log"]:
    c.eval(f"document.querySelector('#git-input').value='{gcmd}'; document.querySelector('#git-run').click(); 'ok'")
    time.sleep(0.1)
git_e2 = c.eval("CF.prog.node('f5_git').evidence.e2 === true && CF.prog.node('f5_git').evidence.e3 === true")
check("K2 Git 分支全流程通过", git_e2 is True)

# ---------- 测试 L: 全面升级新内容(评估框架补缺) ----------
l1 = c.eval("JSON.stringify(['f0b_vm','f1b_protocols','f3b_ps','f11_cve','w25_sms','s4_cvss'].map(id=>!!CF.nodeContent(id)))")
check("L1 六个扩展节点课程就绪", l1.count("true") == 6, l1)
l2 = c.eval("CF.variants['w5_xss'].length")
check("L2 XSS 变体含 WAF 绕过(4个)", l2 == 4, f"variants={l2}")

# f11_cve: CVE 博物馆 — 全部节点已在前置标记 done(避免解锁问题),进入答题
c.eval("CF.go('node?f11_cve'); CF.viewStep('f11_cve',2); 'ok'")
time.sleep(0.8)
cve_opts = c.eval("document.querySelectorAll('.task-item[data-case]').length")
check("L3 CVE 博物馆 6 案例渲染", cve_opts == 6, f"cases={cve_opts}")
c.eval("document.querySelectorAll('.task-item[data-case]')[0].click(); 'ok'")
c.eval("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('归纳答题')).click(); 'ok'")
time.sleep(0.3)
# 通用答题: 正确答案都在第 1 个选项
def run_cve_quiz():
    for _ in range(10):
        opt = c.eval("document.querySelector('#cve-q .diag-opt') ? 1 : 0")
        if not opt:
            break
        c.eval("document.querySelector('#cve-q .diag-opt').click(); 'ok'")
        time.sleep(0.05)
        c.eval("document.querySelector('#cve-next') ? document.querySelector('#cve-next').click() : 0; 'ok'")
        time.sleep(0.05)
run_cve_quiz()
time.sleep(0.3)
cve_ev = c.eval("CF.prog.node('f11_cve').evidence.e2 === true && CF.prog.node('f11_cve').evidence.e4 === true")
check("L4 CVE 归纳答题授予 e2+e4", cve_ev is True)

# s4_cvss: CVSS 三场景 — 点选参考向量后提交
c.eval("CF.go('node?s4_cvss'); CF.viewStep('s4_cvss',2); 'ok'")
time.sleep(0.8)
# 场景1: 点 C:H I:H A:H; 场景2: UI:R S:C C:L I:L; 场景3: PR:L C:H
for clicks in [["C|H","I|H","A|H"], ["UI|R","S|C","C|L","I|L"], ["PR|L","C|H"]]:
    for kv in clicks:
        k, v = kv.split("|")
        c.eval(f"document.querySelector('[data-k=\"{k}\"][data-v=\"{v}\"]').click(); 'ok'")
        time.sleep(0.03)
    c.eval("document.querySelector('#cv-submit').click(); 'ok'")
    time.sleep(0.2)
    c.eval("document.querySelector('#cv-next') ? document.querySelector('#cv-next').click() : 0; 'ok'")
    time.sleep(0.2)
cvss_ev = c.eval("CF.prog.node('s4_cvss').evidence.e2 === true && CF.prog.node('s4_cvss').evidence.e4 === true")
check("L5 CVSS 三场景通过授予 e2+e4", cvss_ev is True)

# w25_sms: 短信轰炸 — 预置请求连发 8 次
c.eval("CF.go('node?w25_sms'); CF.viewStep('w25_sms',2); 'ok'")
time.sleep(0.8)
for _ in range(8):
    c.eval("document.querySelector('#vb-send').click(); 'ok'")
    time.sleep(0.12)
sms_e2 = c.eval("CF.prog.node('w25_sms').evidence.e2 === true")
check("L6 短信轰炸连发 8 次出 FLAG 授予 e2", sms_e2 is True)
# 验证码复用: 先确认已有 code_hint,再连发 3 次校验
c.eval("""(()=>{ document.querySelector('#vb-path').value='/api/sms/verify';
  document.querySelector('#vb-body').value='{"phone":"13800138000","code":"886722"}';
  document.querySelector('#vb-method') ? document.querySelector('#vb-method').value='POST' : 0; return 'ok';})()""")
time.sleep(0.2)
for _ in range(3):
    c.eval("document.querySelector('#vb-send').click(); 'ok'")
    time.sleep(0.12)
sms_replay = c.eval("document.querySelector('#vb-resp').textContent.includes('c4ptch4_r3us3')")
check("L7 验证码重放 3 次出 FLAG", sms_replay is True)

# r0_recon: 侦察工具 tab(懒加载,需先点第二个 tab; 前置 w_boss 需临时解锁)
c.eval("CF.prog.node('w_boss').done = true; CF.go('node?r0_recon'); CF.viewStep('r0_recon',2); 'ok'")
time.sleep(0.8)
recon_tab_btn = c.eval("[...document.querySelectorAll('button')].some(b=>b.textContent.includes('侦察工具'))")
c.eval("[...document.querySelectorAll('button')].find(b=>b.textContent.includes('侦察工具')).click(); 'ok'")
time.sleep(0.3)
recon_tools = c.eval("document.body.textContent.includes('目录爆破') && document.body.textContent.includes('子域名枚举')")
check("L8 侦察工具(子域名+目录爆破)渲染", recon_tab_btn is True and recon_tools is True)

# ---------- 测试 M: 三个新实验室(Scope/假设/最小化验证) ----------
m1 = c.eval("JSON.stringify([typeof CF.renderScopeReader, typeof CF.renderHypothesisLab, typeof CF.renderVerifyLab])")
check("M1 三个渲染器就绪", m1 == '["function","function","function"]', m1)

# s0_scope: 解锁链 r2_verify 前置,直接标记链上节点 done 后进入
c.eval("['w_boss','r0_recon','r1_model','r2_verify'].forEach(id=>CF.prog.node(id).done=true); CF.go('node?s0_scope'); CF.viewStep('s0_scope',2); 'ok'")
time.sleep(0.8)
scope_doc = c.eval("document.body.textContent.includes('云购商城 SRC 测试规则')")
check("M2 Scope 文档渲染", scope_doc is True)
for _ in range(5):
    c.eval("(document.querySelector('#scope-q .diag-opt')||{}).click ? document.querySelector('#scope-q .diag-opt').click() : 0; 'ok'")
    time.sleep(0.05)
    c.eval("document.querySelector('#scope-next') ? document.querySelector('#scope-next').click() : 0; 'ok'")
    time.sleep(0.05)
time.sleep(0.3)
scope_ev = c.eval("CF.prog.node('s0_scope').evidence.e2 === true && CF.prog.node('s0_scope').evidence.e4 === true")
check("M3 Scope 五题通过授予 e2+e4", scope_ev is True)

# r1_model: 假设实验室(data-k 稳定: g0/g1/g2 = 好假设,不受乱序影响)
c.eval("CF.go('node?r1_model'); CF.viewStep('r1_model',2); 'ok'")
time.sleep(0.8)
for rnd in range(2):
    for k in ["g0", "g1", "g2"]:
        c.eval(f"document.querySelector('[data-k=\"{k}\"]').click(); 'ok'")
        time.sleep(0.03)
    c.eval("document.querySelector('#hyp-check').click(); 'ok'")
    time.sleep(0.2)
    c.eval("(document.querySelector('#hyp-next')||{}).click ? document.querySelector('#hyp-next').click() : 0; 'ok'")
    time.sleep(0.2)
time.sleep(0.3)
hyp_ev = c.eval("CF.prog.node('r1_model').evidence.e2 === true && CF.prog.node('r1_model').evidence.e4 === true")
check("M4 假设实验室两关通过授予 e2+e4", hyp_ev is True)

# r2_verify: 最小化验证(正确答案固定在第一个选项)
c.eval("CF.go('node?r2_verify'); CF.viewStep('r2_verify',2); 'ok'")
time.sleep(0.8)
for _ in range(3):
    c.eval("(document.querySelector('[data-vi=\"0\"]')||{}).click ? document.querySelector('[data-vi=\"0\"]').click() : 0; 'ok'")
    time.sleep(0.05)
    c.eval("document.querySelector('#ver-next') ? document.querySelector('#ver-next').click() : 0; 'ok'")
    time.sleep(0.05)
time.sleep(0.3)
ver_ev = c.eval("CF.prog.node('r2_verify').evidence.e2 === true && CF.prog.node('r2_verify').evidence.e4 === true")
check("M5 最小化验证三场景通过授予 e2+e4", ver_ev is True)

# M6: r1_model 现在也有 s3 硬门槛(先重置 evidence 再验证拦截)
m6 = c.eval("""(()=>{ const p=CF.prog.node('r1_model'); const saved=JSON.parse(JSON.stringify(p.evidence));
  p.evidence={}; CF.store.save();
  const blocked = (function(){ const before=p.steps.s3; CF.completeStep('r1_model','s3'); return !(CF.prog.node('r1_model').steps.s3||false); })();
  p.evidence=saved; CF.store.save(); return blocked; })()""")
check("M6 r1_model s3 未做实验被拦截", m6 is True)

# 全节点交互覆盖审计(除 BOSS 外全部有渲染路径)
m7 = c.eval("""(()=>{
  const dispatch = new Set(['f0_cpu','f0b_vm','f1_net','f1b_protocols','f2_linux','f3_win','f3b_ps','f11_cve',
    'f4_py','f5_git','f6_eng','f7_nmap','f8_subnet','f9_capture','f10_perm','f_boss','w0_http','w1_burp',
    'w2_auth','w_boss','r0_recon','r1_model','r2_verify','r3_fp','s0_scope','s1_report','s2_review','s_boss','s3_board','s4_cvss']);
  const noLab = CF.nodes.filter(n=>!n.boss && !dispatch.has(n.id) && !(CF.vulnLabs||{})[n.id]).map(n=>n.id);
  return JSON.stringify(noLab);
})()""")
check("M7 全部非BOSS节点均有交互实验室", m7 == "[]", m7)

c.close()
proc.terminate()
fails = [r for r in results if not r[1]]
print(f"\n==== {len(results)-len(fails)}/{len(results)} passed ====")
sys.exit(1 if fails else 0)
