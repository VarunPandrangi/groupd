import { Link } from 'react-router-dom';
import { Users, FileText, BarChart3 } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Groups',
    description: 'Form teams, manage members, and collaborate with your classmates in one place.',
  },
  {
    icon: FileText,
    title: 'Assignments',
    description: 'Track every assignment, due date, and submission link — never miss a deadline.',
  },
  {
    icon: BarChart3,
    title: 'Progress',
    description: 'Visual dashboards and completion tracking for students and professors alike.',
  },
];

export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .landing-animate {
          opacity: 0;
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .landing-dot-grid {
          background-image: radial-gradient(circle, var(--border-default) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .landing-hero-glow {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79, 123, 247, 0.08) 0%, transparent 70%);
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }

        .landing-gradient-text {
          background: linear-gradient(135deg, #4F7BF7 0%, #34D399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .landing-cta-primary {
          background: var(--accent-primary);
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 8px;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        .landing-cta-primary:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 24px rgba(79, 123, 247, 0.3);
        }
        .landing-cta-primary:active {
          transform: scale(0.98);
        }

        .landing-cta-outline {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-default);
          padding: 14px 32px;
          border-radius: 8px;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }
        .landing-cta-outline:hover {
          border-color: var(--border-hover);
          transform: scale(1.03);
          box-shadow: 0 2px 16px rgba(255, 255, 255, 0.04);
        }
        .landing-cta-outline:active {
          transform: scale(0.98);
        }

        .landing-feature-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 32px 28px;
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }
        .landing-feature-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot grid background */}
        <div
          className="landing-dot-grid"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />

        {/* Hero glow */}
        <div className="landing-hero-glow" />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1080px',
            margin: '0 auto',
            padding: '0 24px',
          }}
        >
          {/* Header */}
          <header
            className="landing-animate"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 0',
              animationDelay: '0s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              JoinEazy
            </span>
            <Link
              to="/login"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => (e.target.style.color = 'var(--text-primary)')}
              onMouseOut={(e) => (e.target.style.color = 'var(--text-secondary)')}
            >
              Sign In →
            </Link>
          </header>

          {/* Hero */}
          <section
            style={{
              textAlign: 'center',
              paddingTop: '100px',
              paddingBottom: '80px',
            }}
          >
            <h1
              className="landing-animate"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: '24px',
                animationDelay: '0.1s',
              }}
            >
              Collaborate.{' '}
              <span className="landing-gradient-text">Submit.</span>{' '}
              Succeed.
            </h1>

            <p
              className="landing-animate"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                color: 'var(--text-secondary)',
                maxWidth: '560px',
                margin: '0 auto 40px',
                lineHeight: 1.6,
                animationDelay: '0.2s',
              }}
            >
              The unified platform for student groups, assignment tracking,
              and submission management. Built for classrooms that move fast.
            </p>

            <div
              className="landing-animate"
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                animationDelay: '0.3s',
              }}
            >
              <Link to="/register" className="landing-cta-primary">
                Get Started
              </Link>
              <Link to="/login" className="landing-cta-outline">
                Sign In
              </Link>
            </div>
          </section>

          {/* Features */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
              paddingBottom: '80px',
            }}
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="landing-animate landing-feature-card"
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    <Icon
                      size={22}
                      style={{ color: 'var(--accent-primary)' }}
                    />
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </section>

          {/* Footer */}
          <footer
            className="landing-animate"
            style={{
              textAlign: 'center',
              padding: '32px 0',
              borderTop: '1px solid var(--border-default)',
              animationDelay: '0.7s',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)',
              }}
            >
              Built for JoinEazy
            </span>
          </footer>
        </div>
      </div>
    </>
  );
}
