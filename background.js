// ============================================================
//  Traffic Noise - Hintergrundlogik
//
//  Ablauf:
//   1. Firefox meldet, dass der PC idle ist (Schwelle: zufaellig
//      CONFIG.idleSeconds.min .. max Sekunden).
//   2. Solange idle (und innerhalb der aktiven Stunden, unter Tageslimit)
//      wird in einem minimierten Hintergrundfenster eine Seite nach der
//      anderen angesurft - mit unregelmaessigen Pausen und Bursts.
//   3. Sobald wieder eine Eingabe kommt ("active"), stoppt alles sofort
//      und der Hintergrund-Tab wird auf about:blank geparkt.
// ============================================================

"use strict";

let surfing = false;        // laeuft die Surf-Schleife gerade?
let starting = false;       // startSurfing() gerade in Arbeit (gegen Doppelstart)
let stopFlag = false;       // Abbruchsignal fuer die laufende Schleife
let idleNow = "active";     // letzter bekannter Idle-Status
let loopTimer = null;       // Handle des naechsten setTimeout
let lastLoopAt = 0;         // fuer den Watchdog

// ---------- kleine Helfer ----------------------------------

function log(...a) { if (CONFIG.debug) console.log("[noise]", ...a); }
function warn(...a) { console.warn("[noise]", ...a); }

function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

function inActiveHours() {
  const h = new Date().getHours();
  const { start, end } = CONFIG.activeHours;
  return start <= end ? (h >= start && h < end) : (h >= start || h < end);
}

function pickGap() {
  const w = CONFIG.gap.weights;
  const r = Math.random();
  if (r < w.short)
    return rand(CONFIG.gap.shortSeconds.min, CONFIG.gap.shortSeconds.max) * 1000;
  if (r < w.short + w.medium)
    return rand(CONFIG.gap.mediumSeconds.min, CONFIG.gap.mediumSeconds.max) * 1000;
  return rand(CONFIG.gap.longSeconds.min, CONFIG.gap.longSeconds.max) * 1000;
}

// ---------- Zustand (storage.local) -----------------------

const STATE_DEFAULTS = {
  visitLog: [],        // [{ url, theme, ts }]
  dayKey: "",
  visitsToday: 0,
  activeThemes: [],
  bgWindowId: null,
  bgTabId: null,
  paused: false
};

async function getState() {
  return browser.storage.local.get(STATE_DEFAULTS);
}
async function setState(patch) {
  return browser.storage.local.set(patch);
}

async function ensureDay(state) {
  const tk = todayKey();
  if (state.dayKey === tk) return;

  const allThemes = Object.keys(SITES);
  const n = randInt(
    CONFIG.themesPerDay.min,
    Math.min(CONFIG.themesPerDay.max, allThemes.length)
  );
  const activeThemes = shuffle(allThemes).slice(0, n);

  state.dayKey = tk;
  state.visitsToday = 0;
  state.activeThemes = activeThemes;
  await setState({ dayKey: tk, visitsToday: 0, activeThemes });
  log("Neuer Tag", tk, "- aktive Themen:", activeThemes.join(", "));
}

// ---------- Hintergrundfenster / -Tab ---------------------

async function ensureBgTab(state) {
  // vorhandenen Tab wiederverwenden
  if (state.bgTabId != null) {
    try {
      await browser.tabs.get(state.bgTabId);
      return state.bgTabId;
    } catch (e) { /* Tab weg */ }
  }
  // vorhandenes Fenster wiederverwenden
  if (state.bgWindowId != null) {
    try {
      await browser.windows.get(state.bgWindowId);
      const tab = await browser.tabs.create({
        windowId: state.bgWindowId, url: "about:blank", active: false
      });
      await setState({ bgTabId: tab.id });
      state.bgTabId = tab.id;
      return tab.id;
    } catch (e) { /* Fenster weg */ }
  }
  // neues, unfokussiertes Fenster anlegen und minimieren
  const win = await browser.windows.create({ url: "about:blank", focused: false });
  try { await browser.windows.update(win.id, { state: "minimized" }); } catch (e) {}
  const tab = win.tabs[0];
  await setState({ bgWindowId: win.id, bgTabId: tab.id });
  state.bgWindowId = win.id;
  state.bgTabId = tab.id;
  log("Hintergrundfenster angelegt (id " + win.id + ")");
  return tab.id;
}

async function parkTab() {
  const { bgTabId } = await getState();
  if (bgTabId == null) return;
  try { await browser.tabs.update(bgTabId, { url: "about:blank" }); } catch (e) {}
}

// ---------- URL-Auswahl ----------------------------------

function recentUrlSet(state) {
  return new Set(
    state.visitLog.slice(-CONFIG.noRepeatWindow).map(v => v.url)
  );
}

