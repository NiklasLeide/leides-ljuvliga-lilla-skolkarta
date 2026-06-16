import { Fragment, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { fargForT, normalisera } from '../lib/metrics.js';

// Blekinge ligger i sydöstra Sverige – startvy centrerad över länet.
const BLEKINGE_CENTRUM = [56.22, 15.3];
const STARTZOOM = 9;

// Avstånd i pixlar under vilket två markörer räknas som överlappande.
const KLUNGA_PX = 26;

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

export default function Karta(props) {
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
      <Markorer {...props} />
    </MapContainer>
  );
}

function Markorer({ skolor, vald, onValj, fargMetric, omfang, maxElever, matchar }) {
  const map = useMap();
  const [oppen, setOppen] = useState(null); // id på utspridd klunga
  const [tick, setTick] = useState(0); // tvinga omräkning vid zoom
  const stangTimer = useRef(null);

  // Räkna om klungor när zoomen ändras (pixelavstånd beror på zoom).
  useMapEvents({
    zoomstart: () => setOppen(null),
    zoomend: () => setTick((t) => t + 1),
  });

  // Gruppera markörer som ligger nära varandra i pixelrymden (enkel union).
  const klungor = useMemo(() => {
    const pts = skolor.map((s) => ({ s, p: map.latLngToLayerPoint([s.lat, s.lng]) }));
    const anvand = new Array(pts.length).fill(false);
    const grupper = [];
    for (let i = 0; i < pts.length; i++) {
      if (anvand[i]) continue;
      const grupp = [pts[i].s];
      anvand[i] = true;
      for (let j = i + 1; j < pts.length; j++) {
        if (anvand[j]) continue;
        if (pts[i].p.distanceTo(pts[j].p) < KLUNGA_PX) {
          grupp.push(pts[j].s);
          anvand[j] = true;
        }
      }
      grupper.push(grupp);
    }
    return grupper;
  }, [skolor, map, tick]);

  function oppna(id) {
    clearTimeout(stangTimer.current);
    setOppen(id);
  }
  function schemaStang() {
    clearTimeout(stangTimer.current);
    stangTimer.current = setTimeout(() => setOppen(null), 220);
  }

  const fargFor = (s) =>
    fargMetric
      ? fargForT(fargMetric, normalisera(fargMetric, fargMetric.get(s), omfang))
      : huvudmanFarg(s.huvudman);

  const skolMarkor = (s, position) => {
    const aktiv = vald?.kod === s.kod;
    const med = matchar ? matchar(s) : true;
    return (
      <CircleMarker
        key={s.kod}
        center={position}
        radius={radie(s.metrics?.antalElever, maxElever) * (aktiv ? 1.25 : 1)}
        pathOptions={{
          color: aktiv ? '#0f172a' : '#ffffff',
          weight: aktiv ? 3 : 1.5,
          fillColor: fargFor(s),
          fillOpacity: med ? (aktiv ? 1 : 0.85) : 0.12,
          opacity: med ? 1 : 0.25,
        }}
        eventHandlers={{
          click: () => onValj(s),
          mouseover: () => clearTimeout(stangTimer.current),
          mouseout: schemaStang,
        }}
      >
        <Tooltip direction="top" offset={[0, -6]}>
          {s.namn}
        </Tooltip>
      </CircleMarker>
    );
  };

  return (
    <>
      {klungor.map((grupp) => {
        if (grupp.length === 1) return skolMarkor(grupp[0], [grupp[0].lat, grupp[0].lng]);

        const id = grupp.map((s) => s.kod).join('-');
        const mitt = L.latLng(
          grupp.reduce((a, s) => a + s.lat, 0) / grupp.length,
          grupp.reduce((a, s) => a + s.lng, 0) / grupp.length
        );

        // Sprid ut vid hover, eller om en vald skola finns i klungan.
        const utspridd = oppen === id || grupp.some((s) => s.kod === vald?.kod);
        if (!utspridd) {
          // Hopfälld klunga: en bubbla med antal, sprids ut vid hover.
          const ikon = L.divIcon({
            className: 'klunga-wrap',
            html: `<div class="klunga">${grupp.length}</div>`,
            iconSize: [30, 30],
          });
          return (
            <Marker
              key={id}
              position={mitt}
              icon={ikon}
              eventHandlers={{
                mouseover: () => oppna(id),
                mouseout: schemaStang,
                click: () => oppna(id),
              }}
            >
              <Tooltip direction="top" offset={[0, -14]}>
                {grupp.length} skolor – hovra för att sprida
              </Tooltip>
            </Marker>
          );
        }

        // Utspridd klunga: medlemmarna placeras i en ring runt mitten.
        const mittPx = map.latLngToLayerPoint(mitt);
        const rr = 30 + grupp.length * 5;
        return (
          <Fragment key={id}>
            {grupp.map((s, k) => {
              const vinkel = (2 * Math.PI * k) / grupp.length - Math.PI / 2;
              const pos = map.layerPointToLatLng(
                L.point(mittPx.x + rr * Math.cos(vinkel), mittPx.y + rr * Math.sin(vinkel))
              );
              return (
                <Fragment key={s.kod}>
                  <Polyline
                    positions={[mitt, pos]}
                    pathOptions={{ color: '#94a3b8', weight: 1, opacity: 0.7 }}
                  />
                  {skolMarkor(s, pos)}
                </Fragment>
              );
            })}
            {/* Liten mittpunkt som håller klungan öppen mellan markörerna. */}
            <CircleMarker
              center={mitt}
              radius={4}
              pathOptions={{ color: '#fff', weight: 1, fillColor: '#64748b', fillOpacity: 1 }}
              eventHandlers={{ mouseover: () => oppna(id), mouseout: schemaStang }}
            />
          </Fragment>
        );
      })}
    </>
  );
}
