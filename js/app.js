// ===== 状态 =====
const KEY = 'trade-english-trainer-v1';

const defaultState = {
  today: todayStr(),
  region: 'us',
  tasks: {},
  shadowRounds: 0,      // 完成的跟读轮次
  shadowLines: 0,       // 当前材料已掌握句数
  shadowTotal: 0,
  recordDone: 0,        // 完成的复述次数
  roleplayDone: 0,      // 完成的陪练轮次
  packDone: 0,          // 完成的素材数
  packs: [],            // 我的待跟读清单
  vocab: [],            // 生词本
  weekProgress: {},     // {1: 5, 2: 3, ...} 完成天数
  radar: { flow: 3, pron: 3, vocab: 4, grammar: 3, confidence: 2, listening: 3 },
  history: {},          // { '2026-10-15': 3 } 每日完成项数
  recordings: [],       // 录音元数据（存 dataURL 可能超限，只存时长+日期）
  rpNotes: []
};

let S = load();

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultState, today: todayStr() };
    const s = JSON.parse(raw);
    // 跨天：重置今日任务，连续天数 +1
    if (s.today !== todayStr()) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yStr = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
      if (!s.history[yStr]) delete s.tasks; // 昨天没学，连续中断
      s.tasks = {};
      s.today = todayStr();
    }
    return { ...defaultState, ...s };
  } catch (e) {
    return { ...defaultState, today: todayStr() };
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('保存失败，存储空间可能已满'); }
}

// ===== 工具 =====
function $(id) { return document.getElementById(id); }
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}
function bumpToday() {
  S.history[S.today] = (S.history[S.today] || 0) + 1;
}
function streak() {
  let n = 0;
  const d = new Date();
  for (;;) {
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    if (S.history[k]) { n++; d.setDate(d.getDate() - 1); } else break;
    if (n > 365) break;
  }
  return n;
}

// ===== 视图切换 =====
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('view-' + t.dataset.view).classList.add('active');
    window.scrollTo(0, 0);
  });
});

// ===== 总览 =====
function renderDashboard() {
  $('streakNum').textContent = streak();
  $('totalDone').textContent = Object.values(S.tasks).filter(Boolean).length
    + S.shadowRounds + S.recordDone + S.roleplayDone;

  const shadowPct = S.shadowRounds > 0 ? 100 : 0;
  const recPct = Math.min(100, Math.round(S.recordDone / 20 * 100));
  const rolePct = Math.min(100, Math.round(S.roleplayDone / 20 * 100));
  const totalPct = Math.round((shadowPct + recPct + rolePct) / 3);

  const set = (v, b, p) => { $(v).textContent = p + '%'; $(b).style.width = p + '%'; };
  set('statOverall', 'barOverall', totalPct);
  set('statShadow', 'barShadow', shadowPct);
  set('statRecord', 'barRecord', recPct);
  set('statRole', 'barRole', rolePct);

  // 今日任务
  const box = $('todayTasks');
  box.innerHTML = '';
  TODAY_TASKS.forEach(t => {
    const done = !!S.tasks[t.id];
    const n = el('div', 'task' + (done ? ' done' : ''));
    n.innerHTML = `<div class="task-box">✓</div>
      <div class="task-body">
        <div class="task-title">${t.title}</div>
        <div class="task-meta">${t.meta}</div>
      </div>`;
    n.onclick = () => {
      S.tasks[t.id] = !S.tasks[t.id];
      if (S.tasks[t.id]) bumpToday();
      save(); renderDashboard();
    };
    box.appendChild(n);
  });

  // 雷达
  drawRadar();
  // 热力
  drawHeat();
}

