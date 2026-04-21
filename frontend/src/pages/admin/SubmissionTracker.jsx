import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  FolderSimple,
} from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import { Page } from '../../components/common/Page';
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
  const submittedRatio =
    summary.total_groups > 0 ? Math.min(100, Math.round((summary.submitted_groups / summary.total_groups) * 100)) : 0;
  const assignmentStatus = String(selectedAssignment?.status || '')
    .trim()
    .toUpperCase() || 'ACTIVE';

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
    <Page className="submission-tracker-architectural">
      <header className="submission-tracker-architectural__header">
        <h1 className="submission-tracker-architectural__title">Submission Tracker</h1>
        <p className="submission-tracker-architectural__subtitle">
          Verify every group against every assignment.
        </p>
      </header>

      <section className="submission-tracker-architectural__config-grid">
        <article className="submission-tracker-architectural__config-card">
          <span className="submission-tracker-architectural__config-chip">Config</span>
          <label
            htmlFor="submission-assignment-select"
            className="submission-tracker-architectural__label"
          >
            Target Assignment
          </label>
          <div className="submission-tracker-architectural__select-wrap">
            <select
              id="submission-assignment-select"
              className="submission-tracker-architectural__select"
              value={selectedAssignmentId}
              onChange={(event) => setSelectedAssignmentId(event.target.value)}
            >
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </option>
              ))}
            </select>
            <span className="submission-tracker-architectural__caret" aria-hidden="true">
              <CaretDown size={16} weight="bold" />
            </span>
          </div>
        </article>

        <article className="submission-tracker-architectural__snapshot-card">
          <p className="submission-tracker-architectural__snapshot-label">Snapshot</p>
          <div className="submission-tracker-architectural__snapshot-grid">
            <div>
              <span>Due Date</span>
              <strong className="submission-tracker-architectural__snapshot-red">
                {selectedAssignment?.due_date
                  ? formatAssignmentDate(selectedAssignment.due_date).toUpperCase()
                  : '--'}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{assignmentStatus}</strong>
            </div>
            <div>
              <span>Total Groups</span>
              <strong>{summary.total_groups}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{summary.submitted_groups}</strong>
            </div>
          </div>
          <div className="submission-tracker-architectural__progress" aria-hidden="true">
            <span style={{ width: `${submittedRatio}%` }} />
          </div>
        </article>
      </section>

      <section className="submission-tracker-architectural__ledger">
        <div className="submission-tracker-architectural__ledger-head">
          <h2>Group Verification Ledger</h2>
          <span>Live</span>
        </div>

        {isTableLoading ? (
          <div className="submission-tracker-architectural__loading">
            <Skeleton variant="text" height="44px" />
            <Skeleton variant="card" height="72px" />
            <Skeleton variant="card" height="72px" />
            <Skeleton variant="card" height="72px" />
          </div>
        ) : rows.length === 0 ? (
          <div className="submission-tracker-architectural__empty">
            No groups are expected for this assignment yet.
          </div>
        ) : (
          <>
            <div className="submission-tracker-architectural__table-wrap">
              <table className="submission-tracker-architectural__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Group Name</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Submitted By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, index) => {
                    const isExpanded = expandedRows.has(row.row_id);
                    const memberCount =
                      Number(row.member_count) ||
                      (Array.isArray(row.members) ? row.members.length : 0);
                    const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                    return (
                      <Fragment key={row.row_id}>
                        <tr
                          className={cx('submission-tracker-architectural__row', isExpanded && 'submission-tracker-architectural__row--expanded')}
                          onClick={() => toggleRowExpansion(row.row_id)}
                        >
                          <td className="submission-tracker-architectural__id">
                            {String(rowNumber).padStart(2, '0')}
                          </td>
                          <td>
                            <div className="submission-tracker-architectural__group">
                              <button
                                type="button"
                                className="submission-tracker-architectural__toggle"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleRowExpansion(row.row_id);
                                }}
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? 'Collapse group row' : 'Expand group row'}
                              >
                                <CaretRight size={13} weight="bold" />
                              </button>
                              <span>{row.group_name}</span>
                              {row.group_deleted ? (
                                <span className="submission-tracker-architectural__deleted">
                                  Deleted
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>{memberCount}</td>
                          <td>
                            <span
                              className={cx(
                                'submission-tracker-architectural__status',
                                row.is_submitted
                                  ? 'submission-tracker-architectural__status--submitted'
                                  : 'submission-tracker-architectural__status--pending'
                              )}
                            >
                              {row.is_submitted ? 'Submitted' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            {row.is_submitted
                              ? row.submitted_by_name ?? row.submitted_by_email ?? 'Unknown student'
                              : '--'}
                          </td>
                          <td className="mono">
                            {row.confirmed_at ? formatTimestamp(row.confirmed_at) : '--'}
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="submission-tracker-architectural__expanded">
                            <td colSpan={6}>
                              {row.group_deleted ? (
                                <p>
                                  {row.group_note ??
                                    'Group no longer exists - members were released.'}
                                </p>
                              ) : Array.isArray(row.members) && row.members.length > 0 ? (
                                <div className="submission-tracker-architectural__members">
                                  {row.members.map((member) => (
                                    <div key={member.id}>
                                      <span>{member.full_name}</span>
                                      <span>{member.email}</span>
                                      <span className="mono">{member.student_id}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p>No active student members in this group.</p>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="submission-tracker-architectural__footer">
              <p>
                Page {currentPage} of {totalPages}
              </p>
              {totalPages > 1 ? (
                <div className="submission-tracker-architectural__pager">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage <= 1}
                  >
                    <CaretLeft size={14} />
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <CaretRight size={14} />
                  </button>
                </div>
              ) : null}
            </footer>
          </>
        )}
      </section>
    </Page>
  );
}
