import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, ExternalLink, FileClock } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { formatAssignmentDate, formatRelativeDueDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function AssignmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentAssignment = useAssignmentStore((state) => state.currentAssignment);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const fetchAssignment = useAssignmentStore((state) => state.fetchAssignment);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      try {
        await fetchAssignment(id);
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load this assignment.'));
          navigate('/student/assignments', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadAssignment();

    return () => {
      isMounted = false;
    };
  }, [fetchAssignment, id, navigate]);

  if (!isReady || isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentAssignment || currentAssignment.id !== id) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <button
        type="button"
        onClick={() => navigate('/student/assignments')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          justifySelf: 'flex-start',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.92rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={18} />
        Back to Assignments
      </button>

      <section
        style={{
          borderRadius: '32px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 34%), var(--bg-secondary)',
          padding: 'clamp(24px, 4vw, 38px)',
          boxShadow: '0 24px 58px rgba(0, 0, 0, 0.14)',
          display: 'grid',
          gap: '28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '18px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '760px' }}>
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
              Assignment Detail
            </p>
            <h1
              style={{
                marginTop: '12px',
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                lineHeight: 0.94,
                letterSpacing: '-0.06em',
                color: 'var(--text-primary)',
              }}
            >
              {currentAssignment.title}
            </h1>
          </div>

          <StatusBadge status={currentAssignment.status} />
        </div>

        <div
          style={{
            display: 'grid',
            gap: '18px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          <div
            style={{
              padding: '20px',
              borderRadius: '24px',
              border: '1px solid var(--border-default)',
              background: 'color-mix(in srgb, var(--bg-primary) 12%, transparent)',
              display: 'grid',
              gap: '10px',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              <CalendarDays size={16} />
              Due Date
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              {formatAssignmentDate(currentAssignment.due_date)}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
              {formatRelativeDueDate(currentAssignment.due_date)}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              window.open(currentAssignment.onedrive_link, '_blank', 'noopener,noreferrer')
            }
            style={{
              padding: '20px 22px',
              borderRadius: '24px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              boxShadow: '0 18px 40px rgba(79, 123, 247, 0.22)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  opacity: 0.86,
                }}
              >
                OneDrive
              </div>
              <div style={{ marginTop: '8px', fontSize: '1rem', fontWeight: 700 }}>
                Open Submission Link
              </div>
            </div>

            <ExternalLink size={22} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '16px',
            padding: '24px',
            borderRadius: '28px',
            border: '1px solid var(--border-default)',
            background: 'color-mix(in srgb, var(--bg-primary) 12%, transparent)',
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
              Assignment Brief
            </p>
            <p
              style={{
                margin: '12px 0 0',
                fontSize: '1rem',
                lineHeight: 1.9,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {currentAssignment.description || 'No description provided for this assignment.'}
            </p>
          </div>

          <div
            style={{
              padding: '20px',
              borderRadius: '22px',
              border: '1px dashed color-mix(in srgb, var(--accent-warning) 34%, transparent)',
              background: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
              display: 'grid',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--accent-warning)',
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <FileClock size={16} />
              Submission Section
            </div>
            <p
              style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: '1rem',
                lineHeight: 1.75,
              }}
            >
              Submission controls coming next sprint.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