function drawRadar() {
  const labels = [['flow', '流利度'], ['pron', '发音'], ['vocab', '词汇'], ['grammar', '语法'], ['confidence', '自信度'], ['listening', '听力']];
  const cx = 130, cy = 95, R = 62;
  const n = labels.length;
  let svg = `<svg viewBox="0 0 260 190" width="100%" style="max-height:190px">`;
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / n;
      pts.push(`${(cx + Math.cos(a) * R * f).toFixed(1)},${(cy + Math.sin(a) * R * f).toFixed(1)}`);
    }
    svg += `<polygon class="radar-ring" points="${pts.join(' ')}"/>`;
  });
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const v = (S.radar[labels[i][0]] || 1) / 5;
    pts.push(`${(cx + Math.cos(a) * R * v).toFixed(1)},${(cy + Math.sin(a) * R * v).toFixed(1)}`);
  }
  svg += `<polygon class="radar-shape" points="${pts.join(' ')}"/>`;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    const v = (S.radar[labels[i][0]] || 1) / 5;
    const px = cx + Math.cos(a) * R * v, py = cy + Math.sin(a) * R * v;
    svg += `<circle class="radar-dot" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.5"/>`;
    const lx = cx + Math.cos(a) * (R + 22), ly = cy + Math.sin(a) * (R + 18);
    const anch = Math.abs(lx - cx) < 6 ? 'middle' : (lx > cx ? 'start' : 'end');
    svg += `<text class="radar-axis" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anch}">${labels[i][1]} ${S.radar[labels[i][0]]||1}</text>`;
    // 滑杆
    const sx = cx + Math.cos(a) * R, sy = cy + Math.sin(a) * R;
    svg += `<circle class="radar-dot" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="2" fill="#4a5163" data-radar="${labels[i][0]}" style="cursor:pointer"/>`;
  }
  svg += `</svg>`;
  const box = $('radarBox');
  box.innerHTML = svg;
  box.querySelectorAll('[data-radar]').forEach(c => {
    c.onclick = (e) => {
      const k = c.dataset.radar;
      S.radar[k] = Math.min(5, (S.radar[k] || 1) + 1);
      save(); drawRadar();
      toast('点顶点提高评分');
    };
  });
}

$('btnSaveRadar').onclick = () => { save(); bumpToday(); renderDashboard(); toast('已保存本周自评'); };

function drawHeat() {
  const box = $('heatBox');
  box.innerHTML = '';
  const d = new Date();
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const c = S.history[k] || 0;
    const lv = c === 0 ? '' : c <= 2 ? 'l1' : c <= 4 ? 'l2' : 'l3';
    const isToday = k === S.today;
    const cell = el('div', 'heat-cell ' + lv + (isToday ? ' today' : ''));
    cell.style.height = (14 + Math.min(c, 6) * 10) + 'px';
    cell.title = k + '：完成 ' + c + ' 项';
    box.appendChild(cell);
    d.setDate(d.getDate() + 1);
  }
}

// ===== 影子跟读 =====
let LINES = [];
let audioURL = null;

$('btnSample').onclick = () => {
  $('audioTitle').value = '示例：商务电话开场（无音频可先练文本）';
  $('manualLines').value = [
    'Good morning, this is John calling from ABC Trading.',
    'How are you doing today?',
    'We specialize in stainless steel fittings for the food industry.',
    'I know you are busy, so I will keep it to two minutes.',
    'Our MOQ is one thousand pieces.',
    'For five thousand pieces, our unit price is three dollars and eighty cents, FOB Shenzhen.',
    'Our terms are thirty percent deposit, seventy percent against the B/L copy.',
    'This price is valid for fifteen days.',
    'Would it help if I sent a sample first?',
    'I will email you the spec sheet right after this call.'
  ].join('\n');
  toast('已填入示例，可直接载入');
};

function parseSRT(txt) {
  const out = [];
  const blocks = txt.replace(/\r/g, '').split(/\n\s*\n/);
  blocks.forEach(b => {
    const lines = b.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    const ti = lines.findIndex(l => l.includes('-->'));
    if (ti < 0) return;
    const m = lines[ti].match(/([\d:.,]+)\s*-->\s*([\d:.,]+)/);
    if (!m) return;
    out.push({ start: toSec(m[1]), text: lines.slice(ti + 1).join(' ').replace(/<[^>]+>/g, '').trim() });
  });
  return out;
}
function parseVTT(txt) { return parseSRT(txt.replace(/^WEBVTT.*?\n\n/s, '')); }
function toSec(t) {
  const p = t.split(':').map(parseFloat);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

$('audioFile').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  window.__asrFile = f;
  if (audioURL) URL.revokeObjectURL(audioURL);
  audioURL = URL.createObjectURL(f);
  $('audioEl').src = audioURL;
  if (!$('audioTitle').value) $('audioTitle').value = f.name.replace(/\.[^.]+$/, '');
  toast('文件已载入，可直接播放或点「自动生成字幕」');
};

