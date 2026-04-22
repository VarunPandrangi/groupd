import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UsersThree } from '@phosphor-icons/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

const STATUS_META = {
  overdue: {
    category: 'Design',
    label: 'Overdue',
    tone: 'overdue',
  },
  active: {
    category: 'Development',
    label: 'Active',
    tone: 'active',
  },
  upcoming: {
    category: 'Research',
    label: 'Upcoming',
    tone: 'upcoming',
  },
};

function getStatusMeta(status, isSubmitted) {
  if (isSubmitted) {
    return {
      category: 'Development',
      label: 'Completed',
      tone: 'completed',
    };
  }

  return (
    STATUS_META[String(status || '').toLowerCase()] || {
      category: 'Testing',
      label: 'Pending',
      tone: 'pending',
    }
  );
}

function getCompletionPercent(completedAssignments, totalAssignments) {
  if (!totalAssignments) {
    return 0;
  }

  return Math.round((completedAssignments / totalAssignments) * 100);
}

function getDaysLabel(days) {
  return `${days} day${days === 1 ? '' : 's'}`;
}

function getDueWindowLabel(assignments) {
  if (!assignments.length) {
    return 'No Tasks';
  }

  if (assignments.every((assignment) => assignment.is_submitted)) {
    return 'All Completed';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextDue = [...assignments]
    .filter((assignment) => !assignment.is_submitted)
    .map((assignment) => ({
      ...assignment,
      dueDateObject: new Date(assignment.due_date),
    }))
    .filter((assignment) => !Number.isNaN(assignment.dueDateObject.getTime()))
    .sort((left, right) => left.dueDateObject.getTime() - right.dueDateObject.getTime())[0];

  if (!nextDue) {
    return 'No Due Date';
  }

  const days = Math.ceil(
    (nextDue.dueDateObject.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return `Overdue by ${getDaysLabel(Math.abs(days))}`;
  }

  if (days === 0) {
    return 'Due Today';
  }

  return `Due in ${getDaysLabel(days)}`;
}

function getAssigneeName(assignment) {
  if (!assignment.submitted_by_name) {
    return 'Not Submitted';
  }

  return assignment.submitted_by_name;
}

function getInitials(name) {
  if (!name || name === 'Not Submitted') {
    return 'NS';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function GroupProgress() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const groupProgress = useSubmissionStore((state) => state.groupProgress);
  const isLoading = useSubmissionStore((state) => state.isLoading);
  const fetchGroupProgress = useSubmissionStore((state) => state.fetchGroupProgress);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        await fetchGroupProgress();
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load progress.'));
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

  if (!isReady || isLoading) {
    return <LoadingSpinner />;
  }

  const assignments = Array.isArray(groupProgress)
    ? groupProgress
    : groupProgress?.progress ?? [];

  if (!user?.group_id && assignments.length === 0) {
    return (
      <section className="progress-empty" aria-labelledby="progress-empty-title">
        <div className="progress-empty__panel">
          <span className="progress-empty__corner progress-empty__corner--tl" aria-hidden="true" />
          <span className="progress-empty__corner progress-empty__corner--tr" aria-hidden="true" />
          <span className="progress-empty__corner progress-empty__corner--bl" aria-hidden="true" />
          <span className="progress-empty__corner progress-empty__corner--br" aria-hidden="true" />

          <div className="progress-empty__icon" aria-hidden="true">
            <UsersThree size={54} weight="duotone" />
          </div>

          <h1 id="progress-empty-title" className="progress-empty__title">
            No Progress Data Yet
          </h1>

          <p className="progress-empty__message">
            Join a group to track group assignments here. Individual assignments will appear
            automatically once they are assigned to your enrolled courses.
          </p>

          <button
            type="button"
            className="progress-empty__action"
            onClick={() => navigate('/student/group')}
          >
            <UsersThree size={16} weight="fill" />
            <span>Find a Group</span>
          </button>
        </div>
      </section>
    );
  }

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(
    (assignment) => assignment.is_submitted
  ).length;
  const completionPercent = getCompletionPercent(completedAssignments, totalAssignments);

  const sortedAssignments = [...assignments].sort((left, right) => {
    if (left.is_submitted !== right.is_submitted) {
      return Number(left.is_submitted) - Number(right.is_submitted);
    }

    return new Date(left.due_date).getTime() - new Date(right.due_date).getTime();
  });

  const dueWindowLabel = getDueWindowLabel(sortedAssignments);

  function handleExportData() {
    const payload = {
      generated_at: new Date().toISOString(),
      summary: {
        total_assignments: totalAssignments,
        completed_assignments: completedAssignments,
        completion_percent: completionPercent,
      },
      assignments: sortedAssignments,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'progress-tracker.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="progress-tracker" aria-label="Progress tracker">
      <header className="progress-tracker__header">
        <div>
          <div className="progress-tracker__chips">
            <span className="progress-tracker__chip">Active Project</span>
            <span className="progress-tracker__chip progress-tracker__chip--alert">
              {dueWindowLabel}
            </span>
          </div>
          <h1 className="progress-tracker__title">Progress Tracker</h1>
          <p className="progress-tracker__subtitle">
            Assignment tracking across your individual and group work.
          </p>
        </div>

        <button
          type="button"
          className="progress-tracker__export"
          onClick={handleExportData}
        >
          Export Data
        </button>
      </header>

      <section className="progress-tracker__block" aria-label="Overall completion">
        <div className="progress-tracker__block-head">
          <h2 className="progress-tracker__block-title">Overall Completion</h2>
          <strong className="progress-tracker__percent">{completionPercent}%</strong>
        </div>

        <div
          className="progress-tracker__overall-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completionPercent}
        >
          <div
            className="progress-tracker__overall-fill"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </section>

      <section className="progress-tracker__block" aria-label="Task ledger">
        <div className="progress-tracker__ledger-head">
          <h2 className="progress-tracker__ledger-title">Task Ledger</h2>
          <span className="progress-tracker__ledger-tools" aria-hidden="true">
            ≡  ↕
          </span>
        </div>

        {sortedAssignments.length === 0 ? (
          <div className="progress-tracker__empty">
            <p>No assignments are currently available to track.</p>
          </div>
        ) : (
          <div className="progress-tracker__grid">
            {sortedAssignments.map((assignment) => {
              const key = assignment.assignment_id ?? assignment.id;
              const progressPercent = assignment.is_submitted ? 100 : 0;
              const assigneeName = getAssigneeName(assignment);
              const assigneeInitials = getInitials(assigneeName);
              const meta = getStatusMeta(assignment.status, assignment.is_submitted);

              return (
                <article
                  key={key}
                  className={`progress-tracker__task ${meta.tone === 'overdue' ? 'progress-tracker__task--alert' : ''}`}
                >
                  <header className="progress-tracker__task-head">
                    <span className="progress-tracker__task-type">{meta.category}</span>
                    <span className="progress-tracker__task-icon" aria-hidden="true">
                      {meta.tone === 'completed' ? '●' : meta.tone === 'overdue' ? '▲' : '◔'}
                    </span>
                  </header>

                  <h3 className="progress-tracker__task-title">{assignment.title}</h3>

                  <div className="progress-tracker__task-progress-head">
                    <span>Progress</span>
                    <strong>{progressPercent}%</strong>
                  </div>

                  <div className="progress-tracker__task-bar" aria-hidden="true">
                    <div
                      className="progress-tracker__task-fill"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="progress-tracker__task-date">{formatAssignmentDate(assignment.due_date)}</p>

                  <footer className="progress-tracker__task-foot">
                    <div className="progress-tracker__assignee">
                      <span className="progress-tracker__avatar">{assigneeInitials}</span>
                      <span>{assigneeName}</span>
                    </div>

                    <span
                      className={`progress-tracker__pill progress-tracker__pill--${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
