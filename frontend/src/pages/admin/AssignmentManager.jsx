import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FilePlus,
  FolderSimple,
  PencilSimple,
  TrashSimple,
} from '@phosphor-icons/react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Page, PageHeader } from '../../components/common/Page';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const PAGE_SIZE = 10;

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
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
    <Page>
      <PageHeader
        eyebrow="Assignment Management"
        eyebrowAccent
        title="Publish, revise, and retire every brief"
        description="Keep assignments organized with clear status tags, visible targeting, and one-click editing for anything that needs attention."
        actions={
          <Button type="button" onClick={() => navigate('/admin/assignments/new')}>
            <FilePlus size={16} />
            Create Assignment
          </Button>
        }
      />

      <Card className="table-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={FolderSimple}
            title="No assignments yet"
            message="Create the first assignment to start publishing briefs for student groups."
            actionLabel="Create Assignment"
            onAction={() => navigate('/admin/assignments/new')}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Assign To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>
                        <span className="table__title">{assignment.title}</span>
                        <span className="table__description">
                          {assignment.description || 'No description provided.'}
                        </span>
                      </td>
                      <td className="mono">{formatAssignmentDate(assignment.due_date)}</td>
                      <td>
                        <StatusBadge status={assignment.status} />
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            assignment.assign_to === 'all' ? 'pill--green' : 'pill--blue'
                          }`}
                        >
                          {getAssignmentScopeLabel(assignment)}
                        </span>
                      </td>
                      <td>
                        <div className="cluster">
                          <Button
                            type="button"
                            variant="icon"
                            iconOnly
                            aria-label={`Edit ${assignment.title}`}
                            onClick={() => navigate(`/admin/assignments/${assignment.id}`)}
                          >
                            <PencilSimple size={16} />
                          </Button>

                          <Button
                            type="button"
                            variant="icon"
                            iconOnly
                            aria-label={`Delete ${assignment.title}`}
                            onClick={() => setAssignmentToDelete(assignment)}
                          >
                            <TrashSimple size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="toolbar" style={{ marginTop: 20 }}>
              <p className="toolbar__meta">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

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
    </Page>
  );
}