$('subFile').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    const txt = fr.result;
    LINES = f.name.endsWith('.vtt') ? parseVTT(txt) : parseSRT(txt);
    if (!LINES.length) { toast('字幕解析失败，检查格式'); return; }
    S.shadowTotal = LINES.length; save(); renderLineList(); updateShadowBar();
    toast('字幕解析成功，' + LINES.length + ' 句');
  };
  fr.readAsText(f);
};

$('btnLoadMaterial').onclick = () => {
  if (LINES.length) { renderLineList(); updateShadowBar(); toast('使用字幕 ' + LINES.length + ' 句'); return; }
  const txt = $('manualLines').value.trim();
  if (!txt) { toast('请先导入字幕或手写句子'); return; }
  LINES = txt.split('\n').map(s => s.trim()).filter(Boolean).map(s => ({ start: null, end: null, text: s }));
  S.shadowTotal = LINES.length; save(); renderLineList(); updateShadowBar();
  $('nowLine').textContent = LINES[0].text;
  $('nowSub').textContent = '已载入 ' + LINES.length + ' 句（文本模式，无音频时间轴）· 点句子开始跟读';
  toast('已载入 ' + LINES.length + ' 句，文本模式');
};

let mastered = new Set();
let cur = -1;
let segTimer = null;

function renderLineList() {
  const box = $('lineList');
  box.innerHTML = '';
  if (!LINES.length) { box.innerHTML = '<div class="hint">尚无句子。左侧导入字幕或手写句子。</div>'; return; }
  LINES.forEach((l, i) => {
    const it = el('div', 'line-item' + (i === cur ? ' active' : '') + (mastered.has(i) ? ' mastered' : ''));
    const t = l.start !== null && l.start !== undefined
      ? `<span class="ln-time">${fmt(l.start)}</span>` : `<span class="ln-time">${i + 1}</span>`;
    it.innerHTML = t + `<span class="ln-text" data-sentence="${esc(l.text)}">${tokenizeHTML(l.text)}</span>`;
    it.onclick = () => gotoLine(i);
    it.ondblclick = () => {
      mastered.has(i) ? mastered.delete(i) : mastered.add(i);
      renderLineList(); updateShadowBar();
    };
    box.appendChild(it);
  });
  updateShadowBar();
}
function esc(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function fmt(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}

function gotoLine(i) {
  if (!LINES.length) return;
  cur = i;
  const l = LINES[i];
  if (l.start !== null && l.start !== undefined && $('audioEl').src) {
    $('audioEl').currentTime = l.start;
    $('audioEl').play().catch(() => {});
  }
  $('nowLine').textContent = l.text;
  $('nowSub').textContent = '第 ' + (i + 1) + ' / ' + LINES.length + ' 句'
    + (l.start !== null && l.start !== undefined ? ' · ' + fmt(l.start) : '')
    + (mastered.has(i) ? ' · 已掌握' : '');
  renderLineList();
  document.querySelector('.line-item.active')?.scrollIntoView({ block: 'nearest' });
  if ($('loopToggle').checked) startSegLoop(i);
}

let segTimeout = null;
function startSegLoop(i) {
  clearTimeout(segTimeout);
  const l = LINES[i];
  if (!l || l.start === null || l.start === undefined) return;
  const end = l.end || (LINES[i + 1] ? LINES[i + 1].start : null);
  if (!end) return;
  const a = $('audioEl');
  const check = () => {
    if (cur !== i) return;
    if (a.currentTime >= end - 0.05) { a.currentTime = l.start; a.play().catch(() => {}); }
    segTimeout = setTimeout(check, 120);
  };
  segTimeout = setTimeout(check, 120);
}

$('btnNext').onclick = () => gotoLine(Math.min(cur + 1, LINES.length - 1));
$('btnPrev').onclick = () => gotoLine(Math.max(cur - 1, 0));
$('btnReplay').onclick = () => { clearTimeout(segTimeout); if (cur >= 0) gotoLine(cur); };

document.querySelectorAll('[data-speed]').forEach(c => {
  c.onclick = () => {
    document.querySelectorAll('[data-speed]').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    $('audioEl').playbackRate = parseFloat(c.dataset.speed);
  };
});
$('loopToggle').onchange = () => {
  if ($('loopToggle').checked && cur >= 0) startSegLoop(cur); else clearTimeout(segTimeout);
};

function updateShadowBar() {
  const total = LINES.length || S.shadowTotal || 0;
  const done = mastered.size;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('barShadowDetail').style.width = pct + '%';
  $('shadowDetailText').textContent = done + ' / ' + total + ' 句已掌握　·　' + pct + '%';
}
$('btnFinishShadow').onclick = () => {
  if (!LINES.length) { toast('先载入材料再计入进度'); return; }
  S.shadowRounds++; bumpToday(); save();
  mastered.clear(); renderLineList(); renderDashboard(); renderWeeks();
  toast('本轮跟读已计入进度，去录一段复述吧');
};

// ===== 录音复述 =====
let mediaRec = null, chunks = [], recTimer = null, recStart = 0, recBlobURL = null;

$('btnRec').onclick = async () => {
  if (mediaRec && mediaRec.state === 'recording') {
    mediaRec.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRec = new MediaRecorder(stream);
    chunks = [];
    mediaRec.ondataavailable = e => chunks.push(e.data);
    mediaRec.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      if (recBlobURL) URL.revokeObjectURL(recBlobURL);
      recBlobURL = URL.createObjectURL(blob);
      $('btnPlayRec').disabled = false;
      $('btnPlayRec').onclick = () => { const a = new Audio(recBlobURL); a.play(); };
      S.recordings.unshift({ dur: fmt(recSec), date: S.today, topic: $('recordTopic').value });
      S.recordings = S.recordings.slice(0, 12);
      save(); renderRecList();
      stream.getTracks().forEach(t => t.stop());
      $('recDot').classList.remove('on');
      $('recHint').textContent = '录音完成，点「回放」听一遍';
      $('btnRec').textContent = '● 开始录音';
    };
    mediaRec.start();
    recStart = Date.now();
    $('recDot').classList.add('on');
    $('btnRec').textContent = '■ 停止录音';
    $('recHint').textContent = '正在录音…';
    recTimer = setInterval(() => {
      recSec = (Date.now() - recStart) / 1000;
      $('recTime').textContent = fmt(recSec);
    }, 200);
  } catch (e) {
    toast('麦克风权限被拒绝，请在浏览器地址栏允许麦克风');
  }
};
let recSec = 0;

