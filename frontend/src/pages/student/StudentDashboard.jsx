import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDots } from '@phosphor-icons/react';
import StitchNoGroupDashboard from '../../components/student/StitchNoGroupDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import dashboardService from '../../services/dashboardService';
import { useAuthStore } from '../../stores/authStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  // Preserve compact single-token identifiers like "S11" instead of truncating
  // them into ambiguous one-letter tags like "S".
  if (parts.length === 1) {
    const token = parts[0].toUpperCase();
    return token.length <= 4 ? token : token.slice(0, 2);
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getMemberTag(member) {
  if (member?.student_id) {
    return String(member.student_id).trim().toUpperCase();
  }

  return getInitials(member?.full_name);
}

function getProgressPercent(submittedCount, totalAssignments) {
  if (!totalAssignments) {
    return 0;
  }

  return Math.round((submittedCount / totalAssignments) * 100);
}

function formatDateStamp(dateInput) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return { month: 'TBD', day: '--' };
  }

  return {
    month: date
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function getPriorityMeta(status) {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'overdue') {
    return {
      module: 'High Priority',
      badge: 'High Priority',
      tone: 'overdue',
    };
  }

  if (normalizedStatus === 'active') {
    return {
      module: 'In Flight',
      badge: 'In Progress',
      tone: 'active',
    };
  }

  return {
    module: 'Planned',
    badge: 'Upcoming',
    tone: 'upcoming',
  };
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

  const group = dashboard?.group ?? null;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (dashboard && !group) {
    return (
      <StitchNoGroupDashboard
        onCreateGroup={() => navigate('/student/group/create')}
        onFindTeammates={() => navigate('/student/group')}
      />
    );
  }

  const members = group?.members ?? [];
  const leader = members.find((member) => member.id === group?.created_by) ?? null;
  const totalAssignments = dashboard?.totalAssignments ?? 0;
  const submittedCount = dashboard?.submittedCount ?? 0;
  const pendingCount = dashboard?.pendingCount ?? 0;
  const upcomingDeadlines = dashboard?.upcomingDeadlines ?? [];
  const completionPercent = getProgressPercent(submittedCount, totalAssignments);

  return (
    <section className="workspace-cool" aria-label="Student workspace dashboard">
      {!dashboard ? (
        <div className="workspace-cool__panel workspace-cool__panel--empty">
          Dashboard data is unavailable right now. Please refresh and try again.
        </div>
      ) : null}

      {dashboard && group ? (
        <>
          <header className="workspace-cool__hero">
            <p className="workspace-cool__eyebrow">Student Workspace</p>
            <h1 className="workspace-cool__title">
              Welcome Back, <span>{(user?.full_name || 'Student').toUpperCase()}</span>
            </h1>
            <p className="workspace-cool__subtitle">
              System active. Group modules loaded. Pending tasks require attention.
            </p>
          </header>

          <section className="workspace-cool__cards">
            <article className="workspace-cool__card workspace-cool__card--unit">
              <header className="workspace-cool__card-top workspace-cool__card-top--dark">
                <h2>Active Unit</h2>
                <span aria-hidden="true">▴</span>
              </header>

              <div className="workspace-cool__card-body">
                <p className="workspace-cool__label">Team Designation</p>
                <h3 className="workspace-cool__unit-name">{group.name}</h3>

                <div className="workspace-cool__split">
                  <div>
                    <p className="workspace-cool__label">Members</p>
                    <p className="workspace-cool__strong workspace-cool__strong--danger">{members.length}</p>
                  </div>
                  <div>
                    <p className="workspace-cool__label">Status</p>
                    <p className="workspace-cool__status-ok">■ Active</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="workspace-cool__card workspace-cool__card--progress">
              <header className="workspace-cool__card-top">
                <h2>Global Progression</h2>
                <span className="workspace-cool__percent-pill">{completionPercent}%</span>
              </header>

              <div className="workspace-cool__card-body">
                <div className="workspace-cool__bar-meta">
                  <span>Completion Rate</span>
                  <span>Target: 100%</span>
                </div>

                <div
                  className="workspace-cool__bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={completionPercent}
                >
                  <span
                    className="workspace-cool__bar-fill"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <div className="workspace-cool__stats-row">
                  <div>
                    <strong>{totalAssignments}</strong>
                    <span>Total</span>
                  </div>
                  <div>
                    <strong className="workspace-cool__strong--ok">{submittedCount}</strong>
                    <span>Done</span>
                  </div>
                  <div>
                    <strong className="workspace-cool__strong--danger">{pendingCount}</strong>
                    <span>Pending</span>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="workspace-cool__deadlines">
            <header className="workspace-cool__deadlines-head">
              <h2>
                <span aria-hidden="true">▲</span>
                Critical Path: Upcoming Deadlines
              </h2>
            </header>

            {upcomingDeadlines.length === 0 ? (
              <div className="workspace-cool__deadline-empty">
                No pending deadlines right now. Your team is currently caught up.
              </div>
            ) : (
              <div className="workspace-cool__deadline-list">
                {upcomingDeadlines.map((assignment) => {
                  const stamp = formatDateStamp(assignment.due_date);
                  const meta = getPriorityMeta(assignment.status);

                  return (
                    <button
                      key={assignment.id}
                      type="button"
                      className="workspace-cool__deadline-row"
                      onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                    >
                      <div className={`workspace-cool__stamp workspace-cool__stamp--${meta.tone}`}>
                        <small>{stamp.month}</small>
                        <strong>{stamp.day}</strong>
                      </div>

                      <div className="workspace-cool__deadline-main">
                        <small>{meta.module}</small>
                        <h3>{assignment.title}</h3>
                        <p>
                          <CalendarDots size={12} />
                          <span>Due {formatAssignmentDate(assignment.due_date)}</span>
                        </p>
                      </div>

                      <div className="workspace-cool__deadline-side">
                        <span className={`workspace-cool__badge workspace-cool__badge--${meta.tone}`}>
                          {meta.badge}
                        </span>
                        <span className="workspace-cool__go" aria-hidden="true">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="workspace-cool__floating" aria-label="Group metadata">
            <p>Lead: {leader?.full_name || 'Unknown'}</p>
            <p>Member tags: {members.map((member) => getMemberTag(member)).join(' · ')}</p>
          </aside>
        </>
      ) : null}
    </section>
  );
}
