import { METRICS, formateraVarde } from '../lib/metrics.js';

// Färger som identifierar varje skola genom hela jämförelsen.
const PALETT = ['#2563eb', '#db2777', '#16a34a'];

export default function Jamfor({ skolor, onStang, onTaBort }) {
  return (
    <div className="overlay" onClick={onStang}>
      <div className="jmf" onClick={(e) => e.stopPropagation()}>
        <header className="jmf__head">
          <h2>Jämför skolor</h2>
          <button className="panel__stang" onClick={onStang} aria-label="Stäng">
            ✕
          </button>
        </header>

        <div className="jmf__legend">
          {skolor.map((s, i) => (
            <span key={s.kod} className="jmf__chip">
              <i style={{ background: PALETT[i] }} />
              {s.namn}
              <button onClick={() => onTaBort(s)} aria-label="Ta bort">
                ✕
              </button>
            </span>
          ))}
        </div>

        {METRICS.map((m) => {
          const varden = skolor.map((s) => m.get(s));
          const max = Math.max(...varden.filter((v) => v != null), 0) || 1;
          return (
            <section key={m.key} className="jmf__metrik">
              <h3>{m.label}</h3>
              {skolor.map((s, i) => {
                const v = m.get(s);
                return (
                  <div key={s.kod} className="jmf__stapelrad">
                    <span className="jmf__stapel">
                      <i
                        style={{
                          width: v != null ? `${8 + 92 * (v / max)}%` : '0%',
                          background: PALETT[i],
                        }}
                      />
                    </span>
                    <span className="jmf__varde">{formateraVarde(m, v)}</span>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
}