function renderRecList() {
  const box = $('recList');
  if (!S.recordings.length) { box.innerHTML = '<div class="hint">还没有录音记录</div>'; return; }
  box.innerHTML = '';
  S.recordings.forEach((r, i) => {
    const it = el('div', 'mini-item');
    it.innerHTML = `<div class="mi-body">${esc(r.topic)}</div><span class="mini-label">${r.dur} · ${r.date}</span><span class="mi-del">×</span>`;
    it.querySelector('.mi-del').onclick = () => { S.recordings.splice(i, 1); save(); renderRecList(); };
    box.appendChild(it);
  });
}

// 自评清单
const CHECKS = SELF_CHECK.map((t, i) => ({ id: 'c' + i, text: t }));
let checkState = {};
function renderChecks() {
  const box = $('selfCheck');
  box.innerHTML = '';
  CHECKS.forEach(c => {
    const l = el('label', 'check-item');
    l.innerHTML = `<input type="checkbox" ${checkState[c.id] ? 'checked' : ''}><span>${c.text}</span>`;
    l.querySelector('input').onchange = e => { checkState[c.id] = e.target.checked; };
    box.appendChild(l);
  });
}
$('btnFinishRecord').onclick = () => {
  const ok = Object.values(checkState).filter(Boolean).length;
  if (ok < 3) { toast('至少勾选 3 项才算完成'); return; }
  S.recordDone++; bumpToday(); save();
  checkState = {}; renderChecks(); renderDashboard(); renderWeeks();
  toast('复述 #' + S.recordDone + ' 已记录');
};

