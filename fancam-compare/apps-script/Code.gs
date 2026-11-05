/**
 * Novae Dance Hub — receives kids' comparison videos and saves them in Laura's Google Drive.
 *
 * Setup (step by step in SETUP-GOOGLE-DRIVE.md, part C): paste this file into a new project at
 * script.google.com, change TEAM_CODE below, run setup() once, then Deploy → New deployment →
 * Web app (Execute as: Me · Who has access: Anyone).
 * Put the /exec URL in assignments.json → submitUrl.
 *
 * Videos land in your existing "Novae - NEON" folder, inside its HW1, HW2, … folders. Whoever that folder is shared with can see them:
 * only you can open it. The team code lives only here, never in the web page.
 */

// ====== CHANGE THIS ======
const TEAM_CODE = 'change-me';          // what the kids type before they can submit (not case-sensitive)
// =========================

const ROOT_FOLDER_NAME = 'Novae - NEON';   // Laura's existing folder that holds HW1, HW2, …
const CHUNK = 8 * 1024 * 1024;          // must be a multiple of 256 KB (Drive's rule for resumable uploads)
const MAX_SIZE = 1024 * 1024 * 1024;    // refuse anything over 1 GB

/** Run this once from the editor (▶ Run). It asks for permission and creates the folder. */
function setup() {
  const folder = rootFolder();
  Logger.log('Submissions folder: ' + folder.getUrl());
  if (TEAM_CODE === 'change-me') Logger.log('Remember to change TEAM_CODE at the top of the file!');
}

function doGet() {
  return json({ ok: true, app: 'fancam-submit' });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'bad request' }); }
  try {
    if (req.action === 'start') return json(start(req));
    if (req.action === 'chunk') return json(chunk(req));
    if (req.action === 'list') return json(list(req));
    return json({ ok: false, error: 'unknown action' });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: String((err && err.message) || err) });
  }
}

/** 1. Check the team code and open a Drive upload for one video. */
function start(req) {
  if (norm(req.passcode) !== norm(TEAM_CODE) || TEAM_CODE === 'change-me') {
    Utilities.sleep(1500);              // slow down guessing
    return { ok: false, code: 'passcode', error: 'wrong team code' };
  }
  const size = Number(req.size);
  if (!(size > 0 && size <= MAX_SIZE)) return { ok: false, error: 'video size not accepted' };
  const mime = /webm/i.test(req.mime) ? 'video/webm' : 'video/mp4';
  const lock = LockService.getScriptLock();   // two kids submitting at once must not make two folders
  lock.waitLock(20000);
  let folder;
  try { folder = subFolder(rootFolder(), clean(req.assignment) || 'Other'); } finally { lock.releaseLock(); }
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH.mm');
  const name = [clean(req.name) || 'No name', clean(req.member), stamp].filter(String).join(' · ') + (mime === 'video/webm' ? '.webm' : '.mp4');

  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(size) },
    payload: JSON.stringify({ name: name, parents: [folder.getId()], mimeType: mime }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error('Drive refused the upload (' + res.getResponseCode() + ')');
  const h = res.getHeaders(), session = h.Location || h.location;
  const id = Utilities.getUuid();
  CacheService.getScriptCache().put('up_' + id, JSON.stringify({ session: session, size: size }), 21600);   // 6 hours
  return { ok: true, id: id, chunk: CHUNK };
}

/** 2. Receive one piece (base64) and pass it on to Drive. The last piece finishes the file. */
function chunk(req) {
  const cache = CacheService.getScriptCache(), key = 'up_' + req.id;
  const up = JSON.parse(cache.get(key) || 'null');
  if (!up) return { ok: false, error: 'upload expired, tap Submit again' };
  const bytes = Utilities.base64Decode(String(req.data || ''));
  const off = Number(req.offset), end = off + bytes.length - 1;
  if (!(off >= 0) || !bytes.length || end >= up.size) return { ok: false, error: 'bad piece' };

  const res = UrlFetchApp.fetch(up.session, {
    method: 'put',
    contentType: 'application/octet-stream',
    payload: bytes,
    headers: { 'Content-Range': 'bytes ' + off + '-' + end + '/' + up.size },
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code === 308) {                   // Drive wants more; "Range: bytes=0-N" says what it has
    const range = res.getHeaders().Range || res.getHeaders().range;
    return { ok: true, done: false, next: range ? Number(String(range).split('-')[1]) + 1 : 0 };
  }
  if (code === 200 || code === 201) {
    cache.remove(key);
    return { ok: true, done: true };
  }
  throw new Error('Drive said ' + code);
}

/** 3. Who has submitted this week: names, member, latest time, number of tries. No videos, no links. */
function list(req) {
  if (norm(req.passcode) !== norm(TEAM_CODE) || TEAM_CODE === 'change-me') {
    Utilities.sleep(1500);
    return { ok: false, code: 'passcode', error: 'wrong team code' };
  }
  const root = rootFolder(), week = clean(req.assignment) || 'Other', folder = findSub(root, week);
  // a link to this week's folder for Laura (or the main folder if this week's isn't there yet)
  if (!folder) return { ok: true, items: [], folderUrl: root.getUrl(), folderName: root.getName() };
  const files = folder.getFiles(), people = {};
  while (files.hasNext()) {
    const f = files.next(), fname = f.getName();
    if (!/\.(mp4|webm)$/i.test(fname) || fname.split(' · ').length < 3) continue;   // only videos sent from the page ("name · member · time")
    const parts = fname.replace(/\.(mp4|webm|mov)$/i, '').split(' · ');
    const name = (parts[0] || 'No name').trim(), key = name.toLowerCase(), when = f.getDateCreated();
    const p = people[key] || (people[key] = { name: name, member: '', latest: 0, tries: 0 });
    p.tries++;
    if (when.getTime() > p.latest) { p.latest = when.getTime(); p.member = parts.length > 2 ? parts[1] : ''; p.name = name; }
  }
  const items = Object.keys(people).map(function (k) { const p = people[k]; return { name: p.name, member: p.member, latest: new Date(p.latest).toISOString(), tries: p.tries }; });
  items.sort(function (a, b) { return a.latest < b.latest ? 1 : -1; });
  return { ok: true, items: items, folderUrl: folder.getUrl(), folderName: folder.getName() };
}

// ---------- helpers ----------
// The existing folder named ROOT_FOLDER_NAME (found once, then remembered by its ID, so renaming it later is fine).
// HW_ROOT_ID is a new key on purpose: older versions remembered the "Fancam Submissions" folder under ROOT_FOLDER_ID.
function rootFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('HW_ROOT_ID');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const it = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
  props.setProperty('HW_ROOT_ID', folder.getId());
  return folder;
}
// Find this week's folder even if it's written "HW 2" or "hw2 - Nov 1" (but never take HW20 for HW2).
function findSub(parent, name) {
  const want = String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  const it = parent.getFolders();
  while (it.hasNext()) {
    const f = it.next(), n = f.getName().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (n === want || (n.indexOf(want) === 0 && !/^[0-9]/.test(n.slice(want.length)))) return f;
  }
  return null;
}
function subFolder(parent, name) {
  return findSub(parent, name) || parent.createFolder(name);
}
function clean(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); }
function norm(s) { return String(s || '').trim().toLowerCase(); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
