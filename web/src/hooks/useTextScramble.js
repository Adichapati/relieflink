import { useState, useEffect, useRef, useCallback } from 'react';

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFabcdef';

/**
 * Hacker text-scramble effect.
 * Rapidly flips through random symbols before snapping to the real text.
 * @param {string} target — the final text to reveal
 * @param {boolean} active — whether the scramble is currently running
 * @param {number} duration — total scramble duration in ms (default 800)
 */
export function useTextScramble(target, active = false, duration = 800) {
  const [display, setDisplay] = useState('');
  const frameRef = useRef(null);

  const scramble = useCallback(() => {
    if (!target) { setDisplay(''); return; }

    const startTime = performance.now();
    const chars = target.split('');

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const result = chars.map((char, i) => {
        // Characters reveal left-to-right based on progress
        const charThreshold = i / chars.length;
        if (progress > charThreshold + 0.3) return char; // Revealed
        if (char === ' ') return ' ';
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');

      setDisplay(result);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  useEffect(() => {
    if (active && target) {
      const cleanup = scramble();
      return cleanup;
    }
    if (!active) setDisplay('');
  }, [active, target, scramble]);

  return display;
}
