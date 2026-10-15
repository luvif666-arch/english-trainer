const puppeteer = require('puppeteer-core');
const path = require('path');
const PAGE = 'file:///' + path.resolve(__dirname, '..', 'index.html').split(path.sep).join('/');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--allow-file-access-from-files'],
  });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', m => console.log('[' + m.type() + ']', m.text()));
  await page.goto(PAGE, { waitUntil: 'networkidle2' });

  // 真实网络下测试两个 API 是否在浏览器里通
  const r = await page.evaluate(async () => {
    const out = { dict: null, trans: null, err: null };
    try {
      const d = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/negotiate');
      out.dictStatus = d.status;
      const j = await d.json();
      out.dictHasData = !!(j && j[0]);
    } catch (e) { out.err = 'dict: ' + e.message; }
    try {
      const t = await fetch('https://api.mymemory.translated.net/get?q=negotiate&langpair=en|zh-CN');
      out.transStatus = t.status;
      const j2 = await t.json();
      out.trans = j2.responseData.translatedText;
    } catch (e) { out.err = (out.err || '') + ' trans: ' + e.message; }
    return out;
  });
  console.log('浏览器内 API 连通性:', JSON.stringify(r, null, 1));

  // 直接调 openDict 看渲染
  await page.evaluate(() => { window.openDict('negotiate', 'We negotiated a lower price.'); });
  await wait(8000);
  const r2 = await page.evaluate(() => ({
    word: document.getElementById('dictWord').textContent,
    bodyHtml: document.getElementById('dictBody').innerHTML.slice(0, 260),
    zh: (document.querySelector('.dict-zh') || {}).textContent || '(无)',
    def: (document.querySelector('.dict-text') || {}).textContent || '(无)',
    hasSentBtn: !!document.getElementById('dictSentBtn')
  }));
  console.log('openDict 渲染(等8s):', JSON.stringify(r2, null, 1));

  await browser.close();
})();
