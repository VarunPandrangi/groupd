import { useEffect, useMemo, useState } from 'react';
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
import assignmentService from '../../services/assignmentService';
import courseService from '../../services/courseService';
import groupService from '../../services/groupService';
import submissionService from '../../services/submissionService';

const ALL_COURSES_VALUE = '__all_courses__';
const TOP_INDIVIDUAL_PERFORMANCE_LIMIT = 5;
const ALL_STUDENTS_ROW_HEIGHT = 32;
const MIN_ALL_STUDENTS_CHART_HEIGHT = 260;

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function roundToTwo(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Number(numericValue.toFixed(2));
}

function toId(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function toSafeLower(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeStudentName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeStudent(student, index = 0) {
  const id = toId(student?.id ?? student?._id);
  const email = toSafeLower(student?.email);
  const fullName = String(student?.full_name ?? student?.fullName ?? '').trim();
  const fallbackLabel = fullName || email || `Student ${index + 1}`;

  return {
    id,
    email,
    full_name: fallbackLabel,
    key: id ?? email ?? `student:${index}`,
  };
}

function normalizeCourse(course, index = 0) {
  const id = toId(course?.id ?? course?._id);
  const code = String(course?.code ?? '').trim();
  const name = String(course?.name ?? '').trim() || `Course ${index + 1}`;
  const label = code && name ? `${code} - ${name}` : code || name;

  return {
    id,
    code,
    name,
    label,
  };
}

function normalizeAssignment(assignment) {
  const id = toId(assignment?.id ?? assignment?._id);
  const title = String(assignment?.title ?? '').trim() || 'Untitled Assignment';
  const courseId = toId(
    assignment?.course_id ??
      assignment?.course ??
      assignment?.course?._id ??
      assignment?.course?.id
  );
  const submissionType = String(
    assignment?.submission_type ?? assignment?.submissionType ?? 'group'
  ).toLowerCase();
  const assignTo = String(assignment?.assign_to ?? 'all').toLowerCase();
  const targetGroupIds = Array.isArray(assignment?.groups)
    ? assignment.groups
        .map((group) => toId(group?.id ?? group?._id))
        .filter(Boolean)
    : [];

  return {
    id,
    title,
    course_id: courseId,
    submission_type: submissionType === 'individual' ? 'individual' : 'group',
    assign_to: assignTo === 'specific' ? 'specific' : 'all',
    target_group_ids: targetGroupIds,
  };
}

function normalizeSubmission(submission) {
  return {
    group_id: toId(submission?.group_id),
    group_name: String(submission?.group_name ?? '').trim(),
    submitted_by_email: toSafeLower(submission?.submitted_by_email),
    submitted_by_name: String(submission?.submitted_by_name ?? '').trim(),
  };
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

function getPerformanceBarColor(completionRate) {
  if (completionRate < 50) {
    return '#be0f1b';
  }

  if (completionRate < 80) {
    return '#222731';
  }

  return '#737880';
}

function buildFocusedPerformanceData(rows, limit = TOP_INDIVIDUAL_PERFORMANCE_LIMIT) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  if (rows.length <= limit) {
    return rows;
  }

  const topRows = rows.slice(0, limit);
  const otherRows = rows.slice(limit);
  const aggregatedTotals = otherRows.reduce(
    (accumulator, row) => {
      accumulator.totalAssignments += Number(row.total_assignments) || 0;
      accumulator.submittedAssignments += Number(row.submitted_assignments) || 0;
      return accumulator;
    },
    { totalAssignments: 0, submittedAssignments: 0 }
  );

  return [
    ...topRows,
    {
      id: 'individual-performance-others',
      name: `Others (${otherRows.length})`,
      total_assignments: aggregatedTotals.totalAssignments,
      submitted_assignments: aggregatedTotals.submittedAssignments,
      completion_rate:
        aggregatedTotals.totalAssignments > 0
          ? roundToTwo(
              (aggregatedTotals.submittedAssignments / aggregatedTotals.totalAssignments) * 100
            )
          : 0,
      isAggregated: true,
    },
  ];
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

function AssignmentTooltip({ active, payload, entityLabel }) {
  if (!active || !payload?.length) {
    return null;
  }

  const assignment = payload[0].payload;

  return (
    <ChartTooltip
      title={assignment.title}
      subtitle={`${assignment.submitted_count}/${assignment.total_count} ${entityLabel}`}
      percentage={Math.round(assignment.completion_rate)}
    />
  );
}

function PerformanceTooltip({ active, payload, titleKey = 'name' }) {
  if (!active || !payload?.length) {
    return null;
  }

  const entity = payload[0].payload;

  return (
    <ChartTooltip
      title={entity[titleKey]}
      subtitle={`${entity.submitted_assignments}/${entity.total_assignments} assignments submitted`}
      percentage={Math.round(entity.completion_rate)}
      badgeLabel={entity.isAggregated ? 'OTHERS' : null}
    />
  );
}

function ChartCard({ title, axisLabel, actions = null, children }) {
  return (
    <section className="admin-dashboard__chart-card">
      <header className="admin-dashboard__chart-head">
        <h2 className="admin-dashboard__chart-title">{title}</h2>
        {actions ? <div className="admin-dashboard__chart-actions">{actions}</div> : null}
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
        <Skeleton variant="text" width="220px" />
      </div>

      <div className="admin-dashboard__stats-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="card" height="196px" />
        ))}
      </div>

      <div className="admin-dashboard__charts-grid">
        <Skeleton variant="chart" />
        <Skeleton variant="chart" />
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
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [allAssignments, setAllAssignments] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [studentsByCourseId, setStudentsByCourseId] = useState({});
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState({});
  const [individualPerformanceView, setIndividualPerformanceView] = useState('top');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [isCompactChart, setIsCompactChart] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const [rawCourses, rawAssignments, rawGroups] = await Promise.all([
          courseService.listCourses(),
          assignmentService.getAllAssignmentsForAdmin(),
          groupService.getAllGroupsForAdmin(200),
        ]);

        if (!isMounted) {
          return;
        }

        const courseRows = Array.isArray(rawCourses?.courses)
          ? rawCourses.courses
          : Array.isArray(rawCourses)
            ? rawCourses
            : [];

        const normalizedCourses = courseRows
          .map(normalizeCourse)
          .filter((course) => Boolean(course.id));
        const normalizedAssignments = (Array.isArray(rawAssignments) ? rawAssignments : [])
          .map(normalizeAssignment)
          .filter((assignment) => Boolean(assignment.id));
        const normalizedGroups = (Array.isArray(rawGroups) ? rawGroups : [])
          .map((group) => ({
            id: toId(group?.id ?? group?._id),
            name: String(group?.name ?? '').trim() || 'Unknown Group',
          }))
          .filter((group) => Boolean(group.id));

        const studentEntries = await Promise.all(
          normalizedCourses.map(async (course) => {
            try {
              const response = await courseService.listEnrolledStudents(course.id);
              const students = Array.isArray(response?.students)
                ? response.students
                : Array.isArray(response)
                  ? response
                  : [];

              return [
                course.id,
                students
                  .map(normalizeStudent)
                  .filter((student) => Boolean(student.key)),
              ];
            } catch {
              return [course.id, []];
            }
          })
        );

        if (!isMounted) {
          return;
        }

        setCourses(normalizedCourses);
        setSelectedCourseId((previousCourseId) => {
          if (
            previousCourseId &&
            (previousCourseId === ALL_COURSES_VALUE ||
              normalizedCourses.some((course) => course.id === previousCourseId))
          ) {
            return previousCourseId;
          }

          return normalizedCourses[0]?.id ?? ALL_COURSES_VALUE;
        });
        setAllAssignments(normalizedAssignments);
        setAllGroups(normalizedGroups);
        setStudentsByCourseId(Object.fromEntries(studentEntries));
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

  const filteredAssignments = useMemo(() => {
    if (selectedCourseId === ALL_COURSES_VALUE || !selectedCourseId) {
      return allAssignments;
    }

    return allAssignments.filter(
      (assignment) => assignment.course_id === selectedCourseId
    );
  }, [allAssignments, selectedCourseId]);

  const missingSubmissionIds = useMemo(
    () =>
      filteredAssignments
        .map((assignment) => assignment.id)
        .filter((assignmentId) => !submissionsByAssignmentId[assignmentId]),
    [filteredAssignments, submissionsByAssignmentId]
  );

  useEffect(() => {
    if (missingSubmissionIds.length === 0) {
      return undefined;
    }

    let isMounted = true;
    setIsLoadingSubmissions(true);

    async function loadMissingSubmissions() {
      const results = await Promise.all(
        missingSubmissionIds.map(async (assignmentId) => {
          try {
            const rows = await submissionService.getSubmissionsByAssignment(assignmentId);
            return [assignmentId, rows.map(normalizeSubmission)];
          } catch {
            return [assignmentId, []];
          }
        })
      );

      if (!isMounted) {
        return;
      }

      setSubmissionsByAssignmentId((previousRows) => ({
        ...previousRows,
        ...Object.fromEntries(results),
      }));
      setIsLoadingSubmissions(false);
    }

    loadMissingSubmissions();

    return () => {
      isMounted = false;
    };
  }, [missingSubmissionIds]);

  const analytics = useMemo(() => {
    const selectedCourseStudents = selectedCourseId === ALL_COURSES_VALUE
      ? Object.values(studentsByCourseId).flat()
      : studentsByCourseId[selectedCourseId] ?? [];

    const uniqueStudents = [];
    const seenStudentKeys = new Set();

    selectedCourseStudents.forEach((student, index) => {
      const normalized = normalizeStudent(student, index);
      if (!normalized.key || seenStudentKeys.has(normalized.key)) {
        return;
      }

      seenStudentKeys.add(normalized.key);
      uniqueStudents.push(normalized);
    });

    const studentByEmail = new Map(
      uniqueStudents
        .filter((student) => Boolean(student.email))
        .map((student) => [student.email, student.key])
    );
    const studentByName = new Map(
      uniqueStudents
        .filter((student) => Boolean(student.full_name))
        .map((student) => [normalizeStudentName(student.full_name), student.key])
    );

    const groupAssignments = filteredAssignments.filter(
      (assignment) => assignment.submission_type === 'group'
    );
    const individualAssignments = filteredAssignments.filter(
      (assignment) => assignment.submission_type === 'individual'
    );

    const allGroupsMap = new Map(allGroups.map((group) => [group.id, group]));
    const hasAllScopedGroupAssignments = groupAssignments.some(
      (assignment) => assignment.assign_to === 'all'
    );
    const relevantGroupIds = new Set();

    if (hasAllScopedGroupAssignments) {
      allGroups.forEach((group) => relevantGroupIds.add(group.id));
    } else {
      groupAssignments.forEach((assignment) => {
        assignment.target_group_ids.forEach((groupId) => {
          if (allGroupsMap.has(groupId)) {
            relevantGroupIds.add(groupId);
          }
        });

        const assignmentSubmissions = submissionsByAssignmentId[assignment.id] ?? [];
        assignmentSubmissions.forEach((submission) => {
          if (submission.group_id && allGroupsMap.has(submission.group_id)) {
            relevantGroupIds.add(submission.group_id);
          }
        });
      });
    }

    const relevantGroups = allGroups.filter((group) => relevantGroupIds.has(group.id));

    const submittedGroupIdsByAssignment = new Map(
      groupAssignments.map((assignment) => {
        const submissions = submissionsByAssignmentId[assignment.id] ?? [];
        const submittedIds = new Set(
          submissions
            .map((submission) => submission.group_id)
            .filter((groupId) => Boolean(groupId) && allGroupsMap.has(groupId))
        );
        return [assignment.id, submittedIds];
      })
    );

    const groupAssignmentCompletion = groupAssignments.map((assignment) => {
      const eligibleGroupIds =
        assignment.assign_to === 'all'
          ? relevantGroups.map((group) => group.id)
          : assignment.target_group_ids.filter((groupId) => allGroupsMap.has(groupId));

      const eligibleSet = new Set(eligibleGroupIds);
      const submittedSet = submittedGroupIdsByAssignment.get(assignment.id) ?? new Set();
      const submittedCount = [...submittedSet].filter((groupId) => eligibleSet.has(groupId)).length;
      const totalCount = eligibleSet.size;

      return {
        id: assignment.id,
        title: assignment.title,
        submitted_count: submittedCount,
        total_count: totalCount,
        completion_rate:
          totalCount > 0 ? roundToTwo((submittedCount / totalCount) * 100) : 0,
      };
    });

    const groupPerformance = relevantGroups
      .map((group) => {
        let totalAssignments = 0;
        let submittedAssignments = 0;

        groupAssignments.forEach((assignment) => {
          const isEligible =
            assignment.assign_to === 'all' ||
            assignment.target_group_ids.includes(group.id);

          if (!isEligible) {
            return;
          }

          totalAssignments += 1;

          const submittedGroups =
            submittedGroupIdsByAssignment.get(assignment.id) ?? new Set();
          if (submittedGroups.has(group.id)) {
            submittedAssignments += 1;
          }
        });

        return {
          id: group.id,
          name: group.name,
          total_assignments: totalAssignments,
          submitted_assignments: submittedAssignments,
          completion_rate:
            totalAssignments > 0
              ? roundToTwo((submittedAssignments / totalAssignments) * 100)
              : 0,
        };
      })
      .sort(
        (left, right) =>
          right.completion_rate - left.completion_rate ||
          left.name.localeCompare(right.name)
      );

    function resolveSubmissionStudentKey(submission) {
      const email = toSafeLower(submission?.submitted_by_email);
      if (email && studentByEmail.has(email)) {
        return studentByEmail.get(email);
      }

      const normalizedName = normalizeStudentName(submission?.submitted_by_name);
      if (normalizedName && studentByName.has(normalizedName)) {
        return studentByName.get(normalizedName);
      }

      return null;
    }

    const submittedStudentsByAssignment = new Map(
      individualAssignments.map((assignment) => {
        const submissions = submissionsByAssignmentId[assignment.id] ?? [];
        const submittedStudents = new Set(
          submissions
            .map((submission) => resolveSubmissionStudentKey(submission))
            .filter(Boolean)
        );
        return [assignment.id, submittedStudents];
      })
    );

    const individualAssignmentCompletion = individualAssignments.map((assignment) => {
      const submittedSet = submittedStudentsByAssignment.get(assignment.id) ?? new Set();
      const submittedCount = submittedSet.size;
      const totalCount = uniqueStudents.length;

      return {
        id: assignment.id,
        title: assignment.title,
        submitted_count: submittedCount,
        total_count: totalCount,
        completion_rate:
          totalCount > 0 ? roundToTwo((submittedCount / totalCount) * 100) : 0,
      };
    });

    const individualPerformance = uniqueStudents
      .map((student) => {
        let submittedAssignments = 0;
        const totalAssignments = individualAssignments.length;

        individualAssignments.forEach((assignment) => {
          const submittedStudents =
            submittedStudentsByAssignment.get(assignment.id) ?? new Set();
          if (submittedStudents.has(student.key)) {
            submittedAssignments += 1;
          }
        });

        return {
          id: student.key,
          name: student.full_name,
          total_assignments: totalAssignments,
          submitted_assignments: submittedAssignments,
          completion_rate:
            totalAssignments > 0
              ? roundToTwo((submittedAssignments / totalAssignments) * 100)
              : 0,
        };
      })
      .sort(
        (left, right) =>
          right.completion_rate - left.completion_rate ||
          left.name.localeCompare(right.name)
      );

    const totalSubmittedCount =
      groupAssignmentCompletion.reduce(
        (sum, assignment) => sum + assignment.submitted_count,
        0
      ) +
      individualAssignmentCompletion.reduce(
        (sum, assignment) => sum + assignment.submitted_count,
        0
      );
    const totalEligibleCount =
      groupAssignmentCompletion.reduce(
        (sum, assignment) => sum + assignment.total_count,
        0
      ) +
      individualAssignmentCompletion.reduce(
        (sum, assignment) => sum + assignment.total_count,
        0
      );

    const overallCompletionRate =
      totalEligibleCount > 0
        ? roundToTwo((totalSubmittedCount / totalEligibleCount) * 100)
        : 0;

    return {
      summary: {
        totalStudents: uniqueStudents.length,
        totalGroups: relevantGroups.length,
        totalAssignments: filteredAssignments.length,
        overallCompletionRate,
      },
      groupAssignments,
      individualAssignments,
      groupAssignmentCompletion,
      groupPerformance,
      individualAssignmentCompletion,
      individualPerformance,
    };
  }, [
    allGroups,
    filteredAssignments,
    selectedCourseId,
    studentsByCourseId,
    submissionsByAssignmentId,
  ]);

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

  const roundedCompletionRate = Math.round(analytics.summary.overallCompletionRate);
  const xAxisTickFontSize = isCompactChart ? 9 : 10;
  const xAxisTickLength = isCompactChart ? 8 : 12;
  const xAxisHeight = isCompactChart ? 54 : 30;
  const xAxisAngle = isCompactChart ? -14 : 0;
  const xAxisTextAnchor = isCompactChart ? 'end' : 'middle';
  const chartBottomMargin = isCompactChart ? 24 : 12;
  const chartBarSize = isCompactChart ? 22 : 44;
  const individualPerformanceFocusedData = useMemo(
    () => buildFocusedPerformanceData(analytics.individualPerformance),
    [analytics.individualPerformance]
  );
  const hasIndividualPerformanceViews =
    analytics.individualPerformance.length > TOP_INDIVIDUAL_PERFORMANCE_LIMIT;
  const resolvedIndividualPerformanceView = hasIndividualPerformanceViews
    ? individualPerformanceView
    : 'top';
  const individualPerformanceTopChartHeight = isCompactChart ? 220 : 240;
  const individualPerformanceAllChartHeight = Math.max(
    MIN_ALL_STUDENTS_CHART_HEIGHT,
    analytics.individualPerformance.length * ALL_STUDENTS_ROW_HEIGHT + 24
  );
  const individualPerformanceYAxisTickLength = isCompactChart ? 12 : 16;
  const individualPerformanceHorizontalBarSize = isCompactChart ? 12 : 16;
  const hasAssignments = analytics.summary.totalAssignments > 0;
  const hasGroupAssignments = analytics.groupAssignments.length > 0;
  const hasIndividualAssignments = analytics.individualAssignments.length > 0;
  const isWaitingForSubmissions =
    missingSubmissionIds.length > 0 && isLoadingSubmissions;

  if (isLoading || isWaitingForSubmissions) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <Page className="admin-dashboard">
      <header className="admin-dashboard__header">
        <h1 className="admin-dashboard__workspace-title">Admin Workspace</h1>
        {courses.length > 0 ? (
          <div className="admin-dashboard__controls">
            <label
              htmlFor="admin-dashboard-course-select"
              className="admin-dashboard__control-label"
            >
              Select Course
            </label>
            <select
              id="admin-dashboard-course-select"
              className="admin-dashboard__control-select"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
            >
              <option value={ALL_COURSES_VALUE}>All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </header>

      {courses.length === 0 ? (
        <section className="admin-dashboard__empty-card">
          <p className="admin-dashboard__empty-copy">
            No courses found. Create a course first to unlock course-specific analytics.
          </p>
        </section>
      ) : (
        <>
          <div className="admin-dashboard__stats-grid">
            <AdminMetricCard
              title="Total Students"
              value={analytics.summary.totalStudents}
              icon={Users}
              tone="neutral"
            />
            <AdminMetricCard
              title="Total Groups"
              value={analytics.summary.totalGroups}
              icon={UsersFour}
              tone="neutral"
            />
            <AdminMetricCard
              title="Active Assignments"
              value={analytics.summary.totalAssignments}
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

          {!hasAssignments ? (
            <section className="admin-dashboard__empty-card">
              <p className="admin-dashboard__empty-copy">
                No assignments found for the selected course.
              </p>
            </section>
          ) : null}

          {hasGroupAssignments ? (
            <>
              <h2 className="admin-dashboard__section-title">Group Analytics</h2>
              <div className="admin-dashboard__charts-grid">
                <ChartCard
                  title="How each group assignment is progressing (Assignment Completion %)"
                  axisLabel="Group Assignments"
                >
                  {analytics.groupAssignmentCompletion.length === 0 ? (
                    <ChartEmptyState>
                      No group assignments found for this course.
                    </ChartEmptyState>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={analytics.groupAssignmentCompletion}
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
                          content={<AssignmentTooltip entityLabel="groups submitted" />}
                        />
                        <Bar dataKey="completion_rate" radius={[0, 0, 0, 0]} barSize={chartBarSize}>
                          {analytics.groupAssignmentCompletion.map((assignment, index) => (
                            <Cell
                              key={assignment.id ?? `group-assignment-${index}`}
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
                  axisLabel="Groups"
                >
                  {analytics.groupPerformance.length === 0 ? (
                    <ChartEmptyState>
                      No groups are available for the selected course scope.
                    </ChartEmptyState>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={analytics.groupPerformance}
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
                          content={<PerformanceTooltip />}
                        />
                        <Bar dataKey="completion_rate" radius={[0, 0, 0, 0]} barSize={chartBarSize}>
                          {analytics.groupPerformance.map((group, index) => (
                            <Cell
                              key={`${group.id ?? 'group'}-${index}`}
                              fill={getPerformanceBarColor(group.completion_rate)}
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
            </>
          ) : null}

          {hasIndividualAssignments ? (
            <>
              <h2 className="admin-dashboard__section-title">Individual Analytics</h2>
              <div className="admin-dashboard__charts-grid">
                <ChartCard
                  title="How each individual assignment is progressing (Assignment Completion %)"
                  axisLabel="Individual Assignments"
                >
                  {analytics.individualAssignmentCompletion.length === 0 ? (
                    <ChartEmptyState>
                      No individual assignments found for this course.
                    </ChartEmptyState>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={analytics.individualAssignmentCompletion}
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
                          content={<AssignmentTooltip entityLabel="students submitted" />}
                        />
                        <Bar dataKey="completion_rate" radius={[0, 0, 0, 0]} barSize={chartBarSize}>
                          {analytics.individualAssignmentCompletion.map((assignment, index) => (
                            <Cell
                              key={assignment.id ?? `individual-assignment-${index}`}
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
                  title="Which individuals are staying ahead (Individual Performance %)"
                  axisLabel="Students"
                  actions={hasIndividualPerformanceViews ? (
                    <div className="admin-dashboard__chart-toggle-group" role="group" aria-label="Individual performance view">
                      <button
                        type="button"
                        className={`admin-dashboard__chart-toggle ${resolvedIndividualPerformanceView === 'top' ? 'admin-dashboard__chart-toggle--active' : ''}`}
                        onClick={() => setIndividualPerformanceView('top')}
                        aria-pressed={resolvedIndividualPerformanceView === 'top'}
                      >
                        Top Performers
                      </button>
                      <button
                        type="button"
                        className={`admin-dashboard__chart-toggle ${resolvedIndividualPerformanceView === 'all' ? 'admin-dashboard__chart-toggle--active' : ''}`}
                        onClick={() => setIndividualPerformanceView('all')}
                        aria-pressed={resolvedIndividualPerformanceView === 'all'}
                      >
                        All Students
                      </button>
                    </div>
                  ) : null}
                >
                  {analytics.individualPerformance.length === 0 ? (
                    <ChartEmptyState>
                      No enrolled students found for the selected course scope.
                    </ChartEmptyState>
                  ) : (
                    resolvedIndividualPerformanceView === 'top' ? (
                      <ResponsiveContainer width="100%" height={individualPerformanceTopChartHeight}>
                        <ReBarChart
                          data={individualPerformanceFocusedData}
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
                            tickMargin={10}
                            minTickGap={16}
                            interval={0}
                            angle={0}
                            textAnchor="middle"
                            height={36}
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
                            content={<PerformanceTooltip />}
                          />
                          <Bar dataKey="completion_rate" radius={[0, 0, 0, 0]} barSize={chartBarSize}>
                            {individualPerformanceFocusedData.map((student, index) => (
                              <Cell
                                key={`${student.id ?? 'student'}-${index}`}
                                fill={getPerformanceBarColor(student.completion_rate)}
                                stroke="#1c212b"
                                strokeWidth={1.2}
                              />
                            ))}
                          </Bar>
                        </ReBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="admin-dashboard__chart-scroll">
                        <div style={{ height: individualPerformanceAllChartHeight }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart
                              data={analytics.individualPerformance}
                              layout="vertical"
                              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                            >
                              <CartesianGrid
                                stroke="rgba(98, 104, 118, 0.35)"
                                strokeDasharray="3 4"
                                vertical={false}
                              />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tick={{ fill: 'var(--admin-dashboard-chart-axis)', fontSize: xAxisTickFontSize, fontWeight: 700 }}
                                axisLine={{ stroke: '#1c212b', strokeWidth: 1.3 }}
                                tickLine={false}
                                tickMargin={10}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                tickFormatter={(value) => truncateLabel(value, individualPerformanceYAxisTickLength)}
                                tick={{ fill: 'var(--admin-dashboard-chart-axis)', fontSize: 10, fontWeight: 700 }}
                                axisLine={{ stroke: '#1c212b', strokeWidth: 1.3 }}
                                tickLine={false}
                                tickMargin={10}
                                width={isCompactChart ? 108 : 132}
                              />
                              <Tooltip
                                cursor={{ fill: 'rgba(28, 33, 43, 0.08)' }}
                                content={<PerformanceTooltip />}
                              />
                              <Bar
                                dataKey="completion_rate"
                                radius={[0, 0, 0, 0]}
                                barSize={individualPerformanceHorizontalBarSize}
                              >
                                {analytics.individualPerformance.map((student, index) => (
                                  <Cell
                                    key={`${student.id ?? 'student'}-${index}`}
                                    fill={getPerformanceBarColor(student.completion_rate)}
                                    stroke="#1c212b"
                                    strokeWidth={1.2}
                                  />
                                ))}
                              </Bar>
                            </ReBarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  )}
                </ChartCard>
              </div>
            </>
          ) : null}

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
