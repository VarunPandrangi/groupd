import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  FileText,
  TrendUp,
  Users,
  UsersFour,
} from '@phosphor-icons/react';
import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Skeleton from '../../components/common/Skeleton';
import { Page } from '../../components/common/Page';
import dashboardService from '../../services/dashboardService';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function truncateLabel(value, maxLength = 14) {
  if (!value) {
    return '';
  }

  const normalized = value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

  return normalized.toUpperCase();
}

function getAssignmentBarColor(completionRate) {
  if (completionRate < 35) {
    return '#be0f1b';
  }

  if (completionRate < 55) {
    return '#737880';
  }

  if (completionRate < 80) {
    return '#222731';
  }

  return '#dbdee3';
}

function getGroupBarColor(group) {
  if (group.group_deleted) {
    return '#9ea3ad';
  }

  if (group.completion_rate < 50) {
    return '#be0f1b';
  }

  if (group.completion_rate < 80) {
    return '#222731';
  }

  return '#737880';
}

function ChartTooltip({ title, subtitle, percentage, badgeLabel = null }) {
  return (
    <div className="admin-dashboard__tooltip">
      <div className="admin-dashboard__tooltip-header">
        <p className="admin-dashboard__tooltip-title">
          {title}
        </p>
        {badgeLabel ? (
          <span className="admin-dashboard__tooltip-badge">
            {badgeLabel}
          </span>
        ) : null}
      </div>
      <p className="admin-dashboard__tooltip-subtitle">
        {subtitle}
      </p>
      <p className="admin-dashboard__tooltip-metric">
        {percentage}%
      </p>
    </div>
  );
}

function AssignmentTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const assignment = payload[0].payload;

  return (
    <ChartTooltip
      title={assignment.title}
      subtitle={`${assignment.groups_submitted}/${assignment.groups_assigned} groups submitted`}
      percentage={Math.round(assignment.completion_rate)}
    />
  );
}

function GroupTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const group = payload[0].payload;

  return (
    <ChartTooltip
      title={group.name}
      subtitle={`${group.submitted_assignments}/${group.total_assignments} assignments submitted`}
      percentage={Math.round(group.completion_rate)}
      badgeLabel={group.group_deleted ? 'Deleted' : null}
    />
  );
}

function ChartCard({ title, axisLabel, children }) {
  return (
    <section className="admin-dashboard__chart-card">
      <header className="admin-dashboard__chart-head">
        <h2 className="admin-dashboard__chart-title">{title}</h2>
      </header>
      <div className="admin-dashboard__chart-canvas">{children}</div>
      <p className="admin-dashboard__chart-axis-label">{axisLabel}</p>
    </section>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <Skeleton variant="text" width="148px" />
        <Skeleton variant="text" width="256px" height="56px" />
        <Skeleton variant="text" width="520px" />
      </div>

      <div className="admin-dashboard__stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="card" height="196px" />
        ))}
      </div>

      <div className="admin-dashboard__charts-grid">
        <Skeleton variant="chart" />
        <Skeleton variant="chart" />
      </div>

      <Skeleton variant="card" height="220px" />
    </div>
  );
}

function AdminMetricCard({ title, value, icon: Icon, tone, isPercentage = false }) {
  return (
    <section className={`admin-dashboard__metric-card admin-dashboard__metric-card--${tone}`}>
      <div className="admin-dashboard__metric-head">
        <p className="admin-dashboard__metric-label">{title}</p>
        <div className={`admin-dashboard__metric-icon admin-dashboard__metric-icon--${tone}`}>
          {Icon ? <Icon size={14} weight="bold" /> : null}
        </div>
      </div>
      <div className="admin-dashboard__metric-value">
        {value}
        {isPercentage ? '%' : null}
      </div>
    </section>
  );
}

