import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Crown, User, UsersThree } from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Page } from '../../components/common/Page';
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

  const members = useMemo(() => group?.members ?? [], [group?.members]);
  const leader = useMemo(
    () => members.find((member) => member.id === group?.created_by) || null,
    [group?.created_by, members]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return (
      <EmptyState
        icon={UsersThree}
        title="Group not found"
        message="This group may have been deleted or is no longer available."
        actionLabel="Back to Groups"
        onAction={() => navigate('/admin/groups')}
      />
    );
  }

  return (
    <Page className="group-detail-architectural">
      <header className="group-detail-architectural__header">
        <div>
          <h1 className="group-detail-architectural__title">{group.name}</h1>
          <p className="group-detail-architectural__subtitle">
            {group.description || 'No group description provided.'}
          </p>
        </div>

        <div className="group-detail-architectural__header-actions">
          <button
            type="button"
            className="group-detail-architectural__action-btn"
            onClick={() => toast('Edit flow is not available yet.')}
          >
            Edit Group
          </button>
          <button
            type="button"
            className="group-detail-architectural__action-btn group-detail-architectural__action-btn--secondary"
            onClick={() => navigate('/admin/groups')}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </header>

      <section className="group-detail-architectural__summary-grid">
        <article className="group-detail-architectural__card">
          <div className="group-detail-architectural__card-head">
            <span>Leader</span>
            <Crown size={18} weight="fill" />
          </div>
          <div className="group-detail-architectural__leader-body">
            <span className="group-detail-architectural__avatar-box" aria-hidden="true">
              <User size={22} weight="fill" />
            </span>
            <div>
              <p className="group-detail-architectural__leader-name">
                {leader?.full_name || 'Unavailable'}
              </p>
              <p className="group-detail-architectural__leader-role">Group Lead</p>
            </div>
          </div>
        </article>

        <article className="group-detail-architectural__card">
          <div className="group-detail-architectural__card-head">
            <span>Snapshot</span>
          </div>
          <div className="group-detail-architectural__snapshot">
            <div className="group-detail-architectural__snapshot-pane">
              <strong>{members.length}</strong>
              <span>Members</span>
            </div>
            <div className="group-detail-architectural__snapshot-pane">
              <strong>{formatDate(group.created_at)}</strong>
              <span>Created On</span>
            </div>
          </div>
        </article>
      </section>

      <section className="group-detail-architectural__table-card">
        <div className="group-detail-architectural__table-head">
          <span>Members</span>
          <span className="group-detail-architectural__table-chip">Current Roster</span>
        </div>

        <div className="group-detail-architectural__table-wrap">
          <table className="group-detail-architectural__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberRole = member.id === group.created_by ? 'Leader' : 'Member';

                return (
                  <tr key={member.id}>
                    <td>
                      <div className="group-detail-architectural__name-cell">
                        <span className="group-detail-architectural__name-icon" aria-hidden="true">
                          <User size={14} weight="fill" />
                        </span>
                        <span>{member.full_name}</span>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td className="mono">{member.student_id}</td>
                    <td>
                      <span
                        className={`group-detail-architectural__role ${
                          memberRole === 'Leader'
                            ? 'group-detail-architectural__role--leader'
                            : ''
                        }`}
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
    </Page>
  );
}
