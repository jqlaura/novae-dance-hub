// Pretend to be an iPhone in Low Power Mode: videos may only play right after a tap on a "Tap to show" button.
// Checks that the preview and the Check-the-match stills offer that button, and one tap shows them all.
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || '8765';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.addInitScript(() => {
    let allow = false;
    document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.tapshow')) { allow = true; setTimeout(() => { allow = false; }, 0); } }, true);
    const real = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (!allow && this.id !== 'outVid') return Promise.reject(new DOMException('blocked (low power)', 'NotAllowedError'));
      return real.call(this);
    };
  });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.__dance && window.__dance.assignments.length, null, { timeout: 20000 });
  await page.evaluate(() => { const s = document.getElementById('assignment'); s.value = 'demo'; s.dispatchEvent(new Event('change')); });
  await page.click('#members button:has-text("Member B")');
  await page.click('#sampleOwn');
  await page.waitForFunction(() => window.__dance.env.p, null, { timeout: 60000 });
  await page.waitForTimeout(500);
  const btns = () => page.evaluate(() => [...document.querySelectorAll('.tapshow')].filter((b) => !b.hidden).map((b) => b.parentElement.querySelector('video').id + ':' + b.textContent));
  console.log('preview blocked -> buttons:', JSON.stringify(await btns()), '| preview playing:', await page.evaluate(() => !document.getElementById('frameVid').paused));
  await page.click('#frame .tapshow'); await page.waitForTimeout(500);
  console.log('after tap -> buttons:', JSON.stringify(await btns()), '| preview playing:', await page.evaluate(() => !document.getElementById('frameVid').paused));
  console.log('low power hint shown:', await page.isVisible('text=Low Power Mode'));
  await browser.close();
})();
