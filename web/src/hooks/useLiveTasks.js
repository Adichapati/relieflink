import { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { firestore } from '../firebaseClient';
import { normalizeTask } from '../lib/taskAdapter';
import { pushToast } from './useToasts';

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

export function useLiveTasks({ enableToasts = true } = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(new Map());
  const primedRef = useRef(false);

  useEffect(() => {
    const q = query(
      collection(firestore, 'requests'),
      orderBy('created_at', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = snap.docs.map((d) =>
          normalizeTask({ id: d.id, ...d.data() }),
        );

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
                pushToast({
                  kind: 'success',
                  title: 'Resolved',
                  body: shortLabel(t),
                });
              } else if (t.status === 'dispatched') {
                pushToast({
                  kind: 'info',
                  title: 'Dispatched',
                  body: shortLabel(t),
                });
              }
            }
          }
        }

        prevRef.current = new Map(next.map((t) => [t.id, t]));
        primedRef.current = true;
        setTasks(next);
        setLoading(false);
      },
      (err) => {
        console.warn('Live task subscription failed:', err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [enableToasts]);

  return { tasks, loading };
}
