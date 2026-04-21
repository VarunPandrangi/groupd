import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MagnifyingGlass,
  Plus,
  PlusCircle,
  SpinnerGap,
  TrashSimple,
  User,
  UserMinus,
  UserPlus,
  UsersThree,
} from '@phosphor-icons/react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

const MAX_GROUP_MEMBERS = 6;

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

  const openSlotCount = isLeader
    ? Math.max(0, MAX_GROUP_MEMBERS - sortedMembers.length)
    : 0;

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

  const handleJoinExisting = () => {
    toast('Ask a group leader to invite you using your email or student ID.');
  };

  if (!isReady) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return (
      <div className="stitch-dashboard__module-wrap" aria-label="Stitch no-group workspace">
        <section className="stitch-group-empty" aria-labelledby="stitch-group-empty-title">
          <div className="stitch-group-empty__grid" aria-hidden="true" />

          <div className="stitch-group-empty__panel">
            <div className="stitch-group-empty__visual" aria-hidden="true">
              <div className="stitch-group-empty__silhouette" />
              <div className="stitch-group-empty__status-card">
                <UsersThree size={30} weight="fill" />
                <span className="stitch-group-empty__status-rule" />
                <p>STATUS: UNASSIGNED</p>
              </div>
            </div>

            <div className="stitch-group-empty__copy">
              <div className="stitch-group-empty__copy-corners" aria-hidden="true" />

              <p className="stitch-group-empty__eyebrow">
                <span className="stitch-group-empty__eyebrow-dot" />
                ACTION REQUIRED
              </p>

              <h2 id="stitch-group-empty-title" className="stitch-group-empty__title">
                YOU&apos;RE NOT IN A GROUP YET
              </h2>

              <p className="stitch-group-empty__message">
                Create a group to invite classmates, track your team&apos;s progress, and keep
                collaboration organized in one place.
              </p>

              <div className="stitch-group-empty__actions">
                <button
                  type="button"
                  className="stitch-group-empty__button stitch-group-empty__button--primary"
                  onClick={() => navigate('/student/group/create')}
                >
                  <PlusCircle size={17} weight="fill" />
                  CREATE GROUP
                </button>

                <button
                  type="button"
                  className="stitch-group-empty__button stitch-group-empty__button--secondary"
                  onClick={handleJoinExisting}
                >
                  <MagnifyingGlass size={17} />
                  JOIN EXISTING
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div aria-label="Stitch active-group workspace">
      <section className="stitch-group-uniform__panel" aria-labelledby="stitch-group-uniform-title">
        <header className="stitch-group-uniform__hero">
          <div>
            <p className="stitch-group-uniform__hero-kicker">PROJECT ALPHA - FALL SEMESTER</p>
            <h2 id="stitch-group-uniform-title" className="stitch-group-uniform__hero-title">
              {group.name}
            </h2>
            {group.description ? (
              <p className="stitch-group-uniform__hero-meta">{group.description}</p>
            ) : null}
          </div>

          <div className="stitch-group-uniform__hero-status">
            <span className="stitch-group-uniform__hero-status-label">STATUS</span>
            <span className="stitch-group-uniform__hero-status-value">ACTIVE</span>
          </div>
        </header>

        {isLeader && isAddFormOpen ? (
          <section className="stitch-group-uniform__invite" aria-labelledby="stitch-group-uniform-invite">
            <p id="stitch-group-uniform-invite" className="stitch-group-uniform__invite-title">
              INVITE A CLASSMATE
            </p>

            <form onSubmit={handleAddMember} className="stitch-group-uniform__invite-form">
              <input
                type="text"
                className="stitch-group-uniform__input"
                value={memberIdentifier}
                onChange={(event) => setMemberIdentifier(event.target.value)}
                placeholder="student@college.edu or 22CS101"
              />

              <button type="submit" className="stitch-group-uniform__invite-submit" disabled={isAddingMember}>
                {isAddingMember ? <SpinnerGap size={14} className="spinner" /> : <UserPlus size={13} />}
                {isAddingMember ? 'ADDING...' : 'ADD MEMBER'}
              </button>

              <button
                type="button"
                className="stitch-group-uniform__invite-close"
                onClick={() => setIsAddFormOpen(false)}
              >
                CLOSE
              </button>
            </form>
          </section>
        ) : null}

        <div className="stitch-group-uniform__roster-grid">
          {sortedMembers.map((member) => {
            const memberIsSelf = member.id === user?.id;
            const isLeadCard = member.id === group?.created_by;

            return (
              <article
                key={member.id}
                className={`stitch-group-uniform__member-card${
                  isLeadCard ? ' stitch-group-uniform__member-card--lead' : ''
                }`}
              >
                {isLeadCard ? <span className="stitch-group-uniform__member-accent" aria-hidden="true" /> : null}

                {isLeader && !memberIsSelf ? (
                  <button
                    type="button"
                    className="stitch-group-uniform__member-remove"
                    onClick={() =>
                      setConfirmState({
                        type: 'remove',
                        member,
                        isSubmitting: false,
                      })
                    }
                    aria-label={`Remove ${member.full_name}`}
                  >
                    <TrashSimple size={13} />
                  </button>
                ) : null}

                <div className="stitch-group-uniform__member-body">
                  <div className="stitch-group-uniform__member-head">
                    <span className="stitch-group-uniform__member-avatar">
                      <User size={50} />
                    </span>

                    <span
                      className={`stitch-group-uniform__member-label${
                        isLeadCard ? ' stitch-group-uniform__member-label--lead' : ''
                      }`}
                    >
                      {member.student_id}
                    </span>
                  </div>

                  <p className="stitch-group-uniform__member-role">
                    {isLeadCard ? 'Team Leader' : 'Member'}
                  </p>
                  <h3 className="stitch-group-uniform__member-name">{member.full_name}</h3>
                </div>

                <a href={`mailto:${member.email}`} className="stitch-group-uniform__member-action">
                  {member.email}
                </a>
              </article>
            );
          })}

          {Array.from({ length: openSlotCount }).map((_, index) => (
            <button
              key={`open-slot-${index}`}
              type="button"
              className="stitch-group-uniform__open-slot"
              onClick={() => setIsAddFormOpen(true)}
            >
              <span className="stitch-group-uniform__open-slot-icon">
                <Plus size={18} />
              </span>
              <span className="stitch-group-uniform__open-slot-title">OPEN SLOT</span>
              <span className="stitch-group-uniform__open-slot-invite">INVITE MEMBER</span>
            </button>
          ))}
        </div>

        <section className="stitch-group-uniform__danger" aria-labelledby="stitch-group-uniform-danger-title">
          <div className="stitch-group-uniform__danger-copy">
            <p className="stitch-group-uniform__danger-kicker">DANGER ZONE</p>
            <h3 id="stitch-group-uniform-danger-title" className="stitch-group-uniform__danger-title">
              {isLeader ? 'DELETE THIS GROUP' : 'LEAVE THIS GROUP'}
            </h3>
            <p className="stitch-group-uniform__danger-text">
              {isLeader
                ? 'This removes every member from the group and resets your team workspace.'
                : 'Leave this group to return to an unassigned workspace state.'}
            </p>
          </div>

          {isLeader ? (
            <button
              type="button"
              className="stitch-group-uniform__danger-action"
              onClick={() =>
                setConfirmState({
                  type: 'delete',
                  member: null,
                  isSubmitting: false,
                })
              }
            >
              Delete Group
            </button>
          ) : (
            <button
              type="button"
              className="stitch-group-uniform__danger-action stitch-group-uniform__danger-action--secondary"
              onClick={() =>
                setConfirmState({
                  type: 'leave',
                  member: null,
                  isSubmitting: false,
                })
              }
            >
              <UserMinus size={13} />
              Leave Group
            </button>
          )}
        </section>
      </section>

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
    </div>
  );
}
