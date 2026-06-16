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

const sov = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, forsok = 0) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: ACCEPT },
  });
  if (!res.ok) {
    // 403/429/5xx är ofta tillfällig rate-limiting – backa av och försök igen.
    if ([403, 429, 500, 502, 503].includes(res.status) && forsok < 4) {
      await sov(500 * 2 ** forsok);
      return api(path, forsok + 1);
    }
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

// Tolkar Skolverkets talvärden: svenskt decimalkomma ("13,2"), "cirka 30",
// samt specialkoderna ".." (för få elever) och "." (saknas) → null.
function tolkaTal(rad) {
  if (!rad || rad.valueType !== 'EXISTS' || rad.value == null) return null;
  const m = String(rad.value).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Plockar senaste året med ett faktiskt värde ur en tidsserie.
function senaste(serie) {
  const giltiga = (serie ?? [])
    .filter((r) => r.valueType === 'EXISTS' && r.value != null)
    .sort((a, b) => String(b.timePeriod).localeCompare(String(a.timePeriod)));
  return giltiga[0] ?? null;
}

// Hämtar gymnasiestatistik för en skola och aggregerar till nyckeltal på
// skolnivå. Lärartäthet och behöriga lärare är redan på skolnivå (samma för
// alla program); antal elever och andel behöriga är per program och slås ihop.
export async function hamtaStatistik(kod) {
  let data;
  try {
    data = await api(`/school-units/${kod}/statistics/gy`);
  } catch {
    return { program: [], metrics: {} };
  }
  const pm = data?.body?.programMetrics ?? [];

  const program = [...new Set(pm.map((m) => m.programCode).filter(Boolean))].sort();

  // Skolnivå: ta första programblockets värde (identiskt över program).
  let larartathet = null;
  let behorigaLarare = null;
  let harBibliotek = false;
  for (const m of pm) {
    larartathet ??= tolkaTal(senaste(m.studentsPerTeacherQuota));
    behorigaLarare ??= tolkaTal(senaste(m.certifiedTeachersQuota));
    if (m.hasLibrary) harBibliotek = true;
  }

  // Per program: summera elever, elevviktat snitt för andel behöriga.
  let antalElever = 0;
  let harElevtal = false;
  let viktSumma = 0;
  let andelSumma = 0;
  for (const m of pm) {
    const elever = tolkaTal(senaste(m.totalNumberOfPupils));
    if (elever != null) {
      antalElever += elever;
      harElevtal = true;
    }
    const andel = tolkaTal(senaste(m.ratioOfStudentsEligibleForUndergraduateEducation));
    if (andel != null) {
      const vikt = elever ?? 1;
      viktSumma += vikt;
      andelSumma += andel * vikt;
    }
  }

  return {
    program,
    metrics: {
      antalElever: harElevtal ? antalElever : null,
      larartathet,
      behorigaLarare,
      andelBehoriga: viktSumma > 0 ? andelSumma / viktSumma : null,
      harBibliotek,
    },
  };
}
