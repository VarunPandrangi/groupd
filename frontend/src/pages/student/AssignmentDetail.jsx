import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion as Motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  CheckCircle,
  FileText,
  Info,
} from '@phosphor-icons/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FormattedText from '../../components/common/FormattedText';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/student/ProgressBar';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
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
  const group = useGroupStore((state) => state.group);
  const fetchMyGroup = useGroupStore((state) => state.fetchMyGroup);
  const currentAssignment = useAssignmentStore((state) => state.currentAssignment);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const fetchAssignment = useAssignmentStore((state) => state.fetchAssignment);
  const requestSubmissionConfirmation = useSubmissionStore(
    (state) => state.requestSubmissionConfirmation
  );
  const confirmSubmission = useSubmissionStore((state) => state.confirmSubmission);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const isSubmitting = useSubmissionStore((state) => state.isLoading);

  const [isReady, setIsReady] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState('');

  const submissionStatus = currentAssignment?.submission_status ?? null;
  const hasSubmitted = Boolean(submissionStatus?.is_submitted);
  const statusMeta = getStatusTone(currentAssignment?.status, hasSubmitted);
  const submissionType = currentAssignment?.submission_type ?? 'group';
  const isGroupAssignment = submissionType === 'group';
  const isIndividualAssignment = submissionType === 'individual';

  const leader = useMemo(() => {
    if (!group || !Array.isArray(group.members)) {
      return null;
    }

    return group.members.find((member) => member.id === group.created_by) ?? null;
  }, [group]);

  const isLeader = Boolean(
    isGroupAssignment && user?.id && group?.created_by && user.id === group.created_by
  );

  const canSubmit = Boolean(
    !hasSubmitted &&
      ((isIndividualAssignment && user?.id) ||
        (isGroupAssignment && group?.id && isLeader))
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const assignment = await fetchAssignment(id);

        if (assignment?.submission_type === 'group') {
          await fetchMyGroup().catch(() => null);
        }

        await fetchMySubmissions().catch(() => []);
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
  }, [fetchAssignment, fetchMyGroup, fetchMySubmissions, id, navigate]);

  useEffect(() => {
    if (!isReady || !isGroupAssignment || !group || isLeader || hasSubmitted) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchAssignment(id).catch(() => null);
    }, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchAssignment, group, hasSubmitted, id, isGroupAssignment, isLeader, isReady]);

  async function handlePrepareSubmission() {
    if (!canSubmit || isSubmitting) {
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
      toast.success(
        isIndividualAssignment
          ? 'Individual submission confirmed.'
          : 'Submission confirmed successfully!'
      );
      await Promise.all([fetchAssignment(id), fetchMySubmissions().catch(() => [])]);
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
              <Motion.div
                key={statusMeta.tone}
                initial={{ opacity: 0.7, scale: 0.92 }}
                animate={{ opacity: 1, scale: [0.98, 1.06, 1] }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <StatusBadge status={statusMeta.tone} label={statusMeta.label} />
              </Motion.div>

              <StatusBadge
                status={isGroupAssignment ? 'group' : 'individual'}
                label={isGroupAssignment ? 'Group Assignment' : 'Individual Assignment'}
              />

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
            <p className="stitch-assignment-detail__panel-kicker">
              {isGroupAssignment ? 'What your group needs to deliver' : 'What you need to deliver'}
            </p>

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
              {isGroupAssignment ? 'Group Submission' : 'Individual Submission'}
            </h2>
            <p className="stitch-assignment-detail__submission-kicker">
              {hasSubmitted
                ? 'Submission confirmed'
                : isGroupAssignment
                  ? 'Submit for your group'
                  : 'Submit for yourself'}
            </p>

            {isGroupAssignment && group && !isLeader ? (
              <Card
                as="div"
                variant="compact"
                style={{
                  padding: '10px 12px',
                  borderStyle: 'dashed',
                  borderColor: 'var(--accent-amber)',
                  background: 'var(--accent-amber-soft)',
                }}
              >
                <p style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700 }}>
                  <Info size={14} weight="fill" />
                  Leader Confirmation Required
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Only {leader?.full_name || 'your group leader'} can confirm submission for this
                  assignment. Once confirmed, all group members will see it here.
                </p>
              </Card>
            ) : null}

            <ProgressBar current={hasSubmitted ? 1 : 0} total={1} tone={hasSubmitted ? 'success' : 'warning'} />

            <div className="stitch-assignment-detail__submission-callout">
              {hasSubmitted ? (
                <p>
                  {isGroupAssignment ? 'Confirmed by' : 'Submitted by'}{' '}
                  {submissionStatus?.submitted_by_name || 'you'} on{' '}
                  {formatTimestamp(submissionStatus?.confirmed_at)}.
                </p>
              ) : (
                <p>
                  Please use the "Open Submission Link" button above to complete your work externally,
                  then return here to confirm submission.
                </p>
              )}
            </div>

            {hasSubmitted ? (
              <Motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{
                  display: 'grid',
                  gap: '8px',
                  padding: '10px 12px',
                  border: '1px solid var(--accent-green)',
                  background: 'var(--accent-green-soft)',
                }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    <Motion.path
                      d="M5 13l4 4L19 7"
                      fill="none"
                      stroke="var(--accent-green)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />
                  </svg>
                  <strong style={{ color: 'var(--accent-green)' }}>Submitted on {formatTimestamp(submissionStatus?.confirmed_at)}</strong>
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {isGroupAssignment
                    ? 'This confirmation is now visible to your entire group.'
                    : 'Your submission has been recorded and cannot be changed.'}
                </p>
              </Motion.div>
            ) : null}

            <div className="stitch-assignment-detail__submission-actions">
              {isIndividualAssignment && hasSubmitted ? (
                <Button
                  type="button"
                  className="stitch-assignment-detail__submit-btn"
                  variant="primary"
                  disabled
                >
                  <CheckCircle size={13} weight="bold" />
                  Already Submitted
                </Button>
              ) : null}

              {canSubmit ? (
                <Button
                  type="button"
                  className="stitch-assignment-detail__submit-btn"
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={handlePrepareSubmission}
                >
                  <CheckCircle size={13} weight="bold" />
                  {isSubmitting
                    ? 'Preparing...'
                    : isIndividualAssignment
                      ? 'Submit for Yourself'
                      : 'Mark as Submitted'}
                </Button>
              ) : null}

              {isGroupAssignment && hasSubmitted ? (
                <span className="stitch-assignment-detail__confirmed-pill">
                  <CheckCircle size={14} weight="fill" />
                  Submission Confirmed
                </span>
              ) : null}
            </div>

            {isGroupAssignment && !group && !hasSubmitted ? (
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
        message={
          isIndividualAssignment
            ? 'Confirm your submission? This action cannot be undone.'
            : 'Have you uploaded your work using the assignment link? This action cannot be undone.'
        }
        confirmText={isIndividualAssignment ? 'Confirm Submission' : 'Yes, I have submitted'}
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
