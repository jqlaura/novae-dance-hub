// "My video is ready!" gating, and "See who's in" with a fake Apps Script:
// a wrong code saved earlier must not show an error; the right code shows the list and the week's folder link.
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || '8765';
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.addInitScript(() => { try { localStorage.setItem('fancam.code', 'old-wrong-code'); } catch (e) {} });
  await page.route('**/macros/s/**', async (route) => {
    const req = JSON.parse(route.request().postData() || '{}');
    if (req.action === 'list' && req.passcode === 'right')
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, folderUrl: 'https://drive.google.com/drive/folders/TEST', folderName: req.assignment,
        items: [{ name: 'Elena', member: 'Oa', latest: new Date().toISOString(), tries: 2 }] }) });
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: false, code: 'passcode', error: 'wrong team code' }) });
  });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction(() => window.__dance && window.__dance.assignments.length, null, { timeout: 20000 });
  await page.waitForTimeout(1500);                       // the quiet background check with the saved code
  console.log('saved wrong code forgotten:', await page.evaluate(() => localStorage.getItem('fancam.code')) === null);
  await page.click('#whoBtn'); await page.waitForTimeout(800);
  console.log('open list, note:', JSON.stringify(await page.textContent('#whoNote')), '| code box shown:', await page.isVisible('#whoCode'));
  await page.fill('#whoCode', 'right'); await page.click('#whoGo'); await page.waitForTimeout(800);
  console.log('after right code:', JSON.stringify(await page.textContent('#whoList')), '| folder link:', await page.isVisible('#whoFolderLink'),
    await page.getAttribute('#whoFolderLink', 'href'), JSON.stringify(await page.textContent('#whoFolderLink')));

  // "My video is ready!" gating
  await page.evaluate(() => { const s = document.getElementById('assignment'); s.value = 'demo'; s.dispatchEvent(new Event('change')); });
  const shown = () => page.evaluate(() => getComputedStyle(document.getElementById('step5')).display !== 'none');
  const uploadShown = () => page.evaluate(() => getComputedStyle(document.getElementById('step2')).display !== 'none');
  console.log('no member yet: upload step shown', await uploadShown());
  await page.click('#members button:has-text("Member B")');
  console.log('picked Member B: upload step shown', await uploadShown());
  await page.click('#sampleOwn');
  await page.waitForFunction(() => window.__dance.env.p && window.__dance.dur.f > 0, null, { timeout: 60000 });
  console.log('video read, before mirror answer: ready disabled', await page.isDisabled('#videoReady'), '| note', JSON.stringify(await page.textContent('#readyNote')), '| check shown', await shown());
  await page.click('#mirrorChoice button[data-v="no"]');
  console.log('mirror answered: ready disabled', await page.isDisabled('#videoReady'), '| check shown', await shown());
  await page.click('#videoReady');
  console.log('tapped ready: button', JSON.stringify(await page.textContent('#videoReady')), '| check shown', await shown());

  // open the page again: the member is picked already
  await page.reload();
  await page.waitForFunction(() => window.__dance && window.__dance.assignments.length, null, { timeout: 20000 });
  await page.evaluate(() => { const s = document.getElementById('assignment'); s.value = 'demo'; s.dispatchEvent(new Event('change')); });
  await page.waitForFunction(() => window.__dance.dur.f > 0, null, { timeout: 60000 });
  console.log('after reopening: member', await page.evaluate(() => window.__dance.member && window.__dance.member.name),
    '| pressed', JSON.stringify(await page.textContent('#members button[aria-pressed="true"]')), '| hint', JSON.stringify(await page.textContent('#memberHint')),
    '| upload step shown', await uploadShown());
  await browser.close();
})();
