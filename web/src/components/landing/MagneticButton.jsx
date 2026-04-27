import { useRef, useState } from 'react';

/**
 * Button that subtly pulls toward the cursor when hovered (~10px max),
 * and emits a soft sonar pulse when idle so it draws attention without
 * being distracting.
 *
 * Pass-through props go to the underlying button so it can be styled
 * with existing classes (btn-accent, btn-ghost, etc.).
 */
export default function MagneticButton({
  children,
  className = '',
  pulse = false,
  onClick,
  type = 'button',
  ...rest
}) {
  const ref = useRef(null);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMove = (e) => {
    const node = ref.current;
    if (!node) return;
    const r = node.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Strength caps at ~10px of pull
    const strength = 0.18;
    setDelta({ x: dx * strength, y: dy * strength });
  };

  const onLeave = () => {
    setHovered(false);
    setDelta({ x: 0, y: 0 });
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      className={`magnetic-btn ${className} ${hovered ? 'is-hovered' : ''}`}
      style={{
        transform: `translate(${delta.x}px, ${delta.y}px)`,
      }}
      {...rest}
    >
      {pulse && !hovered && <span className="magnetic-pulse" aria-hidden="true" />}
      <span className="magnetic-btn-inner">{children}</span>
    </button>
  );
}
