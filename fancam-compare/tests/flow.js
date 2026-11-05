// End-to-end on the demo assignment: sample practice video → "not mirrored" → Member B →
// check the match (two pairs at 1/3 and 2/3 of your video) → Looks right → generate → download.
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
  await page.waitForFunction(() => window.__dance && window.__dance.assignments.length, null, { timeout: 20000 });
  await page.evaluate(() => { const s = document.getElementById('assignment'); s.value = 'demo'; s.dispatchEvent(new Event('change')); });
  await page.click('#sampleOwn');
  await page.waitForFunction(() => window.__dance.env.p, null, { timeout: 60000 });
  await page.click('#mirrorChoice button[data-v="no"]');
  await page.click('#videoReady');
  const preview = await page.evaluate(() => ({ frame: document.getElementById('frameVid').style.transform, note: document.getElementById('mirrorNote').textContent, mirror: window.__dance.mirror }));
  console.log('after "No":', JSON.stringify(preview));
  await page.click('#members button:has-text("Member B")');
  await page.waitForFunction(() => window.__dance.aligned, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({
    d: +window.__dance.d.toFixed(3),
    checks: [['stillPt', 'stillFt', 'stillP', 'startVid'], ['stillPt2', 'stillFt2', 'stillP2', 'startVid2']].map(([a, b, c, e]) =>
      `${document.getElementById(a).textContent} ↔ ${document.getElementById(b).textContent} (frames at ${document.getElementById(c).currentTime.toFixed(2)} / ${document.getElementById(e).currentTime.toFixed(2)})`),
    stillPTransform: document.getElementById('stillP').style.transform,
    step3: document.getElementById('step5').className, step4: document.getElementById('step6').className,
    exportDisabled: document.getElementById('exportBtn').disabled,
  }));
  console.log('before Looks right:', JSON.stringify(before, null, 1));
  await page.screenshot({ path: path.join(out, 'v5_check.png'), fullPage: true });
  await page.click('#looksRight');
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({
    ok: !document.getElementById('matchOk').hidden, btns: !document.getElementById('matchBtns').hidden,
    step3: document.getElementById('step5').className, step4: document.getElementById('step6').className,
    exportDisabled: document.getElementById('exportBtn').disabled,
  }));
  console.log('after Looks right:', JSON.stringify(after));
  await page.screenshot({ path: path.join(out, 'v5_confirmed.png'), fullPage: true });
  await page.click('#exportBtn');
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 180000 });
  const blob = await page.evaluate(async () => {
    const S = window.__dance; const b = S.outBlob; const buf = new Uint8Array(await b.arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { b64: btoa(s), ext: S.outExt };
  });
  const f = path.join(out, 'v5_out.' + blob.ext); require('fs').writeFileSync(f, Buffer.from(blob.b64, 'base64'));
  console.log('saved', f);
  await browser.close();
})();
