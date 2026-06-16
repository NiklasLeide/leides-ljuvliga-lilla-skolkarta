import { METRICS } from '../lib/metrics.js';

// Kontrollrad: välj vilket nyckeltal som färglägger kartan/rankar topplistan,
// samt programfilter för "program-findern".
export default function Kontroller({
  fargKey,
  onFargKey,
  programVal,
  onProgramVal,
  programOptioner,
}) {
  return (
    <div className="kontroller">
      <label className="kontroll">
        <span>Färg &amp; ranking</span>
        <select value={fargKey} onChange={(e) => onFargKey(e.target.value)}>
          <option value="huvudman">Huvudman</option>
          {METRICS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="kontroll">
        <span>Visa skolor med program</span>
        <select value={programVal} onChange={(e) => onProgramVal(e.target.value)}>
          <option value="">Alla program</option>
          {programOptioner.map((p) => (
            <option key={p.kod} value={p.kod}>
              {p.namn}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
