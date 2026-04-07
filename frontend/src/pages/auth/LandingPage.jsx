import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion as Motion,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  CalendarDots,
  ChalkboardTeacher,
  ChartBar,
  CheckCircle,
  FileText,
  MoonStars,
  SquaresFour,
  SunDim,
  TrendUp,
  Users,
  UsersThree,
} from '@phosphor-icons/react';
import { FadeUp, StaggerGroup } from '../../components/common/Page';
import Card from '../../components/common/Card';
import LogoWordmark from '../../components/common/LogoWordmark';
import { buttonClassName } from '../../components/common/buttonClassName';
import { useThemeStore } from '../../stores/themeStore';

/* ───────────────────────────── static data ───────────────────────────── */

const featureCards = [
  {
    icon: UsersThree,
    title: 'Group Creation & Member Management',
    description:
      'Students can create groups, manage members, and keep submissions coordinated around each assignment.',
    tone: {
      background: 'var(--accent-blue-soft)',
      color: 'var(--accent-blue)',
    },
  },
  {
    icon: FileText,
    title: 'Assignment Tracking',
    description:
      'Assignments include due dates, brief details, and submission links so teams always know what is pending.',
    tone: {
      background: 'var(--accent-amber-soft)',
      color: 'var(--accent-amber)',
    },
  },
  {
    icon: TrendUp,
    title: 'Progress Monitoring',
    description:
      'Students and professors get clear progress views, including completion trends and submission status by group.',
    tone: {
      background: 'var(--accent-green-soft)',
      color: 'var(--accent-green)',
    },
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Create Or Join A Group',
    description:
      'Students set up groups and manage members before working on assigned briefs.',
  },
  {
    step: '02',
    title: 'Track Assignments And Submit',
    description:
      'Each assignment page shows due date, brief context, and the submission workflow for the group.',
  },
  {
    step: '03',
    title: 'Monitor Progress In Dashboard',
    description:
      'Professors use dashboard and submission tracking views to monitor group completion and confirmations.',
  },
];

const roleViews = [
  {
    title: 'For Students',
    icon: Users,
    points: [
      'Create and manage groups with classmates',
      'View assigned briefs and due dates',
      'Submit assignment links for the group',
      'Track group progress from the student dashboard',
    ],
  },
  {
    title: 'For Professors',
    icon: ChartBar,
    points: [
      'Create and manage assignments',
      'View group completion and dashboard insights',
      'Use submission tracker to review confirmations',
      'Monitor group-level progress across the class',
    ],
  },
];

const dashboardPreviewCards = [
  {
    title: 'Student Command Center',
    icon: SquaresFour,
    detail: 'One timeline for group tasks, due dates, and submission readiness.',
  },
  {
    title: 'Professor Intelligence',
    icon: ChartBar,
    detail: 'Completion signals spotlight risk early so interventions happen before misses.',
  },
  {
    title: 'Submission Evidence',
    icon: CalendarDots,
    detail: 'Each delivery captures owner, timestamp, and proof for confident reviews.',
  },
];

/* ─────────────── network visual — geometric layout ─────────────── */

/*
  Geometric 3-column, 2-row grid layout:

  Row 1:  Professors (10,22)  →  Assignments (38,22)  ─────→  Analytics (82,22)
                                      │                           ▲
                                      ▼                           │
  Row 2:  Students (10,78)    →  Groups (38,78)       →  Submissions (66,65)

  Connections (all conceptually correct):
  - Professors → Assignments  (professors create assignments)
  - Students → Groups         (students form groups)
  - Groups → Submissions      (groups confirm submissions)
  - Assignments → Submissions (assignments receive submissions — diagonal)
  - Submissions → Analytics   (submissions feed the dashboard)
  - Professors → Analytics    (professors view analytics)
*/

const collaborationNodes = [
  {
    id: 'professors',
    icon: ChalkboardTeacher,
    label: 'Professors',
    description: 'Professors create assignments and monitor class-wide analytics.',
    x: 10,
    y: 22,
  },
  {
    id: 'students',
    icon: UsersThree,
    label: 'Students',
    description: 'Students register, join groups, and collaborate on submissions.',
    x: 10,
    y: 78,
  },
  {
    id: 'assignments',
    icon: FileText,
    label: 'Assignments',
    description: 'Assignments carry briefs, due dates, and OneDrive submission links.',
    x: 40,
    y: 22,
  },
  {
    id: 'groups',
    icon: Users,
    label: 'Groups',
    description: 'Students form groups of up to 6 to collaborate on assignments.',
    x: 40,
    y: 78,
  },
  {
    id: 'submissions',
    icon: CheckCircle,
    label: 'Submissions',
    description: 'One member confirms on behalf of the group — timestamped and irreversible.',
    x: 68,
    y: 65,
  },
  {
    id: 'analytics',
    icon: ChartBar,
    label: 'Analytics',
    description: 'Real-time dashboards show completion rates and group performance.',
    x: 86,
    y: 22,
  },
];

