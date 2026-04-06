import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, ClipboardCheck, FolderSearch, Users } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
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
    <div style={{ display: 'grid', gap: '24px' }}>
      <section
        style={{
          borderRadius: '30px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 14%, transparent), transparent 36%), var(--bg-secondary)',
          padding: 'clamp(24px, 4vw, 36px)',
          display: 'grid',
          gap: '14px',
        }}
      >
        <Skeleton width="130px" />
        <Skeleton width="320px" height="56px" />
        <Skeleton width="58%" />
      </section>

      <Skeleton variant="card" height="150px" />
      <Skeleton variant="card" height="360px" />
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

        const [submissions, groups] = await Promise.all([
          submissionService.getSubmissionsByAssignment(selectedAssignmentId),
          groupService.getAllGroupsForAdmin(),
        ]);

        if (!isMounted || !selectedAssignment) {
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

        const nextRows = expectedGroups.map((group) => {
          const submission = submissionsByGroupId.get(group.id);

          return {
            groupId: group.id,
            groupName: group.name,
            submittedBy: submission?.submitted_by_name ?? '',
            submittedAt: submission?.confirmed_at ?? '',
            status: submission ? 'confirmed' : 'pending',
          };
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
        icon={FolderSearch}
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
    <>
      <style>{`
        @keyframes submissionTrackerFade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .submission-tracker-page {
          animation: submissionTrackerFade 420ms ease forwards;
        }

        .submission-tracker-card:hover {
          transform: translateY(-3px);
          border-color: var(--border-hover);
          box-shadow: 0 24px 56px rgba(0, 0, 0, 0.16);
        }

        @media (max-width: 1023px) {
          .submission-tracker-controls {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>

      <div className="submission-tracker-page" style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 34%), linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
            padding: 'clamp(24px, 4vw, 38px)',
            boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            Submission Tracker
          </p>

          <h1
            style={{
              marginTop: '12px',
              fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              color: 'var(--text-primary)',
            }}
          >
            Verify every group against every assignment
          </h1>

          <p
            style={{
              margin: '16px 0 0',
              maxWidth: '58ch',
              lineHeight: 1.8,
              color: 'var(--text-secondary)',
            }}
          >
            Choose an assignment to see the exact groups expected to submit, who
            confirmed on their behalf, and who is still pending.
          </p>
        </section>

        <section
          className="submission-tracker-card"
          style={{
            padding: '24px',
            borderRadius: '28px',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            boxShadow: '0 18px 42px rgba(0, 0, 0, 0.12)',
            display: 'grid',
            gap: '18px',
            transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
          }}
        >
          <div
            className="submission-tracker-controls"
            style={{
              display: 'grid',
              gap: '18px',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
            }}
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <label
                htmlFor="submission-assignment-select"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                }}
              >
                Assignment
              </label>
              <select
                id="submission-assignment-select"
                value={selectedAssignmentId}
                onChange={(event) => setSelectedAssignmentId(event.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-default)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.96rem',
                  outline: 'none',
                }}
              >
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedAssignment ? (
              <div
                style={{
                  display: 'grid',
                  gap: '10px',
                  alignContent: 'start',
                  padding: '14px 16px',
                  borderRadius: '18px',
                  border: '1px solid var(--border-default)',
                  background: 'color-mix(in srgb, var(--bg-primary) 18%, transparent)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <CalendarDays size={16} />
                  Due {formatAssignmentDate(selectedAssignment.due_date)}
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <Users size={16} />
                  {selectedAssignment.assign_to === 'all'
                    ? 'Assigned to all groups'
                    : `${selectedAssignment.groups?.length ?? 0} specific groups`}
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                  }}
                >
                  <ClipboardCheck size={16} />
                  {confirmedCount}/{rows.length} confirmed
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section
          className="submission-tracker-card"
          style={{
            padding: '24px',
            borderRadius: '28px',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            boxShadow: '0 18px 42px rgba(0, 0, 0, 0.12)',
            display: 'grid',
            gap: '20px',
            transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Expected Group Status
            </p>
            <h2
              style={{
                marginTop: '8px',
                fontSize: 'clamp(1.6rem, 4vw, 2rem)',
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
              }}
            >
              Submission confirmations by group
            </h2>
          </div>

          {isTableLoading ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <Skeleton variant="text" height="44px" />
              <Skeleton variant="card" height="72px" />
              <Skeleton variant="card" height="72px" />
              <Skeleton variant="card" height="72px" />
            </div>
          ) : rows.length === 0 ? (
            <div
              style={{
                minHeight: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '22px',
                border: '1px dashed var(--border-default)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.7,
                padding: '20px',
              }}
            >
              No groups are expected for this assignment yet.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    minWidth: '720px',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border-default)',
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      {['Group Name', 'Submitted By', 'Submitted At', 'Status'].map(
                        (label) => (
                          <th
                            key={label}
                            style={{
                              padding: '16px 18px',
                              textAlign: 'left',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--text-tertiary)',
                            }}
                          >
                            {label}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row) => (
                      <tr
                        key={row.groupId}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <td
                          style={{
                            padding: '18px',
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                          }}
                        >
                          {row.groupName}
                        </td>
                        <td
                          style={{
                            padding: '18px',
                            color: row.submittedBy
                              ? 'var(--text-primary)'
                              : 'var(--text-tertiary)',
                          }}
                        >
                          {row.submittedBy || ''}
                        </td>
                        <td
                          style={{
                            padding: '18px',
                            color: row.submittedAt
                              ? 'var(--text-secondary)'
                              : 'var(--text-tertiary)',
                            fontFamily: row.submittedAt
                              ? 'var(--font-mono)'
                              : 'var(--font-body)',
                            fontSize: '0.88rem',
                          }}
                        >
                          {row.submittedAt ? formatTimestamp(row.submittedAt) : ''}
                        </td>
                        <td style={{ padding: '18px' }}>
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '16px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}
                >
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
        </section>
      </div>
    </>
  );
}
