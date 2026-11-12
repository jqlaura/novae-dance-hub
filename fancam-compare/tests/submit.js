// Submit with a fake Google Apps Script (no real upload): the first "start" never answers (the page must
// time out and retry), pieces are checked for size and order, then a second run checks Cancel.
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || '8765';
  const mode = process.argv[3] || 'upload';     // 'upload', 'cancel' or 'original'
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  let starts = 0, pieces = [], hangChunks = mode === 'cancel';
  await page.route('**/macros/s/**', async (route) => {
    const req = JSON.parse(route.request().postData() || '{}');
    if (req.action === 'start') {
      starts++;
      if (starts === 1) return;                                  // never answer: the page has to give up and retry
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, id: 'test' + starts, chunk: 8 * 1048576 }) });
    }
    if (req.action === 'chunk') {
      if (hangChunks) return;
      const len = Buffer.from(req.data, 'base64').length;
      pieces.push({ off: req.offset, len, size: req.offset + len });
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, done: false, next: req.offset + len }) });
    }
    return route.fulfill({ contentType: 'application/json', body: '{"ok":false,"error":"unknown action"}' });
  });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.__dance && window.__dance.assignments.length, null, { timeout: 20000 });
  await page.evaluate(() => { const s = document.getElementById('assignment'); s.value = 'demo'; s.dispatchEvent(new Event('change')); });
  await page.click('#members button:has-text("Member B")');
  await page.click('#sampleOwn');
  await page.waitForFunction(() => window.__dance.env.p, null, { timeout: 60000 });
  await page.click('#mirrorChoice button[data-v="no"]');
  await page.fill('#partMin', '0'); await page.fill('#partSec', '00');   // the demo practice video starts before Member B's part
  await page.click('#videoReady');
  await page.waitForFunction(() => window.__dance.aligned, null, { timeout: 60000 });
  await page.waitForTimeout(800);
  const stills = await page.evaluate(() => ['stillP', 'stillP2'].map((id) => document.getElementById(id).style.transform));
  console.log('Check the match, your stills:', JSON.stringify(stills));
  await page.waitForFunction(() => !document.getElementById('result').hidden, null, { timeout: 180000 });
  const size = await page.evaluate(() => window.__dance.outBlob.size);
  await page.evaluate(() => { window.__dance._timeouts = { start: 2000, chunk: 3000 }; });
  await page.click(mode === 'original' ? '#finalChoice button[data-v="orig"]' : '#finalChoice button[data-v="yes"]');
  let startReq = null; page.on('request', (r) => { try { const j = JSON.parse(r.postData() || '{}'); if (j.action === 'start') startReq = j; } catch (e) {} });
  await page.fill('#kidName', 'Test'); await page.fill('#teamCode', 'x');
  if (mode === 'cancel') {          // pieces never answer; the kid taps Cancel
    await page.evaluate(() => { window.__dance._timeouts = { start: 2000, chunk: 60000 }; });
    await page.click('#submitBtn');
    await page.waitForTimeout(3500);
    console.log('cancel visible during upload:', await page.isVisible('#cancelUp'), '| note:', await page.textContent('#submitNote'));
    await page.click('#cancelUp');
    await page.waitForFunction(() => !window.__dance.submitting, null, { timeout: 10000 });
    console.log('after cancel:', await page.textContent('#submitNote'), '| submit enabled:', !(await page.isDisabled('#submitBtn')), '| cancel hidden:', !(await page.isVisible('#cancelUp')));
    await browser.close(); return;
  }
  const notes = new Set();
  const watch = setInterval(async () => { try { notes.add(await page.textContent('#submitNote')); } catch (e) {} }, 300);
  await page.click('#submitBtn');
  await page.waitForFunction(() => !window.__dance.submitting, null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(500); clearInterval(watch);
  console.log('video size', size, '| start calls', starts, '| pieces', pieces.map((p) => (p.len / 1048576).toFixed(2) + 'MB@' + p.off).join(', '));
  console.log('contiguous:', pieces.every((p, i) => p.off === (i ? pieces[i - 1].size : 0)), '| total sent', pieces.length ? pieces[pieces.length - 1].size : 0,
    '| non-final pieces multiple of 256 KB:', pieces.slice(0, -1).every((p) => p.len % 262144 === 0));
  console.log('notes seen:', [...notes].filter(Boolean).join(' | '));
  console.log('final note:', await page.textContent('#submitNote'), '| submitted:', await page.evaluate(() => window.__dance.submitted));
  const sizes = await page.evaluate(() => ({ original: window.__dance.file.p.size, comparison: window.__dance.outBlob && window.__dance.outBlob.size }));
  console.log('sent', pieces.length ? pieces[pieces.length - 1].size : 0, 'bytes | original', sizes.original, '| comparison', sizes.comparison, '| member label:', startReq && startReq.member, '| mime:', startReq && startReq.mime);
  await browser.close();
})();
