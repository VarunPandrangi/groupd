import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle,
  Clock3,
  FileText,
  Users,
} from 'lucide-react';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/student/ProgressBar';
import dashboardService from '../../services/dashboardService';
import { useAuthStore } from '../../stores/authStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function getInitials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

function StudentDashboardSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section
        style={{
          borderRadius: '30px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 14%, transparent), transparent 36%), var(--bg-secondary)',
          padding: 'clamp(24px, 4vw, 36px)',
          display: 'grid',
          gap: '14px',
        }}
      >
        <Skeleton width="120px" />
        <Skeleton width="320px" height="56px" />
        <Skeleton width="60%" />
      </section>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>

      <div
        style={{
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <Skeleton variant="card" height="160px" />
        <Skeleton variant="card" height="160px" />
        <Skeleton variant="card" height="160px" />
      </div>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.95fr)',
        }}
      >
        <Skeleton variant="card" height="320px" />
        <Skeleton variant="card" height="320px" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, accentColor }) {
  const StatIcon = icon;

  return (
    <article
      className="student-dashboard-card"
      style={{
        padding: '22px',
        borderRadius: '24px',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-secondary)',
        boxShadow: '0 16px 38px rgba(0, 0, 0, 0.1)',
        display: 'grid',
        gap: '18px',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
    >
      <div
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
          color: accentColor,
        }}
      >
        <StatIcon size={20} strokeWidth={2.1} />
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 2.6rem)',
            letterSpacing: '-0.05em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}
        >
          <AnimatedCounter target={value} />
        </div>

        <p
          style={{
            margin: '10px 0 0',
            color: 'var(--text-secondary)',
            fontSize: '0.92rem',
            fontWeight: 600,
          }}
        >
          {title}
        </p>
      </div>
    </article>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const nextDashboard = await dashboardService.getStudentDashboard();

        if (isMounted) {
          setDashboard(nextDashboard);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load your dashboard.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  const group = dashboard?.group ?? null;
  const members = group?.members ?? [];
  const leader = members.find((member) => member.id === group?.created_by) ?? null;
  const totalAssignments = dashboard?.totalAssignments ?? 0;
  const submittedCount = dashboard?.submittedCount ?? 0;
  const pendingCount = dashboard?.pendingCount ?? 0;
  const upcomingDeadlines = dashboard?.upcomingDeadlines ?? [];

  return (
    <>
      <style>{`
        @keyframes studentDashboardFade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .student-dashboard-page {
          animation: studentDashboardFade 420ms ease forwards;
        }

        .student-dashboard-card:hover,
        .student-deadline-row:hover,
        .student-dashboard-link:hover {
          transform: translateY(-3px);
          border-color: var(--border-hover);
          box-shadow: 0 24px 56px rgba(0, 0, 0, 0.16);
        }

        @media (max-width: 1023px) {
          .student-dashboard-panels {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 767px) {
          .student-dashboard-actions {
            width: 100%;
          }

          .student-dashboard-actions > button {
            width: 100%;
          }
        }
      `}</style>

      <div className="student-dashboard-page" style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 18%, transparent), transparent 36%), linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
            padding: 'clamp(24px, 4vw, 38px)',
            boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            Student Dashboard
          </p>

          <h1
            style={{
              marginTop: '12px',
              fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              color: 'var(--text-primary)',
            }}
          >
            Welcome back, {user?.full_name ?? 'Student'}
          </h1>

          <p
            style={{
              margin: '16px 0 0',
              maxWidth: '58ch',
              lineHeight: 1.8,
              color: 'var(--text-secondary)',
            }}
          >
            Keep your group organized, watch deadline pressure build in real time, and
            stay ahead of every submission your team is expected to confirm.
          </p>
        </section>

        {!dashboard ? (
          <section
            style={{
              padding: '26px',
              borderRadius: '24px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            Dashboard data is unavailable right now. Please refresh and try again.
          </section>
        ) : null}

        {dashboard && !group ? (
          <section
            className="student-dashboard-card"
            style={{
              padding: 'clamp(24px, 4vw, 34px)',
              borderRadius: '28px',
              border: '1px solid var(--border-default)',
              background:
                'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-warning) 12%, transparent), transparent 42%), var(--bg-secondary)',
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.12)',
              display: 'grid',
              gap: '20px',
              transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-warning)',
                background:
                  'color-mix(in srgb, var(--accent-warning) 14%, transparent)',
              }}
            >
              <Users size={24} strokeWidth={2.1} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                  letterSpacing: '-0.04em',
                  color: 'var(--text-primary)',
                }}
              >
                Create or join a group to get started
              </h2>
              <p
                style={{
                  margin: '12px 0 0',
                  maxWidth: '54ch',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                }}
              >
                Your dashboard comes to life once you are part of a group. Join your
                teammates to unlock assignment stats, upcoming deadlines, and submission
                tracking.
              </p>
            </div>

            <div className="student-dashboard-actions" style={{ display: 'flex' }}>
              <button
                type="button"
                onClick={() => navigate('/student/group/create')}
                className="student-dashboard-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  boxShadow: '0 18px 40px rgba(79, 123, 247, 0.24)',
                }}
              >
                Create a Group
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        ) : null}

        {dashboard && group ? (
          <>
            <section
              className="student-dashboard-panels"
              style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
              }}
            >
              <article
                className="student-dashboard-card"
                style={{
                  padding: '26px',
                  borderRadius: '28px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-secondary)',
                  boxShadow: '0 16px 38px rgba(0, 0, 0, 0.1)',
                  display: 'grid',
                  gap: '22px',
                  transition:
                    'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      Your Group
                    </p>
                    <h2
                      style={{
                        marginTop: '10px',
                        fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                        letterSpacing: '-0.04em',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {group.name}
                    </h2>
                    <p
                      style={{
                        margin: '10px 0 0',
                        lineHeight: 1.75,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {leader
                        ? `${leader.full_name} is leading a ${members.length}-member team.`
                        : `${members.length} members are currently in this group.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/student/group')}
                    className="student-dashboard-link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-default)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition:
                        'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                    }}
                  >
                    Manage
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '999px',
                      background:
                        'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                    }}
                  >
                    <Users size={16} />
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>

                  {leader ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '999px',
                        background:
                          'color-mix(in srgb, var(--accent-secondary) 12%, transparent)',
                        color: 'var(--accent-secondary)',
                        fontWeight: 700,
                      }}
                    >
                      Leader: {leader.full_name}
                    </span>
                  ) : null}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {members.slice(0, 5).map((member, index) => (
                    <div
                      key={member.id}
                      title={member.full_name}
                      style={{
                        width: '44px',
                        height: '44px',
                        marginLeft: index === 0 ? 0 : '-6px',
                        borderRadius: '999px',
                        border: '2px solid var(--bg-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          'linear-gradient(135deg, rgba(79, 123, 247, 0.2), rgba(52, 211, 153, 0.16))',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.95rem',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {getInitials(member.full_name)}
                    </div>
                  ))}

                  {members.length > 5 ? (
                    <span
                      style={{
                        marginLeft: '8px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    >
                      +{members.length - 5} more
                    </span>
                  ) : null}
                </div>
              </article>

              <article
                className="student-dashboard-card"
                style={{
                  padding: '26px',
                  borderRadius: '28px',
                  border: '1px solid var(--border-default)',
                  background:
                    'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-secondary) 14%, transparent), transparent 40%), var(--bg-secondary)',
                  boxShadow: '0 16px 38px rgba(0, 0, 0, 0.1)',
                  display: 'grid',
                  gap: '18px',
                  transition:
                    'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent-secondary)',
                    }}
                  >
                    Overall Progress
                  </p>
                  <h2
                    style={{
                      marginTop: '10px',
                      fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                      letterSpacing: '-0.04em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {submittedCount} of {totalAssignments} assignments submitted
                  </h2>
                </div>

                <ProgressBar
                  current={submittedCount}
                  total={totalAssignments}
                  showLabel
                  size="lg"
                />

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.7,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {pendingCount === 0
                    ? 'Your group is fully caught up right now.'
                    : `${pendingCount} assignment${pendingCount === 1 ? '' : 's'} still need group confirmation.`}
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/student/progress')}
                  className="student-dashboard-link"
                  style={{
                    justifySelf: 'start',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition:
                      'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                  }}
                >
                  View Progress
                  <ArrowRight size={16} />
                </button>
              </article>
            </section>

            <section
              style={{
                display: 'grid',
                gap: '18px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <StatCard
                title="Total Assignments"
                value={totalAssignments}
                icon={FileText}
                accentColor="var(--accent-primary)"
              />
              <StatCard
                title="Submitted"
                value={submittedCount}
                icon={CheckCircle}
                accentColor="var(--accent-secondary)"
              />
              <StatCard
                title="Pending"
                value={pendingCount}
                icon={Clock3}
                accentColor="var(--accent-warning)"
              />
            </section>

            <section
              className="student-dashboard-card"
              style={{
                padding: '26px',
                borderRadius: '28px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                boxShadow: '0 16px 38px rgba(0, 0, 0, 0.1)',
                display: 'grid',
                gap: '20px',
                transition:
                  'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Upcoming Deadlines
                </p>
                <h2
                  style={{
                    marginTop: '8px',
                    fontSize: 'clamp(1.7rem, 4vw, 2.2rem)',
                    letterSpacing: '-0.04em',
                    color: 'var(--text-primary)',
                  }}
                >
                  The next five moments that matter
                </h2>
              </div>

              {upcomingDeadlines.length === 0 ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: '1px dashed var(--border-default)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  No pending deadlines right now. Your group is either fully submitted or
                  waiting on new assignments to be published.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {upcomingDeadlines.map((assignment) => (
                    <button
                      key={assignment.id}
                      type="button"
                      onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                      className="student-deadline-row"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '18px 20px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-default)',
                        background: 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '14px',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition:
                          'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                      }}
                    >
                      <div style={{ display: 'grid', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {assignment.title}
                        </span>
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.88rem',
                          }}
                        >
                          Due {formatAssignmentDate(assignment.due_date)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <StatusBadge status={assignment.status} />
                        <ArrowRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
