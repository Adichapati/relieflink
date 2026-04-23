import { useState, useCallback } from 'react';
import FieldReveal from '../ui/FieldReveal';

const DEMO_INPUT = `URGENT - need food and water at riverside community center 
in Bangalore. ~200 families displaced by flooding. 
Medical supplies also needed. Contact Priya at 9876543210. 
Children and elderly priority. Roads partially blocked near MG Road.`;

const MOCK_EXTRACTED = {
  type: 'Food, Water, Medical Supplies',
  urgency: 'HIGH',
  location: 'Riverside Community Center, Bangalore',
  people: '~200 families',
  contact: 'Priya — 9876543210',
  notes: 'Children & elderly priority. Roads partially blocked near MG Road.',
};

export default function IntakeSection() {
  const [rawText, setRawText] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decoded, setDecoded] = useState(null);
  const [showCursor, setShowCursor] = useState(false);

  const handleDecode = useCallback(() => {
    if (!rawText.trim()) return;
    setIsDecoding(true);
    setDecoded(null);

    // Simulate AI processing delay
    setTimeout(() => {
      setDecoded(MOCK_EXTRACTED);
    }, 400);
  }, [rawText]);

  const handleLoadDemo = useCallback(() => {
    setDecoded(null);
    setIsDecoding(false);
    setRawText('');
    setShowCursor(true);

    // Typewriter effect for demo text
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRawText(DEMO_INPUT.slice(0, i));
      if (i >= DEMO_INPUT.length) {
        clearInterval(interval);
        setShowCursor(false);
      }
    }, 18);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section intake-section" id="intake">
      <div className="intake-header">
        <span className="section-eyebrow mono">02 // Signal Intake</span>
        <h2 className="section-title">
          Decode Distress <span className="accent">Signals</span>
        </h2>
        <p className="section-subtitle">
          Paste raw, messy relief requests. Our AI extracts structured data in real-time.
        </p>
      </div>

      <div className="intake-grid">
        {/* Left: Raw input */}
        <div className="intake-panel">
          <div className="panel-header">
            <span className="panel-dot red" />
            <span className="panel-label mono">RAW SIGNAL</span>
          </div>
          <textarea
            className="intake-textarea mono"
            placeholder="Paste a distress message here..."
            value={rawText}
            onChange={(e) => { setRawText(e.target.value); setDecoded(null); setIsDecoding(false); }}
            rows={8}
          />
          <div className="intake-actions">
            <button className="btn-ghost" type="button" onClick={handleLoadDemo}>
              Load Demo
            </button>
            <button
              className="btn-accent"
              type="button"
              onClick={handleDecode}
              disabled={!rawText.trim()}
            >
              <span className="btn-icon">⚡</span>
              Decode Signal
            </button>
          </div>
        </div>

        {/* Right: AI decoded output */}
        <div className={`intake-panel decoded-panel ${decoded ? 'active' : ''}`}>
          <div className="panel-header">
            <span className={`panel-dot ${decoded ? 'green' : 'amber'}`} />
            <span className="panel-label mono">
              {decoded ? 'DECODED ✓' : isDecoding ? 'DECODING...' : 'AI EXTRACTION'}
            </span>
            {isDecoding && !decoded && <span className="decode-spinner" />}
          </div>

          <div className="decoded-fields">
            <FieldReveal label="Type" value={decoded?.type} active={!!decoded} delay={0} />
            <FieldReveal label="Urgency" value={decoded?.urgency} active={!!decoded} delay={100} />
            <FieldReveal label="Location" value={decoded?.location} active={!!decoded} delay={200} />
            <FieldReveal label="People" value={decoded?.people} active={!!decoded} delay={300} />
            <FieldReveal label="Contact" value={decoded?.contact} active={!!decoded} delay={400} />
            <FieldReveal label="Notes" value={decoded?.notes} active={!!decoded} delay={500} />
          </div>
        </div>
      </div>
    </section>
  );
}
