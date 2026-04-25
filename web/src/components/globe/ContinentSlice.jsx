import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './globeConfig';

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function subdivideCoords(coords, maxDeg = 4) {
  const result = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    const dist = Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
    const segs = Math.max(1, Math.ceil(dist / maxDeg));
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      result.push([lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t]);
    }
  }
  result.push(coords[coords.length - 1]);
  return result;
}

function buildGeometry(rawCoords, radius) {
  const coords = subdivideCoords(rawCoords, 4);
  const contour = coords.map(([lng, lat]) => new THREE.Vector2(lng, lat));
  if (contour.length > 2 && contour[0].distanceTo(contour[contour.length - 1]) < 0.01) {
    contour.pop();
  }
  let tris;
  try { tris = THREE.ShapeUtils.triangulateShape(contour, []); } catch { return null; }
  if (!tris.length) return null;

  const pts3D = contour.map((v) => latLngToVec3(v.y, v.x, radius));
  const verts = [], norms = [];
  for (const [a, b, c] of tris) {
    if (a >= pts3D.length || b >= pts3D.length || c >= pts3D.length) continue;
    for (const i of [a, b, c]) {
      const v = pts3D[i];
      verts.push(v.x, v.y, v.z);
      const n = v.clone().normalize();
      norms.push(n.x, n.y, n.z);
    }
  }
  if (!verts.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  return geo;
}

export default function ContinentSlice({ name, coords }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const offsetRef = useRef(0);

  const { geometry, outlineArr, normal } = useMemo(() => {
    const r = GLOBE_RADIUS + 0.2;
    const geo = buildGeometry(coords, r);
    const sub = subdivideCoords(coords, 3);
    const outline = sub.map(([lng, lat]) => latLngToVec3(lat, lng, r + 0.1));
    const arr = new Float32Array(outline.flatMap((v) => [v.x, v.y, v.z]));
    const ctr = coords.reduce(([sL, sA], [l, a]) => [sL + l, sA + a], [0, 0]);
    const n = latLngToVec3(ctr[1] / coords.length, ctr[0] / coords.length, 1).normalize();
    return { geometry: geo, outlineArr: arr, normal: n };
  }, [coords]);

  useFrame((_, dt) => {
    const target = hovered ? 12 : 0;
    offsetRef.current += (target - offsetRef.current) * Math.min(1, 6 * dt);
    if (groupRef.current) {
      groupRef.current.position.copy(normal.clone().multiplyScalar(offsetRef.current));
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geometry}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhongMaterial
          color={hovered ? '#1a1a1a' : '#1f1f1f'}
          transparent opacity={hovered ? 0.85 : 0.4}
          side={THREE.DoubleSide}
          emissive={hovered ? '#00ff88' : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
          depthWrite={false}
        />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={outlineArr.length / 3} array={outlineArr} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={hovered ? '#00ff88' : '#333333'} transparent opacity={hovered ? 0.9 : 0.35} />
      </line>
    </group>
  );
}
