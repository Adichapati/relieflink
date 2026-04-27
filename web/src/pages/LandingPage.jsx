import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import HeroGlobeBackdrop from '../components/landing/HeroGlobeBackdrop';
import DecodeText from '../components/landing/DecodeText';
import LiveSignalCards from '../components/landing/LiveSignalCards';
import ScrollyPipeline from '../components/landing/ScrollyPipeline';
import MagneticButton from '../components/landing/MagneticButton';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile } = useContext(AuthContext);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    if (user && profile) {
      navigate('/dashboard');
    }
  }, [user, profile, navigate]);

  // Subtle mouse-follow parallax on the hero. Stays within ±6px so it
  // never feels swimmy.
  useEffect(() => {
    const onMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Normalize to -1..1, then scale
      const x = (e.clientX / w - 0.5) * 12;
      const y = (e.clientY / h - 0.5) * 12;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <>
      <div className="star-field" />
      <div className="landing-aurora" aria-hidden="true">
        <span className="aurora-blob aurora-blob-a" />
        <span className="aurora-blob aurora-blob-b" />
        <span className="aurora-blob aurora-blob-c" />
      </div>
      <HeroGlobeBackdrop />

      <div className="landing-shell">
        <header className="landing-nav">
          <motion.div
            className="navbar-brand"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Relief<span>Link</span>
          </motion.div>
          <motion.div
            className="landing-nav-actions"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button
              type="button"
              className="btn-ghost"
              onClick={() => navigate('/auth?mode=login')}
            >
              Log in
            </button>
            <MagneticButton
              className="btn-accent"
              onClick={() => navigate('/auth?mode=signup')}
            >
              <span>Get started</span>
              <span style={{ fontSize: '1.05em' }}>→</span>
            </MagneticButton>
          </motion.div>
        </header>

        <section
          ref={heroRef}
          className="landing-hero"
          style={{
            transform: `translate3d(${parallax.x * -0.4}px, ${parallax.y * -0.4}px, 0)`,
          }}
        >
          <motion.p
            className="hero-eyebrow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <span className="hero-eyebrow-cursor" />
            <DecodeText
              text="AI-Powered Disaster Relief"
              delayMs={350}
              durationMs={550}
            />
          </motion.p>

          <h1 className="landing-title">
            <DecodeText
              text="Turn distress signals into"
              delayMs={650}
              durationMs={800}
            />
            <span className="hero-title-accent">
              {' '}
              <DecodeText
                text="coordinated action"
                delayMs={1500}
                durationMs={900}
              />
            </span>
          </h1>

          <motion.p
            className="landing-subtitle"
            initial="hidden"
            animate="visible"
            transition={{ delayChildren: 2.4, staggerChildren: 0.025 }}
          >
            {LANDING_SUBTITLE.split(' ').map((w, i) => (
              <motion.span
                key={`${w}-${i}`}
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4 }}
                className="subtitle-word"
              >
                {w}
                {i < LANDING_SUBTITLE.split(' ').length - 1 ? ' ' : ''}
              </motion.span>
            ))}
          </motion.p>

          <motion.div
            className="landing-cta-row"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 3.0 }}
          >
            <MagneticButton
              className="btn-accent landing-cta"
              pulse
              onClick={() => navigate('/auth?mode=signup')}
            >
              <span className="btn-icon">⚡</span>
              <span>Join the network</span>
            </MagneticButton>
            <MagneticButton
              className="btn-ghost landing-cta"
              onClick={() => navigate('/auth?mode=login')}
            >
              I already have an account
            </MagneticButton>
          </motion.div>

          <motion.div
            className="landing-hero-cards"
            style={{
              transform: `translate3d(${parallax.x * 0.6}px, ${parallax.y * 0.6}px, 0)`,
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 3.4 }}
          >
            <LiveSignalCards />
          </motion.div>

          <motion.div
            className="landing-scroll-hint mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 4.2, duration: 0.6 }}
          >
            <span className="scroll-hint-mouse">
              <span className="scroll-hint-wheel" />
            </span>
            scroll · see the pipeline
          </motion.div>
        </section>

        <ScrollyPipeline />

        <section className="landing-footer-cta">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            Ready to <span className="hero-title-accent">coordinate relief</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Sign up as a volunteer in 30 seconds. Coordinators by invitation.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <MagneticButton
              className="btn-accent landing-cta"
              pulse
              onClick={() => navigate('/auth?mode=signup')}
            >
              <span className="btn-icon">⚡</span>
              <span>Join the network</span>
            </MagneticButton>
          </motion.div>
        </section>
      </div>
    </>
  );
}

const LANDING_SUBTITLE =
  'ReliefLink decodes messy field reports with Gemini, geocodes them onto a tactical map, and matches each request to the nearest qualified volunteer — automatically.';
