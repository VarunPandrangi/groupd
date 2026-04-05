import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Crown, UsersRound } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import groupService from '../../services/groupService';

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

export default function GroupDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadGroupDetail() {
      setIsLoading(true);
      try {
        const response = await groupService.getGroupDetail(id);
        if (isMounted) {
          setGroup(response);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load group details.'));
          navigate('/admin/groups', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadGroupDetail();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const members = group?.members ?? [];
  const leader = useMemo(
    () => members.find((member) => member.id === group?.created_by) || null,
    [group?.created_by, members]
  );

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LoadingSpinner fullPage={false} size={40} />
      </div>
    );
  }

  if (!group) {
    return (
      <EmptyState
        icon={UsersRound}
        title="Group not found"
        message="This group may have been deleted or is no longer available."
        actionLabel="Back to Groups"
        onAction={() => navigate('/admin/groups')}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes groupDetailFade {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group-detail-page {
          animation: groupDetailFade 0.42s ease forwards;
        }
      `}</style>

      <div className="group-detail-page" style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, rgba(79, 123, 247, 0.16), transparent 34%), linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
            padding: 'clamp(24px, 4vw, 36px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '16px',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: '720px' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/groups')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '18px',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={17} />
                Back to Groups
              </button>

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
                Group Detail
              </p>
              <h1
                style={{
                  marginTop: '10px',
                  fontSize: 'clamp(2.1rem, 5vw, 3rem)',
                  letterSpacing: '-0.05em',
                  color: 'var(--text-primary)',
                }}
              >
                {group.name}
              </h1>
              <p
                style={{
                  margin: '14px 0 0',
                  maxWidth: '56ch',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                }}
              >
                {group.description || 'No group description provided.'}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gap: '12px',
                minWidth: '220px',
              }}
            >
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Leader
                </p>
                <p
                  style={{
                    margin: '8px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  <Crown size={16} color="var(--accent-warning)" />
                  {leader?.full_name || 'Unavailable'}
                </p>
              </div>

              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Snapshot
                </p>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: '0.96rem',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                  }}
                >
                  {members.length} members
                </p>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Created on {formatDate(group.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            borderRadius: '28px',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
          }}
        >
          <div
            style={{
              padding: '22px 24px',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <h2
              style={{
                fontSize: '1.6rem',
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
              }}
            >
              Members
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '780px',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid var(--border-default)',
                  }}
                >
                  {['Name', 'Email', 'Student ID', 'Role'].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: '18px 24px',
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
                {members.map((member) => {
                  const memberRole =
                    member.id === group.created_by ? 'Leader' : 'Member';

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      }}
                    >
                      <td
                        style={{
                          padding: '20px 24px',
                          color: 'var(--text-primary)',
                          fontWeight: 700,
                        }}
                      >
                        {member.full_name}
                      </td>
                      <td
                        style={{
                          padding: '20px 24px',
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.88rem',
                        }}
                      >
                        {member.email}
                      </td>
                      <td
                        style={{
                          padding: '20px 24px',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.88rem',
                        }}
                      >
                        {member.student_id}
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '999px',
                            background:
                              memberRole === 'Leader'
                                ? 'rgba(251, 191, 36, 0.14)'
                                : 'rgba(79, 123, 247, 0.12)',
                            color:
                              memberRole === 'Leader'
                                ? 'var(--accent-warning)'
                                : 'var(--accent-primary)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                          }}
                        >
                          {memberRole}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
