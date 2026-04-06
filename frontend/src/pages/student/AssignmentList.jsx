import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, FileText, Layers3 } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuthStore } from '../../stores/authStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { formatAssignmentDate, sortAssignmentsByDueDate } from '../../utils/assignmentDates';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
];

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function AssignmentList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const assignments = useAssignmentStore((state) => state.assignments);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!user?.group_id) {
      return;
    }

    let isMounted = true;

    async function loadAssignments() {
      try {
        await fetchAssignments();
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load assignments right now.'));
        }
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, [fetchAssignments, user?.group_id]);

  const sortedAssignments = useMemo(
    () => sortAssignmentsByDueDate(assignments),
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    if (activeFilter === 'all') {
      return sortedAssignments;
    }

    return sortedAssignments.filter((assignment) => assignment.status === activeFilter);
  }, [activeFilter, sortedAssignments]);

  if (!user?.group_id) {
    return (
      <EmptyState
        icon={Layers3}
        title="Join a group to see assignments"
        message="Assignments unlock once you are part of a student group, so you can track only the work that belongs to your team."
        actionLabel="Go to My Group"
        onAction={() => navigate('/student/group')}
      />
    );
  }

  return (
    <>
      <style>{`
        .assignment-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-hover);
          box-shadow: 0 22px 44px rgba(0, 0, 0, 0.18);
        }
      `}</style>

      <div style={{ display: 'grid', gap: '24px' }}>
      <section
        style={{
          borderRadius: '30px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 34%), var(--bg-secondary)',
          padding: 'clamp(24px, 4vw, 36px)',
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '680px' }}>
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
              Assignment Board
            </p>
            <h1
              style={{
                marginTop: '10px',
                fontSize: 'clamp(2.3rem, 5vw, 3.2rem)',
                letterSpacing: '-0.05em',
                color: 'var(--text-primary)',
              }}
            >
              Keep every deadline in sharp focus
            </h1>
            <p
              style={{
                margin: '14px 0 0',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                maxWidth: '58ch',
              }}
            >
              Browse the assignments for your group, filter by urgency, and jump into
              the full brief whenever you are ready to submit.
            </p>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '18px',
              background: 'color-mix(in srgb, var(--bg-primary) 20%, transparent)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            <FileText size={18} />
            {sortedAssignments.length} assignment{sortedAssignments.length === 1 ? '' : 's'}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '999px',
                  border: isActive
                    ? '1px solid color-mix(in srgb, var(--accent-primary) 32%, transparent)'
                    : '1px solid var(--border-default)',
                  background: isActive
                    ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                    : 'var(--bg-secondary)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div
            style={{
              minHeight: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LoadingSpinner fullPage={false} size={38} />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignments here yet"
            message={
              activeFilter === 'all'
                ? 'Once your instructor assigns work to your group, it will show up here with due dates and status badges.'
                : `There are no ${activeFilter} assignments for your group right now.`
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '18px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            {filteredAssignments.map((assignment) => (
              <button
                key={assignment.id}
                type="button"
                onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                className="assignment-card"
                style={{
                  textAlign: 'left',
                  display: 'grid',
                  gap: '18px',
                  padding: '22px',
                  borderRadius: '24px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  boxShadow: '0 16px 30px rgba(0, 0, 0, 0.08)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.55rem',
                      letterSpacing: '-0.04em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {assignment.title}
                  </h2>
                  <StatusBadge status={assignment.status} />
                </div>

                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                    minHeight: '3.6em',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                  }}
                >
                  {assignment.description || 'No description provided for this assignment.'}
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    paddingTop: '14px',
                    borderTop:
                      '1px solid color-mix(in srgb, var(--border-default) 70%, transparent)',
                  }}
                >
                  <CalendarDays size={18} />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatAssignmentDate(assignment.due_date)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      </div>
    </>
  );
}
