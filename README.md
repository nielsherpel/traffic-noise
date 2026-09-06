# Traffic Noise (Firefox-Erweiterung)

Erzeugt im Hintergrund unregelmäßigen Surf-Traffic über viele Themengebiete,
damit dein echtes Surfverhalten schwerer aus dem Datenstrom herauszulesen ist.
**Keine sichtbare Oberfläche** – nur eine optionale Statusseite.

## Funktionsweise

1. Firefox meldet, wenn der PC **30–60 Sekunden ohne Eingabe** war
   (die genaue Schwelle wird jedes Mal neu zufällig gewählt).
2. Solange der PC idle ist, wird in einem **minimierten Hintergrundfenster**
   eine Seite nach der anderen aufgerufen:
   - zufällige Themen- und Seitenauswahl aus `sites.js`
   - nach dem Laden der Startseite wird mit einstellbarer Wahrscheinlichkeit
     **einer der oberen 1–6 Artikel-Links zufällig geöffnet** (wie ein Klick).
     Werbe-/Sponsored-Links und fremde Domains werden dabei ausgesiebt
     (Filter in `extract.js`).
   - unregelmäßige Pausen (kurz / mittel / lang gemischt)
   - gelegentliche „Bursts" (mehrere Seiten schnell nacheinander, dann Ruhe)
   - Tageslimit, Nachtruhe (Standard 7–24 Uhr), keine Wiederholung der letzten ~50 URLs
3. Sobald du wieder Maus/Tastatur benutzt, **stoppt alles sofort**, der
   Hintergrund-Tab wird auf `about:blank` geparkt.

## Dateien

| Datei | Zweck |
|---|---|
| `manifest.json` | Add-on-Definition (MV2) |
| `config.js` | **alle Einstellungen** (Idle-Schwelle, Zeiten, Limits, Rhythmus, `follow`) |
| `sites.js` | Themen + Ziel-Domains (frei erweiterbar) |
| `background.js` | Logik |
| `extract.js` | wird in geladene Seiten injiziert, sucht Artikel-Links, filtert Werbung |
| `options.html` / `options.js` | optionale Statusseite (kein Steuerelement nötig) |

## Installieren (zum Testen)

1. `about:debugging#/runtime/this-firefox` öffnen
2. **„Temporäres Add-on laden…"** → `manifest.json` in diesem Ordner wählen
3. Läuft sofort. Konsole: bei dem Add-on auf **„Untersuchen"** klicken.

> Temporär geladene Add-ons verschwinden beim Firefox-Neustart. Für dauerhaft
> siehe unten.

## Einstellen

Alles in `config.js`, danach in `about:debugging` **„Neu laden"**. Wichtigste Werte:

- `idleSeconds: { min: 30, max: 60 }` – Ruhezeit, ab der gesurft wird
- `activeHours: { start: 7, end: 24 }` – nur in diesem Fenster
- `maxVisitsPerDay: 150` – Obergrenze pro Tag (jeder Artikel-Hop zählt mit)
- `gap` / `burst` / `dwellSeconds` – Rhythmus
- `follow` – Artikel folgen: `enabled`, `probability` (0.7), `pickFromTop` (6),
  `maxHops` (1), `hopProbability`, `loadTimeoutMs`
- `surfWhenLocked: false` – auch bei gesperrtem Bildschirm surfen?
- `cleanHistory: false` – besuchte URLs aus der Chronik löschen
  (⚠ löscht **alle** Einträge dieser URL, auch echte eigene Besuche)

Themen/Seiten in `sites.js` – Domains ohne `https://`, Pfade erlaubt.

## Dauerhaft installieren – zwei Wege

### A) Selbst signieren über AMO (empfohlen, funktioniert in normalem Firefox)

