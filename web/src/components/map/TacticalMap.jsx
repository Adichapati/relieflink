import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Custom urgency-coded marker icons ── */

function createPinIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" opacity="0.9"/>
    <circle cx="12" cy="12" r="5" fill="#0a0a0a"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'tactical-marker',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

const ICONS = {
  high: createPinIcon('#ff3333'),
  medium: createPinIcon('#ffaa00'),
  low: createPinIcon('#00cc66'),
};

/* ── Radar pulse overlay injected via DOM ── */

function RadarPulse({ position, color = '#ff3333' }) {
  const map = useMap();
  const elRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'radar-pulse-ring';
    el.style.cssText = `
      --radar-color: ${color};
      position: absolute;
      pointer-events: none;
      z-index: 500;
    `;
    elRef.current = el;
    map.getPane('overlayPane').appendChild(el);

    const update = () => {
      const point = map.latLngToLayerPoint(position);
      el.style.left = `${point.x - 30}px`;
      el.style.top = `${point.y - 30}px`;
    };
    update();
    map.on('zoom move', update);

    return () => {
      map.off('zoom move', update);
      el.remove();
    };
  }, [map, position, color]);

  return null;
}

/* ── Match line: animated arc connecting request → volunteer ── */

function MatchLine({ from, to, color = '#00ff88' }) {
  const map = useMap();
  const lineRef = useRef(null);

  useEffect(() => {
    const line = L.polyline([from, to], {
      color,
      weight: 1.5,
      opacity: 0.6,
      dashArray: '6 4',
      className: 'match-line-path',
    }).addTo(map);
    lineRef.current = line;
    return () => { line.remove(); };
  }, [map, from, to, color]);

  return null;
}

/* ── Map data (shared with globe pins) ── */

const REQUESTS = [
  { id: 1, lat: 12.97, lng: 77.59, urgency: 'high', label: 'Bangalore — Food & Water' },
  { id: 2, lat: 28.61, lng: 77.23, urgency: 'medium', label: 'Delhi — Medical Supplies' },
  { id: 3, lat: 6.5, lng: 3.4, urgency: 'high', label: 'Lagos — Emergency Shelter' },
  { id: 4, lat: -1.3, lng: 36.8, urgency: 'medium', label: 'Nairobi — Water Purification' },
  { id: 5, lat: 30.0, lng: 31.2, urgency: 'low', label: 'Cairo — Volunteer Coordination' },
  { id: 6, lat: -23.5, lng: -46.6, urgency: 'high', label: 'São Paulo — Flood Relief' },
  { id: 7, lat: 48.8, lng: 2.3, urgency: 'low', label: 'Paris — Logistics Hub' },
];

const MATCHES = [
  { from: [12.97, 77.59], to: [13.08, 77.58], color: '#00ff88' },
  { from: [6.5, 3.4], to: [6.45, 3.42], color: '#00ff88' },
  { from: [-23.5, -46.6], to: [-23.55, -46.63], color: '#00ff88' },
];

/* ── Main Component ── */

export default function TacticalMap() {
  return (
    <div className="tactical-map-wrapper">
      <MapContainer
        center={[15, 30]}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="tactical-map"
        style={{ width: '100%', height: '500px', background: '#0a0a0a' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {REQUESTS.map((r) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={ICONS[r.urgency]}>
            <Popup className="tactical-popup">
              <div className="popup-inner">
                <span className={`popup-urgency ${r.urgency}`}>{r.urgency.toUpperCase()}</span>
                <span className="popup-label">{r.label}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {REQUESTS.filter(r => r.urgency === 'high').map((r) => (
          <RadarPulse key={`radar-${r.id}`} position={[r.lat, r.lng]} color="#ff3333" />
        ))}

        {MATCHES.map((m, i) => (
          <MatchLine key={i} from={m.from} to={m.to} color={m.color} />
        ))}
      </MapContainer>
    </div>
  );
}
