// End-to-end: assignment → sample practice video → "not mirrored" → member → start time → create → download
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '/tmp';
  const port = process.argv[3] || '8765';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 860 }, acceptDownloads: true });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.screenshot({ path: path.join(out, 'v2_0_start.png'), fullPage: true });
  await page.selectOption('#assignment', 'demo');
  await page.click('#sampleOwn');
  await page.waitForFunction(() => window.__dance.env.p, null, { timeout: 60000 });
  await page.click('#mirrorChoice button[data-v="no"]');
  await page.click('#members button:has-text("Member B")');
  await page.waitForFunction(() => window.__dance.aligned, null, { timeout: 60000 });
  await page.fill('#startRange', '3');
  await page.dispatchEvent('#startRange', 'input');
  const st = await page.evaluate(() => { const S = window.__dance; return { d: +S.d.toFixed(3), startAt: S.startAt, L: +S.L.toFixed(2), mirror: S.mirror,
    steps: [1,2,3,4,5,6].map((n) => document.getElementById('step' + n).className), hint: document.getElementById('startHint').textContent,
    status: document.getElementById('statusMain').textContent, label: document.getElementById('labelF').textContent }; });
  console.log(JSON.stringify(st, null, 1));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, 'v2_1_ready.png'), fullPage: true });
  const dlP = page.waitForEvent('download', { timeout: 120000 });
  await page.click('#exportBtn');
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 120000 });
  await page.fill('#kidName', 'Test Kid');
  await page.click('#saveBtn');
  const dl = await dlP;
  const f = path.join(out, dl.suggestedFilename()); await dl.saveAs(f);
  console.log('downloaded', f);
  await page.click('#submitBtn');
  console.log('submit note:', await page.textContent('#submitNote'));
  await page.screenshot({ path: path.join(out, 'v2_2_done.png'), fullPage: true });
  await browser.close();
})();