Firefox-Release/ESR installiert nur **signierte** Add-ons. Signieren ist für
den Eigengebrauch kostenlos und das Add-on muss **nicht** öffentlich gelistet
werden („unlisted").

```bash
npm install --global web-ext
# API-Zugangsdaten unter addons.mozilla.org/developers/addon/api/key/ holen
web-ext sign --channel=unlisted --api-key=<JWT_ISSUER> --api-secret=<JWT_SECRET>
```

Ergebnis ist eine signierte `.xpi`. Diese per Drag-and-drop in Firefox oder über
`about:addons` → Zahnrad → „Add-on aus Datei installieren" einspielen.
Updates: neue Version signieren, neu installieren (oder `updateURL` einrichten).

- **Pro:** normaler Firefox, überlebt Neustarts, kein about:config-Eingriff
- **Contra:** Mozilla-Entwicklerkonto nötig, Upload durchläuft eine
  (bei unlisted meist automatische) Prüfung

### B) Ohne Signatur (nur bestimmte Firefox-Varianten)

Nur **Firefox Developer Edition, Nightly oder ESR** können Signaturzwang
abschalten:

1. `about:config` → `xpinstall.signatures.required` → `false`
2. Add-on als gepackte `.xpi` (ZIP dieses Ordners, Endung `.xpi`) über
   `about:addons` installieren.

```powershell
# in diesem Ordner, erzeugt traffic-noise.xpi
Compress-Archive -Path * -DestinationPath traffic-noise.zip -Force
Rename-Item traffic-noise.zip traffic-noise.xpi
```

- **Pro:** kein Konto, kein Upload
- **Contra:** im normalen Firefox-Release **nicht** möglich; Signaturzwang
  global aus ist eine Sicherheitsabschwächung

**Empfehlung:** Weg A. Nur wenn du ohnehin Developer Edition/ESR nutzt und
keinen Account willst, Weg B.

## Was das Add-on leistet – und was nicht

- Es **verwässert** erkennbare Interessen-/Zeitmuster in Profilen, die über
  Cookies, Referer und Drittanbieter-Tracker auf den besuchten Seiten
  entstehen. Der Traffic läuft bewusst über **dieselbe Firefox-Identität**
  (gleiche Cookies, gleiche IP) – nur so wird das Rauschen „dir" zugerechnet.
- Es lädt Startseiten und folgt danach höchstens **einem redaktionellen
  Artikel-Link derselben Domain** (zufällig aus den oberen 1–6). **Werbung,
  „Sponsored"/„Anzeige"-Links, Affiliate-/Tracking-URLs und fremde Domains
  werden ausgeschlossen** – siehe Filter in `extract.js`. Kein Ausfüllen von
  Formularen, kein Login, kein Klick auf Buttons.
- Dafür braucht das Add-on die Berechtigung **„Zugriff auf Daten für alle
  Websites"** (`<all_urls>`): nötig, um auf der geladenen Seite die Artikel-Links
  auszulesen (`extract.js` läuft nur lesend im isolierten Content-Script-Kontext).
- Grenzen:
  - Gleiche IP/Geräte-Fingerprint bleiben. Gegen Fingerprinting hilft es nicht.
    Kombiniere mit uBlock Origin, Firefox-Containern, „Schutz vor Aktivitäten­verfolgung" streng, ggf. VPN.
  - Zeit-/Verhaltensanalyse kann regelmäßige Bot-Ladevorgänge potenziell von
    menschlichen trennen. Deshalb Zufallsschwellen, Bursts, Nachtruhe – perfekt
    ist es nicht.
  - Wenn du in Firefox bei Google/Meta o. Ä. eingeloggt bist, fließen
    Hintergrundbesuche (bzw. deren Drittanbieter-Tracker) in dein echtes Profil.
    Das ist hier gewollt (Verwässerung), sollte dir aber klar sein.
  - Seitenbetreiber sehen zusätzliche Aufrufe. Deshalb nur Startseiten, mit
    Pausen und Tageslimit – bitte die Raten nicht hochdrehen.
- **Datenvolumen:** ~150 Startseiten/Tag ≈ grob 0,3–1 GB/Tag. Auf getakteten
  Verbindungen `maxVisitsPerDay` senken.
- **Chronik:** Besuche stehen in deiner Chronik, sofern `cleanHistory` aus ist.
- **Deinstallation:** Das leere, minimierte Hintergrundfenster bleibt evtl.
  offen – einfach schließen.
