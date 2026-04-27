import { useEffect, useState } from 'react';
import GlobeScene from '../globe/GlobeScene';

/**
 * Dimmed globe rendered behind the hero. Same scene as the dashboard,
 * but locked to a slow auto-rotate and faded so text stays readable.
 *
 * The Three.js canvas is heavy, so we delay mounting by a tick to let
 * the static text/buttons render first.
 */
export default function HeroGlobeBackdrop() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMounted(true))
      : setTimeout(() => setMounted(true), 80);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="landing-globe-backdrop" aria-hidden="true">
      <GlobeScene
        globeState={{ rotationSpeed: 0.6, scale: 1.05, opacity: 1 }}
      />
    </div>
  );
}
