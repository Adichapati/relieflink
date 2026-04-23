import { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Preload } from '@react-three/drei';
import * as THREE from 'three';
import GlobeMesh from './GlobeMesh';
import Atmosphere from './Atmosphere';
import WorldGeometry from './WorldGeometry';
import { GLOBE_CAMERA } from './globeConfig';

/* Each pin is tagged with its continent so it lifts with the landmass */
const DEMO_PINS = [
  { lat: 12.97, lng: 77.59, urgency: 'high', continent: 'Asia' },
  { lat: 28.61, lng: 77.23, urgency: 'medium', continent: 'Asia' },
  { lat: 6.5, lng: 3.4, urgency: 'high', continent: 'Africa' },
  { lat: -1.3, lng: 36.8, urgency: 'medium', continent: 'Africa' },
  { lat: 30.0, lng: 31.2, urgency: 'low', continent: 'Africa' },
  { lat: -23.5, lng: -46.6, urgency: 'high', continent: 'South America' },
  { lat: 48.8, lng: 2.3, urgency: 'low', continent: 'Europe' },
];

/* ── Shooting star streak ── */

function ShootingStar({ delay }) {
  const meshRef = useRef();
  const matRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cycle = 5 + delay * 2.5;
    const phase = (t + delay * 3) % cycle;

    if (!meshRef.current || !matRef.current) return;

    if (phase < 1.0) {
      const p = phase / 1.0;
      const ease = p * (2 - p);
      meshRef.current.visible = true;
      meshRef.current.position.x = -250 + ease * 600;
      meshRef.current.position.y = 180 - delay * 80 + ease * -100;
      meshRef.current.position.z = -120 - delay * 40;
      meshRef.current.scale.x = 1 - p * 0.3;
      matRef.current.opacity = p < 0.15 ? p * 6.5 : (1 - p) * 1.1;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} visible={false} rotation={[0, 0, -0.45]}>
      <planeGeometry args={[45, 0.4]} />
      <meshBasicMaterial ref={matRef} color="#ffffff" transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

/* ── Drag-rotatable group ──
   Uses NATIVE DOM events for drag so that R3F continent meshes
   can never block the drag with stopPropagation.
   Continent hover pause is handled via onContinentHover callback. */

function InteractiveGlobe({ rotationSpeed = 1, scale = 1 }) {
  const groupRef = useRef();
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const velocityRef = useRef(0);
  const pausedRef = useRef(false);
  const { gl } = useThree(); // access the canvas DOM element

  // Attach native DOM listeners to the canvas so they can't be blocked by R3F children
  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      velocityRef.current = 0;
    };

    const onMove = (e) => {
      if (!isDragging.current || !groupRef.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      velocityRef.current = dx * 0.003;
      groupRef.current.rotation.y += dx * 0.005;
    };

    const onUp = () => {
      isDragging.current = false;
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [gl]);

  useFrame(() => {
    if (!groupRef.current) return;

    if (isDragging.current) {
      groupRef.current.rotation.y += velocityRef.current;
      velocityRef.current *= 0.92;
    } else if (pausedRef.current) {
      // Slow crawl when hovering a continent
      groupRef.current.rotation.y += 0.0002;
    } else {
      // Normal auto-rotate
      groupRef.current.rotation.y += 0.0015 * rotationSpeed;
    }
  });

  const onContinentHover = useCallback((hovering) => {
    pausedRef.current = hovering;
  }, []);

  return (
    <group ref={groupRef} scale={scale}>
      <GlobeMesh />
      <Atmosphere />
      {/* Pins render inside ContinentGroups so they lift on hover */}
      <WorldGeometry pins={DEMO_PINS} onContinentHover={onContinentHover} />
    </group>
  );
}

/* ── Tooltip overlay (rendered in DOM, not in Canvas) ── */

function ContinentTooltip({ info }) {
  if (!info) return null;

  return (
    <div
      className="continent-tooltip"
      style={{
        left: info.x + 16,
        top: info.y - 8,
      }}
    >
      <span className="tooltip-name">{info.name}</span>
      <span className="tooltip-requests mono">
        {info.requests} active request{info.requests !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

/* ── Main scene ── */

export default function GlobeScene({ globeState = {} }) {
  const { rotationSpeed = 1, scale = 1 } = globeState;
  const [tooltipInfo, setTooltipInfo] = useState(null);

  useEffect(() => {
    const handler = (e) => setTooltipInfo(e.detail);
    window.addEventListener('continent-tooltip', handler);
    return () => window.removeEventListener('continent-tooltip', handler);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{
          position: GLOBE_CAMERA.position,
          fov: GLOBE_CAMERA.fov,
          near: GLOBE_CAMERA.near,
          far: GLOBE_CAMERA.far,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent', cursor: 'grab' }}
      >
        <ambientLight intensity={0.12} />
        <directionalLight position={[200, 100, 150]} intensity={1.0} />
        <directionalLight position={[-120, -60, -100]} intensity={0.25} color="#6688cc" />
        <pointLight position={[0, -150, 100]} intensity={0.3} color="#aaaacc" />

        <Suspense fallback={null}>
          <InteractiveGlobe rotationSpeed={rotationSpeed} scale={scale} />
        </Suspense>

        <Stars radius={200} depth={100} count={2500} factor={5} saturation={0} fade speed={0.4} />

        <ShootingStar delay={0} />
        <ShootingStar delay={1.2} />
        <ShootingStar delay={2.8} />

        <Preload all />
      </Canvas>

      <ContinentTooltip info={tooltipInfo} />
    </div>
  );
}
