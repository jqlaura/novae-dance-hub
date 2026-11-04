const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:8765/index.html');
  const pairs = [['IMG_practice.MOV', 'fancam_moov_end.mp4']];
  for (const [p, f] of pairs) {
    await page.setInputFiles('#fileP', path.join(__dirname, 'tmp', p));
    await page.waitForFunction(() => window.__dance.env.p || document.getElementById('status').className.includes('err'), null, { timeout: 60000 });
    await page.setInputFiles('#fileF', path.join(__dirname, 'tmp', f));
    await page.waitForFunction(() => window.__dance.aligned || document.getElementById('status').className.includes('err'), null, { timeout: 60000 });
    console.log(p, '+', f, await page.evaluate(() => JSON.stringify({ d: window.__dance.d, how: window.__dance.how, status: document.getElementById('statusMain').textContent + ' ' + document.getElementById('statusSub').textContent })));
  }
  // same file, two decode paths: is there any time shift between them?
  for (const f of ['IMG_practice.MOV', 'fancam_moov_end.mp4']) {
    const buf = require('fs').readFileSync(path.join(__dirname, 'tmp', f));
    const r = await page.evaluate(async ([b64, name]) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const file = new File([bytes], name);
      const T = window.__dance._t;
      const a = (await T.decodeVideoAudio(file)).ab, b = await T.decode(bytes.buffer.slice(0));
      const ea = T.onsetEnvelope(await T.toMono(a)), eb = T.onsetEnvelope(await T.toMono(b));
      return { demuxDur: a.duration, nativeDur: b.duration, shiftMs: T.align(eb, ea).d * 1000 };
    }, [buf.toString('base64'), f]);
    console.log(f, JSON.stringify(r));
  }
  await browser.close();
})();
