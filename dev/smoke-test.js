const puppeteer = require('puppeteer-core');
const path = require('path');
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');

const logs = [], errors = [];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: 1440, height: 1000 },
  });
  console.log('浏览器已启动');

  const page = await browser.newPage();
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => {
    const u = r.url();
    if (u.includes('huggingface') || u.includes('jsdelivr')) return; // ASR 模型未触发下载，正常
    errors.push('REQFAIL: ' + u + ' — ' + (r.failure() && r.failure().errorText));
  });

  await page.goto(PAGE, { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('页面已载入');

  // 断言 1：初始化完成，各视图元素已渲染
  const r1 = await page.evaluate(() => ({
    tabs: document.querySelectorAll('.tab').length,
    views: document.querySelectorAll('.view').length,
    tasks: document.querySelectorAll('#todayTasks .task').length,
    heatCells: document.querySelectorAll('#heatBox .heat-cell').length,
    radarSvg: !!document.querySelector('#radarBox svg'),
    scriptCards: document.querySelectorAll('#scriptBox .script-card').length,
    regionCards: document.querySelectorAll('#regionGrid .region-card').length,
    dlgOptions: document.querySelectorAll('#dlgSelect option').length,
    dlgRegionOptions: document.querySelectorAll('#dlgRegion option').length,
    dlgLines: document.querySelectorAll('#dlgBody .dlg-line').length,
    dlgNotes: document.querySelectorAll('#dlgNotes .dlg-note').length,
    weekCards: document.querySelectorAll('#weekBox .week-card').length,
    asrOptions: document.querySelectorAll('#asrModel option').length,
    checkItems: document.querySelectorAll('#selfCheck .check-item').length,
  }));
  console.log('断言1 初始渲染:', JSON.stringify(r1));

  // 断言 2：地区切换联动
  await page.click('.tab[data-view="region"]');
  const r2before = await page.evaluate(() => document.getElementById('rgTitle').textContent);
  const cards = await page.$$('#regionGrid .region-card');
  await cards[1].click();
  await new Promise(r => setTimeout(r, 300));
  const r2 = await page.evaluate(() => ({
    title: document.getElementById('rgTitle').textContent,
    styleItems: document.querySelectorAll('#rgStyle .rg-style-item').length,
    words: document.querySelectorAll('#rgWords .rg-word').length,
    speech: document.getElementById('rgSpeech').textContent.slice(0, 30),
    hint: document.getElementById('rpRegionHint').textContent.slice(0, 30),
    dlgSel: document.getElementById('dlgRegion').value,
  }));
  console.log('断言2 切换地区 前:', r2before, '→ 后:', JSON.stringify(r2));

  // 断言 3：手写句子载入跟读播放器
  await page.click('.tab[data-view="shadow"]');
  await page.click('#btnSample');
  await page.click('#btnLoadMaterial');
  await new Promise(r => setTimeout(r, 300));
  const r3 = await page.evaluate(() => ({
    lineItems: document.querySelectorAll('#lineList .line-item').length,
    nowLine: document.getElementById('nowLine').textContent,
    bar: document.getElementById('barShadowDetail').style.width,
    detail: document.getElementById('shadowDetailText').textContent,
  }));
  console.log('断言3 载入10句:', JSON.stringify(r3));

  // 断言 4：跳句 + 标记掌握
  await page.click('#lineList .line-item:nth-child(3)');
  await new Promise(r => setTimeout(r, 200));
  const r4a = await page.evaluate(() => document.getElementById('nowSub').textContent);
  await page.evaluate(() => {
    const it = document.querySelectorAll('#lineList .line-item');
    it[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    it[1].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 200));
  const r4 = await page.evaluate(() => ({
    nowSub: document.getElementById('nowSub').textContent,
    detail: document.getElementById('shadowDetailText').textContent,
    bar: document.getElementById('barShadowDetail').style.width,
    masteredCount: document.querySelectorAll('#lineList .line-item.mastered').length,
  }));
  console.log('断言4 跳句到第3句:', r4a);
  console.log('断言4 双击标记掌握后:', JSON.stringify(r4));

  // 断言 5：URL 解析生成下载指引
  await page.type('#urlInput', 'https://www.bilibili.com/video/BV1xx411c7mD');
  await page.click('#btnParseURL');
  await new Promise(r => setTimeout(r, 300));
  const r5 = await page.evaluate(() => {
    const g = document.getElementById('urlGuide');
    const c = document.getElementById('dlCmd');
    return {
      visible: g.style.display,
      hasTitle: !!g.querySelector('.guide-title'),
      hasSteps: g.querySelectorAll('.guide-steps li').length,
      cmd: c ? c.textContent.slice(0, 90) : 'NO_CMD',
      note: !!g.querySelector('.guide-note'),
    };
  });
  console.log('断言5 B站链接解析:', JSON.stringify(r5));

  // 断言 6：AI 陪练提示词含地区信息
  await page.click('.tab[data-view="roleplay"]');
  await page.click('#btnGenPrompt');
  await new Promise(r => setTimeout(r, 200));
  const r6 = await page.evaluate(() => {
    const v = document.getElementById('rpPrompt').value;
    return {
      len: v.length,
      hasTarget: v.includes('## Target market'),
      hasBargain: v.includes('Bargaining style'),
      hasRule9: v.includes('target-market style'),
      first60: v.slice(0, 60).replace(/\n/g, ' | '),
    };
  });
  console.log('断言6 陪练提示词:', JSON.stringify(r6));

  // 断言 7：话术库自动替换
  await page.click('.tab[data-view="scripts"]');
  await page.type('#myProduct', 'LED Panel');
  await page.type('#myCompany', 'Sunrise Tech');
  await new Promise(r => setTimeout(r, 300));
  const r7 = await page.evaluate(() => {
    const all = document.querySelectorAll('#scriptBox .sl-en');
    let hitProduct = 0, hitCompany = 0, leftBracket = 0;
    all.forEach(e => {
      if (e.textContent.includes('LED Panel')) hitProduct++;
      if (e.textContent.includes('Sunrise Tech')) hitCompany++;
      if (e.textContent.includes('[产品]') || e.textContent.includes('[')) leftBracket++;
    });
    return { total: all.length, hitProduct, hitCompany, leftBracket };
  });
  console.log('断言7 占位符替换:', JSON.stringify(r7));

  // 断言 8：自评勾选门槛
  await page.click('.tab[data-view="record"]');
  await page.evaluate(() => {
    document.querySelectorAll('#selfCheck input').forEach((c, i) => { if (i < 2) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); } });
  });
  await page.click('#btnFinishRecord');
  await new Promise(r => setTimeout(r, 200));
  const r8 = await page.evaluate(() => ({ stat: document.getElementById('statRecord').textContent }));
  console.log('断言8 勾2项应被拒绝, 复述进度仍为:', r8.stat);

  // 断言 9：周打卡持久化
  await page.click('.tab[data-view="path"]');
  await page.evaluate(() => document.querySelector('#weekBox .week-card button').click());
  await new Promise(r => setTimeout(r, 200));
  const r9 = await page.evaluate(() => {
    const raw = localStorage.getItem('trade-english-trainer-v1');
    const s = raw ? JSON.parse(raw) : {};
    return { week1: s.weekProgress && s.weekProgress['1'], region: s.region, history: Object.keys(s.history || {}).length };
  });
  console.log('断言9 打卡持久化:', JSON.stringify(r9));

  // 截图
  const shots = [
    ['dashboard', '.tab[data-view="dashboard"]'],
    ['shadow', '.tab[data-view="shadow"]'],
    ['dialogue', '.tab[data-view="dialogue"]'],
    ['region', '.tab[data-view="region"]'],
  ];
  for (const [name, sel] of shots) {
    await page.click(sel);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(__dirname, '_shot_' + name + '.png') });
    console.log('截图: _shot_' + name + '.png');
  }

  const realErrors = errors.filter(e => !e.includes('favicon'));
  console.log('\n--- console 日志 ---');
  logs.slice(0, 20).forEach(l => console.log('  ' + l));
  console.log('\n--- 错误 (' + realErrors.length + ') ---');
  realErrors.forEach(e => console.log('  ' + e));
  console.log(realErrors.length ? 'RESULT: FAIL' : 'RESULT: PASS');

  await browser.close();
})();
