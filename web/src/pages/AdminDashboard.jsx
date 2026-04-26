import { useCallback, useState } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useGlobeState } from '../hooks/useGlobeState';
import { useLiveTasks } from '../hooks/useLiveTasks';
import GlobeScene from '../components/globe/GlobeScene';
import Navbar from '../components/layout/Navbar';
import ScrollProgress from '../components/ui/ScrollProgress';
import HeroSection from '../components/sections/HeroSection';
import IntakeSection from '../components/sections/IntakeSection';
import OperationsSection from '../components/sections/OperationsSection';
import ImpactSection from '../components/sections/ImpactSection';
import { pushToast } from '../hooks/useToasts';

const API_BASE = 'http://localhost:8787';

const DEMO_REQUESTS = [
  'URGENT - need food and water at riverside community center in Bangalore. ~200 families displaced by flooding. Children and elderly priority.',
  'Need insulin and basic medical supplies for diabetic camp in Mumbai. About 40 people. Running low.',
  'Drinking water needed near central station Delhi. Around 80 people, 12 children.',
  'Family of 5 in Bangalore HSR layout, no power for 2 days, baby needs formula and warm clothes.',
  'Temporary shelter needed for 25 people displaced from low-lying area. Mumbai west.',
];

export default function AdminDashboard({ profile }) {
  const scrollProgress = useScrollProgress();
  const globeState = useGlobeState(scrollProgress);
  const isScrolled = scrollProgress > 0.02;

  const { tasks, loading } = useLiveTasks();
  const [autoMatching, setAutoMatching] = useState(false);
  const [demoStep, setDemoStep] = useState(0); // 0 = idle, 1..N = running

  const handleAutoMatch = useCallback(async () => {
    const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'needs_review');
    if (pending.length === 0) return;
    setAutoMatching(true);
    try {
      await Promise.all(
        pending.map((t) =>
          fetch(`${API_BASE}/match-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: t.id }),
          }),
        ),
      );
    } finally {
      setAutoMatching(false);
    }
  }, [tasks]);

  const handleComplete = useCallback(async (requestId) => {
    await fetch(`${API_BASE}/complete-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    });
  }, []);

  const handleReassign = useCallback(async (requestId) => {
    await fetch(`${API_BASE}/reassign-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId }),
    });
  }, []);

  const runDemoMode = useCallback(async () => {
    if (demoStep > 0) return; // already running
    pushToast({
      kind: 'info',
      title: 'Demo mode engaged',
      body: `Streaming ${DEMO_REQUESTS.length} signals…`,
      ttl: 3000,
    });
    for (let i = 0; i < DEMO_REQUESTS.length; i++) {
      setDemoStep(i + 1);
      try {
        await fetch(`${API_BASE}/extract-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: DEMO_REQUESTS[i] }),
        });
      } catch {
        /* ignore — toast on next live snapshot */
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
    pushToast({
      kind: 'info',
      title: 'Auto-matching demo signals…',
      ttl: 2500,
    });
    // Wait briefly so the last request lands in Firestore before matching.
    await new Promise((r) => setTimeout(r, 800));
    await handleAutoMatch();
    setDemoStep(0);
  }, [demoStep, handleAutoMatch]);

  const activeCount = tasks.filter((t) => t.status !== 'completed').length;
  const reviewCount = tasks.filter((t) => t.status === 'needs_review').length;

  return (
    <>
      <div className="star-field" />

      <Navbar scrolled={isScrolled} profile={profile} />
      <ScrollProgress progress={scrollProgress} />

      <div className="globe-layer" style={{ opacity: globeState.opacity }}>
        <GlobeScene globeState={globeState} />
      </div>

      <main className="content-layer">
        <HeroSection
          eyebrow={`Admin · ${profile?.name ?? 'Coordinator'}`}
          title="Command Center"
          subtitle={
            loading
              ? 'Synchronizing with the relief network…'
              : `${activeCount} active request${activeCount === 1 ? '' : 's'}` +
                (reviewCount > 0 ? `, ${reviewCount} flagged for review.` : '.')
          }
          ctaLabel="Decode New Signal"
          scrollTargetId="intake"
        />

        <section className="section" style={{ height: '100vh' }} />

        <IntakeSection />

        <OperationsSection
          tasks={tasks}
          title="Command"
          titleAccent="Center"
          eyebrow="03 // Operations"
          defaultView="board"
          onAutoMatch={handleAutoMatch}
          autoMatching={autoMatching}
          showAdminActions
          onComplete={handleComplete}
          onReassign={handleReassign}
          onDemoMode={runDemoMode}
          demoStep={demoStep}
          demoTotal={DEMO_REQUESTS.length}
        />

        <ImpactSection tasks={tasks} />
      </main>
    </>
  );
}
