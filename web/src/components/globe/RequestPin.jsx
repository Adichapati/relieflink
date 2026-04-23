import { useMemo, useRef, memo } from 'react';
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

/* Shared materials */
const PIN_MATS = {
  high: new THREE.MeshBasicMaterial({ color: '#ff3333' }),
  medium: new THREE.MeshBasicMaterial({ color: '#ffaa00' }),
  low: new THREE.MeshBasicMaterial({ color: '#00cc66' }),
};

const RING_MAT = new THREE.MeshBasicMaterial({
  color: '#ff3333', transparent: true, side: THREE.DoubleSide, depthWrite: false,
});

/* Shared geometries */
const STEM_GEO = new THREE.CylinderGeometry(0.5, 0.5, 5, 6);
const HEAD_GEO = new THREE.SphereGeometry(1.8, 10, 10);
const RING_GEO = new THREE.RingGeometry(0.8, 1.2, 16);

const RequestPin = memo(function RequestPin({ lat, lng, urgency = 'medium' }) {
  const glowRef = useRef();
  const ringRef = useRef();

  const mat = PIN_MATS[urgency] || PIN_MATS.medium;

  const { position, quaternion } = useMemo(() => {
    const pos = latLngToVec3(lat, lng, GLOBE_RADIUS + 3);
    const up = new THREE.Vector3(0, 1, 0);
    const dir = pos.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return { position: pos, quaternion: quat };
  }, [lat, lng]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (glowRef.current) {
      glowRef.current.intensity = 0.4 + Math.sin(t * 3) * 0.2;
    }
    if (ringRef.current) {
      const rt = (t % 2) / 2;
      ringRef.current.scale.setScalar(1 + rt * 3);
      ringRef.current.material.opacity = 0.5 * (1 - rt);
    }
  });

  return (
    <group position={position} quaternion={quaternion}>
      <mesh position={[0, 2.5, 0]} geometry={STEM_GEO} material={mat} />
      <mesh position={[0, 6, 0]} geometry={HEAD_GEO} material={mat} />
      <pointLight ref={glowRef} position={[0, 6, 0]} color={mat.color} intensity={0.8} distance={35} />
      {urgency === 'high' && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} geometry={RING_GEO} material={RING_MAT} />
      )}
    </group>
  );
});

export default RequestPin;
