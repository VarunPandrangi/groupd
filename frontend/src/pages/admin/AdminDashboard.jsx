import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  FileText,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SummaryCard from '../../components/admin/SummaryCard';
import Skeleton from '../../components/common/Skeleton';
import dashboardService from '../../services/dashboardService';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function truncateLabel(value, maxLength = 14) {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function getAssignmentBarColor(completionRate) {
  if (completionRate > 75) {
    return 'var(--accent-secondary)';
  }

  if (completionRate >= 25) {
    return 'var(--accent-warning)';
  }

  return 'var(--accent-danger)';
}

function ChartTooltip({ title, subtitle, percentage }) {
  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-tertiary)',
        padding: '10px 12px',
        boxShadow: '0 18px 36px rgba(0, 0, 0, 0.18)',
      }}
    >
      <p
        style={{
          margin: 0,
          color: 'var(--text-primary)',
          fontWeight: 700,
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
        }}
      >
        {subtitle}
      </p>
      <p
        style={{
          margin: '8px 0 0',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
        }}
      >
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
    />
  );
}

function ChartCard({ eyebrow, title, children }) {
  return (
    <article
      className="admin-dashboard-card"
      style={{
        padding: '24px',
        borderRadius: '28px',
        border: '1px solid var(--border-default)',
        background: 'var(--bg-secondary)',
        boxShadow: '0 18px 42px rgba(0, 0, 0, 0.12)',
        display: 'grid',
        gap: '18px',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            marginTop: '8px',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>
      </div>

      {children}
    </article>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <section
        style={{
          borderRadius: '30px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 14%, transparent), transparent 36%), var(--bg-secondary)',
          padding: 'clamp(24px, 4vw, 36px)',
          display: 'grid',
          gap: '14px',
        }}
      >
        <Skeleton width="90px" />
        <Skeleton width="260px" height="56px" />
        <Skeleton width="55%" />
      </section>

      <div
        style={{
          display: 'grid',
          gap: '18px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="card" height="180px" />
        <Skeleton variant="card" height="180px" />
      </div>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
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
            (left, right) => right.completion_rate - left.completion_rate
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

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const roundedCompletionRate = Math.round(summary?.overallCompletionRate ?? 0);

  return (
    <>
      <style>{`
        @keyframes adminDashboardFade {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-dashboard-page {
          animation: adminDashboardFade 420ms ease forwards;
        }

        .admin-dashboard-card:hover,
        .admin-dashboard-action:hover {
          transform: translateY(-3px);
          border-color: var(--border-hover);
          box-shadow: 0 24px 56px rgba(0, 0, 0, 0.16);
        }
      `}</style>

      <div className="admin-dashboard-page" style={{ display: 'grid', gap: '24px' }}>
        <section
          style={{
            borderRadius: '30px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 34%), linear-gradient(180deg, rgba(26, 29, 39, 0.96), rgba(20, 23, 33, 0.98))',
            padding: 'clamp(24px, 4vw, 38px)',
            boxShadow: '0 24px 56px rgba(0, 0, 0, 0.14)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--accent-primary)',
            }}
          >
            Admin Workspace
          </p>

          <h1
            style={{
              marginTop: '12px',
              fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
              lineHeight: 0.96,
              letterSpacing: '-0.05em',
              color: 'var(--text-primary)',
            }}
          >
            Dashboard
          </h1>

          <p
            style={{
              margin: '16px 0 0',
              maxWidth: '60ch',
              lineHeight: 1.8,
              color: 'var(--text-secondary)',
            }}
          >
            Track class-wide momentum, spot lagging groups early, and move from raw
            submission logs to a clearer picture of performance.
          </p>
        </section>

        {!summary ? (
          <section
            style={{
              padding: '26px',
              borderRadius: '24px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
          >
            Dashboard data is unavailable right now. Please refresh and try again.
          </section>
        ) : null}

        {summary ? (
          <>
            <section
              style={{
                display: 'grid',
                gap: '18px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <SummaryCard
                title="Total Students"
                value={summary.totalStudents}
                icon={Users}
                color="var(--accent-primary)"
              />
              <SummaryCard
                title="Total Groups"
                value={summary.totalGroups}
                icon={UsersRound}
                color="var(--accent-secondary)"
              />
              <SummaryCard
                title="Active Assignments"
                value={summary.totalAssignments}
                icon={FileText}
                color="var(--accent-warning)"
              />
              <SummaryCard
                title="Completion Rate"
                value={roundedCompletionRate}
                icon={TrendingUp}
                color="var(--accent-primary)"
              />
            </section>

            <section
              style={{
                display: 'grid',
                gap: '20px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              }}
            >
              <ChartCard
                eyebrow="Assignment Completion"
                title="How every brief is progressing"
              >
                {assignmentAnalytics.length === 0 ? (
                  <div
                    style={{
                      minHeight: '320px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '22px',
                      border: '1px dashed var(--border-default)',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.7,
                      padding: '20px',
                    }}
                  >
                    No assignment analytics yet. Once assignments are published and groups
                    begin submitting, this chart will fill in.
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '340px' }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={assignmentAnalytics}
                        margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
                      >
                        <CartesianGrid
                          stroke="var(--border-default)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="title"
                          tickFormatter={(value) => truncateLabel(value, 12)}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={16}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          cursor={{
                            fill: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                          }}
                          content={<AssignmentTooltip />}
                        />
                        <Bar
                          dataKey="completion_rate"
                          radius={[4, 4, 0, 0]}
                          animationDuration={850}
                        >
                          {assignmentAnalytics.map((assignment) => (
                            <Cell
                              key={assignment.id}
                              fill={getAssignmentBarColor(assignment.completion_rate)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                eyebrow="Group Performance"
                title="Which teams are staying ahead"
              >
                {groupAnalytics.length === 0 ? (
                  <div
                    style={{
                      minHeight: '320px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '22px',
                      border: '1px dashed var(--border-default)',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.7,
                      padding: '20px',
                    }}
                  >
                    No group analytics yet. Create groups and assign work to see
                    performance trends here.
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '340px' }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={groupAnalytics}
                        margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
                      >
                        <CartesianGrid
                          stroke="var(--border-default)"
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tickFormatter={(value) => truncateLabel(value, 12)}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={16}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={40}
                        />
                        <Tooltip
                          cursor={{
                            fill: 'color-mix(in srgb, var(--accent-primary) 10%, transparent)',
                          }}
                          content={<GroupTooltip />}
                        />
                        <Bar
                          dataKey="completion_rate"
                          radius={[4, 4, 0, 0]}
                          fill="var(--accent-primary)"
                          animationDuration={850}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>
            </section>

            <section
              className="admin-dashboard-card"
              style={{
                padding: '24px',
                borderRadius: '28px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                boxShadow: '0 18px 42px rgba(0, 0, 0, 0.12)',
                display: 'grid',
                gap: '18px',
                transition:
                  'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  Quick Actions
                </p>
                <h2
                  style={{
                    marginTop: '8px',
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    letterSpacing: '-0.04em',
                    color: 'var(--text-primary)',
                  }}
                >
                  Jump straight into the next move
                </h2>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '14px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                }}
              >
                {[
                  {
                    label: 'Create Assignment',
                    path: '/admin/assignments/new',
                    color: 'var(--accent-primary)',
                  },
                  {
                    label: 'View Groups',
                    path: '/admin/groups',
                    color: 'var(--accent-secondary)',
                  },
                  {
                    label: 'Track Submissions',
                    path: '/admin/submissions',
                    color: 'var(--accent-warning)',
                  },
                ].map((action) => (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="admin-dashboard-action"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '18px 20px',
                      borderRadius: '20px',
                      border: '1px solid var(--border-default)',
                      background:
                        `color-mix(in srgb, ${action.color} 10%, var(--bg-secondary))`,
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition:
                        'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                    }}
                  >
                    <span>{action.label}</span>
                    <ArrowRight size={18} style={{ color: action.color }} />
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </>
  );
}
