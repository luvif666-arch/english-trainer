// ===== 点词查词 =====
// 单词：dictionaryapi.dev（英文释义/音标/例句，CC BY-SA 3.0）+ MyMemory（中文翻译）
// 全部走公开免费接口，结果缓存在 localStorage，查过的不重复请求。

const dictCache = JSON.parse(localStorage.getItem('trade-english-dict-cache') || '{}');
let dictPending = null;

function cacheSet(k, v) {
  dictCache[k] = v;
  // 控制缓存体积，超了就丢最早的一半
  const keys = Object.keys(dictCache);
  if (keys.length > 600) {
    keys.slice(0, 300).forEach(k2 => delete dictCache[k2]);
  }
  try { localStorage.setItem('trade-english-dict-cache', JSON.stringify(dictCache)); } catch (e) { }
}

// 打开释义卡
function openDict(word, sentence) {
  const card = $('dictCard');
  card.style.display = 'block';
  $('dictWord').textContent = word;
  $('dictBody').innerHTML = '<div class="dict-loading">查询中…</div>';
  card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  const en = word.toLowerCase();
  if (dictCache[en]) { renderDict(word, dictCache[en], sentence); return; }
  if (dictPending) dictPending.abort();
  const ctl = new AbortController();
  dictPending = ctl;
  // 单个请求最长等6 秒，超了就用已有结果渲染，绝不卡在"查询中"
  const timer = setTimeout(() => ctl.abort(), 6000);

  const fail = err => { err && err.name === 'AbortError' && null; };

  Promise.allSettled([
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(en), { signal: ctl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))).catch(e => { fail(e); return null; }),
    fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(en) + '&langpair=en|zh-CN', { signal: ctl.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))).catch(e => { fail(e); return null; })
  ]).then(([dictRes, transRes]) => {
    clearTimeout(timer);
    if (ctl.signal.aborted && dictPending === ctl) { /* 超时或被新查询取代 */ }
    const dict = dictRes.status === 'fulfilled' ? dictRes.value : null;
    const trans = transRes.status === 'fulfilled' ? transRes.value : null;

    const entry = dict && dict[0] ? dict[0] : null;
    let phonetic = '';
    let defs = [];
    if (entry) {
      if (entry.phonetic) phonetic = entry.phonetic;
      else if (entry.phonetics && entry.phonetics.length) {
        const p = entry.phonetics.find(x => x.text);
        if (p) phonetic = p.text;
      }
      (entry.meanings || []).slice(0, 3).forEach(m => {
        (m.definitions || []).slice(0, 2).forEach(d => {
          defs.push({ pos: m.partOfSpeech || '', def: d.definition || '', ex: d.example || '' });
        });
      });
    }
    const zh = trans && trans.responseData ? (trans.responseData.translatedText || '') : '';
    const data = { phonetic, defs: defs.slice(0, 5), zh: /^\d+$|^[\s\W]*$/.test(zh) ? '' : zh };

    if (!data.phonetic && !data.defs.length && !data.zh) {
      $('dictBody').innerHTML = `<div class="dict-loading">
        没查到「${esc(word)}」。<br>
        <span style="color:var(--tx-3)">可能是专有名词/缩写，或词典服务暂时不可用。试试换个词，或联网后再试。</span>
      </div>`;
      $('btnDictSpeak').onclick = () => { };
      return;
    }
    cacheSet(en, data);
    renderDict(word, data, sentence);
  });
}

function renderDict(word, data, sentence) {
  const reg = getRegion(S.region);
  const u = new SpeechSynthesisUtterance(word);
  const v = pickVoice(reg.voice);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = reg.voice;
  u.rate = 0.85;

  let html = '';
  if (data.zh) html += `<div class="dict-zh">${esc(data.zh)}</div>`;
  if (data.phonetic) html += `<div class="dict-ipa">${esc(data.phonetic)}</div>`;
  if (data.defs.length) {
    html += '<div class="dict-defs">';
    data.defs.forEach(d => {
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
