# Projectbeschrijving: Interval Timer Applicatie

**Versie 1.0 — 8 februari 2026**

---

## 1. Projectsamenvatting

Het doel van dit project is het ontwikkelen van een Interval Timer applicatie waarmee gebruikers volledig aanpasbare trainingsschema's kunnen samenstellen. De app ondersteunt meerdere sets met elk meerdere stappen (zoals rennen en pauze), herhaalfunctionaliteit, en audio-feedback met countdown-signalen bij elke overgang.

## 2. Probleemstelling

Bestaande interval-timers bieden vaak beperkte configuratiemogelijkheden. Gebruikers kunnen niet altijd meerdere stappen met variabele duur combineren binnen één set, laat staan sets herhalen met audio-signalen die vooraf waarschuwen dat een overgang nadert. Dit project lost dat op met een flexibele, gebruiksvriendelijke timer.

## 3. Functionele Eisen

### 3.1 Sets en Stappen

- De gebruiker kan één of meerdere **sets** aanmaken. Elke set bevat één of meerdere **stappen**.
- Elke stap heeft een naam (bijv. "Rennen", "Pauze") en een instelbare duur (in seconden of minuten).
- Stappen kunnen in willekeurige volgorde worden geplaatst en bewerkt.
- Sets kunnen individueel of als geheel worden herhaald met een instelbaar aantal herhalingen.

### 3.2 Herhaalfunctie

- Per set kan een **aantal herhalingen** worden ingesteld (bijv. 15x).
- De app toont de huidige herhaling en het totaal aantal (bijv. "Ronde 3/15").

### 3.3 Audio-feedback en Countdown

Bij elke overgang tussen stappen wordt de gebruiker auditief geïnformeerd:

|Moment|Geluid|
|---|---|
|3 seconden voor einde|Kort attentiepiepje (lage toon)|
|2 seconden voor einde|Kort attentiepiepje (middentoon)|
|1 seconde voor einde|Kort attentiepiepje (hoge toon)|
|Einde huidige stap|Eindgeluid (duidelijk afsluitend signaal)|
|Start nieuwe stap|Startgeluid (kort bevestigend signaal)|

- De countdown-piepjes (3–2–1) worden afgespeeld in de **laatste 3 seconden** van elke actieve stap.
- Geluiden moeten duidelijk hoorbaar zijn, ook met achtergrondgeluid (buitentraining).
- Optioneel: volume-instelling en keuze uit verschillende geluidspakketten.

### 3.4 Visuele weergave tijdens training

- Grote, goed leesbare countdown-timer op het scherm.
- Naam van de huidige stap duidelijk zichtbaar (bijv. "Rennen" in groot formaat).
- Kleurcodering per staptype (bijv. groen voor actief, blauw voor pauze).
- Voortgangsindicator: huidige herhaling, huidige stap, en totale voortgang.
- Scherm blijft actief (geen auto-lock) tijdens een actieve sessie.

## 4. Voorbeeldscenario

Een gebruiker configureert de volgende trainingsset:

|Stap|Naam|Duur|Type|
|---|---|---|---|
|1|Rennen|1 minuut|Actief|
|2|Pauze|5 minuten|Rust|
|3|Rennen|3 minuten|Actief|
|4|Pauze|2 minuten|Rust|

De set wordt **15 keer herhaald**. Bij elke stapovergang hoort de gebruiker op t-3, t-2 en t-1 een oplopend attentiepiepje, gevolgd door een eind- en startsignaal.

## 5. Technische Overwegingen

### 5.1 Platform

De applicatie kan worden ontwikkeld als webapplicatie (PWA), native mobiele app (iOS/Android), of als cross-platform app (React Native / Flutter). Een PWA is het snelst te realiseren en werkt op alle apparaten met een browser.

### 5.2 Audio

1. **Web Audio API** — voor het genereren van tonen direct in de browser (geen externe bestanden nodig).
2. **Voorgeladen geluidsbestanden** — voor een rijkere geluidservaring met custom samples.
3. Audio moet ook werken wanneer het scherm vergrendeld is (belangrijk voor mobiel gebruik).

### 5.3 Dataopslag

Trainingsschema's worden lokaal opgeslagen (localStorage of SQLite) zodat gebruikers hun configuraties kunnen bewaren en hergebruiken. Optioneel kan cloudsync worden toegevoegd in een latere fase.

### 5.4 Timing-precisie

De timer moet nauwkeurig zijn en niet afhankelijk van setInterval-drift. Gebruik van requestAnimationFrame of een high-resolution timer (performance.now()) is aanbevolen voor betrouwbare countdowns.

## 6. Niet-functionele Eisen

1. **Gebruiksvriendelijkheid** — Intuïtieve interface, ook bruikbaar tijdens het sporten (grote knoppen, duidelijke tekst).
2. **Responsiviteit** — Werkt goed op zowel mobiel als desktop.
3. **Performance** — Minimale batterijbelasting tijdens langere sessies.
4. **Offline gebruik** — De app moet volledig offline kunnen functioneren na eerste laden.
5. **Toegankelijkheid** — Screen-reader compatible en voldoende contrast.

## 7. Mogelijke Toekomstige Uitbreidingen

1. Spraakbegeleiding (text-to-speech): "Start rennen!", "Pauze!"
2. Exporteren en delen van trainingsschema's
3. Integratie met wearables (smartwatch-notificaties)
4. Trainingsgeschiedenis en statistieken
5. Vooraf ingestelde templates (Tabata, HIIT, Couch-to-5K)
6. Donker thema voor gebruik in schemerlicht

## 8. Samenvatting

De Interval Timer applicatie biedt een flexibele en configureerbare trainingstimer met visuele en auditieve feedback. De kernfunctionaliteit bestaat uit het definiëren van sets met meerdere stappen, het instellen van herhalingen, en een drievoudige countdown met attentiepiepjes (3-2-1) bij elke overgang, gevolgd door duidelijke start- en eindsignalen. Het resultaat is een betrouwbare trainingspartner voor hardlopers, sporters en iedereen die met intervallen traint.