// ===== AI 陪练 =====
$('btnGenPrompt').onclick = () => {
  const reg = getRegion(S.region);
  $('rpPrompt').value = PROMPT_TEMPLATE($('rpRole').value, $('rpScene').value, $('rpLevel').value, reg);
  toast('已按' + reg.short + '生成，复制到 AI 对话里用');
};
$('btnCopyPrompt').onclick = async () => {
  const t = $('rpPrompt');
  if (!t.value) { toast('先生成提示词'); return; }
  try { await navigator.clipboard.writeText(t.value); toast('已复制'); }
  catch (e) { t.select(); document.execCommand('copy'); toast('已复制'); }
};
$('btnRecordRP').onclick = () => {
  S.roleplayDone++; bumpToday(); save(); renderDashboard(); renderWeeks();
  toast('陪练 #' + S.roleplayDone + ' 已记录');
};
$('btnAddNote').onclick = () => {
  const v = $('rpNoteInput').value.trim();
  if (!v) return;
  S.rpNotes.unshift(v);
  if (S.rpNotes.length > 20) S.rpNotes.pop();
  $('rpNoteInput').value = '';
  save(); renderNotes();
};
function renderNotes() {
  const box = $('rpNotes');
  box.innerHTML = '';
  if (!S.rpNotes.length) { box.innerHTML = '<div class="hint">记下每次说不好、下次要改的地方</div>'; return; }
  S.rpNotes.forEach((n, i) => {
    const it = el('div', 'mini-item');
    it.innerHTML = `<div class="mi-body">${esc(n)}</div><span class="mi-del">×</span>`;
    it.querySelector('.mi-del').onclick = () => { S.rpNotes.splice(i, 1); save(); renderNotes(); };
    box.appendChild(it);
  });
}

// ===== 话术库 =====
function renderScripts() {
  const box = $('scriptBox');
  box.innerHTML = '';
  const p = $('myProduct').value || '[产品]';
  const c = $('myCompany').value || '[公司名]';
  SCRIPTS.forEach((s, si) => {
    const card = el('div', 'script-card');
    card.appendChild(el('h3', null, `<span class="num">${si + 1}</span>${s.name}`));
    s.lines.forEach(l => {
      const en = l.en.replace(/\[产品\]/g, p).replace(/\[stainless steel fittings\]/g, p)
        .replace(/\[ABC Trading\]/g, c).replace(/\[公司名\]/g, c)
        .replace(/\[王明\]/g, 'John');
      const it = el('div', 'script-line');
      it.innerHTML = `<span class="sl-cn">${l.cn}</span><span class="sl-en" data-sentence="${esc(en)}">${tokenizeHTML(en)}</span>`;
      it.title = '点击复制';
      it.onclick = () => {
        navigator.clipboard.writeText(en).then(() => toast('已复制')).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = en; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); ta.remove(); toast('已复制');
        });
      };
      card.appendChild(it);
    });
    box.appendChild(card);
  });
}
$('myProduct').oninput = renderScripts;
$('myCompany').oninput = renderScripts;

// ===== 实景对话 =====
let dlgIdx = 0;
let curUtter = null;

function initDialogue() {
  const sel = $('dlgSelect');
  DIALOGUES.forEach((d, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = d.name;
    sel.appendChild(o);
  });
  const rsel = $('dlgRegion');
  REGIONS.forEach(r => {
    const o = document.createElement('option');
    o.value = r.id; o.textContent = r.short;
    rsel.appendChild(o);
  });
  rsel.value = S.region;
  sel.onchange = () => { dlgIdx = parseInt(sel.value, 10); renderDialogue(); };
  rsel.onchange = () => { setRegion(rsel.value); renderDialogue(); };
  $('btnPlayAll').onclick = playAll;
  $('btnStopAll').onclick = stopSpeak;
  $('dlgHide').onchange = renderDialogue;
  $('dlgOnlyRole').onchange = renderDialogue;
  $('dlgRate').onchange = () => { if ('speechSynthesis' in window) speechSynthesis.rate = parseFloat($('dlgRate').value); };
  renderDialogue();
}

function renderDialogue() {
  const d = DIALOGUES[dlgIdx];
  const reg = getRegion(S.region);
  const hideEn = $('dlgHide').checked;
  const onlyYou = $('dlgOnlyRole').checked;

  $('dlgMeta').innerHTML = `<strong>${d.scene}</strong><br>
    难度：你的台词 ${d.levels.you} ／ 对方 ${d.levels.other}　·　共 ${d.lines.length} 句`;
  $('dlgTip').innerHTML = `<b>${reg.short}</b> — ${reg.style.greeting}。${reg.style.trap}`;

  const body = $('dlgBody');
  body.innerHTML = '';
  d.lines.forEach((l, i) => {
    if (onlyYou && l.role !== 'you') return;
    const row = el('div', 'dlg-line ' + l.role + (hideEn ? ' hide-en' : ''));
    row.dataset.i = i;
    row.innerHTML = `
      <div class="dlg-role">${l.role === 'you' ? '你说' : '对方'}</div>
      <div class="dlg-content">
        <div class="dlg-en" data-sentence="${esc(l.en)}">${tokenizeHTML(l.en)}</div>
        <div class="dlg-cn">${l.cn ? '提示：' + esc(l.cn) : ''}</div>
      </div>
      <div class="dlg-play">▶</div>`;
    row.querySelector('.dlg-play').onclick = (e) => {
      e.stopPropagation();
      speak(l.en, i, row);
    };
    body.appendChild(row);
  });

  const nb = $('dlgNotes');
  nb.innerHTML = '';
  d.notes.forEach(n => nb.appendChild(el('div', 'dlg-note', n)));
}

