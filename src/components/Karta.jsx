import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';

// Blekinge ligger i sydöstra Sverige – startvy centrerad över länet.
const BLEKINGE_CENTRUM = [56.22, 15.3];
const STARTZOOM = 9;

// Färg per huvudmannatyp.
export function huvudmanFarg(huvudman) {
  return huvudman === 'Kommunal' ? '#2563eb' : '#db2777';
}

export default function Karta({ skolor, vald, onValj }) {
  return (
    <MapContainer
      center={BLEKINGE_CENTRUM}
      zoom={STARTZOOM}
      scrollWheelZoom
      className="karta"
    >
      {/* Ljus, minimalistisk bakgrundskarta (CARTO Positron). */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      {skolor.map((s) => {
        const aktiv = vald?.kod === s.kod;
        return (
          <CircleMarker
            key={s.kod}
            center={[s.lat, s.lng]}
            radius={aktiv ? 11 : 7}
            pathOptions={{
              color: '#ffffff',
              weight: aktiv ? 3 : 2,
              fillColor: huvudmanFarg(s.huvudman),
              fillOpacity: aktiv ? 1 : 0.85,
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
