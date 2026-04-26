import { useCallback, useMemo } from 'react';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useGlobeState } from '../hooks/useGlobeState';
import { useLiveTasks } from '../hooks/useLiveTasks';
import GlobeScene from '../components/globe/GlobeScene';
import Navbar from '../components/layout/Navbar';
import ScrollProgress from '../components/ui/ScrollProgress';
import HeroSection from '../components/sections/HeroSection';
import IntakeSection from '../components/sections/IntakeSection';
import OperationsSection from '../components/sections/OperationsSection';
import RequestCard from '../components/dashboard/RequestCard';
import { taskToCard, tasksToGlobePins } from '../lib/taskAdapter';

const API_BASE = 'http://localhost:8787';

const VOLUNTEER_VISIBLE_STATUSES = new Set([
  'pending',
  'assigned',
  'dispatched',
  'completed',
]);

function MyMissionsSection({ missions, profile, onAccept, onDecline, onComplete }) {
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];

  return (
    <section className="section my-missions" id="missions">
      <div className="missions-header">
        <span className="section-eyebrow mono">02 // Field Briefing</span>
        <h2 className="section-title">
          Your <span className="accent">Missions</span>
        </h2>
        <p className="section-subtitle">
          Tasks the matching engine has assigned to you. Pull up coordinates from the tactical map below.
        </p>

        {skills.length > 0 && (
          <div className="missions-skills">
            <span className="skills-label mono">Your skills</span>
            {skills.map((s) => (
              <span key={s} className="skill-pill mono">{s}</span>
            ))}
          </div>
        )}
      </div>

      {missions.length === 0 ? (
        <div className="mission-empty mono">
          <span className="mission-empty-dot" />
          No missions assigned yet. Stand by — the matcher will route requests to you when they fit your skills.
        </div>
      ) : (
        <div className="mission-grid">
          {missions.map((m) => (
            <RequestCard
              key={m.id}
              request={m}
              highlight
              showVolunteerActions
              onAccept={onAccept}
              onDecline={onDecline}
              onMissionComplete={onComplete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function VolunteerDashboard({ profile }) {
  const scrollProgress = useScrollProgress();
  const globeState = useGlobeState(scrollProgress);
  const isScrolled = scrollProgress > 0.02;

  const { tasks: rawTasks, loading } = useLiveTasks();

  // Volunteers only see approved/active tasks — pre-approval queue is admin-only
  const tasks = useMemo(
    () => rawTasks.filter((t) => VOLUNTEER_VISIBLE_STATUSES.has(t.status)),
    [rawTasks],
  );

  const myUid = profile?.firebaseUid || profile?.id;
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignedVolunteerId === myUid),
    [tasks, myUid],
  );

  const myMissionCards = useMemo(() => myTasks.map(taskToCard), [myTasks]);
  const globePins = useMemo(() => tasksToGlobePins(tasks), [tasks]);

  const callMissionEndpoint = useCallback(
    async (path, requestId) => {
      if (!myUid) return;
      await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, volunteerId: myUid }),
      });
    },
    [myUid],
  );

  const handleAccept = useCallback(
    (id) => callMissionEndpoint('/accept-mission', id),
    [callMissionEndpoint],
  );
  const handleDecline = useCallback(
    (id) => callMissionEndpoint('/decline-mission', id),
    [callMissionEndpoint],
  );
  const handleComplete = useCallback(
    (id) => callMissionEndpoint('/complete-mission', id),
    [callMissionEndpoint],
  );

  return (
    <>
      <div className="star-field" />

      <Navbar scrolled={isScrolled} profile={profile} />
      <ScrollProgress progress={scrollProgress} />

      <div
        className="globe-layer"
        style={{ opacity: Math.min(0.55, globeState.opacity) }}
      >
        <GlobeScene globeState={globeState} pins={globePins} />
      </div>

      <main className="content-layer">
        <HeroSection
          eyebrow={`Volunteer · ${profile?.name ?? 'Field Operative'}`}
          title="Mission Control"
          subtitle={
            loading
              ? 'Locating your assignments…'
              : myTasks.length > 0
                ? `${myTasks.length} mission${myTasks.length === 1 ? '' : 's'} assigned. Network has ${tasks.length} active signal${tasks.length === 1 ? '' : 's'}.`
                : `Standing by. Network has ${tasks.length} active signal${tasks.length === 1 ? '' : 's'} — the matcher will assign work that fits your skills.`
          }
          ctaLabel={myTasks.length > 0 ? 'View My Missions' : 'View Operations'}
          scrollTargetId={myTasks.length > 0 ? 'missions' : 'operations'}
        />

        <section className="section" style={{ height: '100vh' }} />

        <MyMissionsSection
          missions={myMissionCards}
          profile={profile}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onComplete={handleComplete}
        />

        <IntakeSection
          eyebrow="04 // Field Report"
          title="Report a"
          titleAccent="Distress Signal"
          subtitle="Spotted something? File a report. It will land in the coordinator queue for review before being matched to the right responder."
          submitNote="Pending coordinator review"
        />

        <OperationsSection
          tasks={tasks}
          highlightVolunteerId={myUid}
          title="Network"
          titleAccent="Operations"
          eyebrow="03 // Field Awareness"
          defaultView="map"
        />
      </main>
    </>
  );
}
