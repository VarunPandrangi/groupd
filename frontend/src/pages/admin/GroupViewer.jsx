import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, FolderSearch, Users } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

  const visiblePages = useMemo(
    () => buildVisiblePages(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  return (
    <>
      <style>{`
        @keyframes groupViewerFade {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group-viewer-page {
          animation: groupViewerFade 0.42s ease forwards;
        }

        .group-row:hover {
          background: rgba(79, 123, 247, 0.06);
        }

        .group-page-button:hover:not(:disabled) {
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }
      `}</style>

      <div className="group-viewer-page" style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            borderRadius: '28px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, rgba(79, 123, 247, 0.18), transparent 34%), linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
            padding: 'clamp(24px, 4vw, 36px)',
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
            <div>
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
                Group Administration
              </p>
              <h1
                style={{
                  marginTop: '10px',
                  fontSize: 'clamp(2.2rem, 5vw, 3.1rem)',
                  letterSpacing: '-0.05em',
                  color: 'var(--text-primary)',
                }}
              >
                Review every student group in one place
              </h1>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: '18px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                fontSize: '0.92rem',
              }}
            >
              <Users size={18} />
              {pagination.total} total groups
            </div>
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
          ) : groups.length === 0 ? (
            <EmptyState
              icon={FolderSearch}
              title="No groups yet"
              message="Once students begin creating groups, they'll appear here with their leaders and member counts."
            />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    minWidth: '760px',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border-default)',
                      }}
                    >
                      {['Name', 'Leader', 'Members', 'Created'].map((label) => (
                        <th
                          key={label}
                          style={{
                            padding: '18px 22px',
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
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr
                        key={group.id}
                        className="group-row"
                        onClick={() => navigate(`/admin/groups/${group.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            navigate(`/admin/groups/${group.id}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'background 180ms ease',
                        }}
                      >
                        <td style={{ padding: '20px 22px', verticalAlign: 'top' }}>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '1rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {group.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {group.description || 'No description provided.'}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '20px 22px',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                          }}
                        >
                          {group.leader_name}
                        </td>
                        <td style={{ padding: '20px 22px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '999px',
                              background: 'rgba(52, 211, 153, 0.12)',
                              color: 'var(--accent-secondary)',
                              fontWeight: 700,
                            }}
                          >
                            {group.member_count}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '20px 22px',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.88rem',
                          }}
                        >
                          {formatDate(group.created_at)}
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
                    className="group-page-button"
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
                      transition: 'transform 180ms ease, border-color 180ms ease',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {visiblePages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className="group-page-button"
                      style={{
                        minWidth: '42px',
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '14px',
                        border:
                          pageNumber === pagination.page
                            ? '1px solid rgba(79, 123, 247, 0.2)'
                            : '1px solid var(--border-default)',
                        background:
                          pageNumber === pagination.page
                            ? 'rgba(79, 123, 247, 0.12)'
                            : 'transparent',
                        color:
                          pageNumber === pagination.page
                            ? 'var(--accent-primary)'
                            : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'transform 180ms ease, border-color 180ms ease',
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
                    className="group-page-button"
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
                        pagination.page >= pagination.totalPages
                          ? 'not-allowed'
                          : 'pointer',
                      opacity: pagination.page >= pagination.totalPages ? 0.45 : 1,
                      transition: 'transform 180ms ease, border-color 180ms ease',
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
    </>
  );
}
