import base64, json, os, socket, struct, subprocess, time, urllib.request

PORT = 9224
URL = "http://localhost:8765/index.html"
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if not os.path.exists(EDGE):
    EDGE = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
prof = os.path.join(os.environ["TEMP"], "cf_audit_profile")
proc = subprocess.Popen([EDGE, "--headless=new", "--disable-gpu", "--no-first-run",
                         f"--remote-debugging-port={PORT}", f"--user-data-dir={prof}", URL],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)

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
        if n < 126: h.append(0x80 | n)
        elif n < 65536: h.append(0x80 | 126); h += struct.pack(">H", n)
        else: h.append(0x80 | 127); h += struct.pack(">Q", n)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(data))
        self.s.sendall(bytes(h) + mask + masked)
    def _recv_frame(self):
        def rd(n):
            d = b""
            while len(d) < n: d += self.s.recv(n - len(d))
            return d
        b1, b2 = rd(2)
        n = b2 & 0x7F
        if n == 126: n = struct.unpack(">H", rd(2))[0]
        elif n == 127: n = struct.unpack(">Q", rd(8))[0]
        payload = rd(n) if n else b""
        return b1 & 0x0F, payload
    def eval(self, expr):
        self.next_id += 1
        mid = self.next_id
        msg = {"id": mid, "method": "Runtime.evaluate",
               "params": {"expression": expr, "returnByValue": True}}
        self._send_frame(json.dumps(msg))
        while True:
            opcode, data = self._recv_frame()
            if opcode == 8: raise RuntimeError("ws closed")
            if not data: continue
            m = json.loads(data)
            if m.get("id") == mid:
                if "exceptionDetails" in m.get("result", {}):
                    return {"__error__": m["result"]["exceptionDetails"].get("text", "err")}
                return m.get("result", {}).get("result", {}).get("value")

c = CDP(cdp_ws())
time.sleep(1)
c.eval("""localStorage.setItem('cyber_frontier_v5_save', JSON.stringify({ver:5,created:Date.now(),
  player:{name:'T',rank:'见习研究员',xp:0},diagDone:true,diag:{},path:[],progress:{},
  notes:[],reports:[],stats:{labsDone:0,variantsPassed:0,blindPassed:0,wrongLog:[]},
  daily:{date:'',tasks:[]}})); CF.store.load(); CF.go('home'); 'ok'""")

audit = c.eval("""(()=>{
  const dispatchers = ['f0_cpu','f0b_vm','f1_net','f1b_protocols','f2_linux','f3_win','f3b_ps','f11_cve',
    'f4_py','f5_git','f6_eng','f7_nmap','f8_subnet','f9_capture','f10_perm','f_boss','w0_http','w1_burp',
    'w2_auth','w_boss','r0_recon','r3_fp','s1_report','s2_review','s_boss','s3_board','s4_cvss'];
  const showMapIds = ["f0_cpu","f1_net","f2_linux","f3_win","f4_py","f5_git","f_boss","w0_http","w1_burp",
    "w2_auth","w3_ac","w4_sqli","w5_xss","w6_csrf","w7_upload","w8_ssrf","w9_cmdi","w10_api","w11_logic",
    "w12_traversal","w13_xxe","w14_ssti","w15_nosqli","w16_deser","w17_oauth","w18_race","w19_proto",
    "w20_graphql","w21_misconfig","w22_sensitive","w23_session","w24_llm","w25_sms","f6_eng","f7_nmap",
    "f8_subnet","f9_capture","f10_perm","f0b_vm","f1b_protocols","f3b_ps","f11_cve","s3_board","s4_cvss",
    "w_boss","r0_recon","r3_fp","s0_scope","s1_report","s2_review","s_boss"];
  const vulnLabIds = Object.keys(CF.vulnLabs||{});
  return CF.nodes.map(n=>{
    const content = !!CF.nodeContent(n.id);
    const interactive = dispatchers.includes(n.id) || showMapIds.includes(n.id) || vulnLabIds.includes(n.id);
    // r0_recon 双tab, s0_scope 有无渲染器需单独判
    return {id:n.id, name:n.name, dom:n.domain, content, interactive, boss:!!n.boss};
  });
})()""")

print(f"{'节点':<16}{'域':<12}{'内容':<6}{'交互':<6}")
no_content, no_interactive = [], []
for n in audit:
    if not n["content"]:
        no_content.append(n)
    elif not n["interactive"]:
        no_interactive.append(n)
print("\n== 无内容(quickDone 作弊路径) ==")
for n in no_content: print(" ", n["id"], n["name"])
print("\n== 有内容但无交互实验室 ==")
for n in no_interactive: print(" ", n["id"], n["name"], f"({n['dom']})")

# s0_scope 渲染检查
c.eval("CF.prog.node('w_boss').done=true; CF.go('node?s0_scope'); CF.viewStep('s0_scope',2); 'ok'")
time.sleep(0.8)
scope_zone = c.eval("!!document.getElementById('interactive-zone') && document.getElementById('interactive-zone').children.length > 0")
print("\ns0_scope 交互区渲染:", scope_zone)

# r1_model / r2_verify 渲染检查
for nid in ["r1_model", "r2_verify"]:
    c.eval(f"CF.prog.node('{nid}').done=true; CF.go('node?{nid}'); CF.viewStep('{nid}',2); 'ok'")
    time.sleep(0.6)
    z = c.eval("!!document.getElementById('interactive-zone') && document.getElementById('interactive-zone').children.length > 0")
    print(f"{nid} 交互区渲染:", z)

# 通关死锁扫描: 模拟全节点七步+验证, 哪些节点无法 done
dead = c.eval("""(()=>{
  const out=[];
  CF.nodes.forEach(n=>{
    if(['f_boss','w_boss','s_boss'].includes(n.id)) return; // BOSS 特判
    const p=CF.prog.node(n.id);
    ['s1','s2','s3','s4','s5','s6','s7'].forEach(k=>p.steps[k]=true);
    const content=CF.nodeContent(n.id);
    if(content&&content.verify){ p.verify=content.verify.map(()=>true); p.verifyAll=true; }
    ['e1','e2','e3','e4'].forEach(k=>{ if(!p.evidence[k]) p.evidence[k]=true; });
    if(!p.done) out.push(n.id);
  });
  return out;
})()""")
print("\n== 七步+验证+四维证据后仍未 done(死锁) ==", dead)

c.s.close()
proc.terminate()
