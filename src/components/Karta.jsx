import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { fargForT, normalisera } from '../lib/metrics.js';

// Blekinge ligger i sydöstra Sverige – startvy centrerad över länet.
const BLEKINGE_CENTRUM = [56.22, 15.3];
const STARTZOOM = 9;

// Färg per huvudmannatyp (kategoriskt läge).
export function huvudmanFarg(huvudman) {
  return huvudman === 'Kommunal' ? '#2563eb' : '#db2777';
}

// Bubbelradie utifrån antal elever (kvadratrotsskala ≈ area ∝ elever).
function radie(elever, maxElever) {
  const bas = 7;
  if (!elever || !maxElever) return bas;
  return bas + 13 * Math.sqrt(elever / maxElever);
}

export default function Karta({
  skolor,
  vald,
  onValj,
  fargMetric, // null = färga efter huvudman
  omfang,
  maxElever,
  matchar, // funktion: (skola) => bool, för programfilter
}) {
  return (
    <MapContainer
      center={BLEKINGE_CENTRUM}
      zoom={STARTZOOM}
      scrollWheelZoom
      className="karta"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      {skolor.map((s) => {
        const aktiv = vald?.kod === s.kod;
        const med = matchar ? matchar(s) : true;
        const fill = fargMetric
          ? fargForT(fargMetric, normalisera(fargMetric, fargMetric.get(s), omfang))
          : huvudmanFarg(s.huvudman);
        return (
          <CircleMarker
            key={s.kod}
            center={[s.lat, s.lng]}
            radius={radie(s.metrics?.antalElever, maxElever) * (aktiv ? 1.25 : 1)}
            pathOptions={{
              color: aktiv ? '#0f172a' : '#ffffff',
              weight: aktiv ? 3 : 1.5,
              fillColor: fill,
              fillOpacity: med ? (aktiv ? 1 : 0.85) : 0.12,
              opacity: med ? 1 : 0.25,
            }}
            eventHandlers={{ click: () => onValj(s) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {s.namn}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