function pickVoice(pref) {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices();
  return vs.find(v => v.lang === pref) || vs.find(v => v.lang.replace('_', '-') === pref)
    || vs.find(v => new RegExp('^' + pref.split('-')[0]).test(v.lang)) || null;
}

function speak(text, idx, row) {
  if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
  stopSpeak();
  const reg = getRegion(S.region);
  const u = new SpeechSynthesisUtterance(text);
  const v = pickVoice(reg.voice);
  if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = reg.voice; }
  u.rate = parseFloat($('dlgRate').value) * (reg.speech.rate || 1);
  curUtter = { idx, row };
  if (row) row.classList.add('speaking');
  u.onend = () => { if (row) row.classList.remove('speaking'); curUtter = null; };
  speechSynthesis.speak(u);
}

function stopSpeak() {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  if (curUtter && curUtter.row) curUtter.row.classList.remove('speaking');
  curUtter = null;
}

function playAll() {
  if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
  stopSpeak();
  const onlyYou = $('dlgOnlyRole').checked;
  const lines = DIALOGUES[dlgIdx].lines.filter(l => !onlyYou || l.role === 'you');
  let i = 0;
  const next = () => {
    if (i >= lines.length) { toast('朗读完毕，试试跟读'); return; }
    const l = lines[i];
    const row = document.querySelector(`.dlg-line[data-i="${DIALOGUES[dlgIdx].lines.indexOf(l)}"]`);
    const reg = getRegion(S.region);
    const u = new SpeechSynthesisUtterance(l.en);
    const v = pickVoice(reg.voice);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = reg.voice; }
    u.rate = parseFloat($('dlgRate').value) * (reg.speech.rate || 1);
    if (row) { row.classList.add('speaking'); row.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    u.onend = () => {
      document.querySelectorAll('.dlg-line.speaking').forEach(x => x.classList.remove('speaking'));
      i++; next();
    };
    speechSynthesis.speak(u);
  };
  next();
}

// ===== 目标地区 =====
function setRegion(id) {
  S.region = id;
  save();
  renderRegion();
  const rs = $('dlgRegion'); if (rs) rs.value = id;
  // 同步 AI 陪练的角色描述
  const rs2 = $('rpRole');
  if (rs2 && rs2.dataset.base) rs2.value = rs2.dataset.base;
}

function renderRegion() {
  const grid = $('regionGrid');
  if (!grid) return;
  grid.innerHTML = '';
  REGIONS.forEach(r => {
    const c = el('div', 'region-card' + (r.id === S.region ? ' active' : ''));
    c.innerHTML = `<div class="region-name">${r.common ? '<span class="region-badge">通用</span>' : ''}${r.name.split('（')[0]}</div>
      <div class="region-short">${r.short}</div>`;
    c.onclick = () => { setRegion(r.id); renderDialogue(); };
    grid.appendChild(c);
  });

  const reg = getRegion(S.region);
  $('rgTitle').textContent = reg.name;
  $('rgDesc').textContent = reg.desc;
  $('rgSpeech').innerHTML = `<b>口音特征</b>：${reg.speech.note}　·　朗读基准：${reg.voice}`;

  const st = $('rgStyle');
  st.innerHTML = '';
  const keys = [['greeting', '寒暄长度'], ['name', '称呼方式'], ['bargain', '议价风格'], ['decision', '决策特点'], ['trap', '最容易踩的坑']];
  keys.forEach(([k, label]) => {
    const isTrap = k === 'trap';
    st.appendChild(el('div', 'rg-style-item' + (isTrap ? ' warn' : ''),
      `<div class="rg-style-key">${label}</div><div class="rg-style-val">${reg.style[k]}</div>`));
  });

  const wb = $('rgWords');
  wb.innerHTML = '';
  reg.words.forEach(w => {
    const it = el('div', 'rg-word');
    it.innerHTML = `<div class="rg-word-en">${w.en}</div><div class="rg-word-cn">${w.cn}</div>`;
    it.title = '点击复制';
    it.onclick = () => copyText(w.en);
    wb.appendChild(it);
  });

  // 同步 AI 陪练的地区提示
  const rh = $('rpRegionHint');
  if (rh) rh.innerHTML = `当前陪练将模拟 <b style="color:var(--amber)">${reg.name}</b> 的买家：${reg.style.greeting}，${reg.style.bargain}`;
}

