const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.click('#sampleBtn');
  await page.waitForFunction(() => window.__dance.aligned, null, { timeout: 60000 });
  await page.waitForTimeout(500);
  await page.click('#playBtn');
  const samples = [];
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(500);
    samples.push(await page.evaluate(() => {
      const S = window.__dance, p = document.getElementById('vidP'), f = document.getElementById('vidF');
      // practice time should equal fancam time - d
      return { T: +S.T.toFixed(2), driftMs: Math.round((p.currentTime - (f.currentTime - S.d)) * 1000), rateP: p.playbackRate, mutedF: f.muted, mutedP: p.muted };
    }));
  }
  console.log(samples.map((x) => `T=${x.T} drift=${x.driftMs}ms rate=${x.rateP}`).join('\n'));
  console.log('fancam muted?', samples[3].mutedF, 'practice muted?', samples[3].mutedP);
  await page.click('#playBtn');
  await browser.close();
})();