const collaborationEdges = [
  ['professors', 'assignments'],
  ['students', 'groups'],
  ['groups', 'submissions'],
  ['assignments', 'submissions'],
  ['submissions', 'analytics'],
  ['professors', 'analytics'],
];

/* ─── geometry helpers (unchanged from original) ─── */

function getNodeGeometry(node, nodeMeasurements) {
  const measurement = nodeMeasurements[node.id];
  if (!measurement) {
    return { x: node.x, y: node.y, rx: 6.8, ry: 4 };
  }
  return {
    x: measurement.x,
    y: measurement.y,
    rx: measurement.width / 2,
    ry: measurement.height / 2,
  };
}

function projectPointToPillEdge(center, target, radiusX, radiusY) {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const safeRadiusX = Math.max(radiusX, 0.0001);
  const safeRadiusY = Math.max(radiusY, 0.0001);
  const denominator = Math.sqrt(
    (dx * dx) / (safeRadiusX * safeRadiusX) +
      (dy * dy) / (safeRadiusY * safeRadiusY)
  );
  if (!Number.isFinite(denominator) || denominator === 0) {
    return { x: center.x, y: center.y };
  }
  const scale = 1 / denominator;
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}

function buildConnectedPath(sourceNode, destinationNode, nodeMeasurements) {
  const source = getNodeGeometry(sourceNode, nodeMeasurements);
  const destination = getNodeGeometry(destinationNode, nodeMeasurements);
  const start = projectPointToPillEdge(source, destination, source.rx, source.ry);
  const end = projectPointToPillEdge(destination, source, destination.rx, destination.ry);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const absDy = Math.abs(dy);

  /* Horizontal connections: gentle arc instead of boring straight line */
  if (absDy < 5) {
    const arcBend = Math.abs(dx) * 0.12;
    return `M ${start.x} ${start.y} Q ${start.x + dx * 0.5} ${start.y - arcBend}, ${end.x} ${end.y}`;
  }

  /* Diagonal connections: smooth S-curve through a midpoint */
  const midX = start.x + dx * 0.5;
  const midY = start.y + dy * 0.5;
  return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
}

/* ─── NetworkVisual component ─── */