function readRegion() {
  if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
  stopSpeak();
  const reg = getRegion(S.region);
  const lines = reg.words.map(w => w.en);
  lines.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t);
    const v = pickVoice(reg.voice);
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = reg.voice; }
    u.rate = reg.speech.rate || 1;
    if (i > 0) u.onstart = () => { const rows = document.querySelectorAll('.rg-word'); rows.forEach(r => r.style.borderColor = ''); if (rows[i - 1]) { rows[i - 1].style.borderColor = '#e0912f'; rows[i - 1].scrollIntoView({ block: 'nearest' }); } };
    speechSynthesis.speak(u);
  });
}

function copyText(t) {
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('已复制')).catch(() => fallbackCopy(t));
  else fallbackCopy(t);
}
function fallbackCopy(t) {
  const ta = document.createElement('textarea');
  ta.value = t; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); toast('已复制'); } catch (e) { toast('复制失败'); }
  ta.remove();
}

// ===== 8 周路径 =====
function renderWeeks() {
  const box = $('weekBox');
  box.innerHTML = '';
  WEEKS.forEach(w => {
    const d = S.weekProgress[w.n] || 0;
    const pct = Math.min(100, Math.round(d / 5 * 100));
    const card = el('div', 'week-card');
    card.innerHTML = `
      <div class="week-head">
        <div class="week-title">第 ${w.n} 周</div>
        <div class="week-pct">${d}/5 天</div>
      </div>
      <div class="week-goal">${w.goal}</div>
      <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
      <button class="btn ghost" style="width:100%">打卡今天</button>`;
    card.querySelector('button').onclick = () => {
      if (!S.weekProgress[w.n]) S.weekProgress[w.n] = 0;
      if (S.weekProgress[w.n] < 5) { S.weekProgress[w.n]++; bumpToday(); }
      save(); renderWeeks(); renderDashboard();
      toast('第 ' + w.n + ' 周已打卡 ' + S.weekProgress[w.n] + '/5 天');
    };
    box.appendChild(card);
  });
}

// ===== 数据管理 =====
$('btnExport').onclick = () => {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'english-trainer-backup-' + S.today + '.json';
  a.click();
  toast('已导出');
};
$('btnImport').onclick = () => $('importFile').click();
$('importFile').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      S = { ...defaultState, ...JSON.parse(fr.result) };
      save(); renderAll(); toast('导入成功');
    } catch (err) { toast('文件格式错误'); }
  };
  fr.readAsText(f);
};
$('btnReset').onclick = () => {
  if (!confirm('确定清空全部学习数据？此操作不可撤销。')) return;
  localStorage.removeItem(KEY);
  S = { ...defaultState, today: todayStr() };
  renderAll(); toast('已重置');
};

// ===== 初始化 =====
function renderAll() {
  renderDashboard();
  renderScripts();
  renderRegion();
  initDialogue();
  renderWeeks();
  renderChecks();
  renderNotes();
  renderRecList();
  updateShadowBar();
  initASR();
  initURL();
  initDict();
  initPack();
  // 素材包的地区下拉
  const pk = $('pkRegion');
  if (pk && pk.options.length === 0) {
    REGIONS.forEach(r => {
      const o = document.createElement('option');
      o.value = r.id; o.textContent = r.short;
      pk.appendChild(o);
    });
  }
  $('btnReadRegion').onclick = readRegion;
  $('btnStopRegion').onclick = stopSpeak;
  $('btnApplyRegion').onclick = () => {
    const t = document.querySelector('.tab[data-view="dialogue"]');
    t.click();
    toast('已切换到' + getRegion(S.region).short + '口音的实景对话');
  };
  // 语速选择器显示当前地区基准
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
}
renderAll();
