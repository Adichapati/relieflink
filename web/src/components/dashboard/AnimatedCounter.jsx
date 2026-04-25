import { useEffect, useRef, useState } from 'react';

/**
 * Animated number counter that rolls up from 0 to target.
 */
export default function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const frameRef = useRef(null);

  // Parse the numeric portion
  const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const hasDecimal = String(value).includes('.');
  const decimals = hasDecimal ? (String(value).split('.')[1]?.length || 1) : 0;

  useEffect(() => {
    startRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * numericValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(numericValue);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [numericValue, duration]);

  return (
    <span className="animated-counter">
      {prefix}{hasDecimal ? display.toFixed(decimals) : Math.round(display)}{suffix}
    </span>
  );
}
