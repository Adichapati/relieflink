import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const STEPS = [
  {
    num: '01',
    title: 'Decode',
    subtitle: 'Raw text in. Structured signal out.',
    body: 'Gemini extracts type, urgency, location, and quantity from messy field reports — even in Spanish, Hindi, or French.',
  },
  {
    num: '02',
    title: 'Match',
    subtitle: 'Geocoded. Distance-scored. Skill-checked.',
    body: 'Available volunteers are scored against the request. The matcher picks the closest qualified responder and explains why.',
  },
  {
    num: '03',
    title: 'Coordinate',
    subtitle: 'One command center. Real-time updates.',
    body: 'Live kanban, geocoded tactical map, and live volunteer status — judges see the whole pipeline in motion.',
  },
];

const SAMPLE = {
  raw: 'URGENT — 200 families displaced near MG Road, Bangalore. Need water + medicine.',
  type: 'Water · Medicine',
  urgency: 'CRITICAL',
  location: 'MG Road, Bangalore',
  matched: 'Priya — 1.4 km',
};

export default function ScrollyPipeline() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Map scroll progress (0–1) into a step index 0..2 with eased transitions.
  // We carve out the middle 70% of the section's scroll for the staging,
  // leaving 15% on each end as fade in/out buffer.
  const activeStep = useTransform(scrollYProgress, (v) => {
    if (v < 0.2) return 0;
    if (v < 0.5) return 1;
    return 2;
  });

  // Eased progress (0–1) for the highlight bar
  const lineProgress = useTransform(scrollYProgress, [0.1, 0.85], [0, 1]);

  return (
    <section ref={ref} className="scrolly-pipeline" id="how-it-works">
      <div className="scrolly-pipeline-inner">
        <div className="scrolly-eyebrow mono">HOW IT WORKS</div>
        <h2 className="scrolly-headline">
          From distress signal to dispatched responder
          <span className="scrolly-headline-accent"> in under a minute</span>
        </h2>

        <div className="scrolly-grid">
          {/* Left: step list */}
          <div className="scrolly-steps">
            <motion.div
              className="scrolly-progress-bar"
              style={{ scaleY: lineProgress, transformOrigin: 'top' }}
            />
            {STEPS.map((s, i) => (
              <ScrollyStep
                key={s.num}
                step={s}
                index={i}
                activeStep={activeStep}
              />
            ))}
          </div>

          {/* Right: live preview that morphs as you scroll */}
          <div className="scrolly-preview">
            <ScrollyPreview activeStep={activeStep} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScrollyStep({ step, index, activeStep }) {
  const opacity = useTransform(activeStep, (i) => (i >= index ? 1 : 0.32));
  const x = useTransform(activeStep, (i) => (i === index ? 0 : -4));
  const scale = useTransform(activeStep, (i) => (i === index ? 1 : 0.985));

  return (
    <motion.div
      className="scrolly-step"
      style={{ opacity, x, scale }}
      transition={{ duration: 0.35 }}
    >
      <span className="scrolly-step-num mono">{step.num}</span>
      <h3 className="scrolly-step-title">{step.title}</h3>
      <p className="scrolly-step-sub mono">{step.subtitle}</p>
      <p className="scrolly-step-body">{step.body}</p>
    </motion.div>
  );
}

function ScrollyPreview({ activeStep }) {
  // We render all three states stacked, fading the right one into view
  return (
    <div className="scrolly-preview-card">
      <div className="scrolly-preview-header">
        <span className="scrolly-preview-dot" />
        <span className="scrolly-preview-label mono">SIGNAL #A41C</span>
      </div>

      <PreviewStage step={0} activeStep={activeStep}>
        <span className="scrolly-stage-eyebrow mono">RAW INTAKE</span>
        <p className="scrolly-raw mono">{SAMPLE.raw}</p>
        <div className="scrolly-decoding-bar">
          <span /> <span /> <span />
        </div>
      </PreviewStage>

      <PreviewStage step={1} activeStep={activeStep}>
        <span className="scrolly-stage-eyebrow mono">DECODED ✓</span>
        <div className="scrolly-fields">
          <Field label="Type" value={SAMPLE.type} />
          <Field label="Urgency" value={SAMPLE.urgency} className="urgency-critical" />
          <Field label="Location" value={SAMPLE.location} />
        </div>
        <div className="scrolly-volunteer-grid">
          {[1, 2, 3, 4, 5].map((id) => (
            <span key={id} className="scrolly-volunteer-dot" />
          ))}
        </div>
      </PreviewStage>

      <PreviewStage step={2} activeStep={activeStep}>
        <span className="scrolly-stage-eyebrow mono">DISPATCHED</span>
        <div className="scrolly-route">
          <div className="scrolly-route-node from">
            <span className="scrolly-route-dot volunteer" />
            <span className="scrolly-route-name mono">VOLUNTEER</span>
          </div>
          <div className="scrolly-route-line">
            <span className="scrolly-route-pulse" />
          </div>
          <div className="scrolly-route-node to">
            <span className="scrolly-route-dot signal" />
            <span className="scrolly-route-name mono">SIGNAL</span>
          </div>
        </div>
        <div className="scrolly-match-line">
          <span className="match-arrow">→</span>
          <span className="match-label mono">MATCHED</span>
          <span className="match-volunteer">{SAMPLE.matched}</span>
        </div>
      </PreviewStage>
    </div>
  );
}

function PreviewStage({ step, activeStep, children }) {
  const opacity = useTransform(activeStep, (i) => (i === step ? 1 : 0));
  const y = useTransform(activeStep, (i) => (i === step ? 0 : 12));
  const pointerEvents = useTransform(activeStep, (i) =>
    i === step ? 'auto' : 'none',
  );

  return (
    <motion.div
      className="scrolly-stage"
      style={{ opacity, y, pointerEvents }}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.div>
  );
}

function Field({ label, value, className = '' }) {
  return (
    <div className="scrolly-field">
      <span className="scrolly-field-label mono">{label}</span>
      <span className={`scrolly-field-value ${className}`}>{value}</span>
    </div>
  );
}
