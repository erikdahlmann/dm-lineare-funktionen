# Lineare Funktionen

Trainer: Funktionsgleichungen ablesen und Geraden zeichnen, mit Punktestand.

**Belohnungen (Nov. 2026):** Für jede richtig gelöste Aufgabe gibt es eine
Spielmarke und einen neuen Effekt. Mit einer Marke darf man einen Effekt
fünf Sekunden lang über die ganze Seite laufen lassen:

| | Effekt | Was passiert |
|---|---|---|
| 🖌️ | Schmieren | Die Seite verschmiert unter dem Zeiger wie nasse Farbe. |
| ✨ | Zerstäuben | Die Seite zerfällt in tausende Partikel und fliegt als Wolke davon. |
| 🧱 | Schwerkraft | Alle Bausteine fallen um und purzeln übereinander. |
| 🕳️ | Schwarzes Loch | Alles wird in den Mauszeiger gesogen und verwirbelt. |
| 🍮 | Wackelpudding | Die Seite federt wie Gelee hinter dem Zeiger her. |
| 🔮 | Kaleidoskop | Spiegelsegmente drehen sich, die Farben wandern. |

Esc oder „Stopp" beendet früher. Die Effekte verändern die Seite nicht:
nach fünf Sekunden ist alles wieder genau wie vorher.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | der Trainer (unverändert bis auf acht Zeilen, siehe unten) |
| `belohnungen.js` | Leiste, Spielmarken und die sechs Effekte |
| `belohnungen.css` | Aussehen der Leiste und der Bühne |
| `html2canvas.min.js` | macht das Standbild der Seite (1.4.1, MIT) |
| `original/index.html` | die Fassung vor dem Umbau |

Am Trainer selbst wurden nur acht Zeilen ergänzt, nichts gelöscht:
zwei Einbindungen im Kopf und am Fuß sowie zweimal
`if (window.Belohnung) Belohnung.gewonnen();` an den beiden Stellen,
an denen eine Aufgabe als richtig gilt.

Live: https://dm-pkg.de/dm-lineare-funktionen/
Auch auf Netlify: https://dm-lineare-funktionen.netlify.app/ (online seit 2026-01-06). Erstellt mit Gemini 3 Pro.

Impressum und Datenschutz: https://dm-pkg.de/impressum.html
