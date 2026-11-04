/**
 * Fancam Compare — receives kids' comparison videos and saves them in the coach's Google Drive.
 *
 * Paste this whole file into a new Google Apps Script project (script.google.com), change the
 * team code below, run setup() once, then Deploy → New deployment → Web app
 * (Execute as: Me · Who has access: Anyone). Put the /exec URL in assignments.json → submitUrl.
 *
 * Videos land in "Fancam Submissions/<assignment>/" in your My Drive. That folder is private:
 * only you can open it. The team code lives only here, never in the web page.
 */

// ====== CHANGE THIS ======
const TEAM_CODE = 'change-me';          // what the kids type before they can submit (not case-sensitive)
// =========================

const ROOT_FOLDER_NAME = 'Fancam Submissions';
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

// ---------- helpers ----------
function rootFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('ROOT_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder(ROOT_FOLDER_NAME);
  props.setProperty('ROOT_FOLDER_ID', folder.getId());
  return folder;
}
function subFolder(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}
function clean(s) { return String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60); }
function norm(s) { return String(s || '').trim().toLowerCase(); }
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
