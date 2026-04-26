import { useCallback, useEffect, useState } from 'react';

let _id = 0;
const listeners = new Set();
let toasts = [];

function emit() {
  for (const l of listeners) l(toasts);
}

export function pushToast(toast) {
  const id = ++_id;
  const t = {
    id,
    kind: toast.kind || 'info', // 'info' | 'success' | 'warn' | 'urgent'
    title: toast.title || '',
    body: toast.body || '',
    ttl: toast.ttl ?? 4500,
  };
  toasts = [t, ...toasts].slice(0, 6);
  emit();
  if (t.ttl > 0) {
    setTimeout(() => {
      toasts = toasts.filter((x) => x.id !== id);
      emit();
    }, t.ttl);
  }
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((x) => x.id !== id);
  emit();
}

export function useToasts() {
  const [list, setList] = useState(toasts);
  useEffect(() => {
    const cb = (next) => setList(next);
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, []);
  const dismiss = useCallback((id) => dismissToast(id), []);
  return { toasts: list, dismiss };
}
