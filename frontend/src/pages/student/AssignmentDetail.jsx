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
  const confirmSubmission = useSubmissionStore((state) => state.confirmSubmission);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const isSubmitting = useSubmissionStore((state) => state.isLoading);

  const [isReady, setIsReady] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  async function handleConfirmSubmission() {
    setShowConfirmDialog(false);

    try {
      await confirmSubmission(id);
      toast.success('Submission confirmed successfully!');
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
    <Page>
      <Button type="button" variant="secondary" onClick={() => navigate('/student/assignments')}>
        <ArrowLeft size={16} />
        Back to Assignments
      </Button>

      <Card>
        <div className="page-header">
          <div className="page-header__body">
            <p className="eyebrow eyebrow--accent">Assignment Detail</p>
            <h1 className="page-title">{currentAssignment.title}</h1>
            <div className="cluster" style={{ marginTop: 14 }}>
              <StatusBadge status={currentAssignment.status} />
              <span className="pill mono">
                <CalendarBlank size={14} />
                {formatAssignmentDate(currentAssignment.due_date)}
              </span>
              <span className="toolbar__meta">
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

      <div className="surface-grid surface-grid--two">
        <Card>
          <div className="section-heading">
            <p className="eyebrow">Assignment Brief</p>
            <h2 className="section-heading__title">What your group needs to deliver</h2>
          </div>
          <p className="page-description" style={{ whiteSpace: 'pre-wrap' }}>
            {currentAssignment.description || 'No description provided for this assignment.'}
          </p>
        </Card>

        <Card
          variant="accent"
          accent={hasSubmitted ? 'var(--accent-green)' : 'var(--accent-blue)'}
        >
          <div className="surface-grid">
            <div className="cluster">
              <div
                className="metric__icon"
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
                <p className="eyebrow">{hasSubmitted ? 'Submission Confirmed' : 'Group Submission'}</p>
                <h2 className="section-heading__title" style={{ marginTop: 8 }}>
                  {hasSubmitted ? 'Submitted successfully' : 'Submit for your group'}
                </h2>
              </div>
            </div>

            {hasSubmitted ? (
              <p className="page-description">
                Confirmed by {mySubmission?.submitted_by_name || 'a group member'} on{' '}
                {formatTimestamp(mySubmission?.confirmed_at)}.
              </p>
            ) : (
              <>
                <p className="page-description">
                  Ready to confirm your submission? Make sure the work has been uploaded to OneDrive before you continue.
                </p>
                <div className="cluster">
                  <Button
                    type="button"
                    disabled={isSubmitting || !user?.group_id}
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    {isSubmitting ? 'Confirming...' : 'Mark as Submitted'}
                  </Button>
                </div>
                {!user?.group_id ? (
                  <span className="field__error">
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
        message="Have you uploaded your work to OneDrive? This action cannot be undone."
        confirmText="Yes, I have submitted"
        cancelText="Cancel"
        onConfirm={handleConfirmSubmission}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </Page>
  );
}
