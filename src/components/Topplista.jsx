import { formateraVarde } from '../lib/metrics.js';
import { huvudmanFarg } from './Karta.jsx';

// Rankad lista över skolorna efter valt nyckeltal. Skolorna kommer redan
// filtrerade och sorterade från App.
export default function Topplista({
  skolor,
  metric,
  omfang,
  onValj,
  jamfor,
  onToggleJamfor,
}) {
  return (
    <aside className="panel">
      <header className="panel__head">
        <h2>Topplista</h2>
        <p className="panel__meta">{metric.label}</p>
      </header>

      {skolor.length === 0 && (
        <p className="panel__info">Inga skolor matchar filtret.</p>
      )}

      <ol className="topp">
        {skolor.map((s, i) => {
          const varde = metric.get(s);
          const bredd =
            varde != null && omfang && omfang.max > omfang.min
              ? 8 + 92 * ((varde - omfang.min) / (omfang.max - omfang.min))
              : 0;
          const ivald = jamfor.includes(s.kod);
          return (
            <li key={s.kod} className="topp__rad">
              <span className="topp__plats">{i + 1}</span>
              <button className="topp__knapp" onClick={() => onValj(s)}>
                <span className="topp__namn">
                  <i
                    className="topp__prick"
                    style={{ background: huvudmanFarg(s.huvudman) }}
                  />
                  {s.namn}
                </span>
                <span className="topp__stapel">
                  <i style={{ width: `${bredd}%` }} />
                </span>
              </button>
              <span className="topp__varde">{formateraVarde(metric, varde)}</span>
              <button
                className={`topp__jmf ${ivald ? 'topp__jmf--på' : ''}`}
                title={ivald ? 'Ta bort ur jämförelse' : 'Lägg till i jämförelse'}
                onClick={() => onToggleJamfor(s)}
              >
                {ivald ? '✓' : '+'}
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
