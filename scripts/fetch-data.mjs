// Hämtar samtliga gymnasieskolor i Blekinge från Skolverkets Planned
// educations-API och skriver en snapshot till public/data/. Appen hämtar
// normalt live, men snapshoten används som offline-fallback och gör att
// kartan kan rendera direkt vid sidladdning.
//
//   npm run fetch-data

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BLEKINGE_KOMMUNER,
  listaGymnasieskolor,
  hamtaSkoldetaljer,
  hamtaStatistik,
} from '../src/lib/skolverket.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UTFIL = resolve(__dirname, '../public/data/blekinge-gymnasieskolor.json');

async function main() {
  console.log('Hämtar gymnasieskolor i Blekinge från Skolverkets API...\n');

  // 1. Lista alla gymnasieskolor i länets fem kommuner.
  const listor = await Promise.all(
    BLEKINGE_KOMMUNER.map((k) => listaGymnasieskolor(k.kod))
  );
  const grund = listor.flat();
  console.log(`Hittade ${grund.length} gymnasieskolor totalt.`);

  // 2. Berika varje skola med koordinater, kontaktuppgifter och program.
  const skolor = [];
  for (const s of grund) {
    const detaljer = await hamtaSkoldetaljer(s.kod);
    const { program, metrics } = await hamtaStatistik(s.kod);
    if (!detaljer || detaljer.lat == null || detaljer.lng == null) {
      console.warn(`  ⚠ Saknar koordinater, hoppar över: ${s.namn} (${s.kod})`);
      continue;
    }
    skolor.push({ ...detaljer, huvudman: s.huvudman, program, metrics });
    console.log(`  ✓ ${detaljer.namn} – ${program.length} program`);
  }

  skolor.sort((a, b) => a.namn.localeCompare(b.namn, 'sv'));

  const snapshot = {
    uppdaterad: new Date().toISOString(),
    kalla: 'Skolverkets öppna API (Planned educations v3)',
    antal: skolor.length,
    skolor,
  };

  await mkdir(dirname(UTFIL), { recursive: true });
  await writeFile(UTFIL, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`\nSkrev ${skolor.length} skolor till ${UTFIL}`);
}

main().catch((err) => {
  console.error('Fel vid datahämtning:', err);
  process.exit(1);
});
