import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Crown,
  Mail,
  Plus,
  Trash2,
  UserPlus,
  Users,
  UserRoundMinus,
} from 'lucide-react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';

const AVATAR_BACKGROUNDS = [
  'linear-gradient(135deg, rgba(79, 123, 247, 0.28), rgba(79, 123, 247, 0.12))',
  'linear-gradient(135deg, rgba(52, 211, 153, 0.24), rgba(52, 211, 153, 0.1))',
  'linear-gradient(135deg, rgba(251, 191, 36, 0.24), rgba(251, 191, 36, 0.1))',
  'linear-gradient(135deg, rgba(239, 68, 68, 0.24), rgba(239, 68, 68, 0.1))',
];

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function getInitial(name) {
  return name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
}

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function GroupManagement() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const group = useGroupStore((state) => state.group);
  const members = useGroupStore((state) => state.members);
  const fetchMyGroup = useGroupStore((state) => state.fetchMyGroup);
  const addMember = useGroupStore((state) => state.addMember);
  const removeMember = useGroupStore((state) => state.removeMember);
  const leaveGroup = useGroupStore((state) => state.leaveGroup);
  const deleteGroup = useGroupStore((state) => state.deleteGroup);

  const [isReady, setIsReady] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [confirmState, setConfirmState] = useState({
    type: null,
    member: null,
    isSubmitting: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadGroup() {
      try {
        await fetchMyGroup();
      } catch (error) {
        toast.error(getErrorMessage(error, 'Unable to load your group right now.'));
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadGroup();

    return () => {
      isMounted = false;
    };
  }, [fetchMyGroup]);

  const isLeader = Boolean(group && user && group.created_by === user.id);

  const sortedMembers = useMemo(() => {
    return [...members].sort((left, right) => {
      if (left.id === group?.created_by) {
        return -1;
      }
      if (right.id === group?.created_by) {
        return 1;
      }
      return left.full_name.localeCompare(right.full_name);
    });
  }, [group?.created_by, members]);

  const confirmDialogConfig = useMemo(() => {
    if (confirmState.type === 'remove' && confirmState.member) {
      return {
        title: 'Remove member',
        message: `Remove ${confirmState.member.full_name} from the group?`,
        confirmText: confirmState.isSubmitting ? 'Removing...' : 'Remove Member',
      };
    }

    if (confirmState.type === 'leave') {
      return {
        title: 'Leave group',
        message: `Are you sure you want to leave ${group?.name}?`,
        confirmText: confirmState.isSubmitting ? 'Leaving...' : 'Leave Group',
      };
    }

    if (confirmState.type === 'delete') {
      return {
        title: 'Delete group',
        message:
          'Deleting this group will remove every member from it. This action cannot be undone.',
        confirmText: confirmState.isSubmitting ? 'Deleting...' : 'Delete Group',
      };
    }

    return null;
  }, [confirmState, group?.name]);

  const closeConfirmDialog = () => {
    if (confirmState.isSubmitting) {
      return;
    }

    setConfirmState({
      type: null,
      member: null,
      isSubmitting: false,
    });
  };

  const handleAddMember = async (event) => {
    event.preventDefault();

    const identifier = memberIdentifier.trim();
    if (!identifier) {
      toast.error('Enter an email or student ID.');
      return;
    }

    setIsAddingMember(true);
    try {
      const payload = identifier.includes('@')
        ? { email: identifier }
        : { student_id: identifier };

      await addMember(payload);
      toast.success('Member added successfully.');
      setMemberIdentifier('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to add that member right now.'));
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState.type) {
      return;
    }

    setConfirmState((currentState) => ({
      ...currentState,
      isSubmitting: true,
    }));

    try {
      if (confirmState.type === 'remove' && confirmState.member) {
        await removeMember(confirmState.member.id);
        toast.success(`${confirmState.member.full_name} has been removed.`);
      }

      if (confirmState.type === 'leave') {
        await leaveGroup();
        toast.success('You left the group.');
      }

      if (confirmState.type === 'delete') {
        await deleteGroup();
        toast.success('Group deleted successfully.');
      }

      setConfirmState({
        type: null,
        member: null,
        isSubmitting: false,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'That action could not be completed.'));
      setConfirmState((currentState) => ({
        ...currentState,
        isSubmitting: false,
      }));
    }
  };

  if (!isReady) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return (
      <EmptyState
        icon={Users}
        title="You're not in a group yet"
        message="Create a group to invite classmates, track your team, and keep collaboration organized in one place."
        actionLabel="Create a Group"
        onAction={() => navigate('/student/group/create')}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes groupPageFade {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group-page {
          animation: groupPageFade 0.42s ease forwards;
        }

        .group-add-panel {
          overflow: hidden;
          transition: max-height 240ms ease, opacity 220ms ease, transform 220ms ease;
        }

        .group-add-panel--open {
          max-height: 220px;
          opacity: 1;
          transform: translateY(0);
        }

        .group-add-panel--closed {
          max-height: 0;
          opacity: 0;
          transform: translateY(-8px);
        }

        .group-member-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .group-member-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-hover);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
        }

        .group-icon-button:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.12);
          color: var(--accent-danger);
          border-color: rgba(239, 68, 68, 0.28);
        }

        .group-pill-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        @media (max-width: 1023px) {
          .group-member-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 767px) {
          .group-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }

          .group-actions > button {
            width: 100%;
          }
        }
      `}</style>

      <div className="group-page" style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, rgba(79, 123, 247, 0.24), transparent 34%), linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
            padding: 'clamp(24px, 4vw, 40px)',
            boxShadow: '0 26px 60px rgba(0, 0, 0, 0.16)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ maxWidth: '700px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  background: 'rgba(79, 123, 247, 0.12)',
                  color: 'var(--accent-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Group Workspace
              </div>

              <h1
                style={{
                  marginTop: '18px',
                  fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.05em',
                  color: 'var(--text-primary)',
                }}
              >
                {group.name}
              </h1>

              <p
                style={{
                  margin: '16px 0 0',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  maxWidth: '58ch',
                }}
              >
                {group.description ||
                  'No group description yet. Add one when you want to give your team a shared identity.'}
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginTop: '22px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.92rem',
                  }}
                >
                  Created on {formatDate(group.created_at)}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    background: 'rgba(52, 211, 153, 0.12)',
                    border: '1px solid rgba(52, 211, 153, 0.16)',
                    color: 'var(--accent-secondary)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                  }}
                >
                  {members.length} {members.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>
            </div>

            <div
              className="group-actions"
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              {isLeader ? (
                <button
                  type="button"
                  className="group-pill-button"
                  onClick={() => setIsAddFormOpen((currentValue) => !currentValue)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '1px solid rgba(79, 123, 247, 0.24)',
                    background: 'rgba(79, 123, 247, 0.12)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'transform 180ms ease, background 180ms ease',
                  }}
                >
                  <UserPlus size={18} />
                  Add Member
                </button>
              ) : (
                <button
                  type="button"
                  className="group-pill-button"
                  onClick={() =>
                    setConfirmState({
                      type: 'leave',
                      member: null,
                      isSubmitting: false,
                    })
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    border: '1px solid rgba(251, 191, 36, 0.22)',
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: 'var(--accent-warning)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'transform 180ms ease, background 180ms ease',
                  }}
                >
                  <UserRoundMinus size={18} />
                  Leave Group
                </button>
              )}
            </div>
          </div>

          {isLeader ? (
            <div
              className={`group-add-panel ${
                isAddFormOpen ? 'group-add-panel--open' : 'group-add-panel--closed'
              }`}
              style={{ marginTop: isAddFormOpen ? '24px' : '0' }}
            >
              <form
                onSubmit={handleAddMember}
                style={{
                  display: 'grid',
                  gap: '12px',
                  padding: '18px',
                  borderRadius: '22px',
                  border: '1px solid var(--border-default)',
                  background: 'rgba(12, 15, 22, 0.34)',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                    }}
                  >
                    Invite a classmate
                  </p>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Enter their registered email address or student ID.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 280px' }}>
                    <input
                      type="text"
                      value={memberIdentifier}
                      onChange={(event) => setMemberIdentifier(event.target.value)}
                      placeholder="student@college.edu or 22CS101"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '16px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.95rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="group-pill-button"
                    style={{
                      minWidth: '136px',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: isAddingMember ? 'not-allowed' : 'pointer',
                      opacity: isAddingMember ? 0.75 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 18px 40px rgba(79, 123, 247, 0.22)',
                      transition: 'transform 180ms ease',
                    }}
                  >
                    {isAddingMember ? (
                      <LoadingSpinner fullPage={false} size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    Add
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </section>

        <section style={{ display: 'grid', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)',
                }}
              >
                Member Roster
              </p>
              <h2
                style={{
                  marginTop: '8px',
                  fontSize: '2rem',
                  letterSpacing: '-0.04em',
                  color: 'var(--text-primary)',
                }}
              >
                Everyone in the room
              </h2>
            </div>
          </div>

          <div className="group-member-grid">
            {sortedMembers.map((member, index) => {
              const memberIsLeader = member.id === group.created_by;
              const memberIsSelf = member.id === user?.id;

              return (
                <article
                  key={member.id}
                  className="group-member-card"
                  style={{
                    position: 'relative',
                    display: 'grid',
                    gap: '18px',
                    padding: '24px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-default)',
                    background:
                      'linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
                    transition:
                      'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '14px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '58px',
                        height: '58px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        color: 'var(--text-primary)',
                        background:
                          AVATAR_BACKGROUNDS[index % AVATAR_BACKGROUNDS.length],
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {getInitial(member.full_name)}
                    </div>

                    {isLeader && !memberIsSelf ? (
                      <button
                        type="button"
                        aria-label={`Remove ${member.full_name}`}
                        className="group-icon-button"
                        onClick={() =>
                          setConfirmState({
                            type: 'remove',
                            member,
                            isSubmitting: false,
                          })
                        }
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '14px',
                          border: '1px solid var(--border-default)',
                          background: 'transparent',
                          color: 'var(--text-tertiary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition:
                            'background 180ms ease, color 180ms ease, border-color 180ms ease',
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.28rem',
                          letterSpacing: '-0.03em',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {member.full_name}
                      </h3>

                      {memberIsLeader ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: 'rgba(251, 191, 36, 0.14)',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            color: 'var(--accent-warning)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          <Crown size={13} />
                          Leader
                        </span>
                      ) : null}

                      {memberIsSelf ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: 'rgba(79, 123, 247, 0.12)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          You
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'var(--text-secondary)',
                        fontSize: '0.92rem',
                      }}
                    >
                      <Mail size={16} />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {member.email}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        paddingTop: '14px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.82rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        Student ID
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {member.student_id}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {isLeader ? (
          <section
            style={{
              borderTop: '1px solid var(--border-default)',
              paddingTop: '24px',
            }}
          >
            <div
              style={{
                borderRadius: '24px',
                border: '1px solid rgba(239, 68, 68, 0.18)',
                background:
                  'linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(26, 29, 39, 0.96))',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '18px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ maxWidth: '640px' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--accent-danger)',
                  }}
                >
                  Danger Zone
                </p>
                <h2
                  style={{
                    marginTop: '10px',
                    fontSize: '1.7rem',
                    letterSpacing: '-0.04em',
                    color: 'var(--text-primary)',
                  }}
                >
                  Delete this group
                </h2>
                <p
                  style={{
                    margin: '10px 0 0',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                  }}
                >
                  This removes every member from the group and resets your team workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    type: 'delete',
                    member: null,
                    isSubmitting: false,
                  })
                }
                className="group-pill-button"
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'var(--accent-danger)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 18px 40px rgba(239, 68, 68, 0.22)',
                  transition: 'transform 180ms ease',
                }}
              >
                Delete Group
              </button>
            </div>
          </section>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmState.type && confirmDialogConfig)}
        title={confirmDialogConfig?.title}
        message={confirmDialogConfig?.message}
        confirmText={confirmDialogConfig?.confirmText}
        cancelText="Cancel"
        onCancel={closeConfirmDialog}
        onConfirm={handleConfirmAction}
        variant="danger"
      />
    </>
  );
}
