import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FolderSimple, UsersThree } from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import Card from '../../components/common/Card';
import { Page, PageHeader } from '../../components/common/Page';
import groupService from '../../services/groupService';

const PAGE_SIZE = 8;

function formatDate(dateValue) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
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
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      setIsLoading(true);

      try {
        const response = await groupService.getAllGroups(page, PAGE_SIZE);
        const detailResults = await Promise.allSettled(
          response.groups.map((group) => groupService.getGroupDetail(group.id))
        );

        if (!isMounted) {
          return;
        }

        const enrichedGroups = response.groups.map((group, index) => {
          const detail =
            detailResults[index]?.status === 'fulfilled'
              ? detailResults[index].value
              : null;
          const leader = detail?.members?.find(
            (member) => member.id === detail.created_by
          );

          return {
            ...group,
            leader_name: leader?.full_name || 'Unavailable',
          };
        });

        setGroups(enrichedGroups);
        setPagination(response.pagination);
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

  return (
    <Page>
      <PageHeader
        eyebrow="Group Administration"
        eyebrowAccent
        title="Review every student group in one place"
        description="See leaders, member counts, and creation dates across the classroom, then open any group for a closer look."
        actions={<span className="pill">{pagination.total} total groups</span>}
      />

      <Card className="table-card">
        {isLoading ? (
          <LoadingSpinner />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={FolderSimple}
            title="No groups yet"
            message="Once students begin creating groups, they'll appear here with their leaders and member counts."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Leader</th>
                    <th>Members</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr
                      key={group.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/admin/groups/${group.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/admin/groups/${group.id}`);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="table__title">{group.name}</span>
                        <span className="table__description">
                          {group.description || 'No description provided.'}
                        </span>
                      </td>
                      <td>{group.leader_name}</td>
                      <td>
                        <span className="pill pill--green">{group.member_count}</span>
                      </td>
                      <td className="mono">{formatDate(group.created_at)}</td>
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
    </Page>
  );
}
