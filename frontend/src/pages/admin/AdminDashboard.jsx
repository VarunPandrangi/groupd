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
import SummaryCard from '../../components/admin/SummaryCard';
import Skeleton from '../../components/common/Skeleton';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Page, PageHeader, SectionHeading } from '../../components/common/Page';
import dashboardService from '../../services/dashboardService';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function truncateLabel(value, maxLength = 14) {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function getAssignmentBarColor(completionRate) {
  if (completionRate > 75) {
    return 'var(--accent-green)';
  }

  if (completionRate >= 25) {
    return 'var(--accent-amber)';
  }

  return 'var(--accent-red)';
}

function getGroupBarColor(group) {
  return group.group_deleted ? 'var(--text-muted)' : 'var(--accent-blue)';
}

function ChartTooltip({ title, subtitle, percentage, badgeLabel = null }) {
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__header">
        <p className="table__title" style={{ margin: 0 }}>
          {title}
        </p>
        {badgeLabel ? (
          <span
            className="status-badge"
            style={{
              background: 'var(--accent-amber-soft)',
              color: 'var(--accent-amber)',
            }}
          >
            {badgeLabel}
          </span>
        ) : null}
      </div>
      <p className="table__description" style={{ marginTop: 8 }}>
        {subtitle}
      </p>
      <p className="mono muted" style={{ margin: '10px 0 0', fontSize: '13px' }}>
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

function ChartCard({ eyebrow, title, children }) {
  return (
    <Card>
      <SectionHeading eyebrow={eyebrow} title={title} />
      <div className="chart-card__canvas">{children}</div>
    </Card>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="surface-grid">
      <Skeleton variant="text" width="120px" />
      <Skeleton variant="text" width="280px" height="36px" />
      <div className="surface-grid surface-grid--four">
        <Skeleton variant="card" height="170px" />
        <Skeleton variant="card" height="170px" />
        <Skeleton variant="card" height="170px" />
        <Skeleton variant="card" height="170px" />
      </div>
      <div className="surface-grid surface-grid--two">
        <Skeleton variant="chart" />
        <Skeleton variant="chart" />
      </div>
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
    typeof window !== 'undefined' ? window.innerWidth <= 480 : false
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
      setIsCompactChart(window.innerWidth <= 480);
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
  const xAxisTickFontSize = isCompactChart ? 11 : 12;
  const xAxisTickLength = isCompactChart ? 8 : 12;
  const xAxisHeight = isCompactChart ? 52 : 30;
  const xAxisAngle = isCompactChart ? -16 : 0;
  const xAxisTextAnchor = isCompactChart ? 'end' : 'middle';
  const chartBottomMargin = isCompactChart ? 16 : 8;
  const chartBarSize = isCompactChart ? 28 : 32;

  return (
    <Page>
      <PageHeader
        eyebrow="Admin Workspace"
        eyebrowAccent
        title="Dashboard"
        description="Track class-wide momentum, spot lagging groups early, and move from raw submission logs to a clearer picture of performance."
      />

      {!summary ? (
        <Card>
          <p className="card__copy" style={{ margin: 0 }}>
            Dashboard data is unavailable right now. Please refresh and try again.
          </p>
        </Card>
      ) : (
        <>
          <div className="surface-grid surface-grid--four">
            <SummaryCard
              title="Total Students"
              value={summary.totalStudents}
              icon={Users}
              color="var(--accent-blue)"
            />
            <SummaryCard
              title="Total Groups"
              value={summary.totalGroups}
              icon={UsersFour}
              color="var(--accent-green)"
            />
            <SummaryCard
              title="Active Assignments"
              value={summary.totalAssignments}
              icon={FileText}
              color="var(--accent-amber)"
            />
            <SummaryCard
              title="Completion Rate"
              value={roundedCompletionRate}
              icon={TrendUp}
              color="var(--accent-blue)"
            />
          </div>

          <div className="surface-grid surface-grid--two">
            <ChartCard
              eyebrow="Assignment Completion"
              title="How each assignment is progressing"
            >
              {assignmentAnalytics.length === 0 ? (
                <Card className="card--compact" style={{ height: '100%' }}>
                  <p className="card__copy" style={{ margin: 0 }}>
                    No assignment analytics yet. Once assignments are published and groups begin submitting, this chart will fill in.
                  </p>
                </Card>
              ) : (
                <ResponsiveContainer>
                  <ReBarChart
                    data={assignmentAnalytics}
                    margin={{ top: 18, right: 12, left: 8, bottom: chartBottomMargin }}
                  >
                    <CartesianGrid
                      stroke="var(--border-default)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="title"
                      tickFormatter={(value) => truncateLabel(value, xAxisTickLength)}
                      tick={{ fill: 'var(--text-muted)', fontSize: xAxisTickFontSize }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={isCompactChart ? 12 : 8}
                      minTickGap={isCompactChart ? 8 : 16}
                      interval={0}
                      angle={xAxisAngle}
                      textAnchor={xAxisTextAnchor}
                      height={xAxisHeight}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      width={52}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--accent-blue-soft)' }}
                      content={<AssignmentTooltip />}
                    />
                    <Bar dataKey="completion_rate" radius={[4, 4, 0, 0]} barSize={chartBarSize}>
                      {assignmentAnalytics.map((assignment) => (
                        <Cell
                          key={assignment.id}
                          fill={getAssignmentBarColor(assignment.completion_rate)}
                        />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard eyebrow="Group Performance" title="Which teams are staying ahead">
              {groupAnalytics.length === 0 ? (
                <Card className="card--compact" style={{ height: '100%' }}>
                  <p className="card__copy" style={{ margin: 0 }}>
                    No group analytics yet. Create groups and assign work to see performance trends here.
                  </p>
                </Card>
              ) : (
                <ResponsiveContainer>
                  <ReBarChart
                    data={groupAnalytics}
                    margin={{ top: 18, right: 12, left: 8, bottom: chartBottomMargin }}
                  >
                    <CartesianGrid
                      stroke="var(--border-default)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickFormatter={(value) => truncateLabel(value, xAxisTickLength)}
                      tick={{ fill: 'var(--text-muted)', fontSize: xAxisTickFontSize }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={isCompactChart ? 12 : 8}
                      minTickGap={isCompactChart ? 8 : 16}
                      interval={0}
                      angle={xAxisAngle}
                      textAnchor={xAxisTextAnchor}
                      height={xAxisHeight}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      width={52}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--accent-blue-soft)' }}
                      content={<GroupTooltip />}
                    />
                    <Bar dataKey="completion_rate" radius={[4, 4, 0, 0]} barSize={chartBarSize}>
                      {groupAnalytics.map((group, index) => (
                        <Cell
                          key={`${group.id ?? 'deleted'}-${group.name}-${index}`}
                          fill={getGroupBarColor(group)}
                        />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <Card>
            <SectionHeading
              eyebrow="Quick Actions"
              title="Jump straight into the next move"
            />
            <div
              className="surface-grid surface-grid--three"
              style={{ marginTop: '18px' }}
            >
              {[
                {
                  label: 'Create Assignment',
                  path: '/admin/assignments/new',
                  color: 'var(--accent-blue)',
                },
                {
                  label: 'View Groups',
                  path: '/admin/groups',
                  color: 'var(--accent-green)',
                },
                {
                  label: 'Track Submissions',
                  path: '/admin/submissions',
                  color: 'var(--accent-amber)',
                },
              ].map((action) => (
                <Card
                  key={action.path}
                  as="button"
                  interactive
                  className="card--compact toolbar"
                  style={{
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'var(--bg-card)',
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <span className="table__title">{action.label}</span>
                  <ArrowRight size={18} color={action.color} />
                </Card>
              ))}
            </div>
          </Card>
        </>
      )}
    </Page>
  );
}
