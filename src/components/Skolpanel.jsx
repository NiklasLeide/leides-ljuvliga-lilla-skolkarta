import { useEffect, useState } from 'react';
import { hamtaProgram } from '../lib/skolverket.js';
import { beskrivProgram } from '../lib/program.js';
import { skolinspektionenLankar } from '../lib/skolinspektionen.js';
import { huvudmanFarg } from './Karta.jsx';

export default function Skolpanel({ skola, onStang }) {
  const [program, setProgram] = useState(skola.program ?? null);
  const [programStatus, setProgramStatus] = useState(
    skola.program ? 'klar' : 'laddar'
  );

  // Ladda programlistan (om den inte redan finns i snapshoten).
  useEffect(() => {
    let avbruten = false;
    if (skola.program) {
      setProgram(skola.program);
      setProgramStatus('klar');
      return;
    }
    setProgram(null);
    setProgramStatus('laddar');
    hamtaProgram(skola.kod)
      .then((p) => {
        if (avbruten) return;
        setProgram(p);
        setProgramStatus('klar');
      })
      .catch(() => {
        if (avbruten) return;
        setProgramStatus('fel');
      });
    return () => {
      avbruten = true;
    };
  }, [skola.kod, skola.program]);

  const lankar = skolinspektionenLankar(skola);
  const utbildningar = (program ?? []).map(beskrivProgram);

  return (
    <aside className="panel">
      <button className="panel__stang" onClick={onStang} aria-label="Stäng">
        ✕
      </button>

      <header className="panel__head">
        <span
          className="panel__prick"
          style={{ background: huvudmanFarg(skola.huvudman) }}
        />
        <h2>{skola.namn}</h2>
        <p className="panel__meta">
          {skola.kommun} · {skola.huvudman?.toLowerCase()} huvudman
        </p>
      </header>

      {skola.adress && (
        <p className="panel__adress">
          {skola.adress.gata}, {skola.adress.postnr} {skola.adress.ort}
        </p>
      )}

      <div className="panel__kontakt">
        {skola.webb && (
          <a href={skola.webb} target="_blank" rel="noreferrer">
            Webbplats
          </a>
        )}
        {skola.telefon && <a href={`tel:${skola.telefon}`}>{skola.telefon}</a>}
        {skola.epost && <a href={`mailto:${skola.epost}`}>E-post</a>}
      </div>

      <section className="panel__sektion">
        <h3>Utbildningar</h3>
        {programStatus === 'laddar' && <p className="panel__info">Hämtar utbildningar…</p>}
        {programStatus === 'fel' && (
          <p className="panel__info">Kunde inte hämta utbildningar just nu.</p>
        )}
        {programStatus === 'klar' && utbildningar.length === 0 && (
          <p className="panel__info">
            Inga gymnasieprogram rapporterade för denna skolenhet.
          </p>
        )}
        {programStatus === 'klar' && utbildningar.length > 0 && (
          <ul className="program">
            {utbildningar.map((u) => (
              <li key={u.kod} className="program__rad">
                <span className="program__namn">{u.namn}</span>
                <span className="program__typ" data-typ={u.typ}>
                  {u.typ}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel__sektion">
        <h3>Skolinspektionen</h3>
        <p className="panel__info">
          Beslut, tillsynsrapporter och skolenkäter publiceras av
          Skolinspektionen (ej via öppet API).
        </p>
        <div className="panel__lankar">
          <a
            className="knapp knapp--primar"
            href={lankar.forifylldSok}
            target="_blank"
            rel="noreferrer"
          >
            Sök dokument för {skola.namn}
          </a>
          <a
            className="knapp"
            href={lankar.sokverktyg}
            target="_blank"
            rel="noreferrer"
          >
            Skolinspektionens söktjänst
          </a>
        </div>
      </section>

      <footer className="panel__fot">Skolenhetskod: {skola.kod}</footer>
    </aside>
  );
}
