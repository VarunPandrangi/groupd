import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  FolderSearch,
  Pencil,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const PAGE_SIZE = 10;

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function buildVisiblePages(page, totalPages) {
  const pages = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (!pages.includes(1)) {
    pages.unshift(1);
  }

  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return [...new Set(pages)];
}

function getAssignmentScopeLabel(assignment) {
  if (assignment.assign_to === 'all') {
    return 'All Groups';
  }

  const groupCount = assignment.groups?.length ?? 0;
  return `${groupCount} Group${groupCount === 1 ? '' : 's'}`;
}

export default function AssignmentManager() {
  const navigate = useNavigate();
  const assignments = useAssignmentStore((state) => state.assignments);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const pagination = useAssignmentStore((state) => state.pagination);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const deleteAssignment = useAssignmentStore((state) => state.deleteAssignment);
  const [page, setPage] = useState(1);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        await fetchAssignments({ page, limit: PAGE_SIZE });
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
  }, [fetchAssignments, page]);

  const visiblePages = useMemo(
    () => buildVisiblePages(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  const handleDelete = async () => {
    if (!assignmentToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAssignment(assignmentToDelete.id);
      toast.success('Assignment deleted successfully.');

      const targetPage = assignments.length === 1 && page > 1 ? page - 1 : page;
      setAssignmentToDelete(null);

      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        await fetchAssignments({ page: targetPage, limit: PAGE_SIZE });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete this assignment.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        .assignment-table-row:hover {
          background: color-mix(in srgb, var(--accent-primary) 7%, transparent) !important;
        }
      `}</style>

      <div style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 34%), var(--bg-secondary)',
            padding: 'clamp(24px, 4vw, 36px)',
            boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: '720px' }}>
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
                Assignment Management
              </p>
              <h1
                style={{
                  marginTop: '10px',
                  fontSize: 'clamp(2.3rem, 5vw, 3.2rem)',
                  letterSpacing: '-0.05em',
                  color: 'var(--text-primary)',
                }}
              >
                Publish, revise, and retire every brief
              </h1>
              <p
                style={{
                  margin: '14px 0 0',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  maxWidth: '58ch',
                }}
              >
                Keep assignments organized with clear status tags, visible targeting,
                and one-click editing for anything that needs attention.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/assignments/new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                borderRadius: '16px',
                border: 'none',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 18px 40px rgba(79, 123, 247, 0.22)',
              }}
            >
              <FilePlus2 size={18} />
              Create Assignment
            </button>
          </div>
        </section>

        <section
          style={{
            borderRadius: '28px',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            boxShadow: '0 26px 60px rgba(0, 0, 0, 0.14)',
          }}
        >
          {isLoading ? (
            <div
              style={{
                minHeight: '360px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LoadingSpinner fullPage={false} size={36} />
            </div>
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={FolderSearch}
              title="No assignments yet"
              message="Create the first assignment to start publishing briefs for student groups."
              actionLabel="Create Assignment"
              onAction={() => navigate('/admin/assignments/new')}
            />
          ) : (
            <>
              <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
                <table
                  style={{
                    width: '100%',
                    minWidth: '980px',
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr>
                      {['Title', 'Due Date', 'Status', 'Assign To', 'Actions'].map((label) => (
                        <th
                          key={label}
                          style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            padding: '18px 22px',
                            textAlign: 'left',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--text-tertiary)',
                            background: 'var(--bg-secondary)',
                            borderBottom: '1px solid var(--border-default)',
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment, index) => (
                      <tr
                        key={assignment.id}
                        className="assignment-table-row"
                        style={{
                          background:
                            index % 2 === 0
                              ? 'transparent'
                              : 'color-mix(in srgb, var(--bg-primary) 18%, transparent)',
                          borderBottom:
                            '1px solid color-mix(in srgb, var(--border-default) 72%, transparent)',
                        }}
                      >
                        <td style={{ padding: '20px 22px', verticalAlign: 'top' }}>
                          <div style={{ display: 'grid', gap: '6px', maxWidth: '380px' }}>
                            <span
                              style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {assignment.title}
                            </span>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                color: 'var(--text-secondary)',
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                              }}
                            >
                              {assignment.description || 'No description provided.'}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '20px 22px',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.9rem',
                          }}
                        >
                          {formatAssignmentDate(assignment.due_date)}
                        </td>
                        <td style={{ padding: '20px 22px' }}>
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td style={{ padding: '20px 22px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px 12px',
                              borderRadius: '999px',
                              background:
                                assignment.assign_to === 'all'
                                  ? 'color-mix(in srgb, var(--accent-secondary) 18%, transparent)'
                                  : 'color-mix(in srgb, var(--accent-primary) 14%, transparent)',
                              color:
                                assignment.assign_to === 'all'
                                  ? 'var(--accent-secondary)'
                                  : 'var(--accent-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {getAssignmentScopeLabel(assignment)}
                          </span>
                        </td>
                        <td style={{ padding: '20px 22px' }}>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              type="button"
                              aria-label={`Edit ${assignment.title}`}
                              onClick={() => navigate(`/admin/assignments/${assignment.id}`)}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '14px',
                                border: '1px solid var(--border-default)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Pencil size={18} />
                            </button>

                            <button
                              type="button"
                              aria-label={`Delete ${assignment.title}`}
                              onClick={() => setAssignmentToDelete(assignment)}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '14px',
                                border:
                                  '1px solid color-mix(in srgb, var(--accent-danger) 28%, transparent)',
                                background:
                                  'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
                                color: 'var(--accent-danger)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
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
                  padding: '18px 22px',
                  borderTop: '1px solid var(--border-default)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}
                >
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-default)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                      opacity: pagination.page <= 1 ? 0.45 : 1,
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {visiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      style={{
                        minWidth: '42px',
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '14px',
                        border:
                          pageNumber === pagination.page
                            ? '1px solid color-mix(in srgb, var(--accent-primary) 26%, transparent)'
                            : '1px solid var(--border-default)',
                        background:
                          pageNumber === pagination.page
                            ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)'
                            : 'transparent',
                        color:
                          pageNumber === pagination.page
                            ? 'var(--accent-primary)'
                            : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setPage((currentPage) =>
                        Math.min(pagination.totalPages, currentPage + 1)
                      )
                    }
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '14px',
                      border: '1px solid var(--border-default)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor:
                        pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      opacity: pagination.page >= pagination.totalPages ? 0.45 : 1,
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={Boolean(assignmentToDelete)}
        title="Delete assignment"
        message={`Soft-delete "${assignmentToDelete?.title}"? Students will no longer see it, but the audit trail stays intact.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Assignment'}
        cancelText="Cancel"
        onCancel={() => {
          if (!isDeleting) {
            setAssignmentToDelete(null);
          }
        }}
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
