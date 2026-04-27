import { useEffect, useState, useRef } from 'react';

const SCRAMBLE_CHARS = '!@#$%^&*<>/?_+={}[]ABCDEFXYZ0123456789';

/**
 * Hacker-decode text effect. Letters cycle through random symbols
 * then lock left-to-right at the target text.
 *
 * Designed for hero titles — accepts a `delayMs` so multiple instances
 * can decode in sequence.
 */
export default function DecodeText({
  text,
  className = '',
  delayMs = 0,
  durationMs = 700,
  trigger = true,
}) {
  const [display, setDisplay] = useState(text);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!trigger || startedRef.current) return;
    startedRef.current = true;

    let raf = 0;
    const startDelay = setTimeout(() => {
      const chars = text.split('');
      const start = performance.now();

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / durationMs, 1);

        const next = chars
          .map((ch, i) => {
            if (ch === ' ') return ' ';
            const charThreshold = i / chars.length;
            // Each char locks once total progress passes its position
            if (progress > charThreshold + 0.15) return ch;
            return SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          })
          .join('');

        setDisplay(next);

        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setDisplay(text);
        }
      };

      raf = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(startDelay);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [text, delayMs, durationMs, trigger]);

  // Render as a span so callers control wrapping/styling around it.
  return <span className={className}>{display}</span>;
}
