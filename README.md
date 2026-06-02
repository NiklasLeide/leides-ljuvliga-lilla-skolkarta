# Gymnasiekartan Blekinge

En karta över alla **gymnasieskolor i Blekinge län**. Klicka på en skola för att
se vilka utbildningar (gymnasieprogram) den erbjuder och länkar till beslut och
rapporter från Skolinspektionen.

Datan kommer från **[Skolverkets öppna API:er](https://www.skolverket.se/om-oss/oppna-data)**
(Planned educations v3).

## Funktioner

- 🗺️ Interaktiv Leaflet-karta (ljus CARTO-stil) med alla länets gymnasieskolor.
- 🎨 Markörerna är färgade efter huvudman (kommunal / fristående).
- 🎓 Klick på en skola visar utbildningar, kontaktuppgifter och skolenhetskod.
- 🏛️ Länkar till Skolinspektionens söktjänst samt en förifylld sökning på skolan.
- ⚡ Hämtar live från Skolverkets API, med en sparad snapshot som offline-fallback.

## Komma igång

```bash
npm install
npm run dev
```

Öppna sedan adressen som Vite skriver ut (vanligtvis http://localhost:5173).

### Uppdatera den sparade datan (fallback)

Snapshoten i `public/data/blekinge-gymnasieskolor.json` används om live-anropen
mot Skolverket misslyckas. Generera om den med:

```bash
npm run fetch-data
```

### Bygg för produktion

```bash
npm run build      # statisk build i dist/
npm run preview    # förhandsgranska bygget
```

## Hur datan hämtas

| Steg | Endpoint |
| --- | --- |
| Lista gymnasieskolor per kommun | `GET /v3/school-units?typeOfSchooling=gy&geographicalAreaCode={kod}` |
| Detaljer (koordinater, kontakt) | `GET /v3/school-units/{kod}` |
| Utbildningar (program) | `GET /v3/school-units/{kod}/statistics/gy` |

API:t kräver headern
`Accept: application/vnd.skolverket.plannededucations.api.v3.hal+json` och
stödjer CORS, så anropen görs direkt i webbläsaren.

Blekinge täcks av kommunkoderna 1060 (Olofström), 1080 (Karlskrona),
1081 (Ronneby), 1082 (Karlshamn) och 1083 (Sölvesborg).

## Licens

Koden: se [LICENSE](LICENSE). Skoldatan tillhandahålls av Skolverket under
Creative Commons. Kartrutor © OpenStreetMap-bidragsgivare och CARTO.
