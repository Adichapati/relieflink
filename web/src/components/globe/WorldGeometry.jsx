import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { feature } from 'topojson-client';
import { GLOBE_RADIUS } from './globeConfig';
import RequestPin from './RequestPin';

const DATA_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const CONTINENT_CENTERS = {
  Africa: [20, 0], Europe: [15, 50], Asia: [90, 40],
  'North America': [-100, 45], 'South America': [-60, -15],
  Oceania: [135, -25],
};

/* Request counts per continent (matches DEMO_PINS) */
const CONTINENT_REQUESTS = {
  Africa: 2, Europe: 1, Asia: 2,
  'North America': 0, 'South America': 1,
  Oceania: 0,
};

function latLngToVec3(lat, lng, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/* ── Country ID → Continent lookup (UN M49 numeric codes) ── */

const ID_TO_CONTINENT = {};
const addIds = (c, ids) => ids.forEach(id => { ID_TO_CONTINENT[id] = c; });

addIds('Africa', [12,24,204,72,854,108,120,132,140,148,174,178,180,384,262,818,
  226,232,231,266,270,288,324,624,404,426,430,434,450,454,466,478,480,504,
  508,516,562,566,646,678,686,694,706,710,728,729,736,748,834,768,788,800,
  732,894,716]);

addIds('Asia', [4,51,31,48,50,64,96,116,156,196,268,356,360,364,368,376,392,
  400,398,414,417,418,422,458,462,496,104,524,408,512,586,275,608,634,682,
  702,410,144,760,158,762,764,626,792,795,784,860,704,887]);

addIds('Europe', [8,20,40,112,56,70,100,191,203,208,233,246,250,276,300,348,
  352,372,380,428,440,442,807,470,498,499,528,578,616,620,642,643,688,703,
  705,724,752,756,804,826]);

addIds('North America', [28,44,52,84,124,188,192,212,214,222,308,320,332,340,
  388,484,558,591,659,662,670,780,840]);

addIds('South America', [32,68,76,152,170,218,328,600,604,740,858,862]);

addIds('Oceania', [36,242,296,584,583,520,540,554,598,882,90,776,798,548]);

function classifyById(id) {
  return ID_TO_CONTINENT[Number(id)] || null;
}

function subdivide(coords, maxDeg = 5) {
  const out = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i], [x2, y2] = coords[i + 1];
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.ceil(d / maxDeg));
    for (let s = 0; s < n; s++) {
      const t = s / n;
      out.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  out.push(coords[coords.length - 1]);
  return out;
}

