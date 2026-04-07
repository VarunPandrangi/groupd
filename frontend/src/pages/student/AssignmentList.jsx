import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarDots,
  CheckCircle,
  FileText,
  UsersThree,
} from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import FormattedText from '../../components/common/FormattedText';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Page, PageHeader } from '../../components/common/Page';
import { useAuthStore } from '../../stores/authStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { formatAssignmentDate, sortAssignmentsByDueDate } from '../../utils/assignmentDates';
import { cx } from '../../utils/cx';

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
  const mySubmissions = useSubmissionStore((state) => state.mySubmissions);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const [activeFilter, setActiveFilter] = useState('all');
  const hasGroup = Boolean(user?.group_id);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const requests = [fetchAssignments()];

        if (user?.group_id) {
          requests.push(fetchMySubmissions());
        }

        await Promise.all(requests);
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
  }, [fetchAssignments, fetchMySubmissions, user?.group_id]);

  const submittedAssignmentIds = useMemo(
    () => new Set(mySubmissions.map((submission) => submission.assignment_id)),
    [mySubmissions]
  );

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

  return (
    <Page>
      <PageHeader
        eyebrow="Assignments"
        eyebrowAccent
        title="Keep every deadline in sharp focus"
        description={
          hasGroup
            ? 'Browse assignments for your group, filter by urgency, and jump into the full brief whenever you are ready to submit.'
            : 'Browse all assignments posted to everyone. Join a group to unlock group-specific assignments and submission confirmation.'
        }
        actions={<span className="inline-flex items-center gap-2 rounded-full text-sm font-medium pill">{sortedAssignments.length} assignments</span>}
      />

      {!hasGroup ? (
        <Card>
          <div className="flex items-center justify-between gap-4 toolbar">
            <p className="text-sm leading-relaxed toolbar__meta">
              You can view assignments posted to all students now. Create or join a group to access group-targeted work and submit confirmations.
            </p>
            <Button type="button" variant="secondary" onClick={() => navigate('/student/group')}>
              <UsersThree size={16} />
              Go to My Group
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="flex gap-2 filter-pills">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            type="button"
            className={cx(
              'rounded-full text-sm font-medium transition duration-200 filter-pill',
              activeFilter === filter.key && 'filter-pill--active'
            )}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No assignments here yet"
          message={
            activeFilter === 'all'
              ? hasGroup
                ? 'Once your instructor assigns work to your group, it will show up here with due dates and status badges.'
                : 'No assignments posted to all students are available yet. Join a group to unlock group-specific assignments.'
              : hasGroup
                ? `There are no ${activeFilter} assignments for your group right now.`
                : `There are no ${activeFilter} assignments posted to all students right now.`
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 surface-grid surface-grid--three">
          {filteredAssignments.map((assignment) => (
            <Card
              key={assignment.id}
              as="button"
              interactive
              className="grid gap-4 surface-grid"
              style={{ textAlign: 'left', cursor: 'pointer' }}
              onClick={() => navigate(`/student/assignments/${assignment.id}`)}
            >
              <div className="flex items-start justify-between gap-3 card__header">
                <div>
                  <div className="flex items-center gap-3 cluster" style={{ gap: 8 }}>
                    <h2 className="text-lg font-semibold tracking-tight card__title">{assignment.title}</h2>
                    {submittedAssignmentIds.has(assignment.id) ? (
                      <CheckCircle size={18} color="var(--accent-green)" weight="fill" />
                    ) : null}
                  </div>
                  <FormattedText
                    as="div"
                    className="text-sm leading-relaxed card__copy formatted-text"
                    text={assignment.description}
                    fallback="No description provided for this assignment."
                  />
                </div>
                <StatusBadge status={assignment.status} />
              </div>

              <div className="flex items-center gap-3 text-sm cluster mono muted" style={{ fontSize: '13px' }}>
                <CalendarDots size={16} />
                <span>Due {formatAssignmentDate(assignment.due_date)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
