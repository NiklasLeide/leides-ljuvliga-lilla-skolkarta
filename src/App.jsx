import { useState } from 'react';
import Karta from './components/Karta.jsx';
import Skolpanel from './components/Skolpanel.jsx';
import { useGymnasieskolor } from './lib/useGymnasieskolor.js';

export default function App() {
  const { skolor, status, kalla } = useGymnasieskolor();
  const [vald, setVald] = useState(null);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__titel">
          <h1>Gymnasiekartan Blekinge</h1>
          <p>
            Alla gymnasieskolor i Blekinge län – klicka på en skola för
            utbildningar och dokument från Skolinspektionen.
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

      <main className="innehall">
        <div className="kartruta">
          {status === 'fel' ? (
            <div className="centrerat">
              Kunde inte hämta skoldata. Försök igen senare.
            </div>
          ) : (
            <Karta skolor={skolor} vald={vald} onValj={setVald} />
          )}

          <div className="legend">
            <span>
              <i className="legend__prick" style={{ background: '#2563eb' }} />
              Kommunal
            </span>
            <span>
              <i className="legend__prick" style={{ background: '#db2777' }} />
              Fristående
            </span>
          </div>
        </div>

        {vald && <Skolpanel skola={vald} onStang={() => setVald(null)} />}
      </main>

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
