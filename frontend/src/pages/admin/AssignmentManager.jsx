import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  FilePlus,
  FolderSimple,
  MagnifyingGlass,
  PencilSimple,
  TrashSimple,
} from '@phosphor-icons/react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Page } from '../../components/common/Page';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const PAGE_SIZE = 10;
const ALL_GROUP_FILTER = '__all__';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function getAssignmentGroupNames(assignment) {
  if (assignment.assign_to === 'all') {
    return [];
  }

  return (assignment.groups ?? []).map((group) => group?.name).filter(Boolean);
}

function getAssignmentScopeLabel(assignment) {
  if (assignment.assign_to === 'all') {
    return 'All Groups';
  }

  const groupNames = getAssignmentGroupNames(assignment);
  if (groupNames.length === 1) {
    return groupNames[0];
  }

  const groupCount = assignment.groups?.length ?? 0;
  if (groupCount > 0) {
    return `${groupCount} Group${groupCount === 1 ? '' : 's'}`;
  }

  return 'Selected Groups';
}

function getAssignmentPreview(description) {
  return String(description ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function getStatusMeta(status) {
  const normalizedStatus = String(status ?? '')
    .trim()
    .toLowerCase();

  if (normalizedStatus === 'overdue') {
    return { label: 'Overdue', tone: 'overdue' };
  }

  if (normalizedStatus === 'active') {
    return { label: 'Active', tone: 'active' };
  }

  if (normalizedStatus === 'upcoming') {
    return { label: 'Upcoming', tone: 'upcoming' };
  }

  if (normalizedStatus === 'submitted' || normalizedStatus === 'confirmed') {
    return { label: 'Submitted', tone: 'complete' };
  }

  if (normalizedStatus === 'complete') {
    return { label: 'Complete', tone: 'complete' };
  }

  return { label: 'Pending', tone: 'pending' };
}

function getResultsLabel(pagination, visibleCount, hasFilters) {
  if (visibleCount === 0) {
    return hasFilters ? 'No matches on this page' : 'No assignments available';
  }

  if (hasFilters) {
    return `Showing ${visibleCount} filtered result${visibleCount === 1 ? '' : 's'} on this page`;
  }

  const currentPage = pagination?.page ?? 1;
  const limit = pagination?.limit ?? PAGE_SIZE;
  const total = pagination?.total ?? visibleCount;
  const start = (currentPage - 1) * limit + 1;
  const end = start + visibleCount - 1;

  return `Showing ${start}-${end} of ${total}`;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState(ALL_GROUP_FILTER);

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

  const groupOptions = Array.from(
    new Set(assignments.flatMap((assignment) => getAssignmentGroupNames(assignment)))
  ).sort((left, right) => left.localeCompare(right));
  const activeGroupFilter =
    groupFilter === ALL_GROUP_FILTER || groupOptions.includes(groupFilter)
      ? groupFilter
      : ALL_GROUP_FILTER;
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const hasFilters = normalizedQuery.length > 0 || activeGroupFilter !== ALL_GROUP_FILTER;
  const visibleAssignments = assignments.filter((assignment) => {
    const assignmentGroups = getAssignmentGroupNames(assignment);
    const matchesGroup =
      activeGroupFilter === ALL_GROUP_FILTER || assignmentGroups.includes(activeGroupFilter);

    if (!matchesGroup) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      assignment.title,
      getAssignmentPreview(assignment.description),
      getAssignmentScopeLabel(assignment),
      assignmentGroups.join(' '),
      formatAssignmentDate(assignment.due_date),
      getStatusMeta(assignment.status).label,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
  const currentPage = pagination?.page ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const resultsLabel = isLoading
    ? 'Loading assignments...'
    : getResultsLabel(pagination, visibleAssignments.length, hasFilters);

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

  const handleResetFilters = () => {
    setSearchTerm('');
    setGroupFilter(ALL_GROUP_FILTER);
  };

  return (
    <Page className="assignment-manager-architectural">
      <header className="assignment-manager-architectural__header">
        <div className="assignment-manager-architectural__header-copy">
          <h1 className="assignment-manager-architectural__title">Assignment Management</h1>
          <p className="assignment-manager-architectural__subtitle">
            Overview of all active and upcoming tasks
          </p>
        </div>

        <button
          type="button"
          className="assignment-manager-architectural__cta"
          onClick={() => navigate('/admin/assignments/new')}
        >
          <FilePlus size={18} weight="bold" />
          Create Assignment
        </button>
      </header>

      <section className="assignment-manager-architectural__controls" aria-label="Assignment controls">
        <label className="assignment-manager-architectural__search">
          <span className="sr-only">Search assignments</span>
          <span className="assignment-manager-architectural__field-shell assignment-manager-architectural__field-shell--search">
            <MagnifyingGlass
              size={18}
              aria-hidden="true"
              className="assignment-manager-architectural__search-icon"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="assignment-manager-architectural__input"
              placeholder="Search assignments..."
            />
          </span>
        </label>

        <label className="assignment-manager-architectural__select">
          <span className="sr-only">Filter by group</span>
          <span className="assignment-manager-architectural__field-shell assignment-manager-architectural__field-shell--select">
            <select
              value={activeGroupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              className="assignment-manager-architectural__select-field"
            >
              <option value={ALL_GROUP_FILTER}>All Groups</option>
              {groupOptions.map((groupName) => (
                <option key={groupName} value={groupName}>
                  {groupName}
                </option>
              ))}
            </select>
            <CaretDown
              size={16}
              aria-hidden="true"
              className="assignment-manager-architectural__select-caret"
            />
          </span>
        </label>
      </section>

      <section
        className="assignment-manager-architectural__surface"
        aria-label="Assignment management registry"
      >
        {isLoading ? (
          <div className="assignment-manager-architectural__empty-wrap">
            <div className="assignment-manager-architectural__loading">
              <LoadingSpinner fullPage={false} size={30} />
              <p>Loading assignment registry...</p>
            </div>
          </div>
        ) : visibleAssignments.length === 0 ? (
          <div className="assignment-manager-architectural__empty-wrap">
            <div className="assignment-manager-architectural__empty">
              <span className="assignment-manager-architectural__empty-icon" aria-hidden="true">
                <FolderSimple size={28} weight="fill" />
              </span>
              <div className="assignment-manager-architectural__empty-copy">
                <h2>
                  {hasFilters ? 'No assignments match these filters' : 'No assignments published yet'}
                </h2>
                <p>
                  {hasFilters
                    ? 'Clear the current search or group filter to inspect the rest of this page.'
                    : 'Create the first assignment to start distributing briefs across student groups.'}
                </p>
              </div>
              <button
                type="button"
                className="assignment-manager-architectural__ghost"
                onClick={
                  hasFilters
                    ? handleResetFilters
                    : () => navigate('/admin/assignments/new')
                }
              >
                {hasFilters ? 'Clear Filters' : 'Create Assignment'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="assignment-manager-architectural__table-head" aria-hidden="true">
              <span>Assignment Name</span>
              <span>Assigned To</span>
              <span>Due Date</span>
              <span>Status</span>
              <span className="assignment-manager-architectural__actions-head">Actions</span>
            </div>

            <div className="assignment-manager-architectural__rows">
              {visibleAssignments.map((assignment) => {
                const preview = getAssignmentPreview(assignment.description);
                const scopeLabel = getAssignmentScopeLabel(assignment);
                const status = getStatusMeta(assignment.status);

                return (
                  <article className="assignment-manager-architectural__row" key={assignment.id}>
                    <div className="assignment-manager-architectural__cell assignment-manager-architectural__cell--title">
                      <h2>{assignment.title}</h2>
                      {preview ? (
                        <p className="assignment-manager-architectural__preview">{preview}</p>
                      ) : null}
                    </div>

                    <div className="assignment-manager-architectural__cell">
                      <span className="assignment-manager-architectural__cell-label">
                        Assigned To
                      </span>
                      <span className="assignment-manager-architectural__scope">{scopeLabel}</span>
                    </div>

                    <div
                      className={`assignment-manager-architectural__cell assignment-manager-architectural__date ${
                        status.tone === 'overdue'
                          ? 'assignment-manager-architectural__date--overdue'
                          : ''
                      }`}
                    >
                      <span className="assignment-manager-architectural__cell-label">Due Date</span>
                      <span>{formatAssignmentDate(assignment.due_date)}</span>
                    </div>

                    <div className="assignment-manager-architectural__cell">
                      <span className="assignment-manager-architectural__cell-label">Status</span>
                      <span
                        className={`assignment-manager-architectural__status assignment-manager-architectural__status--${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="assignment-manager-architectural__cell assignment-manager-architectural__cell--actions">
                      <span className="assignment-manager-architectural__cell-label">Actions</span>
                      <div className="assignment-manager-architectural__actions">
                        <button
                          type="button"
                          className="assignment-manager-architectural__action"
                          aria-label={`Edit ${assignment.title}`}
                          onClick={() => navigate(`/admin/assignments/${assignment.id}`)}
                        >
                          <PencilSimple size={18} />
                        </button>

                        <button
                          type="button"
                          className="assignment-manager-architectural__action assignment-manager-architectural__action--danger"
                          aria-label={`Delete ${assignment.title}`}
                          onClick={() => setAssignmentToDelete(assignment)}
                        >
                          <TrashSimple size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        <footer className="assignment-manager-architectural__footer">
          <span className="assignment-manager-architectural__footer-copy">{resultsLabel}</span>

          <div className="assignment-manager-architectural__pager">
            <button
              type="button"
              className="assignment-manager-architectural__pager-button"
              onClick={() => setPage((currentValue) => Math.max(currentValue - 1, 1))}
              disabled={isLoading || currentPage <= 1}
            >
              <CaretLeft size={14} />
              Prev
            </button>
            <button
              type="button"
              className="assignment-manager-architectural__pager-button"
              onClick={() => setPage((currentValue) => Math.min(currentValue + 1, totalPages))}
              disabled={isLoading || currentPage >= totalPages}
            >
              Next
              <CaretRight size={14} />
            </button>
          </div>
        </footer>
      </section>

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
