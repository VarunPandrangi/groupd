import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, CalendarDays, Layers3 } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/student/ProgressBar';
import CompletionBadge from '../../components/student/CompletionBadge';
import { useAuthStore } from '../../stores/authStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function formatTimestamp(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default function GroupProgress() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const groupProgress = useSubmissionStore((state) => state.groupProgress);
  const isLoading = useSubmissionStore((state) => state.isLoading);
  const fetchGroupProgress = useSubmissionStore((state) => state.fetchGroupProgress);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user?.group_id) {
      setIsReady(true);
      return;
    }

    let isMounted = true;

    async function loadProgress() {
      try {
        await fetchGroupProgress();
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load group progress.'));
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [fetchGroupProgress, user?.group_id]);

  if (!user?.group_id) {
    return (
      <EmptyState
        icon={Layers3}
        title="No group yet"
        message="Join a student group to start tracking your team's progress across all assignments."
        actionLabel="Go to My Group"
        onAction={() => navigate('/student/group')}
      />
    );
  }

  if (!isReady || isLoading) {
    return <LoadingSpinner />;
  }

  const assignments = Array.isArray(groupProgress)
    ? groupProgress
    : groupProgress?.progress ?? [];

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(
    (assignment) => assignment.is_submitted
  ).length;

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.is_submitted !== b.is_submitted) {
      return Number(a.is_submitted) - Number(b.is_submitted);
    }

    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return (
    <>
      <style>{`
        @keyframes progressCardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .progress-card {
          animation: progressCardIn 400ms ease both;
        }
        .progress-card:hover {
          transform: translateY(-3px);
          border-color: var(--border-hover);
          box-shadow: 0 20px 44px rgba(0, 0, 0, 0.18);
        }
      `}</style>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Header Section */}
        <section
          style={{
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-secondary) 14%, transparent), transparent 34%), var(--bg-secondary)',
            padding: 'clamp(24px, 4vw, 36px)',
            boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
            display: 'grid',
            gap: '24px',
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
              Group Progress
            </p>
            <h1
              style={{
                marginTop: '10px',
                fontSize: 'clamp(2.3rem, 5vw, 3.2rem)',
                letterSpacing: '-0.05em',
                color: 'var(--text-primary)',
              }}
            >
              Track your team's journey
            </h1>
            <p
              style={{
                margin: '14px 0 0',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                maxWidth: '58ch',
              }}
            >
              Monitor how your group is progressing across every assignment. Stay aligned
              and never miss a deadline.
            </p>
          </div>

          {/* Overall progress card */}
          <div
            style={{
              padding: '24px',
              borderRadius: '24px',
              border: '1px solid var(--border-default)',
              background: 'color-mix(in srgb, var(--bg-primary) 20%, transparent)',
              display: 'grid',
              gap: '14px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <BarChart3 size={20} style={{ color: 'var(--accent-secondary)' }} />
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Overall Completion
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {completedAssignments} of {totalAssignments} assignments completed
              </span>
            </div>
            <ProgressBar
              current={completedAssignments}
              total={totalAssignments}
              showLabel={false}
              size="lg"
            />
          </div>
        </section>

        {/* Assignment progress cards grid */}
        {sortedAssignments.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No assignments to track"
            message="Once your instructor assigns work to your group, progress tracking will appear here."
          />
        ) : (
          <section
            style={{
              display: 'grid',
              gap: '18px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            }}
          >
            {sortedAssignments.map((assignment, index) => {
              const submitted = assignment.is_submitted ? 1 : 0;
              const status = assignment.is_submitted ? 'complete' : 'pending';

              return (
                <div
                  key={assignment.assignment_id ?? assignment.id ?? index}
                  className="progress-card"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    padding: '24px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-secondary)',
                    boxShadow: '0 14px 32px rgba(0, 0, 0, 0.08)',
                    display: 'grid',
                    gap: '16px',
                    cursor: 'default',
                    transition:
                      'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  }}
                >
                  {/* Title + status */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.35rem',
                        letterSpacing: '-0.03em',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {assignment.title}
                    </h3>
                    <StatusBadge status={assignment.status} />
                  </div>

                  {/* Due date */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <CalendarDays size={16} />
                    {formatAssignmentDate(assignment.due_date)}
                  </div>

                  {/* Progress bar */}
                  <ProgressBar
                    current={submitted}
                    total={1}
                    showLabel
                    size="md"
                  />

                  {assignment.is_submitted && assignment.confirmed_at ? (
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                      }}
                    >
                      Confirmed by {assignment.submitted_by_name || 'a group member'} on{' '}
                      {formatTimestamp(assignment.confirmed_at)}
                    </p>
                  ) : (
                    <p
                      style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                      }}
                    >
                      Pending group confirmation.
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <CompletionBadge status={status} />
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </>
  );
}
