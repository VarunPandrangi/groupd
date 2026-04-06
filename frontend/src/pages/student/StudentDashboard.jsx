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
      <div className="grid gap-3 metric">
        <div
          className="inline-flex items-center justify-center rounded-xl metric__icon"
          style={{ background: toSoftAccent(accent), color: accent }}
        >
          {icon}
        </div>
        <div>
          <div className="text-3xl font-bold tracking-tight metric__value">
            <AnimatedCounter target={value} />
          </div>
          <p className="text-sm font-medium metric__label">{title}</p>
        </div>
      </div>
    </Card>
  );
}

function StudentDashboardSkeleton() {
  return (
    <div className="grid gap-4 surface-grid">
      <Skeleton variant="text" width="120px" />
      <Skeleton variant="text" width="360px" height="36px" />
      <div className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--two">
        <Skeleton variant="card" height="260px" />
        <Skeleton variant="card" height="260px" />
      </div>
      <div className="grid gap-4 md:grid-cols-3 stat-grid">
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
          <p className="text-sm leading-relaxed card__copy" style={{ margin: 0 }}>
            Dashboard data is unavailable right now. Please refresh and try again.
          </p>
        </Card>
      ) : null}

      {dashboard && !group ? (
        <Card variant="accent" accent="var(--accent-amber)">
          <div className="grid gap-4 surface-grid">
            <div className="inline-flex items-center justify-center rounded-xl metric__icon" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
              <UsersThree size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight section-heading__title">Create or join a group to get started</h2>
              <p className="text-base leading-relaxed page-description">
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
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--two">
            <FadeUp>
              <Card interactive>
                <div className="flex items-start justify-between gap-3 card__header student-group-card__header">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide eyebrow">Your Group</p>
                    <h2 className="text-2xl font-bold tracking-tight section-heading__title" style={{ marginTop: 10 }}>
                      {group.name}
                    </h2>
                    <p className="text-base leading-relaxed page-description">
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

                <div className="flex items-center gap-3 gap-4 cluster student-group-card__meta">
                  <span className="inline-flex items-center gap-2 rounded-full text-sm font-medium pill pill--blue">
                    <UsersThree size={14} />
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                  {leader ? <span className="inline-flex items-center gap-2 rounded-full text-sm font-medium pill pill--green">Leader: {leader.full_name}</span> : null}
                </div>

                <div className="flex items-center gap-3 items-start cluster student-group-card__members">
                  {members.slice(0, 5).map((member) => (
                    members.length <= 3 ? (
                      <span key={member.id} className="inline-flex items-center gap-2 rounded-full member-chip" title={member.full_name}>
                        <span className="inline-flex items-center justify-center rounded-full member-avatar member-avatar--inline">
                          {getInitials(member.full_name)}
                        </span>
                        <span>{member.full_name}</span>
                      </span>
                    ) : (
                      <span key={member.id} className="inline-flex items-center justify-center rounded-full member-avatar" title={member.full_name}>
                        {getInitials(member.full_name)}
                      </span>
                    )
                  ))}
                  {members.length > 5 ? (
                    <span className="text-sm toolbar__meta">+{members.length - 5} more</span>
                  ) : null}
                </div>
              </Card>
            </FadeUp>

            <FadeUp>
              <Card interactive>
                <div className="grid gap-4 surface-grid">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide eyebrow">Overall Progress</p>
                    <h2 className="text-2xl font-bold tracking-tight section-heading__title" style={{ marginTop: 10 }}>
                      {submittedCount} of {totalAssignments} assignments submitted
                    </h2>
                    <p className="text-base leading-relaxed page-description">
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

          <StaggerGroup className="grid gap-4 md:grid-cols-3 stat-grid">
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
            <div className="grid gap-2 section-heading">
              <p className="text-xs font-medium uppercase tracking-wide eyebrow">Upcoming Deadlines</p>
              <h2 className="text-2xl font-bold tracking-tight section-heading__title">The next moments that matter</h2>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <Card className="rounded-xl border p-4 card--compact" style={{ marginTop: 20 }}>
                <p className="text-sm leading-relaxed card__copy" style={{ margin: 0 }}>
                  No pending deadlines right now. Your group is either fully submitted or waiting on new assignments to be published.
                </p>
              </Card>
            ) : (
              <div className="grid divider-list" style={{ marginTop: 12 }}>
                {upcomingDeadlines.map((assignment) => (
                  <button
                    key={assignment.id}
                    type="button"
                    className="flex items-center justify-between gap-4 transition duration-200 list-row list-row--interactive"
                    onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                  >
                    <div>
                      <div className="text-sm font-semibold table__title">{assignment.title}</div>
                      <span className="text-sm leading-relaxed table__description mono">
                        <CalendarDots size={14} style={{ display: 'inline', marginRight: 6 }} />
                        Due {formatAssignmentDate(assignment.due_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 cluster">
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
