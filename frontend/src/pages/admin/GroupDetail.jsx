import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Crown, UsersThree } from '@phosphor-icons/react';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Page, PageHeader } from '../../components/common/Page';
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
    <Page>
      <PageHeader
        eyebrow="Group Detail"
        eyebrowAccent
        title={group.name}
        description={group.description || 'No group description provided.'}
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/groups')}>
            <ArrowLeft size={16} />
            Back to Groups
          </Button>
        }
      />

      <div className="surface-grid surface-grid--two">
        <Card>
          <p className="eyebrow">Leader</p>
          <div className="cluster" style={{ marginTop: 10 }}>
            <div className="metric__icon" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
              <Crown size={18} />
            </div>
            <div>
              <div className="table__title">{leader?.full_name || 'Unavailable'}</div>
              <span className="table__description">Group lead</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="eyebrow">Snapshot</p>
          <div className="surface-grid" style={{ marginTop: 10 }}>
            <div className="table__title">{members.length} members</div>
            <span className="table__description">Created on {formatDate(group.created_at)}</span>
          </div>
        </Card>
      </div>

      <Card className="table-card">
        <div className="section-heading" style={{ marginBottom: 12 }}>
          <p className="eyebrow">Members</p>
          <h2 className="section-heading__title">Current roster</h2>
        </div>

        <div className="table-wrap">
          <table className="table" style={{ minWidth: 780 }}>
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
                    <td className="table__title">{member.full_name}</td>
                    <td className="mono">{member.email}</td>
                    <td className="mono">{member.student_id}</td>
                    <td>
                      <span
                        className={`pill ${
                          memberRole === 'Leader' ? 'pill--amber' : 'pill--blue'
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
      </Card>
    </Page>
  );
}
