import { useState, useCallback } from 'react';
import FieldReveal from '../ui/FieldReveal';
import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
import { API_BASE } from '../../lib/apiBase';

const DEMO_INPUT = `URGENT - need food and water at riverside community center
in Bangalore. ~200 families displaced by flooding.
Medical supplies also needed. Contact Priya at 9876543210.
Children and elderly priority. Roads partially blocked near MG Road.`;

const DEMO_INPUT_ES = `Necesitamos ayuda urgente en Bangalore.
Aproximadamente 30 familias necesitan agua potable y medicinas.
Hay niños pequeños y dos personas mayores con problemas de salud.
La calle principal está parcialmente bloqueada.`;

const DEMO_INPUT_HI = `बंगलौर में तत्काल मदद चाहिए। लगभग 50 परिवार बेघर हो गए हैं।
पीने का पानी, खाना और कंबल की जरूरत है। बच्चे और बुजुर्ग प्राथमिकता पर हैं।
मुख्य सड़क बंद है। कृपया जल्दी पहुँचें।`;

const LANGUAGE_OPTIONS = [
  { code: 'auto', label: 'Auto', flag: '🌐' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

function applyDecoded(data) {
  return {
    type: data.category || 'Unclassified',
    urgency: (data.urgency || 'MEDIUM').toUpperCase(),
    location: data.location_text || '—',
    people: data.quantity_details || '—',
    confidence:
      typeof data.confidence === 'number'
        ? `${Math.round(data.confidence * 100)}%`
        : '—',
    status: data.status || 'pending',
    language: data.language || 'en',
    description_en: data.description_en || '—',
  };
}

export default function IntakeSection({
  onSubmitted,
  eyebrow = '02 // Signal Intake',
  title = 'Decode Distress',
  titleAccent = 'Signals',
  subtitle = 'Paste raw text or capture a voice report. Gemini extracts structured data and saves to the live request queue.',
  submitNote = null,
}) {
  const [mode, setMode] = useState('text');
  const [rawText, setRawText] = useState('');
  const [language, setLanguage] = useState('auto');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState(null);

  const recorder = useVoiceRecorder({ maxSeconds: 30 });

  const handleDecode = useCallback(async () => {
    if (!rawText.trim()) return;
    setIsDecoding(true);
    setDecoded(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/extract-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          language: language === 'auto' ? null : language,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setDecoded(applyDecoded(data));
      if (typeof onSubmitted === 'function') onSubmitted(data);
    } catch (err) {
      setError(err.message || 'Extraction failed');
    } finally {
      setIsDecoding(false);
    }
  }, [rawText, language, onSubmitted]);

  const handleDecodeVoice = useCallback(async () => {
    if (!recorder.base64) return;
    setIsDecoding(true);
    setDecoded(null);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/extract-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: recorder.base64,
          mimeType: 'audio/wav',
          language: language === 'auto' ? null : language,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setDecoded(applyDecoded(data));
      if (typeof onSubmitted === 'function') onSubmitted(data);
    } catch (err) {
      setError(err.message || 'Voice extraction failed');
    } finally {
      setIsDecoding(false);
    }
  }, [recorder.base64, language, onSubmitted]);

  const typeOut = useCallback((text) => {
    setDecoded(null);
    setIsDecoding(false);
    setError(null);
    setRawText('');

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRawText(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, []);

  const handleLoadDemo = useCallback(() => {
    setLanguage('auto');
    typeOut(DEMO_INPUT);
  }, [typeOut]);
  const handleLoadES = useCallback(() => {
    setLanguage('es');
    typeOut(DEMO_INPUT_ES);
  }, [typeOut]);
  const handleLoadHI = useCallback(() => {
    setLanguage('hi');
    typeOut(DEMO_INPUT_HI);
  }, [typeOut]);

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setDecoded(null);
    setError(null);
    if (next === 'text') recorder.reset();
  };

  const recState = recorder.state;
  const recBars = Array.from({ length: 24 }).map((_, i) => {
    // Simulate a level-based bar height. Pulse from center outward.
    const center = 11.5;
    const dist = Math.abs(i - center) / center;
    const bias = 1 - dist * 0.65;
    const pulse = recState === 'recording' ? recorder.level * bias : 0.05 * bias;
    const noise = recState === 'recording' ? Math.random() * 0.15 : 0;
    return Math.min(1, pulse + noise);
  });

  return (
    <section className="section intake-section" id="intake">
      <div className="intake-header">
        <span className="section-eyebrow mono">{eyebrow}</span>
        <h2 className="section-title">
          {title} <span className="accent">{titleAccent}</span>
        </h2>
        <p className="section-subtitle">{subtitle}</p>
        {submitNote && (
          <span className="intake-submit-note mono">⏳ {submitNote}</span>
        )}

        <div className="intake-mode-tabs">
          <button
            type="button"
            className={`intake-mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => switchMode('text')}
          >
            <span className="tab-dot" /> Text
          </button>
          <button
            type="button"
            className={`intake-mode-tab ${mode === 'voice' ? 'active' : ''}`}
            onClick={() => switchMode('voice')}
          >
            <span className="tab-dot" /> Voice
          </button>
        </div>

        <div className="intake-lang-row">
          <span className="intake-lang-label mono">Language</span>
          <div className="intake-lang-chips" role="radiogroup" aria-label="Input language">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                role="radio"
                aria-checked={language === opt.code}
                className={`intake-lang-chip ${language === opt.code ? 'active' : ''}`}
                onClick={() => setLanguage(opt.code)}
                title={opt.label}
              >
                <span className="intake-lang-flag">{opt.flag}</span>
                <span className="intake-lang-text">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="intake-grid">
        <div className="intake-panel">
          <div className="panel-header">
            <span className={`panel-dot ${mode === 'voice' && recState === 'recording' ? 'red breathing' : 'red'}`} />
            <span className="panel-label mono">
              {mode === 'voice' ? 'VOICE CAPTURE' : 'RAW SIGNAL'}
            </span>
            {mode === 'voice' && recState === 'recording' && (
              <span className="voice-timer mono">
                {recorder.seconds.toFixed(1)}s
              </span>
            )}
          </div>

          {mode === 'text' && (
            <>
              <textarea
                className="intake-textarea mono"
                placeholder="Paste a distress message here..."
                value={rawText}
                onChange={(e) => { setRawText(e.target.value); setDecoded(null); setError(null); }}
                rows={8}
              />
              <div className="intake-actions">
                <button className="btn-ghost" type="button" onClick={handleLoadDemo}>
                  Load Demo
                </button>
                <button
                  className="btn-ghost intake-multilingual-btn"
                  type="button"
                  onClick={handleLoadES}
                  title="Load a Spanish distress message — Gemini will translate"
                >
                  <span className="lang-glyph">🇪🇸</span>
                  Load ES
                </button>
                <button
                  className="btn-ghost intake-multilingual-btn"
                  type="button"
                  onClick={handleLoadHI}
                  title="Load a Hindi distress message — Gemini will translate"
                >
                  <span className="lang-glyph">🇮🇳</span>
                  Load HI
                </button>
                <button
                  className="btn-accent"
                  type="button"
                  onClick={handleDecode}
                  disabled={!rawText.trim() || isDecoding}
                >
                  <span className="btn-icon">⚡</span>
                  {isDecoding ? 'Decoding…' : 'Decode Signal'}
                </button>
              </div>
            </>
          )}

          {mode === 'voice' && (
            <>
              <div className={`voice-stage state-${recState}`}>
                <div className="voice-visualizer">
                  {recBars.map((h, i) => (
                    <span
                      key={i}
                      className="voice-bar"
                      style={{
                        height: `${Math.max(6, h * 80)}%`,
                        opacity: 0.35 + h * 0.65,
                      }}
                    />
                  ))}
                </div>

                <div className="voice-status mono">
                  {recState === 'idle' && 'Tap to record up to 30s.'}
                  {recState === 'recording' && '● Listening…'}
                  {recState === 'processing' && 'Encoding audio…'}
                  {recState === 'ready' && '✓ Audio captured. Decode when ready.'}
                  {recState === 'error' && (recorder.error || 'Microphone error')}
                </div>
              </div>

              <div className="intake-actions">
                {recState === 'idle' && (
                  <button
                    className="btn-accent voice-record-btn"
                    type="button"
                    onClick={recorder.start}
                  >
                    <span className="voice-record-dot" />
                    <span>Start Recording</span>
                  </button>
                )}
                {recState === 'recording' && (
                  <button
                    className="btn-accent voice-stop-btn"
                    type="button"
                    onClick={recorder.stop}
                  >
                    <span className="voice-stop-square" />
                    <span>Stop ({Math.max(0, 30 - recorder.seconds).toFixed(0)}s left)</span>
                  </button>
                )}
                {(recState === 'ready' || recState === 'processing' || recState === 'error') && (
                  <>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={recorder.reset}
                      disabled={isDecoding}
                    >
                      Re-record
                    </button>
                    <button
                      className="btn-accent"
                      type="button"
                      onClick={handleDecodeVoice}
                      disabled={recState !== 'ready' || isDecoding}
                    >
                      <span className="btn-icon">⚡</span>
                      {isDecoding ? 'Decoding…' : 'Decode Voice'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {error && <div className="intake-error mono">⚠ {error}</div>}
        </div>

        <div className={`intake-panel decoded-panel ${decoded ? 'active' : ''}`}>
          <div className="panel-header">
            <span className={`panel-dot ${decoded ? 'green' : 'amber'}`} />
            <span className="panel-label mono">
              {decoded ? 'DECODED ✓' : isDecoding ? 'DECODING…' : 'AI EXTRACTION'}
            </span>
            {isDecoding && !decoded && <span className="decode-spinner" />}
          </div>

          <div className="decoded-fields">
            <FieldReveal label="Type" value={decoded?.type} active={!!decoded} delay={0} />
            <FieldReveal label="Urgency" value={decoded?.urgency} active={!!decoded} delay={100} />
            <FieldReveal label="Location" value={decoded?.location} active={!!decoded} delay={200} />
            <FieldReveal label="Quantity / Details" value={decoded?.people} active={!!decoded} delay={300} />
            <FieldReveal label="Confidence" value={decoded?.confidence} active={!!decoded} delay={400} />
            <FieldReveal label="Status" value={decoded?.status} active={!!decoded} delay={500} />
            {decoded && decoded.language && decoded.language !== 'en' && (
              <FieldReveal
                label="Translated From"
                value={decoded.language.toUpperCase()}
                active
                delay={600}
              />
            )}
            {decoded && decoded.description_en && decoded.language !== 'en' && (
              <FieldReveal
                label="English Summary"
                value={decoded.description_en}
                active
                delay={700}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
