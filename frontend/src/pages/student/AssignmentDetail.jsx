import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarBlank, ArrowSquareOut, CheckCircle, Clock, FileText, Check } from '@phosphor-icons/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useAuthStore } from '../../stores/authStore';
import { formatAssignmentDate, formatRelativeDueDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function formatTimestamp(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default function AssignmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const currentAssignment = useAssignmentStore((state) => state.currentAssignment);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const fetchAssignment = useAssignmentStore((state) => state.fetchAssignment);

  const mySubmissions = useSubmissionStore((state) => state.mySubmissions);
  const confirmSubmission = useSubmissionStore((state) => state.confirmSubmission);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const isSubmitting = useSubmissionStore((state) => state.isLoading);

  const [isReady, setIsReady] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);

  // Check if current user already submitted
  const mySubmission = mySubmissions.find(
    (sub) => sub.assignment_id === id
  );
  const hasSubmitted = Boolean(mySubmission);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        await Promise.all([
          fetchAssignment(id),
          fetchMySubmissions(),
        ]);
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

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchAssignment, fetchMySubmissions, id, navigate]);

  // Derive group member submission status from assignment data
  useEffect(() => {
    if (!currentAssignment) return;

    // The assignment detail endpoint may include submissions/member status
    // We'll try to get this info from the assignment data or separate endpoint
    const members = currentAssignment.group_members || currentAssignment.members || [];
    const submissions = currentAssignment.submissions || [];

    if (members.length > 0) {
      const memberStatuses = members.map((member) => {
        const memberSubmission = submissions.find(
          (sub) => sub.student_id === member.id
        );
        return {
          ...member,
          hasSubmitted: Boolean(memberSubmission),
          confirmed_at: memberSubmission?.confirmed_at || null,
        };
      });
      setGroupMembers(memberStatuses);
    }
  }, [currentAssignment]);

  async function handleConfirmSubmission() {
    setShowConfirmDialog(false);
    try {
      await confirmSubmission(id);
      toast.success('Submission confirmed successfully!');
      // Reload assignment to refresh group status
      await fetchAssignment(id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to confirm submission.'));
    }
  }

  if (!isReady || isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentAssignment || currentAssignment.id !== id) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes submittedPulse {
          0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.3); }
          70% { box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
          100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 50px rgba(79, 123, 247, 0.32) !important;
        }
        .submit-btn:active {
          transform: translateY(0);
        }
        .member-row:hover {
          background: color-mix(in srgb, var(--accent-primary) 6%, transparent);
        }
      `}</style>

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
                <CalendarBlank size={16} />
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

              <ArrowSquareOut size={22} />
            </button>
          </div>

          {/* Assignment Brief */}
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

            {/* Submission Section */}
            <div
              style={{
                padding: '24px',
                borderRadius: '22px',
                border: hasSubmitted
                  ? '1px solid color-mix(in srgb, var(--accent-secondary) 34%, transparent)'
                  : '1px dashed color-mix(in srgb, var(--accent-primary) 34%, transparent)',
                background: hasSubmitted
                  ? 'color-mix(in srgb, var(--accent-secondary) 8%, transparent)'
                  : 'color-mix(in srgb, var(--accent-primary) 6%, transparent)',
                display: 'grid',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: hasSubmitted ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {hasSubmitted ? <CheckCircle size={20} weight="fill" /> : <FileText size={20} />}
                {hasSubmitted ? 'Group Submission Confirmed' : 'Group Submission'}
              </div>

              {hasSubmitted ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {mySubmission?.confirmed_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
                      <Check size={20} weight="bold" />
                      <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.88rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Confirmed by {mySubmission.submitted_by_name || 'a group member'} at {formatTimestamp(mySubmission.confirmed_at)}
                    </span>
                  </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                    }}
                  >
                    Ready to confirm your submission? Make sure you have uploaded your work to
                    OneDrive before proceeding.
                  </p>
                  <button
                    type="button"
                    className="submit-btn"
                    disabled={isSubmitting || !user?.group_id}
                    onClick={() => setShowConfirmDialog(true)}
                    style={{
                      justifySelf: 'flex-start',
                      padding: '16px 32px',
                      borderRadius: '18px',
                      border: 'none',
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-body)',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      cursor: isSubmitting || !user?.group_id ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting || !user?.group_id ? 0.6 : 1,
                      boxShadow: '0 18px 44px rgba(79, 123, 247, 0.26)',
                      transition: 'transform 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
                    }}
                  >
                    {isSubmitting ? 'Confirming…' : 'Mark as Submitted'}
                  </button>
                  {!user?.group_id && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: 'var(--accent-danger)',
                      }}
                    >
                      You must join a group before you can confirm submissions.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>


        </section>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm Submission"
        message="Have you uploaded your work to OneDrive? This action cannot be undone."
        confirmText="Yes, I have submitted"
        cancelText="Cancel"
        onConfirm={handleConfirmSubmission}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </>
  );
}
