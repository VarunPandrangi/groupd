import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDots,
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
import groupService from '../../services/groupService';
import submissionService from '../../services/submissionService';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const PAGE_SIZE = 10;

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
    <div className="surface-grid">
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
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
      setRows([]);
      return;
    }

    let isMounted = true;

    async function loadTrackerRows() {
      setIsTableLoading(true);

      try {
        const selectedAssignment = assignments.find(
          (assignment) => assignment.id === selectedAssignmentId
        );

        if (!selectedAssignment) {
          setRows([]);
          return;
        }

        const [submissions, groups] = await Promise.all([
          submissionService.getSubmissionsByAssignment(selectedAssignmentId),
          groupService.getAllGroupsForAdmin(),
        ]);

        if (!isMounted) {
          return;
        }

        const assignedGroupIds = new Set(
          (selectedAssignment.groups ?? []).map((group) => group.id)
        );

        const expectedGroups = [...groups]
          .filter((group) =>
            selectedAssignment.assign_to === 'all'
              ? true
              : assignedGroupIds.has(group.id)
          )
          .sort((left, right) => left.name.localeCompare(right.name));

        const submissionsByGroupId = new Map(
          submissions.map((submission) => [submission.group_id, submission])
        );

        const expectedRows = expectedGroups.map((group) => {
          const submission = submissionsByGroupId.get(group.id);

          return {
            rowKey: group.id,
            groupId: group.id,
            groupName: submission?.group_name ?? group.name,
            groupDeleted: Boolean(submission?.group_deleted),
            submittedBy: submission?.submitted_by_name ?? '',
            submittedAt: submission?.confirmed_at ?? '',
            status: submission ? 'confirmed' : 'pending',
          };
        });

        const liveGroupIds = new Set(expectedGroups.map((group) => group.id));
        const deletedRows = submissions
          .filter(
            (submission) =>
              submission.group_deleted || !liveGroupIds.has(submission.group_id)
          )
          .map((submission) => ({
            rowKey: submission.id,
            groupId: submission.group_id ?? null,
            groupName: submission.group_name ?? 'Unknown Group',
            groupDeleted: true,
            submittedBy: submission.submitted_by_name ?? '',
            submittedAt: submission.confirmed_at ?? '',
            status: 'confirmed',
          }));

        const nextRows = [...expectedRows, ...deletedRows].sort((left, right) => {
          const nameSort = left.groupName.localeCompare(right.groupName, undefined, {
            sensitivity: 'base',
          });

          if (nameSort !== 0) {
            return nameSort;
          }

          const deletedSort = Number(left.groupDeleted) - Number(right.groupDeleted);
          if (deletedSort !== 0) {
            return deletedSort;
          }

          return left.rowKey.localeCompare(right.rowKey);
        });

        setRows(nextRows);
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

    setCurrentPage(1);
    loadTrackerRows();

    return () => {
      isMounted = false;
    };
  }, [assignments, selectedAssignmentId]);

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
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = rows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const confirmedCount = rows.filter((row) => row.status === 'confirmed').length;

  return (
    <Page>
      <PageHeader
        eyebrow="Submission Tracker"
        eyebrowAccent
        title="Verify every group against every assignment"
        description="Choose an assignment to see the exact groups expected to submit, who confirmed on their behalf, and who is still pending."
      />

      <Card>
        <div className="surface-grid surface-grid--two">
          <div className="field">
            <label htmlFor="submission-assignment-select" className="field__label">
              Assignment
            </label>
            <select
              id="submission-assignment-select"
              className="select"
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
            <Card className="card--compact" style={{ background: 'var(--bg-page)' }}>
              <div className="surface-grid">
                <div className="cluster muted" style={{ fontSize: '14px' }}>
                  <CalendarDots size={16} />
                  <span>Due {formatAssignmentDate(selectedAssignment.due_date)}</span>
                </div>
                <div className="cluster muted" style={{ fontSize: '14px' }}>
                  <UsersThree size={16} />
                  <span>
                    {rows.length} {rows.length === 1 ? 'group' : 'groups'} in tracker
                  </span>
                </div>
                <div className="cluster muted" style={{ fontSize: '14px' }}>
                  <ClipboardText size={16} />
                  <span>
                    {confirmedCount}/{rows.length} confirmed
                  </span>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </Card>

      <Card className="table-card">
        <SectionHeading
          eyebrow="Expected Group Status"
          title="Submission confirmations by group"
        />

        {isTableLoading ? (
          <div className="surface-grid" style={{ marginTop: 20 }}>
            <Skeleton variant="text" height="44px" />
            <Skeleton variant="card" height="72px" />
            <Skeleton variant="card" height="72px" />
            <Skeleton variant="card" height="72px" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="card--compact" style={{ marginTop: 20 }}>
            <p className="card__copy" style={{ margin: 0 }}>
              No groups are expected for this assignment yet.
            </p>
          </Card>
        ) : (
          <>
            <div className="table-wrap" style={{ marginTop: 20 }}>
              <table className="table" style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Submitted By</th>
                    <th>Submitted At</th>
                    <th className="table__column--center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={row.rowKey}>
                      <td>
                        <div className="group-name-cell">
                          <span
                            className={`table__title ${
                              row.groupDeleted ? 'group-name-cell__name--deleted' : ''
                            }`}
                          >
                            {row.groupName}
                          </span>
                          {row.groupDeleted ? (
                            <span
                              className="status-badge group-name-cell__tag"
                              style={{
                                background: 'var(--accent-amber-soft)',
                                color: 'var(--accent-amber)',
                              }}
                            >
                              Deleted
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{row.submittedBy || 'Not submitted'}</td>
                      <td className="mono">
                        {row.submittedAt ? formatTimestamp(row.submittedAt) : 'Not submitted'}
                      </td>
                      <td className="table__cell--center">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="toolbar" style={{ marginTop: 20 }}>
              <p className="toolbar__meta">
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
