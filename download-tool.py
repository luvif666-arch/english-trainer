#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
素材下载器 — 本地网页版
双击运行即可，会自动打开浏览器。

用法：
  1. 双击 运行下载器.bat（或本文件）
  2. 浏览器打开后，粘贴 B站 / YouTube 等链接
  3. 点「开始下载」，下完的mp3 就在 download 文件夹
  4. 回到工作台，把 mp3 拖进去就能影子跟读

依赖：yt-dlp + ffmpeg（已随包安装，无需你操心）
"""
import os
import sys
import json
import queue
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

BASE = os.path.dirname(os.path.abspath(__file__))
DL_DIR = os.path.join(BASE, "download")
YTDLP = os.path.join(BASE, "yt-dlp.exe")
FFMPEG = os.path.join(BASE, "ffmpeg.exe")
PORT = 8765

os.makedirs(DL_DIR, exist_ok=True)

# ---- 任务队列：每个任务一个线程，实时吐日志到前端 ----
JOBS = {}          # id -> {status, logs[], files[]}
LOG_Q = queue.Queue()
LOCK = threading.Lock()


def emit(job_id, line):
    LOG_Q.put({"id": job_id, "line": line})


def build_cmd(url, want_sub, only_audio):
    """拼 yt-dlp 参数。有中文注释说明为什么这么写。"""
    cmd = [YTDLP, "--no-playlist", "--ffmpeg-location", BASE, "-o",
           os.path.join(DL_DIR, "%(title).80s.%(ext)s")]

    if only_audio:
        # 只要音频：-x 抽音轨，--audio-format 转 mp3
        cmd += ["-x", "--audio-format", "mp3", "--audio-quality", "0"]
    else:
        cmd += ["-f", "bestaudio/best"]

    if want_sub:
        # 字幕：优先官方手打字幕，没有就下自动生成的
        cmd += ["--write-subs", "--write-auto-subs", "--sub-langs", "en.*,en",
                "--sub-format", "srt/vtt/best", "--convert-subs", "srt"]
        # B站 / YouTube 的字幕常常要登录态才给，自动借浏览器 cookie
        if site_needs_cookies(url):
            if not any(os.path.isdir(os.path.join(os.environ.get("USERPROFILE", ""), "AppData", "Local", "Google", "Chrome", "User Data", p))
                       for p in ("Default", "Profile 1")):
                cmd += ["--cookies-from-browser", "edge"]
            else:
                cmd += ["--cookies-from-browser", "chrome"]

    cmd += [url]
    return cmd


def site_needs_cookies(url):
    """这些站的字幕不给未登录用户。"""
    return any(d in url for d in ("bilibili.com", "youtube.com", "youtu.be"))


def run_job(job_id, url, want_sub, only_audio):
    with LOCK:
        JOBS[job_id] = {"status": "running", "logs": [], "files": []}

    cmd = build_cmd(url, want_sub, only_audio)
    emit(job_id, "$ " + " ".join(cmd[:3]) + " ... " + cmd[-1])

    try:
        import subprocess
        proc = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding="utf-8", errors="replace",
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0)
        )
        for raw in proc.stdout:
            line = raw.strip()
            if not line:
                continue
            # 进度行压缩一下，前端更好读
            if "[download]" in line and "%" in line:
                line = line.split(" at ")[0]
            emit(job_id, line)
        proc.wait()

        # 收集产物
        files = sorted(os.listdir(DL_DIR))
        new_files = [f for f in files if f.lower().endswith((".mp3", ".m4a", ".srt", ".vtt", ".mp4"))]
        with LOCK:
            JOBS[job_id]["files"] = new_files
            JOBS[job_id]["status"] = "done" if proc.returncode == 0 else "error"

        if proc.returncode != 0:
            emit(job_id, "✗ 退出码 %d" % proc.returncode)
        else:
            emit(job_id, "✓ 完成，文件在 download 文件夹")
            if not want_sub or not any(f.endswith(".srt") for f in new_files):
                emit(job_id, "提示：没抓到字幕也没关系，回到工作台用「自动生成字幕」")
    except Exception as e:
        emit(job_id, "✗ 出错：%s" % e)
        with LOCK:
            JOBS[job_id]["status"] = "error"


PAGE = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>素材下载器</title>
<style>
:root{--bg:#12100e;--panel:#1c1917;--line:#332e29;--fg:#e8e3db;--dim:#9a9086;--acc:#d97757;--ok:#7fa87f}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 "Microsoft YaHei",system-ui,sans-serif;padding:24px 16px}
.wrap{max-width:760px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px;letter-spacing:.5px}
.sub{color:var(--dim);font-size:13px;margin-bottom:22px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:14px}
label{display:block;font-size:13px;color:var(--dim);margin-bottom:6px}
input[type=text]{width:100%;padding:11px 12px;background:#0f0d0c;border:1px solid var(--line);border-radius:7px;color:var(--fg);font-size:14px;font-family:inherit}
input[type=text]:focus{outline:none;border-color:var(--acc)}
.row{display:flex;gap:16px;flex-wrap:wrap;margin:14px 0}
.opt{display:flex;align-items:center;gap:7px;font-size:14px;color:var(--fg);cursor:pointer}
input[type=checkbox]{width:16px;height:16px;accent-color:var(--acc);cursor:pointer}
button{background:var(--acc);color:#fff;border:0;padding:11px 26px;border-radius:7px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}
button:hover{background:#c2654a}
button:disabled{opacity:.5;cursor:not-allowed}
#log{background:#0b0a09;border:1px solid var(--line);border-radius:7px;padding:12px;height:280px;overflow-y:auto;font:12px/1.65 Consolas,monospace;color:#c9c1b6;white-space:pre-wrap;word-break:break-all}
.files{margin-top:10px;font-size:13px;color:var(--dim)}
.files b{color:var(--ok)}
.hint{background:#1a1614;border-left:3px solid var(--acc);padding:11px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#c4bbb0;margin-bottom:14px}
.steps{counter-reset:s;font-size:13.5px;color:#c4bbb0}
.steps li{margin-bottom:7px;padding-left:4px}
</style>
</head>
<body>
<div class="wrap">
  <h1>素材下载器</h1>
  <div class="sub">下音频 → 拖进工作台 → 影子跟读</div>

  <div class="hint">
    支持 <b>B站</b>（实测可用）、YouTube 等常见平台。YouTube 需要网络能连上，如果卡住先下B站的。
  </div>

  <div class="card">
    <label>视频链接</label>
    <input type="text" id="url" placeholder="粘贴 B站 / YouTube 链接，回车即可">
    <div class="row">
      <label class="opt"><input type="checkbox" id="sub" checked>同时下英文字幕（有就下，没有也行）</label>
      <label class="opt"><input type="checkbox" id="only" checked>只要音频（不要画面）</label>
    </div>
    <button id="go" onclick="start()">开始下载</button>
    <div class="files" id="files"></div>
  </div>

  <div class="card">
    <label>运行日志</label>
    <div id="log">等待中…</div>
  </div>

  <div class="card">
    <label>接下来怎么用</label>
    <ol class="steps">
      <li>下载完成后，到 <b>download</b> 文件夹拿 mp3 和 srt（如果有）</li>
      <li>打开 <a href="https://luvif666-arch.github.io/english-trainer/" target="_blank" style="color:var(--acc)">外贸英语工作台</a>，进「影子跟读」</li>
      <li>把 mp3 拖进「① 导入」区→ 字幕会自动识别，或改用「③ 导入现成字幕」加载 srt</li>
      <li>点句子开始逐句跟读</li>
    </ol>
  </div>
</div>

<script>
let es=null;
function start(){
  const url=document.getElementById('url').value.trim();
  if(!url){alert('先粘贴链接');return}
  const body=new URLSearchParams({url,sub:document.getElementById('sub').checked,only:document.getElementById('only').checked});
  fetch('/download',{method:'POST',body});
  document.getElementById('log').textContent='启动中…';
}
function connect(){
  es=new EventSource('/stream');
  es.onmessage=e=>{
    const d=JSON.parse(e.data);
    if(d.type==='log'){
      const box=document.getElementById('log');
      if(box.textContent==='等待中…')box.textContent='';
      box.textContent+=d.line+'\n';box.scrollTop=box.scrollHeight;
    }
    if(d.type==='files'){
      document.getElementById('files').innerHTML='已下载：<b>'+d.files.join('</b>、<b>')+'</b>';
    }
  };
}
document.getElementById('url').addEventListener('keydown',e=>{if(e.key==='Enter')start()});
connect();
</script>
</body></html>
"""


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="text/html; charset=utf-8"):
        b = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            return self._send(200, PAGE)
        if u.path == "/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            try:
                # 先推当前已有文件
                files = sorted([f for f in os.listdir(DL_DIR)
                                if f.lower().endswith((".mp3", ".srt", ".vtt"))])
                self.wfile.write(("data: " + json.dumps(
                    {"type": "files", "files": files}) + "\n\n").encode())
                while True:
                    item = LOG_Q.get(timeout=20)
                    jid, line = item["id"], item["line"]
                    self.wfile.write(("data: " + json.dumps(
                        {"type": "log", "line": line}) + "\n\n").encode())
                    self.wfile.flush()
                    if line.startswith("✓") or line.startswith("✗"):
                        files = sorted([f for f in os.listdir(DL_DIR)
                                        if f.lower().endswith((".mp3", ".srt", ".vtt"))])
                        self.wfile.write(("data: " + json.dumps(
                            {"type": "files", "files": files}) + "\n\n").encode())
                        self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        self._send(404, "not found")

    def do_POST(self):
        if self.path != "/download":
            return self._send(404, "nope")
        n = int(self.headers.get("Content-Length", 0))
        q = parse_qs(self.rfile.read(n).decode("utf-8"))
        url = q.get("url", [""])[0]
        sub = q.get("sub", ["0"])[0] == "True"
        only = q.get("only", ["True"])[0] == "True"
        if not url:
            return self._send(400, "no url")
        jid = str(int(time.time() * 1000))
        threading.Thread(target=run_job, args=(jid, url, sub, only), daemon=True).start()
        self._send(200, "ok")


if __name__ == "__main__":
    import time
    print("=" * 46)
    print("  素材下载器已启动")
    print("  地址: http://127.0.0.1:%d" % PORT)
    print("  下载目录: %s" % DL_DIR)
    print("  关掉这个黑窗口就等于关掉下载器")
    print("=" * 46)
    webbrowser.open("http://127.0.0.1:%d" % PORT)
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()