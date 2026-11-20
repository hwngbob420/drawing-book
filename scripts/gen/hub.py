"""Gọi BobDad Hub (MCP over HTTP) để Muse vẽ hình 'g:' cho dự án. Khoá API đọc từ biến môi trường HUBKEY, không lưu vào file.

  HUBKEY=ahk_... python scripts/gen/hub.py submit h1        # gửi lô ảnh (4 hình/lô), in request_id
  HUBKEY=ahk_... python scripts/gen/hub.py fetch  h1        # tải ảnh của lô đã xong, xử lý ra public/gen/
"""
import json, os, re, sys, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = "https://bobdad.afetech.pro/mcp"
KEY = os.environ["HUBKEY"]
OUT = os.path.join(ROOT, "out", "hub")

def rpc(method, params):
    req = urllib.request.Request(URL, json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        {"Authorization": "Key " + KEY, "Content-Type": "application/json", "Accept": "application/json, text/event-stream", "User-Agent": "curl/8.5.0"})
    return json.load(urllib.request.urlopen(req, timeout=120))["result"]

def call(tool, args):
    r = rpc("tools/call", {"name": tool, "arguments": args})
    txt = next((c["text"] for c in r["content"] if c["type"] == "text"), "")
    try: return json.loads(txt)
    except Exception: return {"raw": txt}

def spec():
    return json.load(open(os.path.join(ROOT, "scripts/gen/subjects.json"), encoding="utf8"))

def batch(bid):
    s = spec()
    b = next(b for b in s["batches"] if b["id"] == bid)
    names = list(b["items"])
    lines = "\n".join(f'{i+1}. file name "{n}": {d}' for i, (n, d) in enumerate(b["items"].items()))
    prompt = (s["preamble"] + f"\n\nCreate exactly {len(names)} SEPARATE images (one subject per image, never combine them). Save each as its own file named exactly as given:\n" + lines)
    return names, prompt

def submit(bid):
    names, prompt = batch(bid)
    r = call("hub_run", {"kind": "image", "agent": "muse", "images": len(names), "prompt": prompt, "wait_seconds": 0})
    print(bid, r)
    if "request_id" in r:
        open(os.path.join(OUT, "jobs.txt"), "a").write(f'{bid} {r["request_id"]}\n')

def fetch(bid):
    names, _ = batch(bid)
    rid = [l.split()[1] for l in open(os.path.join(OUT, "jobs.txt")) if l.startswith(bid + " ")][-1]
    r = call("hub_get_result", {"request_id": rid, "wait_seconds": 0})
    print(bid, rid, r.get("status"), r.get("cost"))
    if r.get("status") != "COMPLETED": return
    os.makedirs(os.path.join(OUT, "raw"), exist_ok=True)
    for d in r["downloads"]:
        base = os.path.splitext(os.path.basename(d["file"]))[0]
        req = urllib.request.Request(d["url"], headers={"Authorization": "Key " + KEY, "User-Agent": "curl/8.5.0"})
        data = urllib.request.urlopen(req, timeout=120).read()
        ext = os.path.splitext(d["file"])[1]
        open(os.path.join(OUT, "raw", f"{bid}__{base}{ext}"), "wb").write(data)
        print("  saved", f"{bid}__{base}{ext}", len(data))

if __name__ == "__main__":
    {"submit": submit, "fetch": fetch}[sys.argv[1]](sys.argv[2])
