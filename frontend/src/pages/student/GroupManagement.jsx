import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Crown,
  EnvelopeSimple,
  Plus,
  TrashSimple,
  UserMinus,
  UserPlus,
  UsersThree,
} from '@phosphor-icons/react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Page, PageHeader, SectionHeading } from '../../components/common/Page';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';

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

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        if (left.id === group?.created_by) {
          return -1;
        }
        if (right.id === group?.created_by) {
          return 1;
        }
        return left.full_name.localeCompare(right.full_name);
      }),
    [group?.created_by, members]
  );

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
        icon={UsersThree}
        title="You're not in a group yet"
        message="Create a group to invite classmates, track your team, and keep collaboration organized in one place."
        actionLabel="Create a Group"
        onAction={() => navigate('/student/group/create')}
      />
    );
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Group Workspace"
        eyebrowAccent
        title={group.name}
        description={
          group.description ||
          'No group description yet. Add one when you want to give your team a shared identity.'
        }
        actions={
          isLeader ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddFormOpen((currentValue) => !currentValue)}
            >
              <UserPlus size={16} />
              {isAddFormOpen ? 'Close Invite' : 'Add Member'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setConfirmState({
                  type: 'leave',
                  member: null,
                  isSubmitting: false,
                })
              }
            >
              <UserMinus size={16} />
              Leave Group
            </Button>
          )
        }
      />

      <Card>
        <div className="surface-grid">
          <div className="cluster">
            <span className="pill">
              Created on {formatDate(group.created_at)}
            </span>
            <span className="pill pill--green">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          {isLeader && isAddFormOpen ? (
            <Card as="section" className="surface-grid" style={{ background: 'var(--bg-page)' }}>
              <div>
                <div className="table__title">Invite a classmate</div>
                <span className="table__description">
                  Enter their registered email address or student ID.
                </span>
              </div>

              <form onSubmit={handleAddMember} className="toolbar">
                <div style={{ flex: '1 1 280px' }}>
                  <input
                    type="text"
                    className="input"
                    value={memberIdentifier}
                    onChange={(event) => setMemberIdentifier(event.target.value)}
                    placeholder="student@college.edu or 22CS101"
                  />
                </div>
                <Button type="submit" disabled={isAddingMember}>
                  {isAddingMember ? <LoadingSpinner fullPage={false} size={18} /> : <Plus size={16} />}
                  Add
                </Button>
              </form>
            </Card>
          ) : null}
        </div>
      </Card>

      <SectionHeading
        eyebrow="Member Roster"
        title="Everyone in the room"
      />

      <div
        className="surface-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        {sortedMembers.map((member) => {
          const memberIsLeader = member.id === group.created_by;
          const memberIsSelf = member.id === user?.id;

          return (
            <Card key={member.id} interactive className="surface-grid">
              <div className="card__header">
                <span className="member-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
                  {getInitial(member.full_name)}
                </span>

                {isLeader && !memberIsSelf ? (
                  <Button
                    type="button"
                    variant="icon"
                    iconOnly
                    onClick={() =>
                      setConfirmState({
                        type: 'remove',
                        member,
                        isSubmitting: false,
                      })
                    }
                    aria-label={`Remove ${member.full_name}`}
                  >
                    <TrashSimple size={16} />
                  </Button>
                ) : null}
              </div>

              <div>
                <div className="cluster">
                  <h2 className="card__title">{member.full_name}</h2>
                  {memberIsLeader ? (
                    <span className="pill pill--amber">
                      <Crown size={14} />
                      Leader
                    </span>
                  ) : null}
                  {memberIsSelf ? <span className="pill pill--blue">You</span> : null}
                </div>
              </div>

              <div className="surface-grid">
                <div className="cluster mono muted" style={{ fontSize: '13px' }}>
                  <EnvelopeSimple size={14} />
                  <span>{member.email}</span>
                </div>
                <div className="toolbar">
                  <span className="eyebrow">Student ID</span>
                  <span className="mono">{member.student_id}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {isLeader ? (
        <Card variant="accent" accent="var(--accent-red)">
          <div className="toolbar">
            <div>
              <p className="eyebrow" style={{ color: 'var(--accent-red)' }}>
                Danger Zone
              </p>
              <h2 className="section-heading__title" style={{ marginTop: 8 }}>
                Delete this group
              </h2>
              <p className="page-description">
                This removes every member from the group and resets your team workspace.
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                setConfirmState({
                  type: 'delete',
                  member: null,
                  isSubmitting: false,
                })
              }
            >
              Delete Group
            </Button>
          </div>
        </Card>
      ) : null}

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
    </Page>
  );
}
