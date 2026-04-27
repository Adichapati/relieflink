import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const SIGNALS = [
  {
    raw: 'Need water + medicine for 200 displaced families near MG Road, Bangalore. Children priority.',
    fields: {
      type: 'Water · Medicine',
      urgency: 'CRITICAL',
      location: 'MG Road, Bangalore',
      people: '~200 families',
    },
    matched: 'Priya — 1.4 km',
  },
  {
    raw: 'Power out 2 days. Family of 5 in HSR Layout, baby needs formula and warm clothes.',
    fields: {
      type: 'Shelter · Food',
      urgency: 'HIGH',
      location: 'HSR Layout, Bangalore',
      people: '5 (1 infant)',
    },
    matched: 'Arjun — 0.8 km',
  },
  {
    raw: 'Necesitamos ayuda urgente. 30 familias necesitan agua potable y medicinas.',
    fields: {
      type: 'Water · Medicine',
      urgency: 'HIGH',
      location: 'Bangalore (translated · ES)',
      people: '~30 families',
    },
    matched: 'Maya — 2.1 km',
  },
];

const STEP_DURATIONS = {
  raw: 1600,
  decoding: 1300,
  matched: 1900,
};

/**
 * Looping demo card. Cycles signal-by-signal through three phases:
 *   1. raw     — distress text typing in
 *   2. decoding — AI fields populate one by one
 *   3. matched  — volunteer assignment shown
 */
export default function LiveSignalCards() {
  const [signalIdx, setSignalIdx] = useState(0);
  const [phase, setPhase] = useState('raw');

  useEffect(() => {
    const dur = STEP_DURATIONS[phase];
    const t = setTimeout(() => {
      if (phase === 'raw') setPhase('decoding');
      else if (phase === 'decoding') setPhase('matched');
      else {
        setPhase('raw');
        setSignalIdx((i) => (i + 1) % SIGNALS.length);
      }
    }, dur);
    return () => clearTimeout(t);
  }, [phase]);

  const signal = SIGNALS[signalIdx];
  const showFields = phase === 'decoding' || phase === 'matched';
  const showMatched = phase === 'matched';

  return (
    <div className="live-signal-stack" aria-hidden="true">
      <div className="live-signal-card">
        <div className="live-signal-header">
          <span className="live-dot breathing" />
          <span className="live-signal-eyebrow mono">LIVE · INCOMING</span>
          <span className="live-signal-counter mono">
            {signalIdx + 1}/{SIGNALS.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={`raw-${signalIdx}`}
            className="live-signal-raw mono"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {signal.raw}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence>
          {showFields && (
            <motion.div
              key={`fields-${signalIdx}`}
              className="live-signal-fields"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                },
              }}
            >
              {Object.entries(signal.fields).map(([k, v]) => (
                <motion.div
                  key={k}
                  className="live-signal-field"
                  variants={{
                    hidden: { opacity: 0, x: -8 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="live-signal-field-label mono">{k}</span>
                  <span
                    className={`live-signal-field-value ${
                      k === 'urgency' ? `urgency-${v.toLowerCase()}` : ''
                    }`}
                  >
                    {v}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMatched && (
            <motion.div
              key={`match-${signalIdx}`}
              className="live-signal-match"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="match-arrow">→</span>
              <span className="match-label mono">MATCHED</span>
              <span className="match-volunteer">{signal.matched}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
