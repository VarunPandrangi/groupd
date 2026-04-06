import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion as Motion,
  useReducedMotion,
} from 'framer-motion';
import {
  ArrowRight,
  CalendarDots,
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

const collaborationNodes = [
  {
    id: 'students',
    icon: UsersThree,
    label: 'Student Space',
    description:
      'Students coordinate tasks, split ownership, and move from brief to submission without context switching.',
    x: 16,
    y: 64,
  },
  {
    id: 'groups',
    icon: Users,
    label: 'Group Hub',
    description:
      'A shared workspace that keeps members, responsibilities, and delivery status perfectly aligned.',
    x: 33,
    y: 42,
  },
  {
    id: 'assignments',
    icon: FileText,
    label: 'Assignment Briefs',
    description:
      'Clear briefs, due dates, and resources remove ambiguity so every group executes with confidence.',
    x: 54,
    y: 22,
  },
  {
    id: 'submissions',
    icon: CheckCircle,
    label: 'Submission Flow',
    description:
      'Every handoff is captured with proof, timestamp, and owner so nothing is lost in review.',
    x: 68,
    y: 60,
  },
  {
    id: 'professors',
    icon: TrendUp,
    label: 'Faculty View',
    description:
      'Professors get instant completion signals and can intervene before deadlines slip.',
    x: 75,
    y: 34,
  },
];

const collaborationEdges = [
  ['students', 'groups'],
  ['groups', 'assignments'],
  ['groups', 'submissions'],
  ['assignments', 'submissions'],
  ['submissions', 'professors'],
  ['assignments', 'professors'],
];

function buildCurvedPath(source, destination) {
  const xGap = destination.x - source.x;
  const yGap = destination.y - source.y;
  const direction = xGap >= 0 ? 1 : -1;
  const bend = Math.max(4, Math.abs(yGap) * 0.45);
  const c1x = source.x + xGap * 0.35;
  const c1y = source.y - bend;
  const c2x = source.x + xGap * 0.68 + direction * 1.5;
  const c2y = destination.y + bend * 0.62;

  return `M ${source.x} ${source.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${destination.x} ${destination.y}`;
}

function NetworkVisual() {
  const prefersReducedMotion = useReducedMotion();
  const [activeNode, setActiveNode] = useState('groups');
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  const activeNodeData = useMemo(
    () =>
      collaborationNodes.find((node) => node.id === activeNode) ||
      collaborationNodes[1],
    [activeNode]
  );

  const nodeMap = useMemo(
    () =>
      collaborationNodes.reduce((accumulator, node) => {
        accumulator[node.id] = node;
        return accumulator;
      }, {}),
    []
  );

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setSpotlight({ x, y });
  };

  const handlePointerLeave = () => {
    setSpotlight({ x: 50, y: 50 });
  };

  return (
    <div
      className="landing-network"
      style={{
        '--spot-x': `${spotlight.x}%`,
        '--spot-y': `${spotlight.y}%`,
      }}
    >
      <div
        className="landing-network__canvas"
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
            <filter id="network-link-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {collaborationEdges.map(([from, to], index) => {
            const source = nodeMap[from];
            const destination = nodeMap[to];

            return (
              <Motion.path
                key={`${from}-${to}`}
                d={buildCurvedPath(source, destination)}
                stroke="url(#network-link-gradient)"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
                vectorEffect="non-scaling-stroke"
                filter="url(#network-link-glow)"
                initial={
                  prefersReducedMotion
                    ? { pathLength: 1, opacity: 0.84 }
                    : { pathLength: 0, opacity: 0.56 }
                }
                animate={
                  prefersReducedMotion
                    ? { pathLength: 1, opacity: 0.84 }
                    : {
                        pathLength: 1,
                        opacity: [0.62, 0.98, 0.62],
                      }
                }
                transition={{
                  duration: 2.6,
                  delay: 0.08 + index * 0.07,
                  ease: 'easeInOut',
                  repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
                }}
              />
            );
          })}
        </svg>

        {collaborationNodes.map((node, index) => {
          const Icon = node.icon;
          const isActive = node.id === activeNode;

          return (
            <Motion.button
              key={node.id}
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
                  : {
                      opacity: 1,
                      y: [0, -2, 0],
                    }
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

      <Motion.div
        className="landing-network__panel"
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
                          : {
                              y: [0, index % 2 === 0 ? -4 : -2, 0],
                            }
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
