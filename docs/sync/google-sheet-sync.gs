/**
 * Train v6 — Google Sheets live sync endpoint.
 * Setup: see docs/sync/SETUP.md (5 minutes, once).
 *
 * The app POSTs its full state after every change; this script stores the raw
 * JSON in a hidden "_backup" tab (for restore) and rewrites human-readable
 * tabs: Sessions, Sets, BodyWeight, PRs, Program.
 */

const BACKUP_TAB = "_backup";
const CHUNK = 45000; // stay under the 50k chars/cell limit

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const payload = JSON.parse(e.postData.contents);
    if (!payload || payload.v !== 6 || !payload.state) {
      return json_({ ok: false, error: "bad payload" });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1) raw state for restore
    const raw = JSON.stringify(payload.state);
    let b = ss.getSheetByName(BACKUP_TAB);
    if (!b) { b = ss.insertSheet(BACKUP_TAB); b.hideSheet(); }
    b.clearContents();
    const rows = [["updatedAt", new Date().toISOString()]];
    for (let i = 0; i < raw.length; i += CHUNK) rows.push(["chunk", raw.slice(i, i + CHUNK)]);
    b.getRange(1, 1, rows.length, 2).setValues(rows);

    // 2) readable tabs — generic: any tab the app sends gets written,
    //    so future app updates never need this script re-deployed
    const NAMES = { sessions: "Sessions", sets: "Sets", bw: "BodyWeight", prs: "PRs", program: "Program", coach: "Coach" };
    const tabs = payload.rows || {};
    for (const key in tabs) {
      const name = NAMES[key] || (key.charAt(0).toUpperCase() + key.slice(1));
      writeTab_(ss, name, tabs[key]);
    }

    return json_({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const b = ss.getSheetByName(BACKUP_TAB);
  if (!b) return json_({ ok: false, error: "no backup yet" });
  const vals = b.getDataRange().getValues();
  let raw = "";
  for (const row of vals) if (row[0] === "chunk") raw += row[1];
  if (!raw) return json_({ ok: false, error: "empty backup" });
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, updatedAt: String(vals[0][1]), state: JSON.parse(raw) }))
    .setMimeType(ContentService.MimeType.JSON);
}

function writeTab_(ss, name, rows) {
  if (!rows || !rows.length) return;
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clearContents();
  const width = Math.max.apply(null, rows.map(function (r) { return r.length; }));
  const norm = rows.map(function (r) { while (r.length < width) r.push(""); return r; });
  sh.getRange(1, 1, norm.length, width).setValues(norm);
  sh.setFrozenRows(1);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
