/* ============================================================
   Belohnungs-Effekte für den Trainer "Lineare Funktionen"
   ------------------------------------------------------------
   Für jede richtig gelöste Aufgabe gibt es eine Spielmarke und
   einen neuen Effekt. Mit einer Marke darf man einen Effekt
   fünf Sekunden lang auf der ganzen Seite laufen lassen.

   Die Seite selbst wird nicht verändert. Dieses Modul hängt sich
   nur an zwei Stellen ein:  Belohnung.gewonnen()

   Braucht html2canvas (liegt daneben).
   ============================================================ */
(function () {
"use strict";

var DAUER = 5000;                       // Spieldauer in Millisekunden
var RUHIG = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Die sechs Effekte ---------- */
var EFFEKTE = [
  { id:"schmieren",  symbol:"🖌️", name:"Schmieren",
    tipp:"Zieh mit der Maus – die Seite verschmiert wie nasse Farbe." },
  { id:"staub",      symbol:"✨", name:"Zerstäuben",
    tipp:"Die Seite zerfällt in tausende Partikel und fliegt als Wolke davon." },
  { id:"schwerkraft",symbol:"🧱", name:"Schwerkraft",
    tipp:"Alle Bausteine fallen um und purzeln übereinander." },
  { id:"loch",       symbol:"🕳️", name:"Schwarzes Loch",
    tipp:"Alles wird in den Mauszeiger gesogen und verwirbelt." },
  { id:"pudding",    symbol:"🍮", name:"Wackelpudding",
    tipp:"Die Seite federt wie Gelee hinter dem Zeiger her." },
  { id:"kaleidoskop",symbol:"🔮", name:"Kaleidoskop",
    tipp:"Spiegelsegmente drehen sich, die Farben wandern." }
];

var marken = 0;          // noch nicht ausgegebene Spielmarken
var frei = 0;            // Zahl der freigeschalteten Effekte
var laeuft = false;

/* ============================================================
   1 · Leiste und Meldungen
   ============================================================ */
var leiste, knoepfe = [], markenAnzeige, balken;

function baueLeiste() {
  leiste = document.createElement("div");
  leiste.id = "bel-leiste";
  leiste.setAttribute("role", "region");
  leiste.setAttribute("aria-label", "Belohnungen");
  leiste.innerHTML =
    '<div class="bel-kopf">' +
      '<span class="bel-stern">🎁</span>' +
      '<span class="bel-text">Belohnungen</span>' +
      '<span class="bel-marken" id="bel-marken">0</span>' +
    '</div>' +
    '<div class="bel-knoepfe" id="bel-knoepfe"></div>' +
    '<div class="bel-fuss" id="bel-fuss">Löse eine Aufgabe, um den ersten Effekt freizuschalten.</div>' +
    '<div class="bel-balken"><i id="bel-balken-fuell"></i></div>';
  document.body.appendChild(leiste);

  var halter = leiste.querySelector("#bel-knoepfe");
  EFFEKTE.forEach(function (e, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "bel-knopf";
    b.dataset.i = i;
    b.disabled = true;
    b.innerHTML = '<span class="bel-symbol">🔒</span>' +
                  '<span class="bel-name">' + (i + 1) + '</span>';
    b.addEventListener("click", function () { starte(i); });
    halter.appendChild(b);
    knoepfe.push(b);
  });
  markenAnzeige = leiste.querySelector("#bel-marken");
  balken = leiste.querySelector("#bel-balken-fuell");
  zeichneLeiste();
}

function zeichneLeiste() {
  markenAnzeige.textContent = marken;
  markenAnzeige.classList.toggle("hat", marken > 0);
  knoepfe.forEach(function (b, i) {
    var offen = i < frei;
    b.disabled = !offen || marken < 1 || laeuft;
    b.classList.toggle("offen", offen);
    if (offen) {
      b.querySelector(".bel-symbol").textContent = EFFEKTE[i].symbol;
      b.querySelector(".bel-name").textContent = EFFEKTE[i].name;
      b.title = EFFEKTE[i].tipp;
      b.setAttribute("aria-label", EFFEKTE[i].name + ". " + EFFEKTE[i].tipp);
    }
  });
  var fuss = leiste.querySelector("#bel-fuss");
  if (laeuft) fuss.textContent = "Läuft … (Esc beendet)";
  else if (frei === 0) fuss.textContent = "Löse eine Aufgabe, um den ersten Effekt freizuschalten.";
  else if (marken < 1) fuss.textContent = "Keine Spielmarke übrig. Löse die nächste Aufgabe.";
  else fuss.textContent = marken === 1
      ? "Eine Spielmarke: wähle einen Effekt, 5 Sekunden Spielzeit."
      : marken + " Spielmarken: wähle einen Effekt, 5 Sekunden Spielzeit.";
}

function melde(text, klasse) {
  // immer nur eine Meldung gleichzeitig
  Array.prototype.forEach.call(document.querySelectorAll(".bel-meldung"),
    function (x) { x.remove(); });
  var m = document.createElement("div");
  m.className = "bel-meldung " + (klasse || "");
  m.innerHTML = text;
  document.body.appendChild(m);
  requestAnimationFrame(function () { m.classList.add("da"); });
  setTimeout(function () {
    m.classList.remove("da");
    setTimeout(function () { m.remove(); }, 400);
  }, 3200);
}

/* ============================================================
   2 · Wird vom Trainer bei jeder richtigen Aufgabe gerufen
   ============================================================ */
function gewonnen() {
  marken++;
  if (frei < EFFEKTE.length) {
    frei++;
    var e = EFFEKTE[frei - 1];
    melde('<b>' + e.symbol + " Neu freigeschaltet: " + e.name + "</b><br>" + e.tipp, "neu");
    var k = knoepfe[frei - 1];
    zeichneLeiste();
    k.classList.add("pulsiert");
    setTimeout(function () { k.classList.remove("pulsiert"); }, 1800);
  } else {
    melde("<b>+1 Spielmarke</b><br>Such dir einen Effekt aus.", "");
    zeichneLeiste();
  }
  leiste.classList.add("wink");
  setTimeout(function () { leiste.classList.remove("wink"); }, 700);
}

/* ============================================================
   3 · Bühne auf- und abbauen
   ============================================================ */
var schicht, lw, ctx, S = 1, W = 0, H = 0, ende = 0, raf = 0, aufraeumen = null;
var maus = { x: 0, y: 0, vorX: 0, vorY: 0, aktiv: false };

function bildSchirm() {
  // html2canvas liefert den ganzen Body; wir schneiden den sichtbaren
  // Ausschnitt heraus.
  return html2canvas(document.body, {
    backgroundColor: getComputedStyle(document.body).backgroundColor || "#F3F4F6",
    scale: S,
    logging: false,
    useCORS: true,
    ignoreElements: function (el) {
      return el.id === "bel-leiste" || el.id === "bel-schicht" ||
             el.classList && el.classList.contains("bel-meldung");
    }
  }).then(function (ganz) {
    var aus = document.createElement("canvas");
    aus.width = Math.max(1, Math.round(W * S));
    aus.height = Math.max(1, Math.round(H * S));
    var c = aus.getContext("2d");
    c.fillStyle = getComputedStyle(document.body).backgroundColor || "#F3F4F6";
    c.fillRect(0, 0, aus.width, aus.height);
    c.drawImage(ganz, 0, -Math.round(window.scrollY * S));
    return aus;
  });
}

function starte(i) {
  if (laeuft || marken < 1 || i >= frei) return;
  laeuft = true; marken--;
  zeichneLeiste();
  leiste.classList.add("arbeitet");

  W = document.documentElement.clientWidth;
  H = document.documentElement.clientHeight;
  S = Math.min(window.devicePixelRatio || 1, 2);
  maus.x = maus.vorX = W / 2;
  maus.y = maus.vorY = H / 2;
  maus.aktiv = false;

  var effekt = EFFEKTE[i].id;

  var vorbereiten = (effekt === "schwerkraft")
    ? Promise.resolve(null)
    : bildSchirm();

  vorbereiten.then(function (bild) {
    leiste.classList.remove("arbeitet");
    baueSchicht(effekt !== "schwerkraft");
    ende = performance.now() + DAUER;
    if (effekt === "schwerkraft") effSchwerkraft();
    else if (effekt === "schmieren") effSchmieren(bild);
    else if (effekt === "staub") effStaub(bild);
    else if (effekt === "loch") effLoch(bild);
    else if (effekt === "pudding") effPudding(bild);
    else effKaleidoskop(bild);
  }).catch(function (f) {
    leiste.classList.remove("arbeitet");
    laeuft = false; marken++; zeichneLeiste();
    melde("Der Effekt konnte nicht starten. Deine Spielmarke bleibt dir.", "fehler");
    if (window.console) console.warn("Belohnung:", f);
  });
}

function baueSchicht(mitLeinwand) {
  schicht = document.createElement("div");
  schicht.id = "bel-schicht";
  document.body.appendChild(schicht);
  if (mitLeinwand) {
    document.body.classList.add("bel-versteckt");
    lw = document.createElement("canvas");
    lw.id = "bel-leinwand";
    lw.width = Math.round(W * S);
    lw.height = Math.round(H * S);
    lw.style.width = W + "px";
    lw.style.height = H + "px";
    schicht.appendChild(lw);
    ctx = lw.getContext("2d");
    ctx.setTransform(S, 0, 0, S, 0, 0);
  }
  var stopp = document.createElement("button");
  stopp.type = "button";
  stopp.id = "bel-stopp";
  stopp.textContent = "Stopp";
  stopp.addEventListener("click", beende);
  schicht.appendChild(stopp);

  var uhr = document.createElement("div");
  uhr.id = "bel-uhr";
  uhr.innerHTML = '<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/>' +
    '<circle cx="22" cy="22" r="19" id="bel-uhr-ring"/></svg><span id="bel-uhr-zahl">5</span>';
  schicht.appendChild(uhr);

  schicht.addEventListener("pointermove", beiZeiger);
  schicht.addEventListener("pointerdown", beiZeiger);
  document.addEventListener("keydown", beiTaste);
}

function beiZeiger(ev) {
  maus.x = ev.clientX; maus.y = ev.clientY; maus.aktiv = true;
  if (ev.cancelable) ev.preventDefault();
}
function beiTaste(ev) { if (ev.key === "Escape") beende(); }

function uhrAktualisieren(jetzt) {
  var rest = Math.max(0, ende - jetzt);
  var ring = document.getElementById("bel-uhr-ring");
  var zahl = document.getElementById("bel-uhr-zahl");
  if (ring) {
    var u = 2 * Math.PI * 19;
    ring.style.strokeDasharray = u;
    ring.style.strokeDashoffset = u * (1 - rest / DAUER);
  }
  if (zahl) zahl.textContent = Math.ceil(rest / 1000);
  if (balken) balken.style.transform = "scaleX(" + (rest / DAUER) + ")";
}

function beende() {
  if (!laeuft) return;
  laeuft = false;
  cancelAnimationFrame(raf);
  document.removeEventListener("keydown", beiTaste);
  if (aufraeumen) { try { aufraeumen(); } catch (e) {} aufraeumen = null; }
  document.body.classList.remove("bel-versteckt");
  if (schicht) {
    schicht.classList.add("weg");
    var s = schicht; schicht = null; lw = null; ctx = null;
    setTimeout(function () { s.remove(); }, 320);
  }
  if (balken) balken.style.transform = "scaleX(0)";
  zeichneLeiste();
}

/** Gemeinsame Schleife: ruft schritt(t, jetzt) bis die Zeit um ist. */
function schleife(schritt) {
  function rahmen(jetzt) {
    if (!laeuft) return;
    var rest = ende - jetzt;
    if (rest <= 0) { beende(); return; }
    uhrAktualisieren(jetzt);
    schritt(1 - rest / DAUER, jetzt);
    maus.vorX = maus.x; maus.vorY = maus.y;
    raf = requestAnimationFrame(rahmen);
  }
  raf = requestAnimationFrame(rahmen);
}

/* ============================================================
   4 · Effekt 1 — Schmieren
   ============================================================ */
function effSchmieren(bild) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(bild, 0, 0);
  lw.style.cursor = "crosshair";

  var R = Math.round(46 * S);               // Pinselradius in Bildpunkten
  var pinsel = document.createElement("canvas");
  pinsel.width = pinsel.height = R * 2;
  var pc = pinsel.getContext("2d");
  var maske = document.createElement("canvas");
  maske.width = maske.height = R * 2;
  var mc = maske.getContext("2d");
  var g = mc.createRadialGradient(R, R, 0, R, R, R);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.55, "rgba(0,0,0,.85)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  mc.fillStyle = g; mc.fillRect(0, 0, R * 2, R * 2);

  function stempel(qx, qy, zx, zy, deck) {
    pc.globalCompositeOperation = "copy";
    pc.drawImage(lw, qx - R, qy - R, R * 2, R * 2, 0, 0, R * 2, R * 2);
    pc.globalCompositeOperation = "destination-in";
    pc.drawImage(maske, 0, 0);
    ctx.globalAlpha = deck;
    ctx.drawImage(pinsel, zx - R, zy - R);
    ctx.globalAlpha = 1;
  }

  var hinweis = true;
  schleife(function () {
    if (!maus.aktiv) return;
    if (hinweis) { hinweis = false; }
    var ax = maus.vorX * S, ay = maus.vorY * S;
    var bx = maus.x * S, by = maus.y * S;
    var dx = bx - ax, dy = by - ay;
    var weg = Math.hypot(dx, dy);
    if (weg < 0.4) return;
    var n = Math.min(26, Math.max(2, Math.ceil(weg / (R * 0.22))));
    for (var i = 1; i <= n; i++) {
      var t = i / n;
      stempel(ax + dx * (t - 1 / n), ay + dy * (t - 1 / n),
              ax + dx * t,           ay + dy * t, 0.62);
    }
  });
  aufraeumen = function () { if (lw) lw.style.cursor = ""; };
}

/* ============================================================
   5 · Effekt 2 — Zerstäuben
   ============================================================ */
function effStaub(bild) {
  var zelle = Math.max(9, Math.round(Math.sqrt(W * H / 6000)));
  var sp = Math.ceil(W / zelle), ze = Math.ceil(H / zelle);
  var hilf = document.createElement("canvas");
  hilf.width = sp; hilf.height = ze;
  var hc = hilf.getContext("2d");
  hc.drawImage(bild, 0, 0, sp, ze);
  var daten = hc.getImageData(0, 0, sp, ze).data;

  // Hintergrundfarbe der Seite: solche Zellen lassen wir liegen, damit
  // sichtbar nur der Inhalt zerfällt (sieht deutlich besser aus).
  var bgTxt = getComputedStyle(document.body).backgroundColor || "rgb(243,244,246)";
  var bgZahlen = bgTxt.match(/\d+/g) || [243, 244, 246];
  var bgR = +bgZahlen[0], bgG = +bgZahlen[1], bgB = +bgZahlen[2];

  var max = sp * ze;
  var px = new Float32Array(max), py = new Float32Array(max);
  var vx = new Float32Array(max), vy = new Float32Array(max);
  var los = new Float32Array(max), farbe = new Array(max);
  var dreh = new Float32Array(max);

  var n = 0;
  for (var j = 0; j < ze; j++) {
    for (var i = 0; i < sp; i++) {
      var o = (j * sp + i) * 4;
      var r = daten[o], g2 = daten[o + 1], b2 = daten[o + 2];
      if (Math.abs(r - bgR) < 7 && Math.abs(g2 - bgG) < 7 && Math.abs(b2 - bgB) < 7)
        continue;                                  // reiner Hintergrund
      var k = n++;
      px[k] = i * zelle + zelle / 2;
      py[k] = j * zelle + zelle / 2;
      farbe[k] = "rgb(" + r + "," + g2 + "," + b2 + ")";
      // Die Auflösung läuft als Welle von unten links nach oben rechts
      var welle = (px[k] / W) * 0.42 + (1 - py[k] / H) * 0.28;
      los[k] = 0.05 + welle * 0.42 + Math.random() * 0.1;
      var winkel = Math.random() * Math.PI * 2;
      var tempo = 25 + Math.random() * 85;
      vx[k] = Math.cos(winkel) * tempo + 26 + Math.random() * 44;
      vy[k] = Math.sin(winkel) * tempo - 46 - Math.random() * 52;
      dreh[k] = Math.random() * 6.28;
    }
  }

  var zuletzt = performance.now();
  schleife(function (t, jetzt) {
    var dt = Math.min(0.05, (jetzt - zuletzt) / 1000);
    zuletzt = jetzt;
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor || "#F3F4F6";
    ctx.fillRect(0, 0, W, H);

    // Die noch heile Seite bleibt scharf stehen und bleicht langsam aus,
    // während immer mehr Partikel von ihr abplatzen.
    var rest = Math.max(0, 1 - t / 0.5);
    if (rest > 0.01) {
      ctx.globalAlpha = rest;
      ctx.drawImage(bild, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    for (var k2 = 0; k2 < n; k2++) {
      var frei2 = t - los[k2];
      if (frei2 <= 0) continue;
      // fliegt
      vy[k2] += 42 * dt;                        // ganz leichte Schwerkraft
      vx[k2] += Math.sin(dreh[k2] + jetzt / 520) * 48 * dt;  // Wirbel im Wind
      vy[k2] += Math.cos(dreh[k2] + jetzt / 610) * 34 * dt;
      px[k2] += vx[k2] * dt;
      py[k2] += vy[k2] * dt;
      var a = Math.max(0, 1 - frei2 / 1.05);
      if (a <= 0.02) continue;
      var gr = zelle * (0.35 + a * 0.7);
      ctx.globalAlpha = a;
      ctx.fillStyle = farbe[k2];
      ctx.fillRect(px[k2] - gr / 2, py[k2] - gr / 2, gr, gr);
    }
    ctx.globalAlpha = 1;
  });
}

/* ============================================================
   6 · Effekt 3 — Schwerkraft (echte Elemente fallen)
   ============================================================ */
function effSchwerkraft() {
  var wahl = ["h1", ".card-title", ".progress-indicator", ".canvas-container",
              ".instruction", ".equation-wrapper", ".btn", ".task-display",
              ".feedback-msg", "footer.erik-recht"];
  var koerper = [];
  wahl.forEach(function (w) {
    Array.prototype.forEach.call(document.querySelectorAll(w), function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 6) return;
      if (r.bottom < 0 || r.top > H) return;
      koerper.push({
        el: el, alt: el.getAttribute("style"),
        x: r.left, y: r.top, b: r.width, h: r.height,
        vx: (Math.random() - 0.5) * 220,
        vy: -40 - Math.random() * 120,
        w: 0, vw: (Math.random() - 0.5) * 3.2
      });
    });
  });
  if (!koerper.length) { beende(); return; }

  // Die Karten selbst bleiben stehen; damit das nicht seltsam aussieht,
  // werden sie für die Dauer unsichtbar gemacht.
  var karten = Array.prototype.slice.call(document.querySelectorAll(".card"));
  karten.forEach(function (c) { c.classList.add("bel-leer"); });

  koerper.forEach(function (k) {
    var el = k.el;
    el.style.position = "fixed";
    el.style.left = k.x + "px";
    el.style.top = k.y + "px";
    el.style.width = k.b + "px";
    el.style.height = k.h + "px";
    el.style.margin = "0";
    el.style.zIndex = "99990";
    el.style.willChange = "transform";
    el.style.transformOrigin = "50% 50%";
  });

  var zuletzt = performance.now();
  schleife(function (t, jetzt) {
    var dt = Math.min(0.04, (jetzt - zuletzt) / 1000);
    zuletzt = jetzt;
    koerper.forEach(function (k) {
      k.vy += 1900 * dt;
      k.x += k.vx * dt; k.y += k.vy * dt; k.w += k.vw * dt;
      var boden = H - k.h;
      if (k.y > boden) { k.y = boden; k.vy *= -0.42; k.vx *= 0.76; k.vw *= 0.6;
                         if (Math.abs(k.vy) < 40) { k.vy = 0; k.vw *= 0.5; } }
      if (k.x < 0) { k.x = 0; k.vx *= -0.55; k.vw *= -0.7; }
      if (k.x > W - k.b) { k.x = W - k.b; k.vx *= -0.55; k.vw *= -0.7; }
      k.el.style.transform = "translate(" + (k.x - parseFloat(k.el.style.left)) +
        "px," + (k.y - parseFloat(k.el.style.top)) + "px) rotate(" + k.w + "rad)";
    });
  });

  aufraeumen = function () {
    koerper.forEach(function (k) {
      if (k.alt === null) k.el.removeAttribute("style");
      else k.el.setAttribute("style", k.alt);
    });
    karten.forEach(function (c) { c.classList.remove("bel-leer"); });
  };
}

/* ============================================================
   7 · Effekt 4 — Schwarzes Loch
   ============================================================ */
function effLoch(bild) {
  var ringe = 40;
  var maxR = Math.hypot(W, H) * 0.62;
  schleife(function (t) {
    var cx = maus.aktiv ? maus.x : W / 2;
    var cy = maus.aktiv ? maus.y : H / 2;
    var sog = t * t;                       // nimmt zu
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.fillStyle = "#0b0b14";
    ctx.fillRect(0, 0, W, H);
    for (var i = ringe; i >= 1; i--) {
      var r1 = maxR * i / ringe, r0 = maxR * (i - 1) / ringe;
      var nah = 1 - (r1 / maxR);                 // 0 außen, 1 innen
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r1, 0, 6.2832);
      ctx.arc(cx, cy, r0, 0, 6.2832, true);
      ctx.clip();
      ctx.translate(cx, cy);
      ctx.rotate(nah * nah * 7.5 * sog);
      var s = 1 - nah * 0.92 * sog;
      ctx.scale(Math.max(0.03, s), Math.max(0.03, s));
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = Math.max(0, 1 - nah * sog * 0.9);
      ctx.drawImage(bild, 0, 0, W, H);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * (0.1 + 0.5 * sog));
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.45, "rgba(10,6,30,.92)");
    g.addColorStop(0.8, "rgba(80,40,160,.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, maxR * (0.1 + 0.5 * sog), 0, 6.2832); ctx.fill();
  });
}

