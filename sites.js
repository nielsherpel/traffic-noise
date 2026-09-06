// ============================================================
//  Traffic Noise - Themen und Ziel-Webseiten
//  Jede Zeile = eine Domain (ohne "https://"). Pfade sind erlaubt.
//  Frei erweitern/kuerzen. Nur serioese, harmlose Seiten aufnehmen.
// ============================================================

const SITES = {

  technik: [
    "heise.de", "golem.de", "t3n.de", "chip.de", "computerbild.de",
    "netzwelt.de", "techstage.de", "notebookcheck.com", "hardwareluxx.de",
    "pcgameshardware.de", "computerbase.de", "winfuture.de", "zdnet.de",
    "theverge.com", "techcrunch.com", "arstechnica.com", "engadget.com",
    "wired.com", "tomshardware.com", "gsmarena.com", "androidauthority.com",
    "macrumors.com", "9to5google.com", "xda-developers.com", "mobilegeeks.de"
  ],

  auto: [
    "auto-motor-und-sport.de", "autobild.de", "motor-talk.de", "adac.de",
    "mobile.de", "autoscout24.de", "autozeitung.de", "auto-news.de",
    "automobilwoche.de", "electrive.net", "insideevs.de", "efahrer.chip.de",
    "motor1.com", "caranddriver.com", "topgear.com", "autocar.co.uk",
    "thedrive.com", "motorsport-total.com", "formel1.de", "spritmonitor.de",
    "carwow.de", "edmunds.com", "autoevolution.com", "greencarreports.com"
  ],

  ki: [
    "openai.com", "anthropic.com", "deepmind.google", "ai.meta.com",
    "huggingface.co", "arxiv.org", "paperswithcode.com", "towardsdatascience.com",
    "kdnuggets.com", "machinelearningmastery.com", "analyticsvidhya.com",
    "venturebeat.com", "the-decoder.de", "marktechpost.com", "syncedreview.com",
    "thegradient.pub", "research.google", "blogs.nvidia.com", "mistral.ai",
    "cohere.com", "stability.ai", "perplexity.ai", "elevenlabs.io", "deeplearning.ai"
  ],

  sport: [
    "kicker.de", "sport1.de", "spox.com", "sportschau.de", "transfermarkt.de",
    "11freunde.de", "eurosport.de", "ran.de", "laola1.at", "espn.com",
    "skysports.com", "bbc.com/sport", "theathletic.com", "olympics.com",
    "formula1.com", "motorsport.com", "uefa.com", "nba.com", "nfl.com",
    "cyclingnews.com", "tennisnet.com", "dazn.com", "sports.yahoo.com",
    "spiegel.de/sport"
  ],

  haushalt: [
    "smarticular.net", "utopia.de", "haus.de", "selbst.de", "hausjournal.net",
    "heimwerker.de", "bauen.de", "schoener-wohnen.de", "livingathome.de",
    "homify.de", "wohnglueck.de", "stiftung-warentest.de", "oekotest.de",
    "frag-mutti.de", "haushaltsfee.org", "cleanipedia.com", "hornbach.de",
    "obi.de", "bauhaus.info", "ikea.com", "otto.de", "roller.de",
    "moebel.de", "immowelt.de"
  ],

  kochen: [
    "chefkoch.de", "essen-und-trinken.de", "lecker.de", "kochbar.de",
    "eatsmarter.de", "gaumenfreundin.de", "springlane.de", "kitchenstories.com",
    "gutekueche.de", "koch-mit.de", "einfachbacken.de", "backenmachtgluecklich.de",
    "rezeptwelt.de", "bbcgoodfood.com", "allrecipes.com", "seriouseats.com",
    "bonappetit.com", "food52.com", "thekitchn.com", "epicurious.com",
    "delish.com", "marmiton.org", "giallozafferano.it", "tasteofhome.com"
  ],

  reisen: [
    "tripadvisor.de", "holidaycheck.de", "booking.com", "lonelyplanet.com",
    "reisereporter.de", "travelbook.de", "urlaubsguru.de", "weg.de",
    "komoot.de", "outdooractive.com", "geo.de", "nationalgeographic.com",
    "cntraveler.com", "travelandleisure.com", "skyscanner.de", "kayak.de",
    "momondo.de", "getyourguide.de", "atlasobscura.com", "roughguides.com",
    "fodors.com", "wikivoyage.org", "ab-in-den-urlaub.de", "secret-escapes.de"
  ],

  finanzen: [
    "finanzen.net", "boerse.de", "handelsblatt.com", "wallstreet-online.de",
    "finanztip.de", "justetf.com", "extraetf.com", "onvista.de", "comdirect.de",
    "ariva.de", "boerse-online.de", "finanzfluss.de", "dasinvestment.com",
    "godmode-trader.de", "morningstar.de", "bloomberg.com", "ft.com",
    "marketwatch.com", "investing.com", "cnbc.com", "fool.com",
    "seekingalpha.com", "reuters.com", "tagesschau.de/wirtschaft"
  ],

  gesundheit: [
    "netdoktor.de", "apotheken-umschau.de", "gesundheit.de", "onmeda.de",
    "aok.de", "tk.de", "gesund.bund.de", "pharmazeutische-zeitung.de",
    "deutsche-apotheker-zeitung.de", "gelbe-liste.de", "doccheck.com",
    "healthline.com", "webmd.com", "mayoclinic.org", "medicalnewstoday.com",
    "health.harvard.edu", "everydayhealth.com", "verywellhealth.com",
    "patient.info", "nhs.uk", "kenhub.com", "quarks.de", "minimed.at"
  ],

  wissenschaft: [
    "spektrum.de", "wissenschaft.de", "scinexx.de", "forschung-und-wissen.de",
    "welt-der-physik.de", "mpg.de", "helmholtz.de", "nationalgeographic.de",
    "nature.com", "science.org", "scientificamerican.com", "newscientist.com",
    "livescience.com", "phys.org", "sciencedaily.com", "quantamagazine.org",
    "eurekalert.org", "sciencenews.org", "smithsonianmag.com", "iflscience.com",
    "space.com", "universetoday.com", "sciencealert.com"
  ],

  gaming: [
    "gamestar.de", "gamepro.de", "pcgames.de", "4players.de", "eurogamer.de",
    "spieletipps.de", "mein-mmo.de", "playnation.de", "ign.com", "gamespot.com",
    "polygon.com", "rockpapershotgun.com", "kotaku.com", "pcgamer.com",
    "gamesradar.com", "destructoid.com", "gamesindustry.biz", "gematsu.com",
    "nintendolife.com", "purexbox.com", "pushsquare.com",
    "videogameschronicle.com", "gameinformer.com"
  ],

  garten: [
    "mein-schoener-garten.de", "gartenjournal.net", "plantura.garden",
    "gartentipps.com", "native-plants.de", "gartenflora.de", "hausgarten.net",
    "kraut-und-rueben.de", "garten-treffpunkt.de", "hortipendium.de",
    "baumschule-horstmann.de", "gardenersworld.com", "rhs.org.uk", "almanac.com",
    "gardeningknowhow.com", "thespruce.com", "bhg.com", "finegardening.com",
    "epicgardening.com", "gardenista.com"
  ]
};
