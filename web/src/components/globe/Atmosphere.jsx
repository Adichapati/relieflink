import { useMemo } from 'react';
import * as THREE from 'three';
import { GLOBE_RADIUS } from './globeConfig';

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fragmentShader = `
  uniform vec3 glowColor;
  uniform float coefficient;
  uniform float power;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float intensity = pow(coefficient - dot(vNormal, viewDirection), power);
    gl_FragColor = vec4(glowColor, clamp(intensity * 0.18, 0.0, 1.0));
  }
`;

export default function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color('#ffffff') },
          coefficient: { value: 0.6 },
          power: { value: 5.0 },
        },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh material={material}>
      <sphereGeometry args={[GLOBE_RADIUS * 1.04, 64, 64]} />
    </mesh>
  );
}
