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
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormattedText from '../../components/common/FormattedText';
import { Page } from '../../components/common/Page';
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
    <Page>
      <Button type="button" variant="secondary" onClick={() => navigate('/student/assignments')}>
        <ArrowLeft size={16} />
        Back to Assignments
      </Button>

      <Card>
        <div className="flex items-start justify-between gap-4 page-header">
          <div className="w-full max-w-4xl page-header__body">
            <p className="text-xs font-medium uppercase tracking-wide eyebrow eyebrow--accent">Assignment Detail</p>
            <h1 className="text-3xl font-bold tracking-tight page-title">{currentAssignment.title}</h1>
            <div className="flex items-center gap-3 cluster" style={{ marginTop: 14 }}>
              <StatusBadge status={currentAssignment.status} />
              <span className="text-sm inline-flex items-center gap-2 rounded-full font-medium pill mono">
                <CalendarBlank size={14} />
                {formatAssignmentDate(currentAssignment.due_date)}
              </span>
              <span className="text-sm toolbar__meta">
                {formatRelativeDueDate(currentAssignment.due_date)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              window.open(currentAssignment.onedrive_link, '_blank', 'noopener,noreferrer')
            }
          >
            Open Submission Link
            <ArrowSquareOut size={16} />
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--two">
        <Card>
          <div className="grid gap-2 section-heading">
            <p className="text-xs font-medium uppercase tracking-wide eyebrow">Assignment Brief</p>
            <h2 className="text-2xl font-bold tracking-tight section-heading__title">What your group needs to deliver</h2>
          </div>
          <FormattedText
            as="div"
            className="text-base leading-relaxed text-sm page-description formatted-text"
            text={currentAssignment.description}
            fallback="No description provided for this assignment."
          />
        </Card>

        <Card
          variant="accent"
          accent={hasSubmitted ? 'var(--accent-green)' : 'var(--accent-blue)'}
        >
          <div className="grid gap-4 surface-grid">
            <div className="flex items-center gap-3 cluster">
              <div
                className="inline-flex items-center justify-center rounded-xl metric__icon"
                style={{
                  background: hasSubmitted
                    ? 'var(--accent-green-soft)'
                    : 'var(--accent-blue-soft)',
                  color: hasSubmitted ? 'var(--accent-green)' : 'var(--accent-blue)',
                }}
              >
                {hasSubmitted ? <CheckCircle size={20} weight="fill" /> : <FileText size={20} />}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide eyebrow">{hasSubmitted ? 'Submission Confirmed' : 'Group Submission'}</p>
                <h2 className="text-2xl font-bold tracking-tight section-heading__title" style={{ marginTop: 8 }}>
                  {hasSubmitted ? 'Submitted successfully' : 'Submit for your group'}
                </h2>
              </div>
            </div>

            {hasSubmitted ? (
              <p className="text-base leading-relaxed page-description">
                Confirmed by {mySubmission?.submitted_by_name || 'a group member'} on{' '}
                {formatTimestamp(mySubmission?.confirmed_at)}.
              </p>
            ) : (
              <>
                <p className="text-base leading-relaxed page-description">
                  Ready to confirm your submission? Make sure the work has been uploaded using the assignment link before you continue.
                </p>
                <div className="flex items-center gap-3 cluster">
                  <Button
                    type="button"
                    disabled={isSubmitting || !user?.group_id}
                    onClick={handlePrepareSubmission}
                  >
                    {isSubmitting ? 'Preparing...' : 'Mark as Submitted'}
                  </Button>
                </div>
                {!user?.group_id ? (
                  <span className="text-xs field__error">
                    You must join a group before you can confirm submissions.
                  </span>
                ) : null}
              </>
            )}
          </div>
        </Card>
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
    </Page>
  );
}
