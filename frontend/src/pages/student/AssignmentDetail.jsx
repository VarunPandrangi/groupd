import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  FileText,
} from '@phosphor-icons/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormattedText from '../../components/common/FormattedText';
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

function getStatusTone(status, hasSubmitted) {
  if (hasSubmitted) {
    return { label: 'Submitted', tone: 'submitted' };
  }

  const normalizedStatus = String(status || 'pending').trim().toLowerCase();

  if (normalizedStatus === 'overdue') {
    return { label: 'Overdue', tone: 'overdue' };
  }

  if (normalizedStatus === 'active') {
    return { label: 'Active', tone: 'active' };
  }

  if (normalizedStatus === 'upcoming') {
    return { label: 'Upcoming', tone: 'upcoming' };
  }

  return { label: 'Pending', tone: 'pending' };
}

export default function AssignmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const currentAssignment = useAssignmentStore((state) => state.currentAssignment);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const fetchAssignment = useAssignmentStore((state) => state.fetchAssignment);
  const mySubmissions = useSubmissionStore((state) => state.mySubmissions);
  const requestSubmissionConfirmation = useSubmissionStore(
    (state) => state.requestSubmissionConfirmation
  );
  const confirmSubmission = useSubmissionStore((state) => state.confirmSubmission);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const isSubmitting = useSubmissionStore((state) => state.isLoading);

  const [isReady, setIsReady] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState('');

  const mySubmission = mySubmissions.find((submission) => submission.assignment_id === id);
  const hasSubmitted = Boolean(mySubmission);
  const statusMeta = getStatusTone(currentAssignment?.status, hasSubmitted);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        await Promise.all([fetchAssignment(id), fetchMySubmissions()]);
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

  async function handlePrepareSubmission() {
    if (!user?.group_id || isSubmitting) {
      return;
    }

    try {
      const confirmation = await requestSubmissionConfirmation(id);
      setConfirmationToken(confirmation.confirmation_token);
      setShowConfirmDialog(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to prepare confirmation. Please try again.'));
    }
  }

  async function handleConfirmSubmission() {
    setShowConfirmDialog(false);

    if (!confirmationToken) {
      toast.error('Confirmation session expired. Please try again.');
      return;
    }

    try {
      await confirmSubmission(id, confirmationToken);
      toast.success('Submission confirmed successfully!');
      await fetchAssignment(id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to confirm submission.'));
    } finally {
      setConfirmationToken('');
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
      <div className="stitch-assignment-detail__content" aria-label="Assignment submission workspace">
        <div className="stitch-assignment-detail__back-wrap">
          <button
            type="button"
            className="stitch-assignment-detail__back"
            onClick={() => navigate('/student/assignments')}
          >
            <ArrowLeft size={14} weight="bold" />
            Back to Assignments
          </button>
        </div>

        <section className="stitch-assignment-detail__hero" aria-label="Assignment header">
          <div className="stitch-assignment-detail__hero-copy">
            <div className="stitch-assignment-detail__meta-row">
              <span
                className={`stitch-assignment-detail__status stitch-assignment-detail__status--${statusMeta.tone}`}
              >
                {statusMeta.label}
              </span>

              <span className="stitch-assignment-detail__due">
                <CalendarBlank size={13} />
                Due: {formatAssignmentDate(currentAssignment.due_date) || 'No due date'}
              </span>

              <span className="stitch-assignment-detail__delta">
                {formatRelativeDueDate(currentAssignment.due_date)}
              </span>
            </div>

            <h1 className="stitch-assignment-detail__title">{currentAssignment.title}</h1>
          </div>

          <button
            type="button"
            className="stitch-assignment-detail__link-btn"
            disabled={!currentAssignment.onedrive_link}
            onClick={() =>
              window.open(currentAssignment.onedrive_link, '_blank', 'noopener,noreferrer')
            }
          >
            <ArrowSquareOut size={14} weight="bold" />
            Open Submission Link
          </button>
        </section>

        <div className="stitch-assignment-detail__grid">
          <section className="stitch-assignment-detail__brief" aria-labelledby="assignment-brief-title">
            <h2 id="assignment-brief-title" className="stitch-assignment-detail__panel-title">
              Assignment Brief
            </h2>
            <p className="stitch-assignment-detail__panel-kicker">What your group needs to deliver</p>

            <FormattedText
              as="div"
              className="stitch-assignment-detail__brief-copy formatted-text"
              text={currentAssignment.description}
              fallback="No description provided for this assignment."
            />
          </section>

          <section className="stitch-assignment-detail__submission" aria-labelledby="assignment-submit-title">
            <div className="stitch-assignment-detail__submission-corner" aria-hidden="true">
              <FileText size={18} weight="fill" />
            </div>

            <h2 id="assignment-submit-title" className="stitch-assignment-detail__submission-title">
              Group Submission
            </h2>
            <p className="stitch-assignment-detail__submission-kicker">
              {hasSubmitted ? 'Submission confirmed for your group' : 'Submit for your group'}
            </p>

            <div className="stitch-assignment-detail__submission-callout">
              {hasSubmitted ? (
                <p>
                  Confirmed by {mySubmission?.submitted_by_name || 'a group member'} on{' '}
                  {formatTimestamp(mySubmission?.confirmed_at)}.
                </p>
              ) : (
                <p>
                  Please use the &quot;Open Submission Link&quot; button above to complete your assignment externally, then return here to mark it as submitted.
                </p>
              )}
            </div>

            <div className="stitch-assignment-detail__submission-actions">
              {hasSubmitted ? (
                <span className="stitch-assignment-detail__confirmed-pill">
                  <CheckCircle size={14} weight="fill" />
                  Submission Confirmed
                </span>
              ) : (
                <button
                  type="button"
                  className="stitch-assignment-detail__submit-btn"
                  disabled={isSubmitting || !user?.group_id}
                  onClick={handlePrepareSubmission}
                >
                  <CheckCircle size={13} weight="bold" />
                  {isSubmitting ? 'Preparing...' : 'Mark as Submitted'}
                </button>
              )}
            </div>

            {!user?.group_id && !hasSubmitted ? (
              <p className="stitch-assignment-detail__error">
                You must join a group before you can confirm submissions.
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirm submission"
        message="Have you uploaded your work using the assignment link? This action cannot be undone."
        confirmText="Yes, I have submitted"
        cancelText="Cancel"
        onConfirm={handleConfirmSubmission}
        onCancel={() => {
          setShowConfirmDialog(false);
          setConfirmationToken('');
        }}
      />
    </>
  );
}
