import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../firebaseClient';
import { normalizeTask } from '../lib/taskAdapter';
import { API_BASE } from '../lib/apiBase';
import { pushToast } from './useToasts';

const POLL_INTERVAL_MS = 3000;

const URGENCY_KIND = {
  critical: 'urgent',
  high: 'urgent',
  medium: 'info',
  low: 'info',
};

function shortLabel(t) {
  const cat = (t.category || 'request').toString();
  const loc = t.locationText || 'unknown location';
  return `${cat} · ${loc}`;
}

/**
 * Live subscription to the requests collection.
 * Tries Firestore onSnapshot first (true real-time), falls back to polling
 * the /tasks REST endpoint every few seconds when Firestore client reads are
 * blocked (typical with default security rules).
 */
export function useLiveTasks({ enableToasts = true } = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('connecting'); // 'snapshot' | 'polling' | 'connecting'

  // Refs so the snapshot/poll handlers share the same diff state
  const prevRef = useRef(new Map());
  const primedRef = useRef(false);

  const applyNext = (next) => {
    if (enableToasts && primedRef.current) {
      const prev = prevRef.current;
      for (const t of next) {
        const before = prev.get(t.id);
        if (!before) {
          pushToast({
            kind: URGENCY_KIND[String(t.urgency).toLowerCase()] || 'info',
            title: 'New signal',
            body: shortLabel(t),
          });
        } else if (before.status !== t.status) {
          if (t.status === 'assigned') {
            pushToast({
              kind: 'success',
              title: `Matched · ${t.assignedVolunteerName || 'volunteer'}`,
              body: shortLabel(t),
            });
          } else if (t.status === 'completed') {
            pushToast({ kind: 'success', title: 'Resolved', body: shortLabel(t) });
          } else if (t.status === 'dispatched') {
            pushToast({ kind: 'info', title: 'Dispatched', body: shortLabel(t) });
          }
        }
      }
    }

    prevRef.current = new Map(next.map((t) => [t.id, t]));
    primedRef.current = true;
    setTasks(next);
    setLoading(false);
  };

  useEffect(() => {
    let pollTimer = null;
    let snapshotConnected = false;
    let cancelled = false;

    const stopPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const pollOnce = async () => {
      try {
        const res = await fetch(`${API_BASE}/tasks`);
        if (!res.ok) return;
        const raw = await res.json();
        if (cancelled) return;
        // Sort newest first to match the snapshot path
        const next = raw
          .map(normalizeTask)
          .sort((a, b) => {
            const ta = new Date(a.createdAt || 0).getTime();
            const tb = new Date(b.createdAt || 0).getTime();
            return tb - ta;
          });
        applyNext(next);
      } catch {
        /* network error — try again on next tick */
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      setSource('polling');
      pollOnce();
      pollTimer = setInterval(pollOnce, POLL_INTERVAL_MS);
    };

    const q = query(
      collection(firestore, 'requests'),
      orderBy('created_at', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (cancelled) return;
        snapshotConnected = true;
        stopPolling();
        setSource('snapshot');
        const next = snap.docs.map((d) =>
          normalizeTask({ id: d.id, ...d.data() }),
        );
        applyNext(next);
      },
      (err) => {
        // Most common reason: Firestore security rules don't allow client reads.
        // Fall back to polling the REST API which uses firebase-admin server-side.
        if (!snapshotConnected) {
          console.warn(
            'Live snapshot blocked, falling back to polling:',
            err.message,
          );
          startPolling();
        }
      },
    );

    // If snapshot doesn't connect within a short window, start polling
    // proactively so the UI is never empty.
    const timeoutId = setTimeout(() => {
      if (!snapshotConnected && !cancelled) startPolling();
    }, 1500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      stopPolling();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableToasts]);

  return { tasks, loading, source };
}
