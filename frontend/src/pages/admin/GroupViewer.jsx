import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowSquareOut,
  DotsThree,
  FadersHorizontal,
  FolderSimple,
  Plus,
  UsersThree,
} from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Page } from '../../components/common/Page';
import groupService from '../../services/groupService';
import dashboardService from '../../services/dashboardService';

const PAGE_SIZE = 8;

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateValue));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0);
}

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 1) {
    return [1];
  }

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return [...pages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((left, right) => left - right);
}

function StatCard({ label, value, accent = 'none', tone = 'default' }) {
  return (
    <section
      className={`group-admin-architectural__stat group-admin-architectural__stat--${tone}${
        accent !== 'none' ? ` group-admin-architectural__stat--accent-${accent}` : ''
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}

export default function GroupViewer() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [summary, setSummary] = useState(null);
  const [sortMode, setSortMode] = useState('created');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      setIsLoading(true);

      try {
        const [pageResponse, allGroups, adminSummary] = await Promise.all([
          groupService.getAllGroups(page, PAGE_SIZE),
          groupService.getAllGroupsForAdmin(100),
          dashboardService.getAdminSummary(),
        ]);

        const detailResults = await Promise.allSettled(
          pageResponse.groups.map((group) => groupService.getGroupDetail(group.id))
        );

        if (!isMounted) {
          return;
        }

        const enrichedGroups = pageResponse.groups.map((group, index) => {
          const detail =
            detailResults[index]?.status === 'fulfilled' ? detailResults[index].value : null;
          const leader = detail?.members?.find((member) => member.id === detail.created_by);

          return {
            ...group,
            leader_name: leader?.full_name || 'Unavailable',
          };
        });

        const totalActiveMembersInGroups = allGroups.reduce(
          (sum, group) => sum + (Number(group.member_count) || 0),
          0
        );
        const totalStudents = Number(adminSummary?.totalStudents) || 0;

        setGroups(enrichedGroups);
        setPagination(pageResponse.pagination);
        setSummary({
          totalGroups: Number(pageResponse.pagination?.total) || 0,
          totalStudents,
          totalActiveMembersInGroups,
          totalMembersWithoutGroup: Math.max(0, totalStudents - totalActiveMembersInGroups),
        });
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load groups right now.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGroups();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const sortedGroups = useMemo(() => {
    const nextGroups = [...groups];

    if (sortMode === 'members') {
      return nextGroups.sort(
        (left, right) =>
          (Number(right.member_count) || 0) - (Number(left.member_count) || 0) ||
          left.name.localeCompare(right.name)
      );
    }

    return nextGroups.sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime() ||
        left.name.localeCompare(right.name)
    );
  }, [groups, sortMode]);

  const pageItems = buildPageItems(pagination.page, pagination.totalPages);
  const startEntry =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endEntry = Math.min(pagination.page * pagination.limit, pagination.total);

  if (isLoading) {
    return (
      <div className="group-admin-architectural__loading">
        <LoadingSpinner />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={FolderSimple}
        title="No groups yet"
        message="Once students begin creating groups, they'll appear here with their leads and member counts."
      />
    );
  }

  return (
    <Page className="group-admin-architectural">
      <section className="group-admin-architectural__header">
        <div>
          <h1 className="group-admin-architectural__title">Group Administration</h1>
          <p className="group-admin-architectural__subtitle">
            Review every student group in one place
          </p>
        </div>

        <div className="group-admin-architectural__actions">
          <button
            type="button"
            className="group-admin-architectural__filter-btn"
            onClick={() =>
              setSortMode((currentMode) =>
                currentMode === 'created' ? 'members' : 'created'
              )
            }
          >
            <FadersHorizontal size={14} weight="bold" />
            Filter
          </button>
          <button type="button" className="group-admin-architectural__primary-btn">
            <Plus size={14} weight="bold" />
            New Cluster
          </button>
        </div>
      </section>

      <section className="group-admin-architectural__table-shell">
        <div className="group-admin-architectural__table-head">
          <span>Name / Designation</span>
          <span>Primary Lead</span>
          <span className="group-admin-architectural__table-center">Members</span>
          <span>Established</span>
          <span className="group-admin-architectural__table-end">Actions</span>
        </div>

        <div className="group-admin-architectural__rows">
          {sortedGroups.map((group, index) => {
            const isPrimaryAccent = index === 0;

            return (
              <article
                key={group.id}
                className={`group-admin-architectural__row${
                  isPrimaryAccent ? ' group-admin-architectural__row--primary' : ''
                }`}
              >
                <button
                  type="button"
                  className="group-admin-architectural__row-hit"
                  onClick={() => navigate(`/admin/groups/${group.id}`)}
                  aria-label={`Open ${group.name}`}
                />

                <div className="group-admin-architectural__name">
                  <span className="group-admin-architectural__name-rail" aria-hidden="true" />
                  <div>
                    <strong>{group.name}</strong>
                    <small>{group.description || 'No description provided.'}</small>
                  </div>
                </div>

                <div className="group-admin-architectural__lead">
                  <span className="group-admin-architectural__lead-avatar" aria-hidden="true">
                    <UsersThree size={12} weight="fill" />
                  </span>
                  <span>{group.leader_name}</span>
                </div>

                <div className="group-admin-architectural__members">
                  <span>{formatNumber(group.member_count)}</span>
                </div>

                <div className="group-admin-architectural__date">
                  {formatDate(group.created_at)}
                </div>

                <div className="group-admin-architectural__menu-wrap">
                  <button
                    type="button"
                    className="group-admin-architectural__menu-btn"
                    onClick={() => navigate(`/admin/groups/${group.id}`)}
                    aria-label={`Open actions for ${group.name}`}
                  >
                    <DotsThree size={14} weight="bold" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="group-admin-architectural__stats">
        <StatCard
          label="Total Groups"
          value={formatNumber(summary?.totalGroups)}
          tone="orbital"
        />
        <StatCard
          label="Total Active Members In Groups"
          value={formatNumber(summary?.totalActiveMembersInGroups)}
          tone="orbital"
        />
        <StatCard
          label="Total Members In No Groups"
          value={formatNumber(summary?.totalMembersWithoutGroup)}
          accent="red"
        />
      </section>

      <footer className="group-admin-architectural__footer">
        <span>
          Showing {startEntry}-{endEntry} of {formatNumber(pagination.total)} entries
        </span>

        <div className="group-admin-architectural__pagination">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            Prev
          </button>

          {pageItems.map((item) => (
            <button
              key={item}
              type="button"
              className={
                item === pagination.page
                  ? 'group-admin-architectural__page-btn group-admin-architectural__page-btn--active'
                  : 'group-admin-architectural__page-btn'
              }
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          ))}

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))
            }
          >
            Next
          </button>
        </div>
      </footer>

      <button
        type="button"
        className="group-admin-architectural__floating-open"
        onClick={() => navigate('/admin/groups')}
        aria-label="Open groups overview"
      >
        <ArrowSquareOut size={16} weight="bold" />
      </button>
    </Page>
  );
}
