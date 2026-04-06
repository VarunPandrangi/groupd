import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChartBar,
  CheckCircle,
  FileText,
  UsersThree,
} from '@phosphor-icons/react';
import { FadeUp, StaggerGroup } from '../../components/common/Page';
import Card from '../../components/common/Card';
import { buttonClassName } from '../../components/common/buttonClassName';

const features = [
  {
    icon: UsersThree,
    title: 'Group-first collaboration',
    description:
      'Create teams, manage members, and keep every classmate aligned around the same brief.',
    tone: { background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)' },
  },
  {
    icon: FileText,
    title: 'Assignment clarity',
    description:
      'See due dates, links, statuses, and progress in one place instead of scattered tools.',
    tone: { background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' },
  },
  {
    icon: ChartBar,
    title: 'Progress that stays readable',
    description:
      'Students and admins both get dashboards that surface momentum without visual noise.',
    tone: { background: 'var(--accent-green-soft)', color: 'var(--accent-green)' },
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen landing">
      <header className="flex items-center justify-between gap-4 landing__header">
        <Link to="/" className="font-bold tracking-tight brand">
          Join<span className="font-bold brand__accent">E</span>azy
        </Link>
        <div className="flex items-center gap-3 cluster">
          <Link to="/login" className={buttonClassName({ variant: 'ghost' })}>
            Sign In
          </Link>
          <Link to="/register" className={buttonClassName({ variant: 'primary' })}>
            Get Started
          </Link>
        </div>
      </header>

      <StaggerGroup className="grid gap-6 landing__hero">
        <FadeUp>
          <p className="text-xs font-medium uppercase tracking-wide eyebrow eyebrow--accent">Quiet confidence for classroom operations</p>
          <h1 className="text-3xl font-bold tracking-tight landing__hero-title">Collaborate. Submit. Succeed.</h1>
          <p className="text-lg leading-relaxed landing__hero-copy">
            JoinEazy keeps student groups, assignment briefs, and submission tracking in one calm interface that feels built for real work.
          </p>
          <div className="flex gap-3 landing__actions">
            <Link to="/register" className={buttonClassName({ variant: 'primary' })}>
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link to="/login" className={buttonClassName({ variant: 'secondary' })}>
              Sign In
            </Link>
          </div>
        </FadeUp>

        <FadeUp>
          <div className="grid gap-4 landing__aside">
            <Card>
              <div className="rounded-xl border grid gap-3 hero-card">
                <span className="text-xs font-medium uppercase tracking-wide hero-card__label">Admin Visibility</span>
                <div className="text-3xl font-bold tracking-tight hero-card__value">Every brief, every group, one dashboard.</div>
                <p className="text-base leading-relaxed page-description" style={{ marginTop: 0 }}>
                  Assignment analytics, submission tracking, and group detail views are all built into the same operational surface.
                </p>
              </div>
            </Card>
            <Card variant="accent" accent="var(--accent-green)">
              <div className="flex items-center gap-3 cluster" style={{ alignItems: 'flex-start' }}>
                <div className="inline-flex items-center justify-center rounded-xl metric__icon" style={{ background: 'var(--accent-green-soft)', color: 'var(--accent-green)' }}>
                  <CheckCircle size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide eyebrow">Submission Flow</p>
                  <p className="text-base leading-relaxed page-description" style={{ marginTop: 8 }}>
                    OneDrive links, due dates, and confirmation status all stay attached to the assignment itself.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </FadeUp>
      </StaggerGroup>

      <StaggerGroup className="w-full landing__features">
        <div className="grid gap-5 md:grid-cols-3 landing__feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <FadeUp key={feature.title}>
                <Card interactive>
                  <div
                    className="inline-flex items-center justify-center rounded-xl metric__icon"
                    style={{
                      background: feature.tone.background,
                      color: feature.tone.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight card__title" style={{ marginTop: 18 }}>
                    {feature.title}
                  </h2>
                  <p className="text-sm leading-relaxed card__copy">{feature.description}</p>
                </Card>
              </FadeUp>
            );
          })}
        </div>
      </StaggerGroup>

      <footer className="text-sm landing__footer">Built for JoinEazy</footer>
    </div>
  );
}
