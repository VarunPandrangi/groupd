import { Link } from 'react-router-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDots,
  CheckCircle,
  SquaresFour,
} from '@phosphor-icons/react';

import heroVisual from '../../../stitch-downloads/architectural-logic/e4ba0a966bdb46108b6e0a1e8fbe1f53.png';

const heroLines = ['Manage', 'Student', 'Groups &', 'Assignments', 'Seamlessly.'];

const featureCards = [
  {
    icon: SquaresFour,
    title: 'Group Setup',
    description:
      'Students can create a group, invite classmates, and manage members from one shared workspace. Leaders can add or remove members within the app rules.',
  },
  {
    icon: CalendarDots,
    title: 'Assignment Timeline',
    description:
      'Admins publish assignments for all students or selected groups, and students can track due dates, active work, and overdue items in one view.',
  },
  {
    icon: CheckCircle,
    title: 'Submission Confirmation',
    description:
      'Each group submits through a two-step confirmation flow, and admins can review submission status by assignment and group.',
  },
];

function getRevealMotion(prefersReducedMotion, delay = 0) {
  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0 },
    };
  }

  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.55,
      ease: 'easeOut',
      delay,
    },
  };
}

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="landing-architectural">
      <div className="landing-architectural__shell layout-frame">
        <header className="landing-architectural__header">
          <Link to="/" className="landing-architectural__brand" aria-label="Groupd home">
            GROUPD
          </Link>

          <nav className="landing-architectural__nav" aria-label="Primary">
            <Link to="/login" className="landing-architectural__nav-link landing-architectural__nav-link--ghost">
              LOGIN
            </Link>
            <Link
              to="/register"
              className="landing-architectural__nav-link landing-architectural__nav-link--primary"
            >
              INITIALIZE
            </Link>
          </nav>
        </header>

        <main className="landing-architectural__main">
          <section className="landing-architectural__hero" aria-labelledby="landing-architectural-title">
            <Motion.div
              className="landing-architectural__hero-copy"
              {...getRevealMotion(prefersReducedMotion, 0)}
            >
              <span className="landing-architectural__eyebrow">System Readout V2.4</span>

              <h1 className="landing-architectural__title" id="landing-architectural-title">
                {heroLines.map((line) => (
                  <span
                    key={line}
                    className={
                      line === 'Seamlessly.'
                        ? 'landing-architectural__title-line landing-architectural__title-line--accent'
                        : 'landing-architectural__title-line'
                    }
                  >
                    {line}
                  </span>
                ))}
              </h1>

              <p className="landing-architectural__description">
                A structural framework for academic collaboration. Organize rosters, execute assignments,
                and monitor group dynamics with uncompromising precision.
              </p>

              <div className="landing-architectural__actions">
                <Link to="/register" className="landing-architectural__cta">
                  <span>Get Started</span>
                  <ArrowRight size={18} weight="bold" />
                </Link>
              </div>
            </Motion.div>

            <Motion.figure
              className="landing-architectural__hero-visual"
              {...getRevealMotion(prefersReducedMotion, 0.12)}
            >
              <div className="landing-architectural__visual-frame">
                <div className="landing-architectural__visual-label" aria-hidden="true">
                  <span className="landing-architectural__visual-label-title">groupD</span>
                  <span className="landing-architectural__visual-rule" />
                  <div className="landing-architectural__visual-squares">
                    <span className="landing-architectural__visual-square" />
                    <span className="landing-architectural__visual-square" />
                    <span className="landing-architectural__visual-square" />
                  </div>
                </div>

                <div className="landing-architectural__visual-stage">
                  <img
                    src={heroVisual}
                    alt="Architectural collaboration visualization with glowing blueprint lines and student nodes."
                    className="landing-architectural__visual-image"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </Motion.figure>
          </section>

          <div className="landing-architectural__divider" aria-hidden="true" />

          <section className="landing-architectural__features" aria-labelledby="landing-architectural-features">
            <h2 className="landing-architectural__section-title" id="landing-architectural-features">
              <span>Everything needed for student group</span>
              <span>workflows</span>
            </h2>

            <div className="landing-architectural__feature-grid">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <Motion.article
                    key={feature.title}
                    className="landing-architectural__feature-card"
                    {...getRevealMotion(prefersReducedMotion, 0.16 + index * 0.08)}
                  >
                    <span className="landing-architectural__feature-icon" aria-hidden="true">
                      <Icon size={18} weight="bold" />
                    </span>
                    <h3 className="landing-architectural__feature-title">{feature.title}</h3>
                    <p className="landing-architectural__feature-copy">{feature.description}</p>
                  </Motion.article>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      <footer className="landing-architectural__footer">
        <div className="landing-architectural__footer-inner">
          <span className="landing-architectural__footer-brand">GROUPD</span>
        </div>
      </footer>
    </div>
  );
}
