import { useEffect, useState } from 'react';
import { API_BASE } from '../lib/apiBase';

const POLL_MS = 5000;

/**
 * Polls /volunteers for the manual-assign picker. Polling is fine here —
 * volunteer status changes infrequently and the picker only opens on demand.
 */
export function useVolunteers({ availableOnly = false } = {}) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const fetchOnce = async () => {
      try {
        const url = availableOnly
          ? `${API_BASE}/volunteers?available=true`
          : `${API_BASE}/volunteers`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setVolunteers(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch {
        /* ignore */
      }
    };

    fetchOnce();
    timer = setInterval(fetchOnce, POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [availableOnly]);

  return { volunteers, loading };
}
