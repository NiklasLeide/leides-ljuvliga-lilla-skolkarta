import { beskrivProgram } from '../lib/program.js';
import { skolinspektionenLankar } from '../lib/skolinspektionen.js';
import { METRICS, formateraVarde } from '../lib/metrics.js';
import { huvudmanFarg } from './Karta.jsx';

export default function Skolpanel({ skola, onStang, jamfor, onToggleJamfor }) {
  const lankar = skolinspektionenLankar(skola);
  const utbildningar = (skola.program ?? []).map(beskrivProgram);
  const ivald = jamfor.includes(skola.kod);

  return (
    <aside className="panel">
      <button className="panel__stang" onClick={onStang} aria-label="Tillbaka">
        ←
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

      <button
        className={`knapp ${ivald ? '' : 'knapp--primar'} panel__jmf`}
        onClick={() => onToggleJamfor(skola)}
      >
        {ivald ? '✓ I jämförelsen' : '+ Lägg till i jämförelse'}
      </button>

      <section className="panel__sektion">
        <h3>Nyckeltal</h3>
        <dl className="nyckeltal">
          {METRICS.map((m) => (
            <div key={m.key} className="nyckeltal__rad">
              <dt>{m.label}</dt>
              <dd>{formateraVarde(m, m.get(skola))}</dd>
            </div>
          ))}
          <div className="nyckeltal__rad">
            <dt>Skolbibliotek</dt>
            <dd>{skola.metrics?.harBibliotek ? 'Ja' : 'Nej'}</dd>
          </div>
        </dl>
      </section>

      <section className="panel__sektion">
        <h3>Utbildningar</h3>
        {utbildningar.length === 0 ? (
          <p className="panel__info">
            Inga gymnasieprogram rapporterade för denna skolenhet.
          </p>
        ) : (
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
