import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDots } from '@phosphor-icons/react';
import StitchNoGroupDashboard from '../../components/student/StitchNoGroupDashboard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useCourseStore } from '../../stores/courseStore';
import { formatAssignmentDate, sortAssignmentsByDueDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    const token = parts[0].toUpperCase();
    return token.length <= 4 ? token : token.slice(0, 2);
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getMemberTag(member) {
  if (member?.student_id) {
    return String(member.student_id).trim().toUpperCase();
  }

  return getInitials(member?.full_name || member?.fullName);
}

function getProgressPercent(submittedCount, totalAssignments) {
  if (!totalAssignments) {
    return 0;
  }

  return Math.round((submittedCount / totalAssignments) * 100);
}

function formatDateStamp(dateInput) {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return { month: 'TBD', day: '--' };
  }

  return {
    month: date
      .toLocaleString('en-US', { month: 'short' })
      .toUpperCase(),
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function getPriorityMeta(status) {
  const normalizedStatus = String(status || '').toLowerCase();

  if (normalizedStatus === 'overdue') {
    return {
      module: 'High Priority',
      badge: 'High Priority',
      tone: 'overdue',
    };
  }

  if (normalizedStatus === 'active') {
    return {
      module: 'In Flight',
      badge: 'In Progress',
      tone: 'active',
    };
  }

  return {
    module: 'Planned',
    badge: 'Upcoming',
    tone: 'upcoming',
  };
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const group = useGroupStore((state) => state.group);
  const fetchMyGroup = useGroupStore((state) => state.fetchMyGroup);
  const assignments = useAssignmentStore((state) => state.assignments);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const mySubmissions = useSubmissionStore((state) => state.mySubmissions);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const courses = useCourseStore((state) => state.courses);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        await Promise.all([
          fetchCourses(),
          fetchAssignments(),
          fetchMySubmissions().catch(() => []),
          fetchMyGroup().catch(() => null),
        ]);
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
  }, [fetchAssignments, fetchCourses, fetchMyGroup, fetchMySubmissions]);

  const courseIdSet = useMemo(
    () => new Set((courses ?? []).map((course) => course?._id).filter(Boolean)),
    [courses]
  );

  const scopedAssignments = useMemo(() => {
    return (assignments ?? []).filter((assignment) => {
      const courseId = assignment?.course_id;
      return Boolean(courseId && courseIdSet.has(courseId));
    });
  }, [assignments, courseIdSet]);

  const submittedAssignmentIds = useMemo(() => {
    const ids = new Set(
      (mySubmissions ?? []).map((submission) => submission?.assignment_id).filter(Boolean)
    );

    scopedAssignments.forEach((assignment) => {
      if (assignment?.submission_status?.is_submitted && assignment?.id) {
        ids.add(assignment.id);
      }
    });

    return ids;
  }, [mySubmissions, scopedAssignments]);

  const pendingAssignments = useMemo(
    () =>
      sortAssignmentsByDueDate(
        scopedAssignments.filter((assignment) => !submittedAssignmentIds.has(assignment.id))
      ),
    [scopedAssignments, submittedAssignmentIds]
  );

  const hasIndividualAssignments = useMemo(
    () => scopedAssignments.some((assignment) => assignment.submission_type === 'individual'),
    [scopedAssignments]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!group && !hasIndividualAssignments) {
    return (
      <StitchNoGroupDashboard
        onCreateGroup={() => navigate('/student/group/create')}
        onFindTeammates={() => navigate('/student/group')}
      />
    );
  }

  const members = group?.members ?? [];
  const leader = members.find((member) => member.id === group?.created_by) ?? null;
  const totalAssignments = scopedAssignments.length;
  const submittedCount = submittedAssignmentIds.size;
  const pendingCount = Math.max(totalAssignments - submittedCount, 0);
  const upcomingDeadlines = pendingAssignments.slice(0, 5);
  const completionPercent = getProgressPercent(submittedCount, totalAssignments);

  return (
    <section className="workspace-cool" aria-label="Student workspace dashboard">
      <header className="workspace-cool__hero">
        <p className="workspace-cool__eyebrow">Student Workspace</p>
        <h1 className="workspace-cool__title">
          Welcome Back, <span>{(user?.full_name || 'Student').toUpperCase()}</span>
        </h1>
        <p className="workspace-cool__subtitle">
          Course workload is now filtered to your enrolled courses and live submission status.
        </p>
      </header>

      <section className="workspace-cool__cards">
        <article className="workspace-cool__card workspace-cool__card--unit">
          <header className="workspace-cool__card-top workspace-cool__card-top--dark">
            <h2>Active Unit</h2>
            <span aria-hidden="true">^</span>
          </header>

          <div className="workspace-cool__card-body">
            <p className="workspace-cool__label">Team Designation</p>
            <h3 className="workspace-cool__unit-name">{group?.name || 'Individual Track'}</h3>

            <div className="workspace-cool__split">
              <div>
                <p className="workspace-cool__label">Members</p>
                <p className="workspace-cool__strong workspace-cool__strong--danger">
                  {group ? members.length : 1}
                </p>
              </div>
              <div>
                <p className="workspace-cool__label">Status</p>
                <p className="workspace-cool__status-ok">Active</p>
              </div>
            </div>
          </div>
        </article>

        <article className="workspace-cool__card workspace-cool__card--progress">
          <header className="workspace-cool__card-top">
            <h2>Global Progression</h2>
            <span className="workspace-cool__percent-pill">{completionPercent}%</span>
          </header>

          <div className="workspace-cool__card-body">
            <div className="workspace-cool__bar-meta">
              <span>Completion Rate</span>
              <span>Target: 100%</span>
            </div>

            <div
              className="workspace-cool__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercent}
            >
              <span
                className="workspace-cool__bar-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="workspace-cool__stats-row">
              <div>
                <strong>{totalAssignments}</strong>
                <span>Total</span>
              </div>
              <div>
                <strong className="workspace-cool__strong--ok">{submittedCount}</strong>
                <span>Done</span>
              </div>
              <div>
                <strong className="workspace-cool__strong--danger">{pendingCount}</strong>
                <span>Pending</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="workspace-cool__deadlines">
        <header className="workspace-cool__deadlines-head">
          <h2>
            <span aria-hidden="true">^</span>
            Critical Path: Upcoming Deadlines
          </h2>
        </header>

        {upcomingDeadlines.length === 0 ? (
          <div className="workspace-cool__deadline-empty">
            No pending deadlines right now. You are currently caught up.
          </div>
        ) : (
          <div className="workspace-cool__deadline-list">
            {upcomingDeadlines.map((assignment) => {
              const stamp = formatDateStamp(assignment.due_date);
              const meta = getPriorityMeta(assignment.status);

              return (
                <button
                  key={assignment.id}
                  type="button"
                  className="workspace-cool__deadline-row"
                  onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                >
                  <div className={`workspace-cool__stamp workspace-cool__stamp--${meta.tone}`}>
                    <small>{stamp.month}</small>
                    <strong>{stamp.day}</strong>
                  </div>

                  <div className="workspace-cool__deadline-main">
                    <small>{meta.module}</small>
                    <h3>{assignment.title}</h3>
                    <p>
                      <CalendarDots size={12} />
                      <span>Due {formatAssignmentDate(assignment.due_date)}</span>
                    </p>
                  </div>

                  <div className="workspace-cool__deadline-side">
                    <span className={`workspace-cool__badge workspace-cool__badge--${meta.tone}`}>
                      {meta.badge}
                    </span>
                    <span className="workspace-cool__go" aria-hidden="true">-</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <aside className="workspace-cool__floating" aria-label="Group metadata">
        <p>Lead: {leader?.full_name || user?.full_name || 'Unknown'}</p>
        <p>
          Member tags:{' '}
          {group
            ? members.map((member) => getMemberTag(member)).join(' | ')
            : getMemberTag({ full_name: user?.full_name, student_id: user?.student_id })}
        </p>
      </aside>
    </section>
  );
}
