import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { geocodeLocation, urgencyKey } from '../../lib/taskAdapter';

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

const VOLUNTEER_ICON = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <circle cx="11" cy="11" r="9" fill="#00ff88" opacity="0.18"/>
    <circle cx="11" cy="11" r="5" fill="#00ff88"/>
    <circle cx="11" cy="11" r="2" fill="#0a0a0a"/>
  </svg>`,
  className: 'tactical-volunteer-marker',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const ICONS = {
  high: createPinIcon('#ff3333'),
  medium: createPinIcon('#ffaa00'),
  low: createPinIcon('#00cc66'),
};

function RadarPulse({ position, color = '#ff3333' }) {
  const map = useMap();
  const elRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'radar-pulse-ring';
    el.style.cssText = `--radar-color: ${color}; position: absolute; pointer-events: none; z-index: 500;`;
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

function RouteLabel({ position, distanceKm }) {
  const map = useMap();
  const elRef = useRef(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'route-distance-label mono';
    el.textContent = `${distanceKm.toFixed(1)} km`;
    elRef.current = el;
    map.getPane('overlayPane').appendChild(el);

    const update = () => {
      const point = map.latLngToLayerPoint(position);
      el.style.left = `${point.x}px`;
      el.style.top = `${point.y}px`;
    };
    update();
    map.on('zoom move', update);

    return () => {
      map.off('zoom move', update);
      el.remove();
    };
  }, [map, position, distanceKm]);

  return null;
}

function resolveCoords(t) {
  if (typeof t.lat === 'number' && typeof t.lng === 'number') {
    return [t.lat, t.lng];
  }
  return geocodeLocation(t.locationText) || null;
}

export default function TacticalMap({ tasks = [] }) {
  const { pins, volunteerPins, routes, ungeocoded } = useMemo(() => {
    const pins = [];
    const routes = [];
    const volunteerMap = new Map(); // dedupe volunteers
    let ungeocoded = 0;

    for (const t of tasks) {
      const coords = resolveCoords(t);
      if (!coords) { ungeocoded += 1; continue; }
      pins.push({
        id: t.id,
        lat: coords[0],
        lng: coords[1],
        urgency: urgencyKey(t.urgency),
        label: `${t.locationText || 'Unknown'} — ${t.category || 'Unclassified'}`,
        status: t.status,
        volunteerName: t.assignedVolunteerName,
      });

      const isRouted =
        (t.status === 'assigned' || t.status === 'dispatched') &&
        typeof t.assignedVolunteerLat === 'number' &&
        typeof t.assignedVolunteerLng === 'number';

      if (isRouted) {
        const vKey = `${t.assignedVolunteerId || t.assignedVolunteerName}`;
        if (!volunteerMap.has(vKey)) {
          volunteerMap.set(vKey, {
            id: vKey,
            lat: t.assignedVolunteerLat,
            lng: t.assignedVolunteerLng,
            name: t.assignedVolunteerName || 'Volunteer',
          });
        }
        const km =
          typeof t.assignedVolunteerDistanceKm === 'number'
            ? t.assignedVolunteerDistanceKm
            : haversine(
                [t.assignedVolunteerLat, t.assignedVolunteerLng],
                coords,
              );
        routes.push({
          id: t.id,
          from: [t.assignedVolunteerLat, t.assignedVolunteerLng],
          to: coords,
          status: t.status,
          distanceKm: km,
        });
      }
    }

    return {
      pins,
      volunteerPins: Array.from(volunteerMap.values()),
      routes,
      ungeocoded,
    };
  }, [tasks]);

  const totalGeocoded = pins.length;

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

        {routes.map((r) => (
          <Polyline
            key={`route-${r.id}`}
            positions={[r.from, r.to]}
            pathOptions={{
              color: r.status === 'dispatched' ? '#00ff88' : '#88aaff',
              weight: 2,
              opacity: 0.85,
              dashArray: r.status === 'dispatched' ? null : '6 6',
              className: r.status === 'dispatched'
                ? 'route-line dispatched'
                : 'route-line assigned',
            }}
          />
        ))}

        {routes.map((r) => (
          <RouteLabel
            key={`route-label-${r.id}`}
            position={[(r.from[0] + r.to[0]) / 2, (r.from[1] + r.to[1]) / 2]}
            distanceKm={r.distanceKm}
          />
        ))}

        {pins.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={ICONS[p.urgency]}>
            <Popup className="tactical-popup">
              <div className="popup-inner">
                <span className={`popup-urgency ${p.urgency}`}>{p.urgency.toUpperCase()}</span>
                <span className="popup-label">{p.label}</span>
                <span className="popup-status mono">{p.status}</span>
                {p.volunteerName && (
                  <span className="popup-volunteer mono">→ {p.volunteerName}</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {volunteerPins.map((v) => (
          <Marker key={`vol-${v.id}`} position={[v.lat, v.lng]} icon={VOLUNTEER_ICON}>
            <Popup className="tactical-popup">
              <div className="popup-inner">
                <span className="popup-urgency low">VOLUNTEER</span>
                <span className="popup-label">{v.name}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {pins.filter((p) => p.urgency === 'high').map((p) => (
          <RadarPulse key={`radar-${p.id}`} position={[p.lat, p.lng]} color="#ff3333" />
        ))}
      </MapContainer>

      <div className="map-overlay-badge mono">
        <span className="map-badge-dot" />
        <span>{totalGeocoded} geocoded</span>
        {routes.length > 0 && (
          <span className="map-badge-dim">· {routes.length} en route</span>
        )}
        {ungeocoded > 0 && <span className="map-badge-dim">· {ungeocoded} pending</span>}
      </div>

      {routes.length > 0 && (
        <div className="map-legend mono">
          <div className="map-legend-item">
            <span className="map-legend-line dashed" /> Assigned
          </div>
          <div className="map-legend-item">
            <span className="map-legend-line solid" /> Dispatched
          </div>
        </div>
      )}
    </div>
  );
}

function haversine(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
