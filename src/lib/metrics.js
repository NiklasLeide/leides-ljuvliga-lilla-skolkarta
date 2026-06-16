// Definitioner av de nyckeltal man kan färglägga kartan, ranka topplistan och
// jämföra skolor med. Allt utgår från de aggregerade värdena i skola.metrics.

export const METRICS = [
  {
    key: 'andelBehoriga',
    label: 'Andel behöriga till högskola',
    kort: 'Behöriga (%)',
    enhet: '%',
    hogreBattre: true,
    get: (s) => s.metrics?.andelBehoriga ?? null,
  },
  {
    key: 'behorigaLarare',
    label: 'Andel behöriga lärare',
    kort: 'Behöriga lärare (%)',
    enhet: '%',
    hogreBattre: true,
    get: (s) => s.metrics?.behorigaLarare ?? null,
  },
  {
    key: 'larartathet',
    label: 'Elever per lärare',
    kort: 'Elever/lärare',
    enhet: '',
    hogreBattre: false, // färre elever per lärare = bättre
    get: (s) => s.metrics?.larartathet ?? null,
  },
  {
    key: 'antalElever',
    label: 'Antal elever',
    kort: 'Elever',
    enhet: '',
    hogreBattre: true, // sorteras störst först (inte "bättre")
    neutral: true,
    get: (s) => s.metrics?.antalElever ?? null,
  },
];

export function metricByKey(key) {
  return METRICS.find((m) => m.key === key) ?? METRICS[0];
}

export function formateraVarde(metric, varde) {
  if (varde == null) return 'saknas';
  const tal =
    metric.enhet === '%' || metric.key === 'larartathet'
      ? varde.toFixed(1).replace('.', ',')
      : Math.round(varde).toString();
  return metric.enhet ? `${tal}${metric.enhet === '%' ? ' %' : ''}` : tal;
}

// Min/max för ett nyckeltal över en uppsättning skolor (ignorerar saknade).
export function intervall(metric, skolor) {
  const varden = skolor.map((s) => metric.get(s)).filter((v) => v != null);
  if (varden.length === 0) return null;
  return { min: Math.min(...varden), max: Math.max(...varden) };
}

// Normaliserar ett värde till 0..1 där 1 alltid betyder "bra"/högt på skalan.
export function normalisera(metric, varde, omfang) {
  if (varde == null || !omfang || omfang.max === omfang.min) return null;
  const t = (varde - omfang.min) / (omfang.max - omfang.min);
  return metric.hogreBattre ? t : 1 - t;
}

// Färgskala från blek till mättad. Neutrala mått använder blått, övriga går
// från rött (lågt) via gult till grönt (högt) likt ett trafikljus.
export function fargForT(metric, t) {
  if (t == null) return '#cbd5e1'; // grått = data saknas
  if (metric.neutral) {
    return blanda([226, 232, 240], [37, 99, 235], t); // ljusgrått → blått
  }
  return t < 0.5
    ? blanda([220, 38, 38], [234, 179, 8], t * 2) // rött → gult
    : blanda([234, 179, 8], [22, 163, 74], (t - 0.5) * 2); // gult → grönt
}

function blanda(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
