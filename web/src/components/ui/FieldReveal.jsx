import { useTextScramble } from '../../hooks/useTextScramble';

/**
 * Single field that "decodes" from scrambled text to the final value.
 */
export default function FieldReveal({ label, value, active, delay = 0 }) {
  const display = useTextScramble(value, active, 800 + delay);

  return (
    <div className={`field-reveal ${active && value ? 'active' : ''}`}>
      <span className="field-reveal-label">{label}</span>
      <span className="field-reveal-value mono">
        {display || <span className="field-reveal-placeholder">—</span>}
      </span>
    </div>
  );
}
