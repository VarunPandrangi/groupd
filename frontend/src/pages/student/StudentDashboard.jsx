import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CalendarDots,
  CheckCircle,
  ClockCountdown,
  FileText,
  UsersThree,
} from '@phosphor-icons/react';
import Skeleton from '../../components/common/Skeleton';
import StatusBadge from '../../components/common/StatusBadge';
import ProgressBar from '../../components/student/ProgressBar';
import AnimatedCounter from '../../components/common/AnimatedCounter';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { FadeUp, Page, PageHeader, StaggerGroup } from '../../components/common/Page';
import dashboardService from '../../services/dashboardService';
import { useAuthStore } from '../../stores/authStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function getInitials(name) {
  return String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
}

function toSoftAccent(accent) {
  if (accent === 'var(--accent-green)') {
    return 'var(--accent-green-soft)';
  }

  if (accent === 'var(--accent-amber)') {
    return 'var(--accent-amber-soft)';
  }

  if (accent === 'var(--accent-red)') {
    return 'var(--accent-red-soft)';
  }

  return 'var(--accent-blue-soft)';
}

function StatCard({ title, value, icon, accent }) {
  return (
    <Card variant="accent" accent={accent}>
      <div className="metric">
        <div
          className="metric__icon"
          style={{ background: toSoftAccent(accent), color: accent }}
        >
          {icon}
        </div>
        <div>
          <div className="metric__value">
            <AnimatedCounter target={value} />
          </div>
          <p className="metric__label">{title}</p>
        </div>
      </div>
    </Card>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="surface-grid">
      <Skeleton variant="text" width="120px" />
      <Skeleton variant="text" width="360px" height="36px" />
      <div className="surface-grid surface-grid--two">
        <Skeleton variant="card" height="260px" />
        <Skeleton variant="card" height="260px" />
      </div>
      <div className="stat-grid">
        <Skeleton variant="card" height="170px" />
        <Skeleton variant="card" height="170px" />
        <Skeleton variant="card" height="170px" />
      </div>
      <Skeleton variant="card" height="260px" />
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const nextDashboard = await dashboardService.getStudentDashboard();

        if (isMounted) {
          setDashboard(nextDashboard);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load your dashboard.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <StudentDashboardSkeleton />;
  }

  const group = dashboard?.group ?? null;
  const members = group?.members ?? [];
  const leader = members.find((member) => member.id === group?.created_by) ?? null;
  const totalAssignments = dashboard?.totalAssignments ?? 0;
  const submittedCount = dashboard?.submittedCount ?? 0;
  const pendingCount = dashboard?.pendingCount ?? 0;
  const upcomingDeadlines = dashboard?.upcomingDeadlines ?? [];

  return (
    <Page>
      <PageHeader
        eyebrow="Student Workspace"
        eyebrowAccent
        title={`Welcome back, ${user?.full_name ?? 'Student'}`}
        description="Keep your group organized, stay ahead of deadlines, and make submission status visible without digging through clutter."
      />

      {!dashboard ? (
        <Card>
          <p className="card__copy" style={{ margin: 0 }}>
            Dashboard data is unavailable right now. Please refresh and try again.
          </p>
        </Card>
      ) : null}

      {dashboard && !group ? (
        <Card variant="accent" accent="var(--accent-amber)">
          <div className="surface-grid">
            <div className="metric__icon" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
              <UsersThree size={22} />
            </div>
            <div>
              <h2 className="section-heading__title">Create or join a group to get started</h2>
              <p className="page-description">
                Your dashboard comes to life once you are part of a group. Join your teammates to unlock assignment stats, upcoming deadlines, and submission tracking.
              </p>
            </div>
            <div>
              <Button type="button" onClick={() => navigate('/student/group/create')}>
                Create a Group
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {dashboard && group ? (
        <>
          <StaggerGroup className="surface-grid surface-grid--two">
            <FadeUp>
              <Card interactive>
                <div className="card__header">
                  <div>
                    <p className="eyebrow">Your Group</p>
                    <h2 className="section-heading__title" style={{ marginTop: 10 }}>
                      {group.name}
                    </h2>
                    <p className="page-description">
                      {leader
                        ? `${leader.full_name} is leading a ${members.length}-member team.`
                        : `${members.length} members are currently in this group.`}
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={() => navigate('/student/group')}>
                    Manage
                    <ArrowRight size={16} />
                  </Button>
                </div>

                <div className="cluster">
                  <span className="pill pill--blue">
                    <UsersThree size={14} />
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                  {leader ? <span className="pill pill--green">Leader: {leader.full_name}</span> : null}
                </div>

                <div className="cluster">
                  {members.slice(0, 5).map((member) => (
                    <span key={member.id} className="member-avatar" title={member.full_name}>
                      {getInitials(member.full_name)}
                    </span>
                  ))}
                  {members.length > 5 ? (
                    <span className="toolbar__meta">+{members.length - 5} more</span>
                  ) : null}
                </div>
              </Card>
            </FadeUp>

            <FadeUp>
              <Card interactive>
                <div className="surface-grid">
                  <div>
                    <p className="eyebrow">Overall Progress</p>
                    <h2 className="section-heading__title" style={{ marginTop: 10 }}>
                      {submittedCount} of {totalAssignments} assignments submitted
                    </h2>
                    <p className="page-description">
                      {pendingCount === 0
                        ? 'Your group is fully caught up right now.'
                        : `${pendingCount} assignment${pendingCount === 1 ? '' : 's'} still need group confirmation.`}
                    </p>
                  </div>
                  <ProgressBar
                    current={submittedCount}
                    total={Math.max(totalAssignments, 1)}
                    showLabel
                    size="lg"
                  />
                  <div>
                    <Button type="button" variant="secondary" onClick={() => navigate('/student/progress')}>
                      View Progress
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            </FadeUp>
          </StaggerGroup>

          <StaggerGroup className="stat-grid">
            <FadeUp>
              <StatCard
                title="Total Assignments"
                value={totalAssignments}
                icon={<FileText size={20} />}
                accent="var(--accent-blue)"
              />
            </FadeUp>
            <FadeUp>
              <StatCard
                title="Submitted"
                value={submittedCount}
                icon={<CheckCircle size={20} />}
                accent="var(--accent-green)"
              />
            </FadeUp>
            <FadeUp>
              <StatCard
                title="Pending"
                value={pendingCount}
                icon={<ClockCountdown size={20} />}
                accent="var(--accent-amber)"
              />
            </FadeUp>
          </StaggerGroup>

          <Card>
            <div className="section-heading">
              <p className="eyebrow">Upcoming Deadlines</p>
              <h2 className="section-heading__title">The next moments that matter</h2>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <Card className="card--compact" style={{ marginTop: 20 }}>
                <p className="card__copy" style={{ margin: 0 }}>
                  No pending deadlines right now. Your group is either fully submitted or waiting on new assignments to be published.
                </p>
              </Card>
            ) : (
              <div className="divider-list" style={{ marginTop: 12 }}>
                {upcomingDeadlines.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    className="list-row list-row--interactive"
                    onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                  >
                    <div>
                      <div className="table__title">{assignment.title}</div>
                      <span className="table__description mono">
                        <CalendarDots size={14} style={{ display: 'inline', marginRight: 6 }} />
                        Due {formatAssignmentDate(assignment.due_date)}
                      </span>
                    </div>
                    <div className="cluster">
                      <StatusBadge status={assignment.status} />
                      <ArrowRight size={16} color="var(--text-faint)" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </Page>
  );
}
