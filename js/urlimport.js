// ===== 网址导入（B站 / YouTube 等）=====
// 说明：浏览器无法直接跨域抓取 B站/YouTube 视频（平台有跨域保护和反爬机制）。
// 这里提供两条合规且真正可用的路径：
//   路径 A（推荐、最省事）：用官方/开源命令行工具 yt-dlp 在本地下载音视频，然后拖进页面。
//   路径 B：如果你已有一个可直连的音频/视频文件 URL（不跨域），页面可直接读取。

// 解析用户粘贴的文本，提取第一个视频链接
function extractURL(text) {
  const m = text.match(/https?:\/\/[^\s，。,]+/);
  return m ? m[0] : '';
}

// 判断站点类型
function siteOf(url) {
  if (/bilibili\.com|b23\.tv/i.test(url)) return 'bilibili';
  if (/youtu\.be|youtube\.com/i.test(url)) return 'youtube';
  return 'unknown';
}

// 展示对应站点的操作指引
function showGuide(url) {
  const site = siteOf(url);
  const box = $('urlGuide');
  const isBili = site === 'bilibili';
  const title = isBili ? 'B站视频' : site === 'youtube' ? 'YouTube 视频' : '该链接';

  let steps = '';
  if (isBili) {
    steps = `
      <div class="guide-title">处理「${title}」的推荐做法（2 分钟，全程本地）</div>
      <ol class="guide-steps">
        <li>在你电脑上装一次下载工具（只需装一次，之后每条视频都只要一行命令）：
          <div class="code-line">pip install yt-dlp</div>
          <span class="guide-note">没有 pip？装 Python 后运行 <code>python -m pip install yt-dlp</code>；或直接下载 yt-dlp 官方 exe 放到桌面。</span>
        </li>
        <li>复制下面这条命令，把链接换成你想要的B站视频地址，回车运行：
          <div class="code-line" id="dlCmd">yt-dlp -x --audio-format mp3 -o "material.%(ext)s" "把B站链接粘贴到这里"</div>
        </li>
        <li>下载完成后，生成的 <b>material.mp3</b> 会出现在你运行命令的那个文件夹里。</li>
        <li>回到本页上方「① 导入音频」把 mp3 拖进来，再点「自动生成字幕」——完全本地识别，不上传。</li>
      </ol>
      <div class="guide-note">B站视频通常没有可直接用的英文字幕，所以「自动生成字幕」这步是必须的。想省事也可以只下载音轨（上面的命令已经只提取音频，体积小、速度快）。</div>`;
  } else if (site === 'youtube') {
    steps = `
      <div class="guide-title">处理「${title}」的推荐做法</div>
      <ol class="guide-steps">
        <li>装一次下载工具：<div class="code-line">pip install yt-dlp</div></li>
        <li>复制运行（想省事就只下音频）：
          <div class="code-line" id="dlCmd">yt-dlp -x --audio-format mp3 --write-subs --write-auto-subs --sub-langs "en.*" -o "material.%(ext)s" "把YouTube链接粘贴到这里"</div>
          <span class="guide-note">加了 <code>--write-subs</code> 会顺便把英文字幕一起下下来，这种情况不需要再自动识别。</span>
        </li>
        <li>把下载好的 mp3 和 .srt 字幕都拖进上方导入区即可。</li>
      </ol>`;
  } else {
    steps = `
      <div class="guide-title">这个链接无法直接识别</div>
      <div class="guide-note">如果这是一个可直接访问的音频/视频文件地址（.mp3/.mp4/.m4a/.wav结尾），可以直接拖进上方导入区。
      若是B站/抖音/小红书等平台页面链接，请用 yt-dlp 等工具在本地下载后导入。</div>`;
  }
  box.innerHTML = steps;
  box.style.display = 'block';

  // 命令行里的链接可点击填充
  const cmd = $('dlCmd');
  if (cmd) {
    const q = url.replace(/"/g, '');
    cmd.textContent = cmd.textContent.replace(/把.+链接粘贴到这里|把YouTube链接粘贴到这里|把B站链接粘贴到这里/, q);
    cmd.onclick = () => { copyText(cmd.textContent); };
  }
}

function initURL() {
  $('btnParseURL').onclick = () => {
    const url = extractURL($('urlInput').value.trim());
    if (!url) { toast('没识别到链接，检查是否粘贴完整'); return; }
    showGuide(url);
  };
  $('urlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); $('btnParseURL').click(); }
  });
}
