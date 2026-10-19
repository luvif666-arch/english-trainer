// 素材包网络标注 + 下载器入口 专项测试
const puppeteer = require('puppeteer-core');
const path = require('path');
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');

const logs = [], errors = [];
const R = [];
function chk(id, cond, detail) {
  R.push({ id, pass: !!cond, detail: detail || '' });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 1440, height: 1000 },
  });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(PAGE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 900));

  // P1 切到素材包页
  const okNav = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.tab')];
    const t = tabs.find(x => /素材/.test(x.textContent));
    if (!t) return false;
    t.click(); return true;
  });
  chk('P1', okNav, '切到素材包页');
  await new Promise(r => setTimeout(r, 700));

  // P2 网络说明存在且点名了具体站点
  const note = await page.evaluate(() => {
    const n = document.querySelector('.net-note');
    return n ? n.textContent : '';
  });
  chk('P2', /B站/.test(note) && /YouTube/.test(note) && /代理/.test(note),
      '网络说明含 B站/YouTube/代理 关键信息');

  // P3 下载器链接指向本地端口
  const dlLink = await page.evaluate(() => {
    const a = document.querySelector('.net-note a');
    return a ? a.getAttribute('href') : '';
  });
  chk('P3', dlLink === 'http://127.0.0.1:8765', '下载器链接 = ' + dlLink);

  // P4 网络标签已渲染
  const tags = await page.evaluate(() => ({
    ok: document.querySelectorAll('.pack-tag.net-ok').length,
    need: document.querySelectorAll('.pack-tag.net-need').length,
  }));
  chk('P4', tags.ok >= 3 && tags.need >= 5,
      `B站可用=${tags.ok} 需YouTube=${tags.need}`);

  // P5 B站素材排在前面的（建议优先用能下的）
  const firstNet = await page.evaluate(() => {
    const first = document.querySelector('.preset');
    return first ? !!first.querySelector('.net-ok') : false;
  });
  chk('P5', firstNet, '首条推荐是B站可用素材');

  // P6 PRESET_PACKS 数量与数据完整性
  const pk = await page.evaluate(() => ({
    n: PRESET_PACKS.length,
    allNet: PRESET_PACKS.every(p => p.net === 'ok' || p.net === 'need'),
    allUrl: PRESET_PACKS.every(p => /^https?:\/\//.test(p.url)),
  }));
  chk('P6', pk.n === 8 && pk.allNet && pk.allUrl,
      `素材数=${pk.n} 全有net标记=${pk.allNet} 全有合法URL=${pk.allUrl}`);

  // P7 加入清单仍可用
  const add = await page.evaluate(() => {
    const b = document.querySelector('.preset .act-add');
    if (!b) return 'no-btn';
    b.click();
    return (S.packs && S.packs.length) || 0;
  });
  chk('P7', add >= 1, '加入清单后 packs=' + add);

  // P8 样式真的生效（不是裸HTML）
  const styled = await page.evaluate(() => {
    const t = document.querySelector('.net-note');
    const s = document.querySelector('.pack-tag.net-ok');
    if (!t || !s) return null;
    const ct = getComputedStyle(t), cs = getComputedStyle(s);
    return {
      noteBorder: ct.borderTopWidth,
      okColor: cs.color,
    };
  });
  chk('P8', styled && styled.noteBorder === '1px',
      'net-note 边框生效=' + (styled && styled.noteBorder));

  // P9 其他页没被弄坏
  const others = await page.evaluate(() => {
    const out = {};
    for (const [k, sel] of [['dash', '总览'], ['shadow', '影子跟读'], ['dialog', '实景对话'], ['region', '目标地区']]) {
      const t = [...document.querySelectorAll('.tab')].find(x => x.textContent.includes(sel));
      if (t) { t.click(); out[k] = true; } else out[k] = false;
    }
    return out;
  });
  chk('P9', Object.values(others).every(Boolean), JSON.stringify(others));

  await browser.close();

  console.log('\n=== 结果 ===');
  R.forEach(r => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}  ${r.detail}`));
  const fail = R.filter(r => !r.pass).length;
  console.log(`\n${fail === 0 ? 'RESULT: PASS' : 'RESULT: FAIL (' + fail + ')'}`);
  console.log('console 报错:', logs.length, logs.slice(0, 3).join(' | '));
  console.log('JS 异常:', errors.length, errors.slice(0, 3).join(' | '));
  process.exit(fail === 0 && errors.length === 0 ? 0 : 1);
})();