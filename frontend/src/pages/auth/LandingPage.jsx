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
    <div className="landing">
      <header className="landing__header">
        <Link to="/" className="brand">
          Join<span className="brand__accent">E</span>azy
        </Link>
        <div className="cluster">
          <Link to="/login" className={buttonClassName({ variant: 'ghost' })}>
            Sign In
          </Link>
          <Link to="/register" className={buttonClassName({ variant: 'primary' })}>
            Get Started
          </Link>
        </div>
      </header>

      <StaggerGroup className="landing__hero">
        <FadeUp>
          <p className="eyebrow eyebrow--accent">Quiet confidence for classroom operations</p>
          <h1 className="landing__hero-title">Collaborate. Submit. Succeed.</h1>
          <p className="landing__hero-copy">
            JoinEazy keeps student groups, assignment briefs, and submission tracking in one calm interface that feels built for real work.
          </p>
          <div className="landing__actions">
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
          <div className="landing__aside">
            <Card>
              <div className="hero-card">
                <span className="hero-card__label">Admin Visibility</span>
                <div className="hero-card__value">Every brief, every group, one dashboard.</div>
                <p className="page-description" style={{ marginTop: 0 }}>
                  Assignment analytics, submission tracking, and group detail views are all built into the same operational surface.
                </p>
              </div>
            </Card>
            <Card variant="accent" accent="var(--accent-green)">
              <div className="cluster" style={{ alignItems: 'flex-start' }}>
                <div className="metric__icon" style={{ background: 'var(--accent-green-soft)', color: 'var(--accent-green)' }}>
                  <CheckCircle size={20} weight="fill" />
                </div>
                <div>
                  <p className="eyebrow">Submission Flow</p>
                  <p className="page-description" style={{ marginTop: 8 }}>
                    OneDrive links, due dates, and confirmation status all stay attached to the assignment itself.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </FadeUp>
      </StaggerGroup>

      <StaggerGroup className="landing__features">
        <div className="landing__feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <FadeUp key={feature.title}>
                <Card interactive>
                  <div
                    className="metric__icon"
                    style={{
                      background: feature.tone.background,
                      color: feature.tone.color,
                    }}
                  >
                    <Icon size={20} />
                  </div>
                  <h2 className="card__title" style={{ marginTop: 18 }}>
                    {feature.title}
                  </h2>
                  <p className="card__copy">{feature.description}</p>
                </Card>
              </FadeUp>
            );
          })}
        </div>
      </StaggerGroup>

      <footer className="landing__footer">Built for JoinEazy</footer>
    </div>
  );
}
