# Interval Timer PWA

Een Progressive Web App voor het samenstellen en uitvoeren van aanpasbare interval-trainingsschema's met visuele en auditieve feedback.

**Live demo:** [https://erikfamdejonginfo.github.io/intervaltimer/](https://erikfamdejonginfo.github.io/intervaltimer/)

## Kenmerken

### Trainingsschema's
- Maak meerdere **sets** aan, elk met meerdere **stappen** (bijv. Rennen, Pauze)
- Stel per stap een naam, duur (minuten:seconden) en type (actief/pauze) in
- Stel per set een **aantal herhalingen** in (bijv. 15 rondes)
- Schema's worden lokaal opgeslagen in `localStorage` en blijven bewaard tussen sessies

### Timer
- Grote, goed leesbare **countdown-timer** op het scherm
- **Kleurcodering**: groen voor actieve stappen, blauw voor pauze
- Voortgangsbalk met totale trainingsvoortgang
- Weergave van huidige ronde, stap en totaal resterende tijd
- **3-2-1 startcountdown** voordat de training begint
- Pauze/hervat, volgende stap overslaan, en stoppen

### Audio-feedback (Web Audio API)
- **Countdown-piepjes** (3-2-1) in de laatste 3 seconden van elke stap met oplopende toon
- **Eindsignaal**: drie korte pulsen bij einde actieve stap
- **Startsignaal**: lang aanhoudend toon bij start van een actieve stap
- **Overwinningsfanfare**: oplopend arpeggio (C-E-G-C) bij voltooiing van de training
- Audio wordt ontgrendeld op iOS via een silent buffer bij eerste interactie

### Rennend paard animatie
Tijdens actieve stappen (type "Actief") verschijnt een geanimeerd rennend paard:
- **Sprite sheet animatie** met 18 frames van een gallopperend paard
- Willekeurig **bruin of zwart paard** (met zadel) bij elke actieve stap
- Paard rent herhaaldelijk van links naar rechts over het scherm
- **Grasveld** met wuivende grashalmpjes onder het paard
- **Stofwolkjes** achter de hoeven
- Verdwijnt automatisch bij pauze-stappen
- Respecteert `prefers-reduced-motion` (verborgen voor gebruikers die minder beweging willen)

> Paard sprites afkomstig van [OpenGameArt.org](https://opengameart.org/content/horse-run-cycle) door **reivaxcorp** (CC-BY 3.0)

### PWA & Offline
- **Service Worker** met cache-first strategie voor volledig offline gebruik
- **Web App Manifest** voor installatie op homescreen (standalone modus)
- **Wake Lock API** houdt het scherm actief tijdens de training
- Automatisch opnieuw activeren van wake lock wanneer de pagina weer zichtbaar wordt

### Toegankelijkheid
- Skip-link naar hoofdinhoud
- `aria-live` regio's voor timer-updates
- `aria-label` op alle knoppen en invoervelden
- `role="timer"` op het countdown-element
- `aria-hidden="true"` op decoratieve animatie
- Voldoende contrast (donker thema)
- Minimale touch-targets van 44x44px

## Projectstructuur

```
intervaltimer/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages auto-deploy bij push naar master
├── doc/
│   └── Projectbeschrijving.md      # Uitgebreide functionele specificatie (NL)
├── src/
│   ├── index.html                  # Single-page app met 3 views (home/editor/timer)
│   ├── manifest.json               # PWA manifest (standalone, NL)
│   ├── sw.js                       # Service Worker (cache-first, offline)
│   ├── css/
│   │   └── style.css               # Alle styling incl. paard-animatie en responsive design
│   ├── js/
│   │   ├── app.js                  # Entry point, view-navigatie, schema-lijst rendering
│   │   ├── audio.js                # Web Audio API: tonen, countdown, signalen, fanfare
│   │   ├── timer-engine.js         # Drift-vrije timer met requestAnimationFrame + performance.now()
│   │   ├── timer-view.js           # Timer UI: countdown, stap-info, paard-selectie, voortgang
│   │   ├── schema-editor.js        # Schema editor: sets, stappen, herhalingen, validatie
│   │   ├── storage.js              # localStorage CRUD voor trainingsschema's
│   │   ├── wake-lock.js            # Wake Lock API met auto-reacquire
│   │   └── utils.js                # formatTime, generateId, parseDuration
│   └── icons/
│       ├── icon-192.png            # PWA icoon 192x192
│       ├── icon-512.png            # PWA icoon 512x512
│       ├── caballoNormal_strip.png # Bruin paard sprite strip (18 frames, 1998x81)
│       └── caballoNegro_strip.png  # Zwart paard sprite strip (18 frames, 1998x81)
├── Dockerfile                      # nginx:alpine container
├── docker-compose.yml              # Lokale ontwikkeling op poort 8081
├── nginx/
│   └── default.conf                # nginx config met gzip, caching, security headers
└── README.md                       # Dit bestand
```

## Technische details

### Architectuur
- **Puur HTML/CSS/JavaScript** — geen frameworks, geen build-stap, geen dependencies
- **ES Modules** (`type="module"`) voor modulaire code-organisatie
- **Event-driven timer** via `EventTarget` met custom events (`tick`, `countdown`, `step-start`, `step-end`, `complete`)

### Timer-precisie
- Gebruikt `performance.now()` in combinatie met `requestAnimationFrame` voor drift-vrije timing
- Fallback `setTimeout` als vangnet voor segment-einde detectie
- DOM-updates alleen bij wijziging van de weergegeven seconde (niet elk frame)

### Paard-animatie techniek
- CSS sprite sheet animatie met `background-position` en `steps(18)`
- 18 frames per galop-cyclus, 0.9s per cyclus
- Paard beweegt over het scherm via `@keyframes horseRun` (4s per overtocht)
- Element op ware grootte (222x162px) — geen transform scale, voorkomt clipping

### Deployment
- **GitHub Pages**: automatisch via GitHub Actions workflow bij push naar `master`
- **Docker**: `docker-compose up -d` start nginx op poort 8081 met live volume mount naar `src/`

## Lokaal draaien

### Met Docker
```bash
docker-compose up -d
# Open http://localhost:8081
```

### Zonder Docker
Open `src/index.html` direct in een browser, of gebruik een lokale server:
```bash
npx serve src
# of
python -m http.server 8080 -d src
```

> **Let op:** Service Worker registratie vereist HTTPS of `localhost`.

## Licentie

- **Applicatiecode**: onderdeel van dit project
- **Paard sprites**: [CC-BY 3.0](https://creativecommons.org/licenses/by/3.0/) door [reivaxcorp](https://opengameart.org/content/horse-run-cycle) via OpenGameArt.org