function chooseTarget(state) {
  const themes = state.activeThemes.length ? state.activeThemes : Object.keys(SITES);
  const recent = recentUrlSet(state);

  for (let attempt = 0; attempt < 10; attempt++) {
    const theme = pick(themes);
    const fresh = SITES[theme].filter(u => !recent.has(u));
    if (fresh.length) return { theme, url: pick(fresh) };
  }
  const theme = pick(themes);
  return { theme, url: pick(SITES[theme]) };
}

// ---------- ein Seitenaufruf -----------------------------

// Warten, bis der Tab fertig geladen hat (oder Timeout).
function waitForComplete(tabId, timeoutMs) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      browser.tabs.onUpdated.removeListener(onUpd);
      clearTimeout(to);
      resolve();
    };
    const onUpd = (id, info) => {
      if (id === tabId && info.status === "complete") finish();
    };
    browser.tabs.onUpdated.addListener(onUpd);
    const to = setTimeout(finish, timeoutMs);
    browser.tabs.get(tabId)
      .then(t => { if (t.status === "complete") finish(); })
      .catch(() => finish());
  });
}

async function loadAndWait(tabId, url) {
  try {
    await browser.tabs.update(tabId, { url, active: false });
  } catch (e) {
    warn("tabs.update fehlgeschlagen:", e);
    return false;
  }
  await waitForComplete(tabId, CONFIG.follow.loadTimeoutMs);
  return true;
}

async function recordVisit(state, url, theme) {
  state.visitLog.push({ url, theme, ts: Date.now() });
  if (state.visitLog.length > 400) state.visitLog = state.visitLog.slice(-400);
  state.visitsToday += 1;
  await setState({ visitLog: state.visitLog, visitsToday: state.visitsToday });
}

async function maybeCleanHistory(url) {
  if (!CONFIG.cleanHistory) return;
  for (const u of [url, url + "/", url.replace(/\/$/, "")]) {
    try { await browser.history.deleteUrl({ url: u }); } catch (e) {}
  }
}

