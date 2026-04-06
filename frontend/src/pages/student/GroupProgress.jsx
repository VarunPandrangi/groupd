import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDots, ChartBar, UsersThree } from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/student/ProgressBar';
import CompletionBadge from '../../components/student/CompletionBadge';
import Card from '../../components/common/Card';
import { Page, PageHeader } from '../../components/common/Page';
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
        icon={UsersThree}
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

  const sortedAssignments = [...assignments].sort((left, right) => {
    if (left.is_submitted !== right.is_submitted) {
      return Number(left.is_submitted) - Number(right.is_submitted);
    }

    return new Date(left.due_date).getTime() - new Date(right.due_date).getTime();
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Group Progress"
        eyebrowAccent
        title="Track your team's journey"
        description="Monitor how your group is progressing across every assignment and keep a clear sense of what has been confirmed."
      />

      <Card>
        <div className="grid gap-4 surface-grid">
          <div className="flex items-center gap-3 cluster">
            <div className="inline-flex items-center justify-center rounded-xl metric__icon">
              <ChartBar size={20} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide eyebrow">Overall Completion</p>
              <h2 className="text-2xl font-bold tracking-tight section-heading__title" style={{ marginTop: 8 }}>
                {completedAssignments} of {totalAssignments} assignments completed
              </h2>
            </div>
          </div>
          <ProgressBar
            current={completedAssignments}
            total={Math.max(totalAssignments, 1)}
            size="lg"
            tone="success"
          />
        </div>
      </Card>

      {sortedAssignments.length === 0 ? (
        <EmptyState
          icon={ChartBar}
          title="No assignments to track"
          message="Once your instructor assigns work to your group, progress tracking will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 surface-grid surface-grid--three">
          {sortedAssignments.map((assignment) => {
            const submitted = assignment.is_submitted ? 1 : 0;
            const status = assignment.is_submitted ? 'complete' : 'pending';

            return (
              <Card key={assignment.assignment_id ?? assignment.id} interactive className="grid gap-4 surface-grid">
                <div className="flex items-start justify-between gap-3 card__header">
                  <h2 className="text-lg font-semibold tracking-tight card__title">{assignment.title}</h2>
                  <StatusBadge status={assignment.status} />
                </div>

                <div className="flex items-center gap-3 text-sm cluster mono muted" style={{ fontSize: '13px' }}>
                  <CalendarDots size={16} />
                  <span>{formatAssignmentDate(assignment.due_date)}</span>
                </div>

                <ProgressBar current={submitted} total={1} showLabel tone="success" />

                {assignment.is_submitted && assignment.confirmed_at ? (
                  <p className="text-sm leading-relaxed card__copy">
                    Confirmed by {assignment.submitted_by_name || 'a group member'} on{' '}
                    {formatTimestamp(assignment.confirmed_at)}.
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed card__copy">Pending group confirmation.</p>
                )}

                <div>
                  <CompletionBadge status={status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Page>
  );
}
