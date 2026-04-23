import { useMemo } from 'react';

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Maps a 0–1 scroll progress to globe camera/state.
 * 5 stages, each ~20% of total scroll.
 */
export function useGlobeState(scrollProgress) {
  return useMemo(() => {
    const p = scrollProgress;

    // Stage 1: Orbit (0 – 0.2) — full globe, slow rotation
    if (p < 0.2) {
      const t = p / 0.2;
      return {
        rotationSpeed: lerp(1, 0.7, t),
        scale: 1,
        opacity: 1,
        stage: 'orbit',
      };
    }

    // Stage 2: Approach (0.2 – 0.4) — zoom in, rotation slows
    if (p < 0.4) {
      const t = (p - 0.2) / 0.2;
      return {
        rotationSpeed: lerp(0.7, 0.15, t),
        scale: lerp(1, 1.4, t),
        opacity: 1,
        stage: 'approach',
      };
    }

    // Stage 3: Ground level (0.4 – 0.6) — globe docks left, form appears
    if (p < 0.6) {
      const t = (p - 0.4) / 0.2;
      return {
        rotationSpeed: lerp(0.15, 0, t),
        scale: lerp(1.4, 0.7, t),
        opacity: 1,
        stage: 'ground',
      };
    }

    // Stage 4: Operations (0.6 – 0.8) — mini globe, dashboard takes over
    if (p < 0.8) {
      const t = (p - 0.6) / 0.2;
      return {
        rotationSpeed: 0,
        scale: lerp(0.7, 0.4, t),
        opacity: lerp(1, 0.25, t),
        stage: 'operations',
      };
    }

    // Stage 5: Impact (0.8 – 1.0) — globe zooms back out
    const t = (p - 0.8) / 0.2;
    return {
      rotationSpeed: lerp(0.1, 1, t),
      scale: lerp(0.4, 1, t),
      opacity: lerp(0.25, 1, t),
      stage: 'impact',
    };
  }, [scrollProgress]);
}