function buildMesh(ring, radius) {
  const lngs = ring.map(c => c[0]);
  if (Math.max(...lngs) - Math.min(...lngs) > 180) return null;

  const sub = subdivide(ring, 5);
  const contour = sub.map(([lng, lat]) => new THREE.Vector2(lng, lat));
  if (contour.length > 2 && contour[0].distanceTo(contour[contour.length - 1]) < 0.01) contour.pop();
  if (contour.length < 3) return null;

  let tris;
  try { tris = THREE.ShapeUtils.triangulateShape(contour, []); } catch { return null; }
  if (!tris.length) return null;

  const pts = contour.map(v => latLngToVec3(v.y, v.x, radius));
  const verts = [], norms = [];
  for (const [a, b, c] of tris) {
    if (a >= pts.length || b >= pts.length || c >= pts.length) continue;
    for (const i of [a, b, c]) {
      verts.push(pts[i].x, pts[i].y, pts[i].z);
      const n = pts[i].clone().normalize();
      norms.push(n.x, n.y, n.z);
    }
  }
  if (!verts.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  return g;
}

/* ── Shared materials ── */

const SHARED_MAT_DEFAULT = new THREE.MeshPhongMaterial({
  color: new THREE.Color('#888888'),
  transparent: true,
  opacity: 0.65,
  side: THREE.DoubleSide,
  emissive: new THREE.Color('#222222'),
  emissiveIntensity: 0.08,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -10,
  polygonOffsetUnits: -10,
});

const SHARED_MAT_HOVERED = new THREE.MeshPhongMaterial({
  color: new THREE.Color('#aaaaaa'),
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
  emissive: new THREE.Color('#00ff88'),
  emissiveIntensity: 0.25,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -10,
  polygonOffsetUnits: -10,
});

/* ── Continent group with hover tooltip + pins inside ── */

const ContinentGroup = memo(function ContinentGroup({ name, geometries, pins, onContinentHover }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const offsetRef = useRef(0);
  const normalVec = useRef(new THREE.Vector3());

  useMemo(() => {
    const [lng, lat] = CONTINENT_CENTERS[name] || [0, 0];
    normalVec.current = latLngToVec3(lat, lng, 1).normalize();
  }, [name]);

  useFrame((_, dt) => {
    const target = hovered ? 10 : 0;
    const diff = target - offsetRef.current;
    if (Math.abs(diff) < 0.01) return;
    offsetRef.current += diff * Math.min(1, 6 * dt);
    if (groupRef.current) {
      const v = normalVec.current;
      const s = offsetRef.current;
      groupRef.current.position.set(v.x * s, v.y * s, v.z * s);
    }
  });

  const onOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    if (onContinentHover) {
      const ne = e.nativeEvent;
      onContinentHover(true, name, ne ? { clientX: ne.clientX, clientY: ne.clientY } : null);
    }
  }, [name, onContinentHover]);

  const onOut = useCallback(() => {
    setHovered(false);
    if (onContinentHover) onContinentHover(false, name, null);
  }, [name, onContinentHover]);

  const onMove = useCallback((e) => {
    if (hovered && onContinentHover) {
      const ne = e.nativeEvent;
      onContinentHover(true, name, ne ? { clientX: ne.clientX, clientY: ne.clientY } : null);
    }
  }, [hovered, name, onContinentHover]);

  const material = hovered ? SHARED_MAT_HOVERED : SHARED_MAT_DEFAULT;

  return (
    <group ref={groupRef}>
      {geometries.map((geo, i) => (
        <mesh key={i} geometry={geo} material={material}
          onPointerOver={onOver} onPointerOut={onOut} onPointerMove={onMove}
        />
      ))}
      {/* Pins inside this group — they lift with the continent */}
      {pins && pins.map((pin, i) => (
        <RequestPin key={`pin-${i}`} lat={pin.lat} lng={pin.lng} urgency={pin.urgency} />
      ))}
    </group>
  );
});

/* ── Main component ── */

export default function WorldGeometry({ pins = [], onContinentHover }) {
  const [continents, setContinents] = useState(null);

  /* Group pins by continent */
  const pinsByContinent = useMemo(() => {
    const map = {};
    for (const pin of pins) {
      if (!pin.continent) continue;
      if (!map[pin.continent]) map[pin.continent] = [];
      map[pin.continent].push(pin);
    }
    return map;
  }, [pins]);

  const handleContinentHover = useCallback((hovering, name, coords) => {
    // Notify parent to pause/resume rotation
    if (onContinentHover) onContinentHover(hovering);

    if (hovering && coords) {
      window.dispatchEvent(new CustomEvent('continent-tooltip', {
        detail: {
          name,
          requests: CONTINENT_REQUESTS[name] || 0,
          x: coords.clientX,
          y: coords.clientY,
        }
      }));
    } else if (!hovering) {
      window.dispatchEvent(new CustomEvent('continent-tooltip', { detail: null }));
    }
  }, [onContinentHover]);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => r.json())
      .then((topology) => {
        const countries = feature(topology, topology.objects.countries);
        const groups = {};

        for (const f of countries.features) {
          const cont = classifyById(f.id);
          if (!cont) continue;
          if (!groups[cont]) groups[cont] = [];

          const rings = f.geometry.type === 'MultiPolygon'
            ? f.geometry.coordinates.map((p) => p[0])
            : [f.geometry.coordinates[0]];

          for (const ring of rings) {
            const geo = buildMesh(ring, GLOBE_RADIUS + 3);
            if (geo) groups[cont].push(geo);
          }
        }
        setContinents(groups);
      })
      .catch(() => setContinents({}));
  }, []);

  if (!continents) return null;

  return (
    <>
      {Object.entries(continents).map(([name, geos]) => (
        <ContinentGroup
          key={name}
          name={name}
          geometries={geos}
          pins={pinsByContinent[name] || []}
          onContinentHover={handleContinentHover}
        />
      ))}
    </>
  );
}
