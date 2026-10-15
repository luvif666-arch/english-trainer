const puppeteer = require('puppeteer-core');
const path = require('path');
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');
const errors = [], logs = [];

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
  });

  // ===== 移动端iPhone 尺寸 =====
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') logs.push('[err] ' + m.text()); });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.goto(PAGE, { waitUntil: 'networkidle2' });
  console.log('移动端视口 390×844 已载入');

  // 断言 M1：无横向溢出
  const m1 = await page.evaluate(() => ({
    docW: document.documentElement.scrollWidth,
    winW: window.innerWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1
  }));
  console.log('M1 横向溢出:', JSON.stringify(m1), m1.overflow ? '✗ 有溢出' : '✓');

  // 断言 M2：所有tab 可点且可见
  const m2 = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.tab')];
    return {
      count: tabs.length,
      allVisible: tabs.every(t => t.offsetParent !== null && t.offsetHeight > 0),
      scrollable: document.querySelector('.tabs').scrollWidth > document.querySelector('.tabs').clientWidth,
      minH: Math.min(...tabs.map(t => t.offsetHeight))
    };
  });
  console.log('M2 tab可用性:', JSON.stringify(m2), m2.allVisible && m2.minH >= 30 ? '✓ 触摸高度达标' : '✗');

  // 断言 M3：素材包视图
  await page.click('.tab[data-view="pack"]');
  await wait(300);
  const m3 = await page.evaluate(() => ({
    presets: document.querySelectorAll('#packList .preset').length,
    pkRegionOpts: document.querySelectorAll('#pkRegion option').length,
    vocabHint: !!document.querySelector('#vocabList'),
    form: !!document.querySelector('#packForm')
  }));
  console.log('M3 素材包:', JSON.stringify(m3));

  // 断言 M4：添加素材到清单 → 持久化
  await page.type('#pkName', '测试素材 商务谈判');
  await page.click('#packForm button[type=submit]');
  await wait(300);
  const m4 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('trade-english-trainer-v1'));
    return { packs: s.packs.length, first: s.packs[0] && s.packs[0].name, inDom: !!document.querySelector('#packList .pack') };
  });
  console.log('M4 素材持久化:', JSON.stringify(m4));

  // 断言 M5：生词本
  await page.evaluate(() => {
    window.addVocab('negotiation', '议价');
    window.addVocab('quotation', '报价单');
  });
  await wait(300);
  const m5 = await page.evaluate(() => {
    const items = document.querySelectorAll('#vocabList .vocab');
    const s = JSON.parse(localStorage.getItem('trade-english-trainer-v1'));
    return { inDom: items.length, stored: s.vocab.length, firstWord: items[0] && items[0].querySelector('.vw').textContent };
  });
  console.log('M5 生词本:', JSON.stringify(m5));

  // 断言 M6：点词查词（拦截 API，用假数据验证渲染链路）
  await page.setRequestInterception(true);
  page.on('request', r => {
    if (r.url().includes('dictionaryapi.dev')) {
      return r.respond({
        status: 200, contentType: 'application/json',
        body: JSON.stringify([{ phonetic: '/nɪˈɡəʊʃieɪt/', meanings: [{ partOfSpeech: 'verb', definitions: [{ definition: 'to try to reach an agreement by discussion', example: 'We negotiated a lower price.' }] }] }])
      });
    }
    if (r.url().includes('mymemory')) {
      return r.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ responseData: { translatedText: 'v. 谈判, 商议' } }) });
    }
    r.continue();
  });

  await page.click('.tab[data-view="dialogue"]');
  await wait(400);
  const m6a = await page.evaluate(() => document.querySelectorAll('#dlgBody .w-btn').length);
  await page.evaluate(() => document.querySelector('#dlgBody .w-btn').click());
  await wait(900);
  const m6b = await page.evaluate(() => ({
    visible: document.getElementById('dictCard').style.display,
    word: document.getElementById('dictWord').textContent,
    zh: (document.querySelector('.dict-zh') || {}).textContent || '',
    pos: (document.querySelector('.dict-pos') || {}).textContent || '',
    def: (document.querySelector('.dict-text') || {}).textContent || '',
    ex: (document.querySelector('.dict-ex') || {}).textContent || '',
    hasSentBtn: !!document.getElementById('dictSentBtn')
  }));
  console.log('M6a 可点词数:', m6a);
  console.log('M6b 查词卡片:', JSON.stringify(m6b));

  // 断言 M7：整句翻译
  if (m6b.hasSentBtn) {
    await page.click('#dictSentBtn');
    await wait(700);
    const m7 = await page.evaluate(() => ({
      txt: (document.querySelector('.dict-sent-out-txt') || {}).textContent || 'NONE'
    }));
    console.log('M7 整句翻译:', JSON.stringify(m7));
  }

  // 断言 M8：词典卡片在移动端不出屏
  const m8 = await page.evaluate(() => {
    const r = document.getElementById('dictCard').getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), winW: window.innerWidth, inScreen: r.left >= 0 && r.right <= window.innerWidth + 1 };
  });
  console.log('M8 卡片不出屏:', JSON.stringify(m8), m8.inScreen ? '✓' : '✗');

  // 断言 M9：触屏点击区尺寸
  const m9 = await page.evaluate(() => {
    const pick = sel => { const e = document.querySelector(sel); return e ? { w: Math.round(e.offsetWidth), h: Math.round(e.offsetHeight) } : null; };
    return { wbtn: pick('#dlgBody .w-btn'), packCheck: null, dictIcon: pick('.dict-icon') };
  });
  console.log('M9 触摸尺寸:', JSON.stringify(m9));

  // 截图
  await page.screenshot({ path: path.join(__dirname, '_m_dialogue.png') });
  console.log('截图: _m_dialogue.png');

  // ===== 桌面端复测（确保没搞坏）=====
  const d = await browser.newPage();
  d.on('pageerror', e => errors.push('DESKTOP PAGEERROR: ' + e.message));
  await d.setViewport({ width: 1440, height: 1000 });
  await d.goto(PAGE, { waitUntil: 'networkidle2' });
  const d1 = await d.evaluate(() => ({
    tabs: document.querySelectorAll('.tab').length,
    presets: (document.querySelector('.tab[data-view="pack"]').click(), 0) || 0
  }));
  await wait(300);
  const d2 = await d.evaluate(() => ({
    presets: document.querySelectorAll('#packList .preset').length,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1
  }));
  console.log('桌面端 tabs:', d1.tabs, '预设素材:', d2.presets, '横向溢出:', d2.overflow);

  console.log('\n--- 错误 (' + errors.length + ') ---');
  errors.forEach(e => console.log('  ' + e));
  console.log(errors.length ? 'RESULT: FAIL' : 'RESULT: PASS');
  await browser.close();
})();
