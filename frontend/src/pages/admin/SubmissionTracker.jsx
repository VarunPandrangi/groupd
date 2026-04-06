import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDots,
  CaretDown,
  CaretRight,
  ClipboardText,
  FolderSimple,
  UsersThree,
} from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { Page, PageHeader, SectionHeading } from '../../components/common/Page';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import { formatAssignmentDate } from '../../utils/assignmentDates';
import { cx } from '../../utils/cx';

const PAGE_SIZE = 10;
const EMPTY_TRACKER = {
  assignment: null,
  summary: {
    submitted_groups: 0,
    total_groups: 0,
    pending_groups: 0,
  },
  groups: [],
};

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function formatTimestamp(dateString) {
  if (!dateString) {
    return '';
  }

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

function SubmissionTrackerSkeleton() {
  return (
    <div className="grid gap-4 surface-grid">
      <Skeleton variant="text" width="140px" />
      <Skeleton variant="text" width="320px" height="36px" />
      <Skeleton variant="card" height="160px" />
      <Skeleton variant="card" height="340px" />
    </div>
  );
}

export default function SubmissionTracker() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [tracker, setTracker] = useState(EMPTY_TRACKER);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      setIsAssignmentsLoading(true);

      try {
        const nextAssignments = await assignmentService.getAllAssignmentsForAdmin();

        if (!isMounted) {
          return;
        }

        setAssignments(nextAssignments);
        setSelectedAssignmentId(nextAssignments[0]?.id ?? '');
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load assignments.'));
        }
      } finally {
        if (isMounted) {
          setIsAssignmentsLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedAssignmentId) {
      setTracker(EMPTY_TRACKER);
      setExpandedRows(new Set());
      return;
    }

    let isMounted = true;

    async function loadTrackerRows() {
      setIsTableLoading(true);

      try {
        const trackerResponse =
          await submissionService.getAssignmentGroupStudentStatus(
            selectedAssignmentId
          );

        if (!isMounted) {
          return;
        }

        const normalizedGroups = Array.isArray(trackerResponse.groups)
          ? trackerResponse.groups.map((group, index) => ({
              ...group,
              row_id:
                group.row_id ??
                (group.group_id ? `group:${group.group_id}` : `row:${index}`),
              members: Array.isArray(group.members) ? group.members : [],
            }))
          : [];

        const summary = trackerResponse.summary ?? EMPTY_TRACKER.summary;

        setTracker({
          assignment: trackerResponse.assignment ?? null,
          summary: {
            submitted_groups: Number(summary.submitted_groups) || 0,
            total_groups: Number(summary.total_groups) || 0,
            pending_groups: Number(summary.pending_groups) || 0,
          },
          groups: normalizedGroups,
        });
        setExpandedRows(new Set());
        setCurrentPage(1);
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load submission data.'));
        }
      } finally {
        if (isMounted) {
          setIsTableLoading(false);
        }
      }
    }

    loadTrackerRows();

    return () => {
      isMounted = false;
    };
  }, [selectedAssignmentId]);

  if (isAssignmentsLoading) {
    return <SubmissionTrackerSkeleton />;
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={FolderSimple}
        title="No assignments yet"
        message="Create your first assignment to start tracking which groups have confirmed submission."
      />
    );
  }

  const selectedAssignment =
    assignments.find((assignment) => assignment.id === selectedAssignmentId) ?? null;
  const rows = tracker.groups;
  const summary = tracker.summary;

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function toggleRowExpansion(rowId) {
    setExpandedRows((previousRows) => {
      const nextRows = new Set(previousRows);

      if (nextRows.has(rowId)) {
        nextRows.delete(rowId);
      } else {
        nextRows.add(rowId);
      }

      return nextRows;
    });
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Submission Tracker"
        eyebrowAccent
        title="Verify every group against every assignment"
        description="Choose an assignment to see the exact groups expected to submit, who confirmed on their behalf, and who is still pending."
      />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--two">
          <div className="grid gap-2 field">
            <label htmlFor="submission-assignment-select" className="text-sm font-medium field__label">
              Assignment
            </label>
            <select
              id="submission-assignment-select"
              className="w-full rounded-md select"
              value={selectedAssignmentId}
              onChange={(event) => setSelectedAssignmentId(event.target.value)}
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
          </div>

          {selectedAssignment ? (
            <Card className="rounded-xl border p-4 card--compact" style={{ background: 'var(--bg-page)' }}>
              <div className="grid gap-4 surface-grid">
                <div className="flex items-center gap-3 text-sm cluster muted" style={{ fontSize: '14px' }}>
                  <CalendarDots size={16} />
                  <span>Due {formatAssignmentDate(selectedAssignment.due_date)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm cluster muted" style={{ fontSize: '14px' }}>
                  <UsersThree size={16} />
                  <span>
                    {rows.length} {rows.length === 1 ? 'group' : 'groups'} in tracker
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm cluster muted" style={{ fontSize: '14px' }}>
                  <ClipboardText size={16} />
                  <span>{summary.submitted_groups} of {summary.total_groups} groups submitted</span>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </Card>

      <Card className="rounded-xl border overflow-hidden w-full table-card">
        <SectionHeading
          eyebrow="Expected Group Status"
          title="Submission confirmations by group"
        />

        {isTableLoading ? (
          <div className="grid gap-4 surface-grid" style={{ marginTop: 20 }}>
            <Skeleton variant="text" height="44px" />
            <Skeleton variant="card" height="72px" />
            <Skeleton variant="card" height="72px" />
            <Skeleton variant="card" height="72px" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="rounded-xl border p-4 card--compact" style={{ marginTop: 20 }}>
            <p className="text-sm leading-relaxed card__copy" style={{ margin: 0 }}>
              No groups are expected for this assignment yet.
            </p>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto w-full table-wrap" style={{ marginTop: 20 }}>
              <table className="w-full table tracker-table">
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Member Count</th>
                    <th className="justify-center table__column--center">Status</th>
                    <th>Submitted By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => {
                    const isExpanded = expandedRows.has(row.row_id);
                    const memberCount =
                      Number(row.member_count) ||
                      (Array.isArray(row.members) ? row.members.length : 0);

                    return (
                      <Fragment key={row.row_id}>
                        <tr
                          className={cx('tracker-row', isExpanded && 'tracker-row--expanded')}
                          onClick={() => toggleRowExpansion(row.row_id)}
                        >
                          <td>
                            <div className="inline-flex items-center gap-2 tracker-group-cell">
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md tracker-toggle"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleRowExpansion(row.row_id);
                                }}
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? 'Collapse group row' : 'Expand group row'}
                              >
                                {isExpanded ? (
                                  <CaretDown size={14} weight="bold" />
                                ) : (
                                  <CaretRight size={14} weight="bold" />
                                )}
                              </button>

                              <div className="inline-flex items-center gap-2 tracker-group-meta">
                                <span
                                  className={cx(
                                    'tracker-group-name',
                                    row.group_deleted && 'tracker-group-name--deleted'
                                  )}
                                >
                                  {row.group_name}
                                </span>

                                {row.group_deleted ? (
                                  <span className="inline-flex items-center justify-center rounded-md text-xs font-medium status-badge tracker-deleted-badge">
                                    Deleted
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="font-semibold tracker-member-count">{memberCount}</td>

                          <td className="justify-center table__cell--center">
                            <StatusBadge
                              status={row.is_submitted ? 'submitted' : 'pending'}
                            />
                          </td>

                          <td>
                            {row.is_submitted
                              ? row.submitted_by_name ?? row.submitted_by_email ?? 'Unknown student'
                              : 'Not submitted'}
                          </td>

                          <td className="text-sm mono tracker-timestamp">
                            {row.confirmed_at
                              ? formatTimestamp(row.confirmed_at)
                              : 'Not submitted'}
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="transition duration-200 tracker-expanded-row">
                            <td colSpan={5} className="w-full tracker-expanded-cell">
                              <div className="overflow-x-auto tracker-expanded-content">
                                {row.group_deleted ? (
                                  <p className="text-sm leading-relaxed tracker-note">
                                    {row.group_note ??
                                      'Group no longer exists - members were released.'}
                                  </p>
                                ) : Array.isArray(row.members) && row.members.length > 0 ? (
                                  <div className="overflow-x-auto w-full rounded-lg border tracker-members-wrap">
                                    <div className="w-full rounded-lg border tracker-members">
                                      <div className="grid gap-4 tracker-members__head">
                                        <span>Full Name</span>
                                        <span>Email</span>
                                        <span>Student ID</span>
                                      </div>
                                      <div>
                                        {row.members.map((member) => (
                                          <div
                                            key={member.id}
                                            className="grid gap-4 tracker-members__row"
                                          >
                                            <span className="text-sm font-medium tracker-members__name">
                                              {member.full_name}
                                            </span>
                                            <span className="text-sm tracker-members__email">
                                              {member.email}
                                            </span>
                                            <span className="text-sm tracker-members__student-id">
                                              {member.student_id}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm leading-relaxed tracker-note">No active student members in this group.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 toolbar" style={{ marginTop: 20 }}>
              <p className="text-sm toolbar__meta">
                Page {currentPage} of {totalPages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </Card>
    </Page>
  );
}