function ChartEmptyState({ children }) {
  return (
    <div className="admin-dashboard__chart-empty">
      <p>{children}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [assignmentAnalytics, setAssignmentAnalytics] = useState([]);
  const [groupAnalytics, setGroupAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompactChart, setIsCompactChart] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const [nextSummary, nextAssignments, nextGroups] = await Promise.all([
          dashboardService.getAdminSummary(),
          dashboardService.getAssignmentAnalytics(),
          dashboardService.getGroupAnalytics(),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary(nextSummary);
        setAssignmentAnalytics(nextAssignments);
        setGroupAnalytics(
          [...nextGroups].sort(
            (left, right) =>
              right.completion_rate - left.completion_rate ||
              Number(left.group_deleted) - Number(right.group_deleted) ||
              left.name.localeCompare(right.name)
          )
        );
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load the admin dashboard.'));
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

  useEffect(() => {
    function handleResize() {
      setIsCompactChart(window.innerWidth <= 640);
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const roundedCompletionRate = Math.round(summary?.overallCompletionRate ?? 0);
  const xAxisTickFontSize = isCompactChart ? 9 : 10;
  const xAxisTickLength = isCompactChart ? 8 : 12;
  const xAxisHeight = isCompactChart ? 54 : 30;
  const xAxisAngle = isCompactChart ? -14 : 0;
  const xAxisTextAnchor = isCompactChart ? 'end' : 'middle';
  const chartBottomMargin = isCompactChart ? 24 : 12;
  const chartBarSize = isCompactChart ? 22 : 44;

  return (
    <Page className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1 className="admin-dashboard__workspace-title">Admin Workspace</h1>
      </header>

      {!summary ? (
        <section className="admin-dashboard__empty-card">
          <p className="admin-dashboard__empty-copy">
            Dashboard data is unavailable right now. Please refresh and try again.
          </p>
        </section>
      ) : (
        <>
          <div className="admin-dashboard__stats-grid">
            <AdminMetricCard
              title="Total Students"
              value={summary.totalStudents}
              icon={Users}
              tone="neutral"
            />
            <AdminMetricCard
              title="Total Groups"
              value={summary.totalGroups}
              icon={UsersFour}
              tone="neutral"
            />
            <AdminMetricCard
              title="Active Assignments"
              value={summary.totalAssignments}
              icon={FileText}
              tone="critical"
            />
            <AdminMetricCard
              title="Completion Rate"
              value={roundedCompletionRate}
              icon={TrendUp}
              tone="neutral"
              isPercentage
            />
          </div>

          <div className="admin-dashboard__charts-grid">
            <ChartCard
              title="How each assignment is progressing (Assignment Completion %)"
              axisLabel="Assignments"
            >
              {assignmentAnalytics.length === 0 ? (
                <ChartEmptyState>
                  No assignment analytics yet. Once assignments are published and groups begin
                  submitting, this chart will fill in.
                </ChartEmptyState>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={assignmentAnalytics}
                    margin={{ top: 8, right: 8, left: -10, bottom: chartBottomMargin }}
                  >
                    <CartesianGrid
                      stroke="rgba(98, 104, 118, 0.35)"
                      strokeDasharray="3 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="title"
                      tickFormatter={(value) => truncateLabel(value, xAxisTickLength)}
                      tick={{ fill: 'var(--admin-dashboard-chart-axis)', fontSize: xAxisTickFontSize, fontWeight: 700 }}
                      axisLine={{ stroke: '#1c212b', strokeWidth: 1.3 }}
                      tickLine={false}
                      tickMargin={isCompactChart ? 10 : 12}
                      minTickGap={isCompactChart ? 8 : 18}
                      interval={0}
                      angle={xAxisAngle}
                      textAnchor={xAxisTextAnchor}
                      height={xAxisHeight}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: 'var(--admin-dashboard-chart-axis)', fontSize: 10, fontWeight: 700 }}
                      axisLine={{ stroke: '#1c212b', strokeWidth: 1.3 }}
                      tickLine={false}
                      tickMargin={10}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(28, 33, 43, 0.08)' }}
                      content={<AssignmentTooltip />}
                    />
                    <Bar dataKey="completion_rate" radius={[0, 0, 0, 0]} barSize={chartBarSize}>
                      {assignmentAnalytics.map((assignment, index) => (
                        <Cell
                          key={assignment.id ?? `assignment-${index}`}
                          fill={getAssignmentBarColor(assignment.completion_rate)}
                          stroke="#1c212b"
                          strokeWidth={1.2}
                        />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title="Which teams are staying ahead (Team Performance %)"
              axisLabel="Teams"
            >
              {groupAnalytics.length === 0 ? (
                <ChartEmptyState>
                  No group analytics yet. Create groups and assign work to see performance trends
                  here.
                </ChartEmptyState>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart
                    data={groupAnalytics}
                    margin={{ top: 8, right: 8, left: -10, bottom: chartBottomMargin }}
                  >
                    <CartesianGrid
                      stroke="rgba(98, 104, 118, 0.35)"
                      strokeDasharray="3 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(value) => truncateLabel(value, xAxisTickLength)}
                      tick={{ fill: 'var(--admin-dashboard-chart-axis)', fontSize: xAxisTickFontSize, fontWeight: 700 }}
                      axisLine={{ stroke: '#1c212b', strokeWidth: 1.3 }}
                      tickLine={false}
                      tickMargin={isCompactChart ? 10 : 12}
                      minTickGap={isCompactChart ? 8 : 18}
                      interval={0}
                      angle={xAxisAngle}
                      textAnchor={xAxisTextAnchor}
                      height={xAxisHeight}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: 'var(--admin-dashboard-chart-axis)', fontSize: 10, fontWeight: 700 }}
                      axisLine={{ stroke: '#1c212b', strokeWidth: 1.3 }}
                      tickLine={false}
                      tickMargin={10}
                      width={40}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(28, 33, 43, 0.08)' }}
                      content={<GroupTooltip />}
                    />
                    <Bar dataKey="completion_rate" radius={[0, 0, 0, 0]} barSize={chartBarSize}>
                      {groupAnalytics.map((group, index) => (
                        <Cell
                          key={`${group.id ?? 'deleted'}-${group.name}-${index}`}
                          fill={getGroupBarColor(group)}
                          stroke="#1c212b"
                          strokeWidth={1.2}
                        />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <section className="admin-dashboard__actions-card">
            <h2 className="admin-dashboard__actions-label">Quick Actions</h2>
            <div className="admin-dashboard__actions-grid">
              {[
                {
                  label: 'Create Assignment',
                  path: '/admin/assignments/new',
                  tone: 'default',
                },
                {
                  label: 'View Groups',
                  path: '/admin/groups',
                  tone: 'default',
                },
                {
                  label: 'Track Submissions',
                  path: '/admin/submissions',
                  tone: 'critical',
                },
              ].map((action) => (
                <button
                  key={action.path}
                  type="button"
                  className={`admin-dashboard__action admin-dashboard__action--${action.tone}`}
                  onClick={() => navigate(action.path)}
                >
                  <span className="admin-dashboard__action-label">{action.label}</span>
                  <span className="admin-dashboard__action-icon">
                    <ArrowRight size={22} weight="regular" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </Page>
  );
}
