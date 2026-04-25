import { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { GLOBE_RADIUS, GLOBE_SEGMENTS, GLOBE_TEXTURES } from './globeConfig';

export default function GlobeMesh() {
  const topoTexture = useTexture(GLOBE_TEXTURES.bump);

  return (
    <mesh raycast={() => {}}>
      <sphereGeometry args={[GLOBE_RADIUS, GLOBE_SEGMENTS, GLOBE_SEGMENTS]} />
      <meshPhongMaterial
        map={topoTexture}
        color="#1a1a1a"
        bumpMap={topoTexture}
        bumpScale={3.5}
        specular={new THREE.Color('#555555')}
        shininess={8}
        emissive={new THREE.Color('#050505')}
        transparent
      />
    </mesh>
  );
}