/* ============================================================
   8 · Effekt 5 — Wackelpudding
   ============================================================ */
function effPudding(bild) {
  var streifen = 54;
  var hoehe = H / streifen;
  var x = new Float32Array(streifen), vx2 = new Float32Array(streifen);
  var y = new Float32Array(streifen), vy2 = new Float32Array(streifen);
  var zwischen = document.createElement("canvas");
  zwischen.width = Math.round(W * S); zwischen.height = Math.round(H * S);
  var zc = zwischen.getContext("2d");
  lw.style.cursor = "grab";

  var FEDER = 90;      // Rückstellkraft
  var DAEMPF = 2.4;    // Reibung
  var SCHUB = 34;      // wie stark der Zeiger schiebt
  var zuletzt = performance.now();

  schleife(function (t, jetzt) {
    var dt = Math.min(0.033, (jetzt - zuletzt) / 1000);
    zuletzt = jetzt;
    var dx = maus.x - maus.vorX, dy = maus.y - maus.vorY;

    for (var i = 0; i < streifen; i++) {
      var mitte = (i + 0.5) * hoehe;
      var nah = maus.aktiv
        ? Math.max(0, 1 - Math.abs(mitte - maus.y) / (H * 0.38)) : 0;
      nah *= nah;
      vx2[i] += dx * nah * SCHUB;
      vy2[i] += dy * nah * SCHUB * 0.45;
      // Feder zur Ruhelage
      vx2[i] += -x[i] * FEDER * dt;
      vy2[i] += -y[i] * FEDER * dt;
      var d = Math.exp(-DAEMPF * dt);
      vx2[i] *= d; vy2[i] *= d;
      x[i] += vx2[i] * dt;
      y[i] += vy2[i] * dt;
      if (x[i] > 260) x[i] = 260; if (x[i] < -260) x[i] = -260;
      if (y[i] > 120) y[i] = 120; if (y[i] < -120) y[i] = -120;
    }
    // Nachbarn mitziehen, damit es wie ein zusammenhängendes Gelee wirkt
    for (var p = 0; p < 2; p++) {
      for (var k = 1; k < streifen; k++) {
        var mx = (x[k] - x[k - 1]) * 0.17; x[k] -= mx; x[k - 1] += mx;
        var my = (y[k] - y[k - 1]) * 0.17; y[k] -= my; y[k - 1] += my;
      }
    }
    // immer ein wenig Leben, auch ohne Mausbewegung
    if (!maus.aktiv) {
      for (var q = 0; q < streifen; q++)
        x[q] += Math.sin(jetzt / 420 + q * 0.3) * 0.6;
    }

    zc.setTransform(S, 0, 0, S, 0, 0);
    zc.fillStyle = getComputedStyle(document.body).backgroundColor || "#F3F4F6";
    zc.fillRect(0, 0, W, H);
    for (var m = 0; m < streifen; m++) {
      var yy = m * hoehe;
      zc.drawImage(bild,
        0, yy * S, W * S, hoehe * S + 1,
        x[m], yy + y[m], W, hoehe + 1.2);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(zwischen, 0, 0);
  });
  aufraeumen = function () { if (lw) lw.style.cursor = ""; };
}

/* ============================================================
   9 · Effekt 6 — Kaleidoskop
   ============================================================ */
function effKaleidoskop(bild) {
  var segmente = 10;
  var zoom = 2.6;                     // hineinzoomen, sonst ist alles weiß
  schleife(function (t, jetzt) {
    var cx = maus.aktiv ? maus.x : W / 2;
    var cy = maus.aktiv ? maus.y : H / 2;
    var r = Math.hypot(W, H);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0e0e18";
    ctx.fillRect(0, 0, W, H);
    var dreh = jetzt / 2800;
    var puls = zoom * (1 + 0.18 * Math.sin(jetzt / 1100));
    for (var i = 0; i < segmente; i++) {
      var a0 = (i / segmente) * 6.2832 + dreh;
      var a1 = ((i + 1) / segmente) * 6.2832 + dreh;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.clip();
      ctx.translate(cx, cy);
      ctx.rotate(a0);
      if (i % 2) ctx.scale(1, -1);
      ctx.scale(puls, puls);
      ctx.translate(-cx, -cy);
      ctx.drawImage(bild, 0, 0, W, H);
      ctx.restore();
    }
    // Regenbogen darüberlegen: färbt auch die weißen Flächen ein
    ctx.globalCompositeOperation = "multiply";
    var g;
    if (ctx.createConicGradient) {
      g = ctx.createConicGradient(jetzt / 1400, cx, cy);
      for (var h = 0; h <= 6; h++)
        g.addColorStop(h / 6, "hsl(" + ((h * 60 + jetzt / 18) % 360) + ",85%,66%)");
    } else {
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "hsl(" + (jetzt / 18 % 360) + ",85%,70%)");
      g.addColorStop(1, "hsl(" + ((jetzt / 18 + 180) % 360) + ",85%,62%)");
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  });
}

/* ============================================================
   10 · Start
   ============================================================ */
function start() {
  baueLeiste();
  if (RUHIG) {
    leiste.querySelector("#bel-fuss").textContent =
      "Hinweis: Dein Gerät ist auf wenig Bewegung gestellt. " +
      "Die Effekte laufen trotzdem, wenn du sie anklickst.";
  }
}
if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", start);
else start();

window.Belohnung = { gewonnen: gewonnen, beende: beende };

})();
