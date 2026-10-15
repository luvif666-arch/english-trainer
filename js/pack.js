// ===== 素材包 =====
// 把"待跟读的材料"存成清单：链接 + 地区 + 难度 + 预计耗时 + 完成状态。
// 预置一批适合小白的免费素材（欧美官方源为主，避免中式英语）。

const PRESET_PACKS = [
  {
    id: 'p1', name: 'BBC Learning English · 6 Minute English',
    level: '入门', region: 'uk', mins: 6, dur: '1-2周',
    url: 'https://www.youtube.com/@bbclearningenglish',
    why: '每集 6 分钟讲一个话题，结尾有总结句可以直接复述。语速适中、英音清晰，最适合起步。',
    tip: '先看中文字幕听懂，再关字幕盲听一遍，最后跟读最后 30 秒的总结'
  },
  {
    id: 'p2', name: 'Business English Pod · 电话与议价',
    level: '入门', region: 'us', mins: 10, dur: '3-4周',
    url: 'https://www.youtube.com/@BusinessEnglishPod',
    why: '每集8-12 分钟，专攻打电话、询价、议价、投诉——正好是外贸最常用的场景。',
    tip: '挑"Telephone calls"和"Negotiating price"两个系列连着听，会话套路高度重复'
  },
  {
    id: 'p3', name: 'BBC Learning English · The English We Speak',
    level: '入门', region: 'uk', mins: 2, dur: '1周',
    url: 'https://www.youtube.com/@bbclearningenglish',
    why: '每集 2 分钟讲一个地道口语表达，碎片时间可练。',
    tip: '适合通勤时循环跟读，不用刻意背'
  },
  {
    id: 'p4', name: 'English at University · 学术演讲',
    level: '进阶', region: 'uk', mins: 12, dur: '5-6周',
    url: 'https://www.youtube.com/@EnglishatUniversity',
    why: '接近真实语速的讲座，练反应和长句理解。',
    tip: '先盲听 3 分钟做笔记，再看文稿对照，标记你没听出来的连读'
  },
  {
    id: 'p5', name: 'Al Jazeera English · 新闻访谈',
    level: '拔高', region: 'uk', mins: 15, dur: '7-8周',
    url: 'https://www.youtube.com/@AlJazeeraEnglish',
    why: '英音，议题和贸易/经济强相关，语速真实。',
    tip: '挑经济类议题，一周 2 次，练习用新闻内容练复述'
  },
  {
    id: 'p6', name: '哔哩哔哩 · 英文播客搬运',
    level: '入门', region: 'us', mins: 15, dur: '按需',
    url: 'https://www.bilibili.com',
    why: 'B站上有不少英文原声播客和访谈搬运，可作补充语料。',
    tip: '优先选能自动生成字幕的；避免"中国式英语"教学视频，跟着念会带偏口音'
  }
];

// ===== 生词本 =====
function addVocab(word, note) {
  if (!S.vocab) S.vocab = [];
  const w = word.trim();
  if (!w) return;
  if (S.vocab.some(v => v.w.toLowerCase() === w.toLowerCase())) { toast('已在生词本里'); return; }
  S.vocab.unshift({ w, note: note || '', date: S.today, cnt: 0 });
  if (S.vocab.length > 200) S.vocab.pop();
  save(); renderVocab();
  toast('已加入生词本');
}

function initPack() {
  $('packForm').onsubmit = e => {
    e.preventDefault();
    const name = $('pkName').value.trim();
    if (!name) { toast('填个名字'); return; }
    if (!S.packs) S.packs = [];
    S.packs.unshift({
      id: 'pk' + Date.now(),
      name,
      region: $('pkRegion').value,
      level: $('pkLevel').value,
      mins: parseInt($('pkMins').value, 10) || 10,
      url: $('pkUrl').value.trim(),
      why: $('pkWhy').value.trim(),
      done: false
    });
    save(); renderPacks();
    ['pkName', 'pkUrl', 'pkWhy'].forEach(i => $(i).value = '');
    toast('已加入待跟读清单');
  };
  renderPacks();
  renderVocab();
}

