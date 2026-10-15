// ===== 点词查词 =====
// 三层来源（按速度优先级）：
//   1. 本地缓存 —— 查过的词直接返回
//   2. 内置离线词典 —— 外贸高频词，零延迟、零网络（约 120 词）
//   3. MyMemory 在线翻译 —— 补中文释义（dictionaryapi.dev 在浏览器里 CORS 被拒，已弃用）

const dictCache = JSON.parse(localStorage.getItem('trade-english-dict-cache') || '{}');
let dictPending = null;

function cacheSet(k, v) {
  dictCache[k] = v;
  const keys = Object.keys(dictCache);
  if (keys.length > 600) keys.slice(0, 300).forEach(k2 => delete dictCache[k2]);
  try { localStorage.setItem('trade-english-dict-cache', JSON.stringify(dictCache)); } catch (e) { }
}

// 打开释义卡
function openDict(word, sentence) {
  const card = $('dictCard');
  card.style.display = 'block';
  $('dictWord').textContent = word;
  card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  // 先占位，同时立刻读本地
  $('dictBody').innerHTML = '<div class="dict-loading">查询中…</div>';
  $('btnDictSpeak').onclick = () => { };

  const en = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (dictCache[en]) { renderDict(word, dictCache[en], sentence); return; }

  // ① 离线词典命中：立即渲染，不等网络
  const local = lookupLocal(word);
  let base = null;
  if (local.found) {
    base = {
      phonetic: local.ipa || '',
      defs: [{ pos: local.pos, def: local.def, ex: local.ex }],
      zh: local.zh || ''
    };
    renderDict(word, base, sentence, true);   // 离线命中，不显示"查询中"
  }

  if (dictPending) dictPending.abort();
  const ctl = new AbortController();
  dictPending = ctl;
  const timer = setTimeout(() => ctl.abort(), 6000);

  // ② 补中文（离线词典已有中文则跳过）
  if (base && base.zh) { clearTimeout(timer); return; }

  fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(word) + '&langpair=en|zh-CN', { signal: ctl.signal })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(d => {
      clearTimeout(timer);
      const zh = d && d.responseData ? (d.responseData.translatedText || '') : '';
      if (!zh || /^\d+$/.test(zh.trim())) throw new Error('no translation');
      const data = base
        ? { ...base, zh: zh.replace(/^[\s\W]*|\s*$/g, '').replace(/^v\.|^n\.|^adj\.\s*/i, '') }
        : { phonetic: '', defs: [], zh: zh.trim() };
      cacheSet(en, data);
      renderDict(word, data, sentence);
    })
    .catch(() => {
      clearTimeout(timer);
      if (base) return;   // 离线词典已经渲染过了，忽略
      $('dictBody').innerHTML = `<div class="dict-loading">
        没查到「${esc(word)}」。<br>
        <span style="color:var(--tx-3)">可能是专有名词/缩写，或是翻译服务暂时不可用。换个词或联网后再试。</span>
      </div>`;
    });
}

function renderDict(word, data, sentence, isLocal) {
  const reg = getRegion(S.region);
  const u = new SpeechSynthesisUtterance(word);
  const v = pickVoice(reg.voice);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = reg.voice;
  u.rate = 0.85;

  let html = '';
  if (data.zh) html += `<div class="dict-zh">${esc(data.zh)}</div>`;
  if (data.phonetic) html += `<div class="dict-ipa">${esc(data.phonetic)}</div>`;
  if (isLocal) html += '<div class="dict-src">内置外贸词典 · 离线</div>';
  if (data.defs && data.defs.length) {
    html += '<div class="dict-defs">';
    data.defs.forEach(d => {
      if (!d.def) return;
      html += `<div class="dict-def">
        ${d.pos ? `<span class="dict-pos">${esc(d.pos)}</span>` : ''}
        <span class="dict-text">${esc(d.def)}</span>
        ${d.ex ? `<div class="dict-ex">${esc(d.ex)}</div>` : ''}
      </div>`;
    });
    html += '</div>';
  }
  if (sentence) {
    html += `<button class="dict-sent" id="dictSentBtn">看整句翻译 ›</button>
      <div class="dict-sent-out" id="dictSentOut"></div>`;
  }
  $('dictBody').innerHTML = html;

  $('btnDictSpeak').onclick = () => { speechSynthesis.cancel(); speechSynthesis.speak(u); };
  const sb = $('dictSentBtn');
  if (sb) sb.onclick = (e) => { e.stopPropagation(); translateSentence(sentence); };
}

function translateSentence(s) {
  const out = $('dictSentOut');
  if (!out) return;
  if (out.innerHTML) { out.innerHTML = ''; return; }  // 再点收起
  out.innerHTML = '<div class="dict-loading">翻译中…</div>';
  const key = 'S:' + s;
  if (dictCache[key]) { out.innerHTML = `<div class="dict-sent-out-txt">${esc(dictCache[key])}</div>`; return; }
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(s) + '&langpair=en|zh-CN', { signal: ctl.signal })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(d => {
      clearTimeout(timer);
      const t = d && d.responseData ? d.responseData.translatedText : '';
      if (!t) { out.innerHTML = '<div class="dict-loading">翻译失败，稍后再试</div>'; return; }
      cacheSet(key, t);
      out.innerHTML = `<div class="dict-sent-out-txt">${esc(t)}</div>`;
    })
    .catch(() => {
      clearTimeout(timer);
      out.innerHTML = '<div class="dict-loading">翻译失败，检查网络或稍后再试</div>';
    });
}

// 把一段英文渲染成可点词的 HTML（单词为按钮，空白处可点=整句翻译）
function tokenizeHTML(sentence) {
  const esc_ = esc(sentence);
  return esc_
    .split(/(\s+)/)
    .map(tok => {
      if (/^\s+$/.test(tok)) return '<span class="sp-tap">' + tok + '</span>';
      const m = tok.match(/^([^A-Za-z0-9'’-]*)([A-Za-z][A-Za-z'’-]*)([^A-Za-z0-9'’-]*)$/);
      if (!m) return '<span class="w-btn" data-w="' + esc(tok) + '">' + tok + '</span>';
      return m[1] + '<span class="w-btn" data-w="' + esc(m[2]) + '">' + m[2] + '</span>' + m[3];
    })
    .join('');
}

// 事件委托：点单词查词，点空白查整句
function initDict() {
  $('dictClose').onclick = () => { $('dictCard').style.display = 'none'; };
  $('btnDictSave').onclick = () => {
    const w = $('dictWord').textContent;
    if (w && w.length < 30 && !w.includes('…')) addVocab(w);
    else toast('整句没法加入生词本，点具体单词试试');
  };
  document.addEventListener('click', e => {
    const wb = e.target.closest('.w-btn');
    if (wb) {
      e.stopPropagation();
      const sent = wb.closest('[data-sentence]');
      openDict(wb.dataset.w, sent ? sent.dataset.sentence : '');
      return;
    }
    const sp = e.target.closest('.sp-tap');
    if (sp) {
      e.stopPropagation();
      const sent = sp.closest('[data-sentence]');
      if (sent) { openDict(sent.dataset.sentence.slice(0, 22) + '…', sent.dataset.sentence); }
      return;
    }
    const sb = e.target.closest('.sent-tap');
    if (sb) {
      e.stopPropagation();
      openDict(sb.dataset.sentence.slice(0, 22) + '…', sb.dataset.sentence);
    }
  });
}
