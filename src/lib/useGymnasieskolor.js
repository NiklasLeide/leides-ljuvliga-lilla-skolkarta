import { useEffect, useState } from 'react';
import {
  BLEKINGE_KOMMUNER,
  listaGymnasieskolor,
  hamtaSkoldetaljer,
} from './skolverket.js';

// Bas-URL för statiska filer (respekterar Vite:s `base` på GitHub Pages).
const BAS = import.meta.env.BASE_URL;

// Försöker hämta live från Skolverkets API. Faller tillbaka på den
// förgenererade snapshoten om nätverket/API:t inte svarar.
export function useGymnasieskolor() {
  const [skolor, setSkolor] = useState([]);
  const [status, setStatus] = useState('laddar'); // laddar | klar | fel
  const [kalla, setKalla] = useState(null); // 'live' | 'snapshot'

  useEffect(() => {
    let avbruten = false;

    async function laddaLive() {
      const listor = await Promise.all(
        BLEKINGE_KOMMUNER.map((k) => listaGymnasieskolor(k.kod))
      );
      const grund = listor.flat();
      const detaljerade = await Promise.all(
        grund.map(async (s) => {
          const d = await hamtaSkoldetaljer(s.kod);
          return d ? { ...d, huvudman: s.huvudman, program: null } : null;
        })
      );
      return detaljerade
        .filter((s) => s && s.lat != null && s.lng != null)
        .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'));
    }

    async function laddaSnapshot() {
      const res = await fetch(`${BAS}data/blekinge-gymnasieskolor.json`);
      if (!res.ok) throw new Error('Kunde inte läsa snapshot');
      const data = await res.json();
      return data.skolor ?? [];
    }

    (async () => {
      try {
        const live = await laddaLive();
        if (avbruten) return;
        setSkolor(live);
        setKalla('live');
        setStatus('klar');
      } catch (liveFel) {
        console.warn('Live-hämtning misslyckades, använder snapshot.', liveFel);
        try {
          const snap = await laddaSnapshot();
          if (avbruten) return;
          setSkolor(snap);
          setKalla('snapshot');
          setStatus('klar');
        } catch (snapFel) {
          if (avbruten) return;
          console.error(snapFel);
          setStatus('fel');
        }
      }
    })();

    return () => {
      avbruten = true;
    };
  }, []);

  return { skolor, status, kalla };
}
