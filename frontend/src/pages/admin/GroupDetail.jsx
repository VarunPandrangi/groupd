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
import { cx } from '../../utils/cx';

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

      <div className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--two">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide eyebrow">Leader</p>
          <div className="flex items-center gap-3 cluster" style={{ marginTop: 10 }}>
            <div className="inline-flex items-center justify-center rounded-xl metric__icon" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
              <Crown size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold table__title">{leader?.full_name || 'Unavailable'}</div>
              <span className="text-sm leading-relaxed table__description">Group lead</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-medium uppercase tracking-wide eyebrow">Snapshot</p>
          <div className="grid gap-4 surface-grid" style={{ marginTop: 10 }}>
            <div className="text-sm font-semibold table__title">{members.length} members</div>
            <span className="text-sm leading-relaxed table__description">Created on {formatDate(group.created_at)}</span>
          </div>
        </Card>
      </div>

      <Card className="rounded-xl border overflow-hidden w-full table-card">
        <div className="grid gap-2 section-heading" style={{ marginBottom: 12 }}>
          <p className="text-xs font-medium uppercase tracking-wide eyebrow">Members</p>
          <h2 className="text-2xl font-bold tracking-tight section-heading__title">Current roster</h2>
        </div>

        <div className="overflow-x-auto w-full table-wrap">
          <table className="w-full table" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th className="justify-center table__column--center">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const memberRole = member.id === group.created_by ? 'Leader' : 'Member';

                return (
                  <tr key={member.id}>
                    <td className="text-sm font-semibold table__title">{member.full_name}</td>
                    <td className="text-sm mono">{member.email}</td>
                    <td className="text-sm mono">{member.student_id}</td>
                    <td className="justify-center table__cell--center">
                      <span
                        className={cx(
                          'inline-flex items-center gap-2 rounded-full text-sm font-medium pill',
                          memberRole === 'Leader' ? 'pill--amber' : 'pill--blue'
                        )}
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