function renderPacks() {
  const box = $('packList');
  if (!box) return;
  box.innerHTML = '';

  // 用户清单
  const packs = S.packs || [];
  if (packs.length) {
    const h = el('h3', null, '我的待跟读清单（' + packs.filter(p => p.done).length + ' / ' + packs.length + ' 已完成）');
    box.appendChild(h);
  } else {
    box.appendChild(el('div', 'hint', '还没有自己的素材。从下面预置里挑一个开始，或用上方表单加自己的。'));
  }

  packs.forEach(p => {
    const reg = getRegion(p.region);
    const it = el('div', 'pack' + (p.done ? ' done' : ''));
    it.innerHTML = `
      <div class="pack-check" data-id="${p.id}">${p.done ? '✓' : ''}</div>
      <div class="pack-body">
        <div class="pack-title">${esc(p.name)}</div>
        <div class="pack-meta">
          <span class="pack-tag">${esc(reg.short)}</span>
          <span class="pack-tag">${esc(p.level)}</span>
          <span class="pack-tag">约 ${p.mins} 分钟</span>
        </div>
        ${p.why ? '<div class="pack-why">' + esc(p.why) + '</div>' : ''}
        ${p.url ? '<div class="pack-url" data-url="' + esc(p.url) + '">' + esc(p.url) + '</div>' : ''}
      </div>
      <div class="pack-del" data-id="${p.id}">×</div>`;
    it.querySelector('.pack-check').onclick = () => {
      p.done = !p.done;
      if (p.done) { bumpToday(); S.packDone = (S.packDone || 0) + 1; }
      save(); renderPacks(); renderDashboard();
    };
    it.querySelector('.pack-del').onclick = () => {
      S.packs = S.packs.filter(x => x.id !== p.id);
      save(); renderPacks();
    };
    const u = it.querySelector('.pack-url');
    if (u) u.onclick = () => copyText(p.url);
    box.appendChild(it);
  });

  // 预置推荐
  box.appendChild(el('h3', null, '预置推荐素材（免费，按难度分档）'));
  const grid = el('div', 'preset-grid');
  PRESET_PACKS.forEach(p => {
    const reg = getRegion(p.region);
    const c = el('div', 'preset');
    c.innerHTML = `
      <div class="preset-head">
        <div class="preset-name">${esc(p.name)}</div>
        <div class="preset-lv lv-${p.level === '入门' ? '1' : p.level === '进阶' ? '2' : '3'}">${esc(p.level)}</div>
      </div>
      <div class="preset-meta">
        <span class="pack-tag">${esc(reg.short)}</span>
        <span class="pack-tag">单集 ${p.mins} 分钟</span>
        <span class="pack-tag">建议 ${esc(p.dur)}</span>
      </div>
      <div class="preset-why">${esc(p.why)}</div>
      <div class="preset-tip"><b>怎么用：</b>${esc(p.tip)}</div>
      <div class="ctrl-row" style="margin-top:10px">
        <button class="btn ghost act-open" data-url="${esc(p.url)}">打开来源</button>
        <button class="btn act-add" data-id="${p.id}">加入我的清单</button>
      </div>`;
    c.querySelector('.act-open').onclick = () => window.open(p.url, '_blank');
    c.querySelector('.act-add').onclick = () => {
      if (!S.packs) S.packs = [];
      if (S.packs.some(x => x.presetId === p.id)) { toast('已在清单里'); return; }
      S.packs.unshift({
        id: 'pk' + Date.now(), presetId: p.id, name: p.name,
        region: p.region, level: p.level, mins: p.mins, url: p.url, why: p.tip, done: false
      });
      save(); renderPacks(); toast('已加入清单');
    };
    grid.appendChild(c);
  });
  box.appendChild(grid);
}

function renderVocab() {
  const box = $('vocabList');
  if (!box) return;
  box.innerHTML = '';
  const v = S.vocab || [];
  if (!v.length) {
    box.innerHTML = '<div class="hint">查词时点「加入生词本」，难句的词就会攒到这里，之后专门复习。</div>';
    return;
  }
  box.appendChild(el('div', 'hint', '共 ' + v.length + ' 个词。点词可重新查释义，点次数可标记已掌握。'));
  v.forEach((it, i) => {
    const d = el('div', 'vocab' + (it.cnt >= 3 ? ' got' : ''));
    d.innerHTML = `<div class="vw" data-i="${i}">${esc(it.w)}</div>
      <div class="vn">${esc(it.note || it.date)}</div>
      <div class="vc" data-i="${i}" title="点 3 次标记已掌握">${it.cnt || 0}/3</div>
      <div class="vd" data-i="${i}">×</div>`;
    d.querySelector('.vw').onclick = () => openDict(it.w, '');
    d.querySelector('.vc').onclick = () => {
      it.cnt = (it.cnt || 0) + 1;
      if (it.cnt >= 3) bumpToday();
      save(); renderVocab();
    };
    d.querySelector('.vd').onclick = () => { S.vocab.splice(i, 1); save(); renderVocab(); };
    box.appendChild(d);
  });
}
