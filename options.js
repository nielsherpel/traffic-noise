"use strict";

const $ = id => document.getElementById(id);

async function refresh() {
  let s;
  try {
    s = await browser.runtime.sendMessage("noise:status");
  } catch (e) {
    $("surfing").textContent = "Hintergrund nicht erreichbar";
    return;
  }
  $("surfing").textContent = s.surfing ? "ja" : "nein";
  $("idle").textContent = s.idleNow;
  $("count").textContent = s.visitsToday + " / " + s.maxVisitsPerDay;
  $("themes").textContent = (s.activeThemes || []).join(", ") || "-";
  $("paused").textContent = s.paused ? "ja" : "nein";

  const ul = $("recent");
  ul.innerHTML = "";
  if (!s.recent || !s.recent.length) {
    ul.innerHTML = "<li>noch nichts</li>";
  } else {
    for (const v of s.recent) {
      const li = document.createElement("li");
      const t = new Date(v.ts).toLocaleTimeString("de-DE");
      li.textContent = `${t}  [${v.theme}]  ${v.url}`;
      ul.appendChild(li);
    }
  }
}

$("pause").addEventListener("click", async () => {
  await browser.runtime.sendMessage("noise:togglePause");
  refresh();
});

$("visit").addEventListener("click", async () => {
  $("visit").disabled = true;
  $("visit").textContent = "laeuft...";
  try { await browser.runtime.sendMessage("noise:visitNow"); } catch (e) {}
  $("visit").disabled = false;
  $("visit").textContent = "Jetzt einen Testbesuch";
  refresh();
});

$("refresh").addEventListener("click", refresh);

refresh();
setInterval(refresh, 5000);
