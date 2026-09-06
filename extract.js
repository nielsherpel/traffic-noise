// ============================================================
//  Traffic Noise - Artikel-Link-Extraktor
//  Wird per tabs.executeScript in die geladene Seite injiziert.
//  Rueckgabe: URL eines zufaelligen Artikels aus den oberen N Treffern
//  (window.__NOISE_TOP, Standard 6) oder null.
//  Werbung / Sponsored / fremde Domains werden ausgeschlossen.
// ============================================================

(() => {
  try {
    const TOP = Math.max(1, (window.__NOISE_TOP | 0) || 6);

    const here = location.href.replace(/#.*$/, "");
    const host = location.hostname.replace(/^www\./, "");

    // Pfade, die typischerweise keine Artikel sind
    const badPath = /(?:^|\/)(?:login|signin|sign-in|register|registrieren|anmelden|konto|account|abo|abonnement|paywall|newsletter|impressum|datenschutz|privacy|agb|terms|nutzungsbedingungen|kontakt|contact|ueber-uns|about|hilfe|help|faq|suche|search|tag|tags|thema|themen|schlagwort|kategorie|category|rubrik|ressort|autor|autorin|author|redaktion|shop|store|cart|warenkorb|angebot|angebote|gewinnspiel|jobs|karriere|mediadaten|werbenutzung)(?:\/|$|\?|#)/i;

    // Werbe-/Tracking-Domains, die trotz gleichem Anker auftauchen koennen
    const adHost = /(?:doubleclick|googlesyndication|googleadservices|google-analytics|googletagmanager|adservice|adform|adnxs|amazon-adsystem|taboola|outbrain|criteo|pubmatic|rubiconproject|smartadserver|teads|plista|ligatus|zergnet|revcontent|mgid|adition|yieldlab|stroeer|emsservice|ad-srv|adtech|admngr|ads?\.)/i;

    // Werbe-Kontext-Container: liegt der Link darin, ignorieren
    const adSelector = [
      "[class*='werbung' i]", "[id*='werbung' i]",
      "[class*='anzeige' i]", "[id*='anzeige' i]",
      "[class*='sponsor' i]", "[id*='sponsor' i]",
      "[class*='promo' i]", "[id*='promo' i]",
      "[class*='advert' i]", "[id*='advert' i]",
      "[class*='-ad-' i]", "[class*='_ad_' i]",
      "[class$='-ad' i]", "[class^='ad-' i]", "[class~='ad' i]",
      "[id*='-ad-' i]", "[id^='ad-' i]", "[id$='-ad' i]",
      "[class*='banner' i]", "[class*='outbrain' i]", "[class*='taboola' i]",
      "[class*='dfp' i]", "[class*='gpt' i]", "[class*='adslot' i]",
      "[data-ad]", "[data-adunit]", "[data-advertisement]",
      ".ad", ".ads", ".Ad", ".advertisement", "ins.adsbygoogle", "aside"
    ].join(",");

    // Struktur-Container, die keine Artikel enthalten
    const chromeSelector = "nav,header,footer,[role='navigation'],[role='banner'],[role='contentinfo'],.nav,.navbar,.menu,.header,.site-header,.footer,.site-footer,.sidebar,.breadcrumb,.breadcrumbs,.cookie,.consent,.subscribe,.paywall";

    const adWords = /\b(anzeige|werbung|sponsored|sponsor|promotion|advertorial|partnerangebot|affiliate|jetzt kaufen|zum shop|gutschein|rabatt)\b/i;

    const cands = document.querySelectorAll(
      "article a[href], main a[href], " +
      "h1 a[href], h2 a[href], h3 a[href], " +
      "[class*='teaser' i] a[href], [class*='headline' i] a[href], " +
      "[class*='story' i] a[href], [class*='article' i] a[href], " +
      "[class*='beitrag' i] a[href], [class*='post' i] a[href]"
    );

    const seen = new Set();
    const out = [];

    for (const a of cands) {
      if (out.length >= TOP) break;

      const raw = a.getAttribute("href");
      if (!raw || raw.startsWith("#") || /^(javascript|mailto|tel):/i.test(raw)) continue;

      let u;
      try { u = new URL(raw, here); } catch (e) { continue; }
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      u.hash = "";

      const h = u.hostname.replace(/^www\./, "");
      if (h !== host && !h.endsWith("." + host)) continue;   // nur gleiche Domain
      if (adHost.test(u.hostname)) continue;

      const url = u.href;
      if (url === here || url === here + "/") continue;
      if (u.pathname === "/" || u.pathname === "") continue;
      if (u.pathname.replace(/[/-]/g, "").length < 8) continue; // zu kurz -> Rubrik/Sektion
      if (badPath.test(u.pathname)) continue;

      // Werbe-Marker am Link selbst
      const rel = (a.getAttribute("rel") || "").toLowerCase();
      if (rel.includes("sponsored")) continue;
      if (a.hasAttribute("data-ad") || a.hasAttribute("data-advertisement")) continue;
      if (/(?:[?&])(?:utm_|gclid|fbclid|aff|affiliate|partner|adref|wt_mc|pk_campaign)/i.test(u.search)) continue;

      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (text.length < 12) continue;          // echte Ueberschrift, kein Icon/Label
      if (adWords.test(text)) continue;

      // Werbe- oder Struktur-Kontext?
      if (a.closest(adSelector)) continue;
      if (a.closest(chromeSelector)) continue;

      if (seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }

    if (!out.length) return null;
    return out[Math.floor(Math.random() * out.length)];
  } catch (e) {
    return null;
  }
})();
