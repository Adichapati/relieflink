import { useScrollProgress } from './hooks/useScrollProgress';
import { useGlobeState } from './hooks/useGlobeState';
import GlobeScene from './components/globe/GlobeScene';
import Navbar from './components/layout/Navbar';
import ScrollProgress from './components/ui/ScrollProgress';
import HeroSection from './components/sections/HeroSection';
import IntakeSection from './components/sections/IntakeSection';
import OperationsSection from './components/sections/OperationsSection';

export default function App() {
  const scrollProgress = useScrollProgress();
  const globeState = useGlobeState(scrollProgress);
  const isScrolled = scrollProgress > 0.02;

  return (
    <>
      {/* CSS star background — always visible */}
      <div className="star-field" />

      <Navbar scrolled={isScrolled} />
      <ScrollProgress progress={scrollProgress} />

      {/* Globe: fixed behind all content */}
      <div
        className="globe-layer"
        style={{ opacity: globeState.opacity }}
      >
        <GlobeScene globeState={globeState} />
      </div>

      {/* Scrollable content over the globe */}
      <main className="content-layer">
        <HeroSection />

        {/* Spacer — globe approach zone */}
        <section className="section" style={{ height: '100vh' }} />

        {/* Signal Intake — AI Decoding showcase */}
        <IntakeSection />

        {/* Operations — Tactical Map + Kanban Board */}
        <OperationsSection />
      </main>
    </>
  );
}
