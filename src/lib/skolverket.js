// Klient mot Skolverkets öppna API "Planned educations" (v3).
// API:t kräver en specifik Accept-header och stödjer CORS, så det kan
// anropas både från Node (datahämtningsskriptet) och direkt i webbläsaren.
//
// Dokumentation: https://api.skolverket.se/planned-educations/swagger-ui/index.html

export const API_BASE = 'https://api.skolverket.se/planned-educations/v3';
const ACCEPT = 'application/vnd.skolverket.plannededucations.api.v3.hal+json';

// Blekinge läns fem kommuner (SCB:s kommunkoder).
export const BLEKINGE_KOMMUNER = [
  { kod: '1060', namn: 'Olofström' },
  { kod: '1080', namn: 'Karlskrona' },
  { kod: '1081', namn: 'Ronneby' },
  { kod: '1082', namn: 'Karlshamn' },
  { kod: '1083', namn: 'Sölvesborg' },
];

const KOMMUN_NAMN = Object.fromEntries(
  BLEKINGE_KOMMUNER.map((k) => [k.kod, k.namn])
);

async function api(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: ACCEPT },
  });
  if (!res.ok) {
    throw new Error(`Skolverket API ${res.status} för ${path}`);
  }
  return res.json();
}

// Listar alla gymnasieskolor (skolform "gy") i en kommun.
export async function listaGymnasieskolor(kommunkod) {
  const data = await api(
    `/school-units?typeOfSchooling=gy&geographicalAreaCode=${kommunkod}&size=100`
  );
  const lista = data?.body?._embedded?.listedSchoolUnits ?? [];
  return lista.map((s) => ({
    kod: s.code,
    namn: s.name,
    kommunkod: s.geographicalAreaCode,
    kommun: KOMMUN_NAMN[s.geographicalAreaCode] ?? s.geographicalAreaCode,
    huvudman: s.principalOrganizerType, // Kommunal / Fristående
  }));
}

// Hämtar detaljer för en skolenhet, inkl. koordinater och kontaktuppgifter.
export async function hamtaSkoldetaljer(kod) {
  const data = await api(`/school-units/${kod}`);
  const b = data?.body;
  if (!b) return null;
  const besok = (b.contactInfo?.addresses ?? []).find(
    (a) => a.type === 'VISITING_ADDRESS'
  ) ?? b.contactInfo?.addresses?.[0];
  const lat = parseFloat(b.wgs84_Lat);
  const lng = parseFloat(b.wgs84_Long);
  return {
    kod: b.code,
    namn: b.name,
    kommunkod: b.geographicalAreaCode,
    kommun: KOMMUN_NAMN[b.geographicalAreaCode] ?? b.geographicalAreaCode,
    huvudman: b.principalOrganizerType,
    organisation: b.corporationName,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    adress: besok
      ? {
          gata: besok.street,
          postnr: besok.zipCode,
          ort: besok.city,
        }
      : null,
    epost: b.contactInfo?.email || null,
    telefon: b.contactInfo?.telephone || null,
    webb: b.contactInfo?.web || null,
  };
}

// Hämtar de gymnasieprogram skolan erbjuder, härlett ur gymnasiestatistiken.
export async function hamtaProgram(kod) {
  let data;
  try {
    data = await api(`/school-units/${kod}/statistics/gy`);
  } catch {
    return [];
  }
  const metrics = data?.body?.programMetrics ?? [];
  // Slå ihop till unika programkoder (statistiken kan ha rader per inriktning).
  const koder = new Set(
    metrics.map((m) => m.programCode).filter(Boolean)
  );
  return [...koder].sort();
}