// Auf der aktuell geladenen Seite einen zufaelligen Artikel-Link holen
// (Werbung/Sponsored/fremde Domains werden in extract.js ausgesiebt).
async function pickArticleLink(tabId) {
  try {
    const t = await browser.tabs.get(tabId);
    if (!t.url || !/^https?:/i.test(t.url)) return null;
    await browser.tabs.executeScript(tabId, {
      code: "window.__NOISE_TOP=" + (CONFIG.follow.pickFromTop | 0) + ";"
    });
    const res = await browser.tabs.executeScript(tabId, { file: "extract.js" });
    const link = Array.isArray(res) ? res[0] : null;
    return (typeof link === "string" && /^https?:\/\//.test(link)) ? link : null;
  } catch (e) {
    log("Artikel-Extraktion nicht moeglich:", e && e.message);
    return null;
  }
}

async function visitOnce(state) {
  const tabId = await ensureBgTab(state);
  const { theme, url } = chooseTarget(state);
  const full = /^https?:\/\//.test(url) ? url : "https://" + url;

  log("Besuch:", theme, "->", full);
  if (!(await loadAndWait(tabId, full))) return;
  await recordVisit(state, url, theme);
  await sleep(rand(CONFIG.dwellSeconds.min, CONFIG.dwellSeconds.max) * 1000);
  await maybeCleanHistory(full);

  // einem Artikel auf der Seite folgen?
  if (!CONFIG.follow.enabled) return;
  if (stopFlag || idleNow === "active") return;
  if (Math.random() >= CONFIG.follow.probability) return;

  const maxHops = Math.max(1, CONFIG.follow.maxHops | 0);
  for (let hop = 0; hop < maxHops; hop++) {
    if (stopFlag || idleNow === "active") break;

    const link = await pickArticleLink(tabId);
    if (!link) break;
    if (recentUrlSet(state).has(link)) break;

    log("  -> Artikel:", link);
    if (!(await loadAndWait(tabId, link))) break;
    await recordVisit(state, link, theme + ":artikel");
    await sleep(rand(CONFIG.dwellSeconds.min, CONFIG.dwellSeconds.max) * 1000);
    await maybeCleanHistory(link);

    if (hop + 1 < maxHops && Math.random() >= CONFIG.follow.hopProbability) break;
  }
}

// ---------- Surf-Schleife --------------------------------

function surfingAllowed(state) {
  if (stopFlag) return "stopFlag";
  if (idleNow === "active") return "wieder aktiv";
  if (idleNow === "locked" && !CONFIG.surfWhenLocked) return "gesperrt";
  if (!inActiveHours()) return "ausserhalb aktiver Stunden";
  if (state.paused) return "pausiert";
  if (state.visitsToday >= CONFIG.maxVisitsPerDay) return "Tageslimit erreicht";
  return null;
}

async function startSurfing() {
  if (surfing || starting) return;
  starting = true;
  try {
    stopFlag = false; // frueheres Abbruchsignal zuruecksetzen, sonst blockt der Check unten
    const state = await getState();
    await ensureDay(state);
    const block = surfingAllowed(state);
    if (block) { log("Start abgelehnt:", block); return; }

    surfing = true;
    log("Surfen gestartet");
    surfLoop();
  } finally {
    starting = false;
  }
}

function stopSurfing(reason) {
  stopFlag = true;
  clearTimeout(loopTimer);
  loopTimer = null;
  if (surfing) log("Surfen gestoppt (" + (reason || "?") + ")");
  surfing = false;
  parkTab();
}

async function surfLoop() {
  lastLoopAt = Date.now();

  let state = await getState();
  await ensureDay(state);
  let block = surfingAllowed(state);
  if (block) { stopSurfing(block); return; }

  if (Math.random() < CONFIG.burst.probability) {
    const pages = randInt(CONFIG.burst.minPages, CONFIG.burst.maxPages);
    log("Burst:", pages, "Seiten");
    for (let i = 0; i < pages; i++) {
      state = await getState();
      await ensureDay(state);
      if (surfingAllowed(state)) break;
      await visitOnce(state);
      await sleep(rand(CONFIG.burst.gapSeconds.min, CONFIG.burst.gapSeconds.max) * 1000);
    }
  } else {
    await visitOnce(state);
  }

  await parkTab();

  state = await getState();
  block = surfingAllowed(state);
  if (block) { stopSurfing(block); return; }

  const gap = pickGap();
  log("naechste Runde in ~" + Math.round(gap / 1000) + " s");
  loopTimer = setTimeout(surfLoop, gap);
}

// ---------- Idle-Erkennung ------------------------------

function reseedDetectionInterval() {
  const n = randInt(CONFIG.idleSeconds.min, CONFIG.idleSeconds.max);
  try {
    browser.idle.setDetectionInterval(n); // Firefox-Minimum: 15
    log("Idle-Schwelle neu gesetzt:", n, "s");
  } catch (e) {
    warn("setDetectionInterval:", e);
  }
}

browser.idle.onStateChanged.addListener(state => {
  idleNow = state;
  log("Idle-Status:", state);
  if (state === "idle" || (state === "locked" && CONFIG.surfWhenLocked)) {
    startSurfing();
  } else {
    stopSurfing(state === "locked" ? "gesperrt" : "wieder aktiv");
    if (state === "active") reseedDetectionInterval(); // neue Zufallsschwelle
  }
});

// ---------- Watchdog -----------------------------------
// Fuer den Fall, dass ein onStateChanged-Ereignis verpasst wurde.
browser.alarms.create("watchdog", { periodInMinutes: 3 });
browser.alarms.onAlarm.addListener(async a => {
  if (a.name !== "watchdog") return;

  if (surfing && Date.now() - lastLoopAt > 10 * 60 * 1000) {
    warn("Watchdog: Schleife scheint zu haengen - Neustart");
    stopSurfing("watchdog-neustart");
  }
  if (!surfing) {
    let s;
    try { s = await browser.idle.queryState(60); } catch (e) { s = "active"; }
    idleNow = s;
    if (s === "idle" || (s === "locked" && CONFIG.surfWhenLocked)) {
      log("Watchdog: PC ist idle, aber Schleife laeuft nicht - starte");
      startSurfing();
    }
  }
});

// ---------- Nachrichten von der Optionsseite -----------

browser.runtime.onMessage.addListener(async msg => {
  if (msg === "noise:status") {
    const s = await getState();
    return {
      surfing,
      idleNow,
      dayKey: s.dayKey,
      visitsToday: s.visitsToday,
      maxVisitsPerDay: CONFIG.maxVisitsPerDay,
      activeThemes: s.activeThemes,
      paused: s.paused,
      recent: s.visitLog.slice(-15).reverse()
    };
  }
  if (msg === "noise:visitNow") {
    const s = await getState();
    await ensureDay(s);
    await visitOnce(s);
    await parkTab();
    return { ok: true, visitsToday: (await getState()).visitsToday };
  }
  if (msg === "noise:togglePause") {
    const s = await getState();
    const paused = !s.paused;
    await setState({ paused });
    if (paused) stopSurfing("manuell pausiert");
    return { paused };
  }
  return undefined;
});

// ---------- Start ------------------------------------

async function init() {
  reseedDetectionInterval();
  const s = await getState();
  await ensureDay(s);
  let cur;
  try { cur = await browser.idle.queryState(60); } catch (e) { cur = "active"; }
  idleNow = cur;
  log("Init - Idle-Status:", cur, "| heute besucht:", s.visitsToday);
  if (cur === "idle" || (cur === "locked" && CONFIG.surfWhenLocked)) startSurfing();
}

browser.runtime.onInstalled.addListener(init);
browser.runtime.onStartup.addListener(init);
init();
