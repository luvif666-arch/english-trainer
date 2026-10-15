// ===== 自动字幕生成（Whisper 浏览器端）=====
// 在你的浏览器里跑 Whisper 模型，音视频不经过任何服务器。
// 首次使用需下载模型（tiny 约 40MB / base 约 80MB），之后浏览器缓存，后续免费离线使用。

let asrPipeline = null;
let asrLoading = false;

const ASR_MODELS = [
  { id: 'Xenova/whisper-tiny.en', size: '~40 MB', note: '最快，准确率一般，适合先跑通流程' },
  { id: 'Xenova/whisper-base.en', size: '~80 MB', note: '推荐，均衡，3 分钟音频约 1-2 分钟出结果' },
  { id: 'Xenova/whisper-small.en', size: '~250 MB', note: '最准但慢，需要 8GB 内存，适合长音频' }
];

function initASR() {
  const sel = $('asrModel');
  if (sel.options.length === 0) {
    ASR_MODELS.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.size + ' — ' + m.note;
      sel.appendChild(o);
    });
    sel.value = 'Xenova/whisper-base.en';
  }
  $('btnASR').onclick = runASR;
  setASRStatus('idle', window.__asrFile ? '文件已就绪，点「开始自动生成字幕」' : '选择音视频文件后点「开始识别」');
}

function setASRStatus(state, msg, pct) {
  const box = $('asrStatus');
  const dot = $('asrDot');
  const fill = $('asrProgress').querySelector('.bar-fill');
  box.textContent = msg;
  dot.className = 'asr-dot ' + state;
  if (pct !== undefined) fill.style.width = Math.min(100, pct) + '%';
  if (state === 'idle') fill.style.width = '0%';
}

// 从文件解码音频 → 16kHz 单声道 Float32Array
async function extractAudio(file) {
  const buf = await file.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await ctx.decodeAudioData(buf);
  // 关闭原context，用 OfflineAudioContext 重采样到 16k mono
  const target = 16000;
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * target), target);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  ctx.close();
  return { data: out.getChannelData(0), duration: decoded.duration };
}

async function runASR() {
  const file = window.__asrFile;
  if (!file) { toast('请先选择音视频文件'); return; }
  if (asrLoading) return;

  const modelId = $('asrModel').value;
  asrLoading = true;
  $('btnASR').disabled = true;

  try {
    setASRStatus('busy', '正在解码音频…', 3);
    const { data, duration } = await extractAudio(file);
    setASRStatus('busy', '音频解码完成（' + fmt(dur) + '）。正在加载模型，首次使用需要下载，请稍候…', 8);

    if (!asrPipeline) {
      const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5');
      let device = 'wasm';
      try {
        if (navigator.gpu && await navigator.gpu.requestAdapter()) device = 'webgpu';
      } catch (e) { /* WebGPU 不可用则回退 */ }

      setASRStatus('busy', '正在加载模型 ' + modelId.split('/')[1] + '（' + (device === 'webgpu' ? 'GPU 加速' : 'CPU 模式，首次较慢') + '）…', 15);

      asrPipeline = await pipeline('automatic-speech-recognition', modelId, {
        device,
        dtype: device === 'webgpu' ? 'fp32' : 'q8'
      });
    }

    setASRStatus('busy', '模型就绪，正在识别语音…这一步最久，请不要关闭页面', 30);

    // 分段转写，进度可控且不会因长音频爆内存
    const CHUNK = 30;              // Whisper 原生按 30s 处理
    const STRIDE = 5;
    const total = data.length;
    const allChunks = [];
    let doneChunks = 0;
    const estTotal = Math.ceil(duration / (CHUNK - STRIDE));

    for (let off = 0; off < total; off += (CHUNK - STRIDE) * 16000) {
      const len = Math.min((CHUNK + STRIDE) * 16000, total - off);
      const slice = data.slice(off, off + len);
      const t0 = off / 16000;
      const out = await asrPipeline(slice, {
        return_timestamps: true,
        chunk_length_s: CHUNK,
        stride_length_s: STRIDE
      });
      (out.chunks || []).forEach(c => {
        const [s, e] = c.timestamp || [];
        if (s === null || s === undefined) return;
        allChunks.push({
          start: t0 + s,
          end: t0 + (e ?? s + 2),
          text: (c.text || '').trim()
        });
      });
      doneChunks++;
      const pct = 30 + Math.round((doneChunks / estTotal) * 65);
      setASRStatus('busy', '识别中…' + Math.round(doneChunks / estTotal * 100) + '%（已产出 ' + allChunks.length + ' 句）', pct);
    }

    // 清理：合并过短碎片、去掉重复重叠
    const merged = [];
    allChunks.forEach(c => {
      if (!c.text) return;
      const last = merged[merged.length - 1];
      if (last && c.start - last.end < 0.4) {
        last.text += ' ' + c.text;
        last.end = c.end;
      } else merged.push({ ...c });
    });

    LINES = merged;
    S.shadowTotal = LINES.length;
    mastered = new Set();
    cur = -1;
    save();
    renderLineList();
    updateShadowBar();
    $('nowLine').textContent = merged.length ? merged[0].text : '（未识别到语音）';
    $('nowSub').textContent = '自动字幕已生成，共 ' + merged.length + ' 句，点左侧句子开始跟读';

    setASRStatus('done', '完成：识别出 ' + merged.length + ' 句，已载入跟读播放器');
    toast('字幕生成成功，' + merged.length + ' 句');

    // 提供下载
    if (merged.length) downloadSRT(merged);

  } catch (e) {
    console.error(e);
    setASRStatus('err', '识别失败：' + (e && e.message ? e.message : e));
    toast('识别失败，看控制台详情');
  } finally {
    asrLoading = false;
    $('btnASR').disabled = false;
  }
}

function downloadSRT(lines) {
  const srt = lines.map((l, i) =>
    (i + 1) + '\n' + srtTime(l.start) + ' --> ' + srtTime(l.end) + '\n' + l.text
  ).join('\n\n');
  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'auto-subtitle-' + Date.now() + '.srt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function srtTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0') + ',' + String(ms).padStart(3, '0');
}
