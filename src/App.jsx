import { useMemo, useState } from 'react';
import Karta from './components/Karta.jsx';
import Kontroller from './components/Kontroller.jsx';
import Topplista from './components/Topplista.jsx';
import Skolpanel from './components/Skolpanel.jsx';
import Jamfor from './components/Jamfor.jsx';
import { useGymnasieskolor } from './lib/useGymnasieskolor.js';
import { beskrivProgram } from './lib/program.js';
import { metricByKey, intervall, fargForT } from './lib/metrics.js';

const MAX_JMF = 3;

export default function App() {
  const { skolor, status, kalla } = useGymnasieskolor();
  const [fargKey, setFargKey] = useState('huvudman');
  const [programVal, setProgramVal] = useState('');
  const [vald, setVald] = useState(null);
  const [jamforKoder, setJamforKoder] = useState([]);
  const [visaJamfor, setVisaJamfor] = useState(false);

  const fargMetric = fargKey === 'huvudman' ? null : metricByKey(fargKey);
  const rankMetric = fargMetric ?? metricByKey('andelBehoriga');

  // Programfamiljer (BF, EK, ...) som finns bland skolorna → till program-findern.
  const programOptioner = useMemo(() => {
    const prefix = new Set();
    skolor.forEach((s) => (s.program ?? []).forEach((p) => prefix.add(p.slice(0, 2).toUpperCase())));
    return [...prefix]
      .map((p) => ({ kod: p, namn: beskrivProgram(p).namn }))
      .sort((a, b) => a.namn.localeCompare(b.namn, 'sv'));
  }, [skolor]);

  const matchar = (s) =>
    !programVal ||
    (s.program ?? []).some((p) => p.slice(0, 2).toUpperCase() === programVal);

  const omfangFarg = useMemo(
    () => (fargMetric ? intervall(fargMetric, skolor) : null),
    [fargMetric, skolor]
  );
  const maxElever = useMemo(
    () => Math.max(0, ...skolor.map((s) => s.metrics?.antalElever ?? 0)),
    [skolor]
  );

  // Filtrerade + rankade skolor för topplistan.
  const rankade = useMemo(() => {
    const filtrerade = skolor.filter(matchar);
    return [...filtrerade].sort((a, b) => {
      const va = rankMetric.get(a);
      const vb = rankMetric.get(b);
      if (va == null) return 1;
      if (vb == null) return -1;
      return rankMetric.hogreBattre ? vb - va : va - vb;
    });
  }, [skolor, rankMetric, programVal]);
  const omfangRank = useMemo(
    () => intervall(rankMetric, rankade),
    [rankMetric, rankade]
  );

  const jamfor = skolor.filter((s) => jamforKoder.includes(s.kod));

  function toggleJamfor(s) {
    setJamforKoder((koder) =>
      koder.includes(s.kod)
        ? koder.filter((k) => k !== s.kod)
        : koder.length < MAX_JMF
        ? [...koder, s.kod]
        : koder
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__titel">
          <h1>Gymnasiekartan Blekinge</h1>
          <p>
            Färglägg efter nyckeltal, ranka, filtrera på program och jämför
            skolor – data från Skolverkets öppna API:er.
          </p>
        </div>
        <div className="topbar__status">
          {status === 'klar' && (
            <>
              <span className="pill">{skolor.length} skolor</span>
              <span className="pill pill--kalla" data-kalla={kalla}>
                {kalla === 'live' ? 'Live från Skolverket' : 'Sparad data'}
              </span>
            </>
          )}
          {status === 'laddar' && <span className="pill">Laddar…</span>}
        </div>
      </header>

      {status === 'klar' && (
        <Kontroller
          fargKey={fargKey}
          onFargKey={setFargKey}
          programVal={programVal}
          onProgramVal={setProgramVal}
          programOptioner={programOptioner}
        />
      )}

      <main className="innehall">
        <div className="kartruta">
          {status === 'fel' ? (
            <div className="centrerat">
              Kunde inte hämta skoldata. Försök igen senare.
            </div>
          ) : (
            <Karta
              skolor={skolor}
              vald={vald}
              onValj={setVald}
              fargMetric={fargMetric}
              omfang={omfangFarg}
              maxElever={maxElever}
              matchar={matchar}
            />
          )}

          <Legend fargMetric={fargMetric} omfang={omfangFarg} />
        </div>

        {status === 'klar' &&
          (vald ? (
            <Skolpanel
              skola={vald}
              onStang={() => setVald(null)}
              jamfor={jamforKoder}
              onToggleJamfor={toggleJamfor}
            />
          ) : (
            <Topplista
              skolor={rankade}
              metric={rankMetric}
              omfang={omfangRank}
              onValj={setVald}
              jamfor={jamforKoder}
              onToggleJamfor={toggleJamfor}
            />
          ))}
      </main>

      {jamforKoder.length > 0 && (
        <div className="jmfbar">
          <span>{jamforKoder.length} vald(a) för jämförelse</span>
          <div className="jmfbar__knappar">
            <button onClick={() => setJamforKoder([])}>Rensa</button>
            <button
              className="knapp--primar"
              disabled={jamforKoder.length < 2}
              onClick={() => setVisaJamfor(true)}
            >
              Jämför ({jamforKoder.length})
            </button>
          </div>
        </div>
      )}

      {visaJamfor && jamfor.length >= 2 && (
        <Jamfor
          skolor={jamfor}
          onStang={() => setVisaJamfor(false)}
          onTaBort={toggleJamfor}
        />
      )}

      <footer className="sidfot">
        Data från{' '}
        <a
          href="https://www.skolverket.se/om-oss/oppna-data"
          target="_blank"
          rel="noreferrer"
        >
          Skolverkets öppna API:er
        </a>{' '}
        (Planned educations). Kartrutor © OpenStreetMap &amp; CARTO.
      </footer>
    </div>
  );
}

// Dynamisk legend: gradient för nyckeltal, annars kategoriskt för huvudman.
function Legend({ fargMetric, omfang }) {
  if (fargMetric) {
    const stopp = [0, 0.25, 0.5, 0.75, 1]
      .map((t) => fargForT(fargMetric, t))
      .join(', ');
    const visa = (v) =>
      v == null ? '' : fargMetric.enhet === '%' ? `${Math.round(v)}%` : Math.round(v);
    return (
      <div className="legend">
        <strong>{fargMetric.label}</strong>
        <div className="legend__skala" style={{ background: `linear-gradient(90deg, ${stopp})` }} />
        <div className="legend__ändar">
          <span>{omfang ? visa(fargMetric.hogreBattre ? omfang.min : omfang.max) : 'lågt'}</span>
          <span>{omfang ? visa(fargMetric.hogreBattre ? omfang.max : omfang.min) : 'högt'}</span>
        </div>
        <span className="legend__not">Storlek = antal elever</span>
      </div>
    );
  }
  return (
    <div className="legend">
      <span>
        <i className="legend__prick" style={{ background: '#2563eb' }} />
        Kommunal
      </span>
      <span>
        <i className="legend__prick" style={{ background: '#db2777' }} />
        Fristående
      </span>
      <span className="legend__not">Storlek = antal elever</span>
    </div>
  );
}
