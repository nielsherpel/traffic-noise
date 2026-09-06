// ============================================================
//  Traffic Noise - Konfiguration
//  Nach jeder Aenderung: about:debugging -> Add-on -> "Neu laden"
// ============================================================

const CONFIG = {

  // --- Ausloeser -------------------------------------------------
  // Der PC muss so viele Sekunden ohne Maus-/Tastatureingabe sein,
  // bevor gesurft wird. Bei jedem Wechsel zurueck auf "aktiv" wird
  // ein neuer Zufallswert aus diesem Bereich gezogen -> unregelmaessig.
  // Firefox-Minimum ist 15.
  idleSeconds: { min: 15, max: 30 },

  // Nur in diesem Zeitfenster wird ueberhaupt gesurft (lokale Stunde 0-24).
  // Nachts kein Traffic -> wirkt menschlicher.
  activeHours: { start: 7, end: 24 },

  // Auch surfen, waehrend der Bildschirm gesperrt ist?
  // false = nur wenn du wirklich am Rechner bist, aber gerade nichts tust.
  surfWhenLocked: true,

  // --- Menge --------------------------------------------------
  // Obergrenze an Seitenaufrufen pro Kalendertag (Schutz vor Uebertreibung
  // und vor auffaellig hohem Datenverbrauch).
  maxVisitsPerDay: 150,

  // --- Rhythmus (bewusst unregelmaessig) ----------------------
  // Wie lange eine Seite geladen bleibt, bevor die naechste kommt.
  dwellSeconds: { min: 8, max: 25 },

  // Pause zwischen zwei Seitenaufrufen: gemischt aus kurz / mittel / lang,
  // damit kein gleichmaessiges Muster entsteht.
  gap: {
    shortSeconds:  { min: 5,  max: 20  },
    mediumSeconds: { min: 20, max: 75  },
    longSeconds:   { min: 75, max: 210 },
    weights: { short: 0.5, medium: 0.35, long: 0.15 } // Summe = 1
  },

  // "Surf-Burst": ab und zu schnell mehrere Seiten hintereinander
  // (wie ein Mensch, der mehrere Tabs oeffnet), danach wieder normale Pause.
  burst: {
    probability: 0.4,          // Wahrscheinlichkeit pro Runde
    minPages: 2,
    maxPages: 5,
    gapSeconds: { min: 3, max: 11 }
  },

  // --- Themen ------------------------------------------------
  // Nicht jeden Tag alle Interessen: pro Tag werden nur so viele Themen
  // aus sites.js "aktiviert", der Rest rotiert tageweise.
  themesPerDay: { min: 3, max: 7 },

  // Dieselbe Seite nicht erneut, solange sie unter den letzten N Aufrufen ist.
  noRepeatWindow: 50,

  // --- Artikel folgen -------------------------------------
  // Nach dem Laden einer Startseite zufaellig einen der oberen Artikel-Links
  // oeffnen (wie ein Mensch, der etwas anklickt). Werbe-/Sponsored-Links und
  // fremde Domains werden dabei ausgeschlossen (siehe extract.js).
  follow: {
    enabled: true,
    probability: 0.7,     // Wahrscheinlichkeit, ueberhaupt einem Artikel zu folgen
    pickFromTop: 6,       // zufaellig aus den ersten N gefundenen Artikel-Links
    maxHops: 3,           // wie viele Artikel hintereinander (1 = nur einer)
    hopProbability: 0.35, // Chance auf jeden WEITEREN Hop (nur relevant wenn maxHops > 1)
    loadTimeoutMs: 20000  // wie lange auf "Seite fertig geladen" gewartet wird
  },

  // --- Chronik ---------------------------------------------
  // Besuchte Rausch-URLs wieder aus der Firefox-Chronik loeschen.
  // ACHTUNG: browser.history.deleteUrl entfernt ALLE Eintraege dieser URL,
  // also auch echte eigene Besuche derselben Seite. Standard: aus.
  cleanHistory: true,

  // --- Sonstiges ------------------------------------------
  // Logging in der Hintergrund-Konsole (about:debugging -> "Untersuchen").
  debug: true
};