function NetworkVisual() {
  const prefersReducedMotion = useReducedMotion();
  const [activeNode, setActiveNode] = useState('students');
  const [nodeMeasurements, setNodeMeasurements] = useState({});
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const canvasRef = useRef(null);
  const nodeRefs = useRef({});

  const activeNodeData = useMemo(
    () => collaborationNodes.find((node) => node.id === activeNode) || collaborationNodes[0],
    [activeNode]
  );

  const nodeMap = useMemo(
    () => collaborationNodes.reduce((acc, node) => { acc[node.id] = node; return acc; }, {}),
    []
  );

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setSpotlight({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  };

  const handlePointerLeave = () => setSpotlight({ x: 50, y: 50 });

  useEffect(() => {
    let frameId = 0;

    const measureNodePositions = () => {
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;
      const canvasRect = canvasElement.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;

      const nextMeasurements = {};
      collaborationNodes.forEach((node) => {
        const el = nodeRefs.current[node.id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        nextMeasurements[node.id] = {
          x: ((rect.left - canvasRect.left + rect.width / 2) / canvasRect.width) * 100,
          y: ((rect.top - canvasRect.top + rect.height / 2) / canvasRect.height) * 100,
          width: (rect.width / canvasRect.width) * 100,
          height: (rect.height / canvasRect.height) * 100,
        };
      });

      setNodeMeasurements((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextMeasurements);
        if (prevKeys.length !== nextKeys.length) return nextMeasurements;
        const changed = nextKeys.some((key) => {
          const p = prev[key];
          const n = nextMeasurements[key];
          if (!p || !n) return true;
          return (
            Math.abs(p.x - n.x) > 0.05 ||
            Math.abs(p.y - n.y) > 0.05 ||
            Math.abs(p.width - n.width) > 0.05 ||
            Math.abs(p.height - n.height) > 0.05
          );
        });
        return changed ? nextMeasurements : prev;
      });
    };

    const schedule = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measureNodePositions);
    };

    schedule();
    window.addEventListener('resize', schedule);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(schedule);
      if (canvasRef.current) resizeObserver.observe(canvasRef.current);
      collaborationNodes.forEach((node) => {
        const el = nodeRefs.current[node.id];
        if (el) resizeObserver.observe(el);
      });
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', schedule);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <div
      className="landing-network"
      style={{ '--spot-x': `${spotlight.x}%`, '--spot-y': `${spotlight.y}%` }}
    >
      <div
        className="landing-network__canvas"
        ref={canvasRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      >
        <svg className="landing-network__lines" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="network-link-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.74" />
              <stop offset="52%" stopColor="var(--accent-brand-electric)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.66" />
            </linearGradient>
            <marker
              id="network-link-arrow"
              viewBox="0 0 10 10"
              refX="8.4"
              refY="5"
              markerWidth="4.8"
              markerHeight="4.8"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill="var(--accent-brand-electric)"
                fillOpacity="0.6"
              />
            </marker>
            <filter id="network-link-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* subtle dot grid for geometric feel */}
          {Array.from({ length: 11 }, (_, col) =>
            Array.from({ length: 7 }, (_, row) => (
              <circle
                key={`dot-${col}-${row}`}
                cx={5 + col * 9}
                cy={5 + row * 13}
                r="0.3"
                fill="var(--text-primary)"
                opacity="0.07"
              />
            ))
          )}

          {collaborationEdges.map(([from, to], index) => {
            const source = nodeMap[from];
            const destination = nodeMap[to];
            const pathData = buildConnectedPath(source, destination, nodeMeasurements);
            const isActive = from === activeNode || to === activeNode;

            return (
              <g key={`${from}-${to}`}>
                {/* background shadow line */}
                <path
                  d={pathData}
                  stroke="var(--text-primary)"
                  strokeWidth="1.55"
                  strokeLinecap="round"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.04}
                />
                {/* animated main line */}
                <Motion.path
                  d={pathData}
                  stroke="url(#network-link-gradient)"
                  strokeWidth={isActive ? '2' : '1.5'}
                  strokeDasharray={isActive ? '6 2.5' : '4.2 3'}
                  strokeLinecap="round"
                  fill="none"
                  markerEnd="url(#network-link-arrow)"
                  vectorEffect="non-scaling-stroke"
                  filter="url(#network-link-glow)"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0.84 }
                      : { pathLength: 0, opacity: 0.4 }
                  }
                  animate={
                    prefersReducedMotion
                      ? { opacity: isActive ? 0.95 : 0.6 }
                      : {
                          pathLength: 1,
                          opacity: isActive ? [0.7, 1, 0.7] : [0.4, 0.65, 0.4],
                        }
                  }
                  transition={{
                    pathLength: { duration: 1.4, delay: index * 0.1, ease: 'easeOut' },
                    opacity: {
                      duration: 2.6,
                      delay: 0.08 + index * 0.07,
                      ease: 'easeInOut',
                      repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
                    },
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* DOM nodes — keeps the beautiful frosted pill styling from your CSS */}
        {collaborationNodes.map((node, index) => {
          const Icon = node.icon;
          const isActive = node.id === activeNode;

          return (
            <Motion.button
              key={node.id}
              ref={(element) => {
                if (element) { nodeRefs.current[node.id] = element; }
                else { delete nodeRefs.current[node.id]; }
              }}
              type="button"
              className={`landing-network__node ${isActive ? 'landing-network__node--active' : ''}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
              }}
              onClick={() => setActiveNode(node.id)}
              onMouseEnter={() => setActiveNode(node.id)}
              onFocus={() => setActiveNode(node.id)}
              aria-pressed={isActive}
              initial={
                prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 8 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 1, y: [0, -2, 0] }
              }
              transition={{
                duration: 2.4,
                delay: 0.16 + index * 0.06,
                ease: 'easeInOut',
                repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
              }}
            >
              <span className="landing-network__node-icon" aria-hidden="true">
                <Icon size={15} />
              </span>
              <span>{node.label}</span>
            </Motion.button>
          );
        })}
      </div>

      {/* info panel */}
      <Motion.div
        className="landing-network__panel"
        key={activeNode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <p className="text-xs font-medium uppercase tracking-wide eyebrow">Collaboration Map</p>
        <h3 className="landing-network__panel-title">{activeNodeData.label}</h3>
        <p className="landing-network__panel-copy">{activeNodeData.description}</p>
      </Motion.div>
    </div>
  );
}

/* ──────────────────────────── landing page ──────────────────────────── */

export default function LandingPage() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen landing landing--saas">
      <header className="landing__header">
        <Link to="/" className="brand brand--landing" aria-label="Groupd home">
          <LogoWordmark />
        </Link>

        <div className="landing__header-actions">
          <button
            type="button"
            className={buttonClassName({ variant: 'icon', iconOnly: true })}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={toggleTheme}
          >
            {theme === 'light' ? <MoonStars size={18} /> : <SunDim size={18} />}
          </button>

          <Link to="/login" className={buttonClassName({ variant: 'ghost' })}>
            Sign In
          </Link>

          <Link to="/register" className={buttonClassName({ variant: 'primary' })}>
            Get Started
          </Link>
        </div>
      </header>

      <main className="landing__main">
        <StaggerGroup className="landing__hero">
          <FadeUp className="landing-hero__content">
            <p className="text-xs font-medium uppercase tracking-wide eyebrow eyebrow--accent landing__hero-eyebrow">
              Collaboration platform for classrooms
            </p>
            <h1 className="landing__hero-title">
              Manage Student Groups & Assignments Seamlessly
            </h1>
            <p className="landing__hero-copy">
              Collaborate, submit, and track progress with ease.
            </p>

            <div className="landing__hero-actions">
              <Link to="/register" className={buttonClassName({ variant: 'primary' })}>
                Get Started
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className={buttonClassName({ variant: 'secondary' })}>
                Sign In
              </Link>
            </div>

            <div className="landing__hero-facts">
              <span className="landing__hero-fact">Group management for students</span>
              <span className="landing__hero-fact">Assignment and submission workflow</span>
              <span className="landing__hero-fact">Professor progress monitoring</span>
            </div>
          </FadeUp>

          <FadeUp className="landing-hero__visual">
            <NetworkVisual />
          </FadeUp>
        </StaggerGroup>

        <StaggerGroup className="landing-section">
          <FadeUp className="landing-section__head">
            <p className="text-xs font-medium uppercase tracking-wide eyebrow">Core Features</p>
            <h2 className="landing-section__title">Everything needed for student group workflows</h2>
          </FadeUp>
          <div className="landing-feature-grid">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <FadeUp key={feature.title}>
                  <Card interactive className="landing-feature-card">
                    <span
                      className="landing-feature-card__icon"
                      style={{
                        background: feature.tone.background,
                        color: feature.tone.color,
                      }}
                      aria-hidden="true"
                    >
                      <Icon size={18} />
                    </span>
                    <h3 className="landing-feature-card__title">{feature.title}</h3>
                    <p className="landing-feature-card__copy">{feature.description}</p>
                  </Card>
                </FadeUp>
              );
            })}
          </div>
        </StaggerGroup>

        <StaggerGroup className="landing-section">
          <FadeUp>
            <Card className="landing-preview">
              <div className="landing-preview__backdrop" aria-hidden="true" />
              <div className="landing-preview__main-card">
                <p className="text-xs font-medium uppercase tracking-wide eyebrow">Dashboard Preview</p>
                <h3 className="landing-preview__title">A real-time command surface for every classroom</h3>
                <p className="landing-preview__copy">
                  Groupd turns scattered updates into one reliable operating view for students and faculty.
                </p>
              </div>

              <div className="landing-preview__card-grid">
                {dashboardPreviewCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <Motion.article
                      key={card.title}
                      className="landing-preview__insight-card"
                      animate={
                        prefersReducedMotion
                          ? { y: 0 }
                          : { y: [0, index % 2 === 0 ? -4 : -2, 0] }
                      }
                      transition={{
                        duration: 2.8 + index * 0.3,
                        ease: 'easeInOut',
                        repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
                      }}
                    >
                      <span className="landing-preview__float-icon" aria-hidden="true">
                        <Icon size={16} />
                      </span>
                      <h4>{card.title}</h4>
                      <p>{card.detail}</p>
                    </Motion.article>
                  );
                })}
              </div>
            </Card>
          </FadeUp>
        </StaggerGroup>

        <StaggerGroup className="landing-section">
          <FadeUp className="landing-section__head">
            <p className="text-xs font-medium uppercase tracking-wide eyebrow">How It Works</p>
            <h2 className="landing-section__title">Simple flow for every class</h2>
          </FadeUp>

          <div className="landing-steps">
            {howItWorks.map((step) => (
              <FadeUp key={step.step}>
                <Card interactive className="landing-step-card">
                  <span className="landing-step-card__number">{step.step}</span>
                  <h3 className="landing-step-card__title">{step.title}</h3>
                  <p className="landing-step-card__copy">{step.description}</p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </StaggerGroup>

        <StaggerGroup className="landing-section landing-section--split">
          <FadeUp className="landing-section__head">
            <p className="text-xs font-medium uppercase tracking-wide eyebrow">Student & Professor Views</p>
            <h2 className="landing-section__title">Different roles, one connected workflow</h2>
          </FadeUp>

          <div className="landing-split-grid">
            {roleViews.map((view) => {
              const Icon = view.icon;
              return (
                <FadeUp key={view.title}>
                  <Card interactive className="landing-split-card">
                    <div className="landing-split-card__head">
                      <span className="landing-split-card__icon" aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      <h3>{view.title}</h3>
                    </div>
                    <ul className="landing-split-card__list">
                      {view.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </Card>
                </FadeUp>
              );
            })}
          </div>
        </StaggerGroup>

        <footer className="landing__footer">Built by Varun Pandrangi.</footer>
      </main>
    </div>
  );
}
