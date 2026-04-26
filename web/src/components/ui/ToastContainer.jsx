import { useToasts } from '../../hooks/useToasts';

const KIND_DOT = {
  info: '#88aaff',
  success: '#00ff88',
  warn: '#ffaa00',
  urgent: '#ff3333',
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToasts();

  if (!toasts.length) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.kind}`}
          onClick={() => dismiss(t.id)}
        >
          <span
            className="toast-dot"
            style={{
              background: KIND_DOT[t.kind] || '#88aaff',
              boxShadow: `0 0 8px ${KIND_DOT[t.kind] || '#88aaff'}`,
            }}
          />
          <div className="toast-body">
            <div className="toast-title mono">{t.title}</div>
            {t.body && <div className="toast-text">{t.body}</div>}
          </div>
          <span className="toast-close mono">×</span>
        </div>
      ))}
    </div>
  );
}
