import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { Page, StaggerGroup, FadeUp } from '../../components/common/Page';
import Skeleton from '../../components/common/Skeleton';
import { useCourseStore } from '../../stores/courseStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

function getComparableTimestamp(dateValue) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(dateValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function getCourseCode(course) {
  return String(course?.code ?? course?.course_code ?? 'COURSE').trim().toUpperCase() || 'COURSE';
}

function getCourseName(course) {
  return String(course?.name ?? course?.title ?? 'Untitled course').trim() || 'Untitled course';
}

function getCourseDescription(course) {
  return String(course?.description ?? '').trim() || 'No description provided yet.';
}

function getAssignmentId(assignment) {
  return assignment?._id ?? assignment?.id ?? assignment?.assignment_id ?? null;
}

function normalizeId(value) {
  return value == null ? null : String(value);
}

function getAssignmentTitle(assignment) {
  return assignment?.title ?? assignment?.name ?? assignment?.assignment_title ?? 'Untitled assignment';
}

function getAssignmentDueDate(assignment) {
  return assignment?.dueDate ?? assignment?.due_date ?? assignment?.deadline ?? null;
}

function getSubmissionType(assignment) {
  const value = String(assignment?.submissionType ?? assignment?.submission_type ?? 'group')
    .trim()
    .toLowerCase();

  return value === 'individual' ? 'individual' : 'group';
}

function getAssignmentStatus(assignment, submittedAssignmentIds) {
  const assignmentId = normalizeId(getAssignmentId(assignment));
  if (assignmentId && submittedAssignmentIds.has(assignmentId)) {
    return 'submitted';
  }

  const dueDate = getAssignmentDueDate(assignment);
  const dueAt = getComparableTimestamp(dueDate);

  if (!Number.isFinite(dueAt) || dueAt === Number.POSITIVE_INFINITY) {
    return 'draft';
  }

  return dueAt < Date.now() ? 'overdue' : 'upcoming';
}

function getStatusLabel(status) {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'overdue':
      return 'Overdue';
    case 'draft':
      return 'Draft';
    default:
      return 'Upcoming';
  }
}

function getDueLabel(dueDate, status) {
  if (!dueDate) {
    return status === 'submitted' ? 'SUBMITTED' : 'TBD';
  }

  const formatted = formatAssignmentDate(dueDate).toUpperCase();

  if (status === 'submitted') {
    return formatted;
  }

  if (status === 'overdue') {
    return `OVERDUE ${formatted}`;
  }

  return `DUE ${formatted}`;
}

function getAssignmentActionLabel(status) {
  return status === 'submitted' ? 'REVIEW' : 'VIEW DETAILS';
}

function getAssignmentActionIcon(status) {
  return status === 'submitted' ? CheckCircle : ArrowRight;
}

function getClassificationLabel(assignment) {
  return getSubmissionType(assignment) === 'individual' ? 'INDIVIDUAL' : 'GROUP';
}

function sortAssignments(assignments = []) {
  return [...assignments].sort(
    (left, right) =>
      getComparableTimestamp(getAssignmentDueDate(left)) - getComparableTimestamp(getAssignmentDueDate(right))
  );
}

function CourseDetailSkeleton() {
  return (
    <Page className="student-course-detail-architectural student-course-detail-architectural--loading" aria-label="Loading course detail">
      <header className="student-course-detail-architectural__hero student-course-detail-architectural__hero--loading">
        <div className="student-course-detail-architectural__hero-copy">
          <Skeleton variant="text" width="170px" height="22px" style={{ borderRadius: 0 }} />
          <Skeleton variant="text" width="72%" height="64px" style={{ borderRadius: 0 }} />
          <Skeleton variant="text" width="54%" height="18px" style={{ borderRadius: 0 }} />
        </div>
      </header>

      <section className="student-course-detail-architectural__section" aria-hidden="true">
        <div className="student-course-detail-architectural__section-head">
          <Skeleton variant="text" width="320px" height="26px" style={{ borderRadius: 0 }} />
          <Skeleton variant="text" width="84px" height="28px" style={{ borderRadius: 0 }} />
        </div>

        <StaggerGroup className="student-course-detail-architectural__grid">
          {Array.from({ length: 7 }).map((_, index) => (
            <FadeUp key={`course-detail-skeleton-${index}`}>
              <article className="student-course-detail-architectural__assignment-card student-course-detail-architectural__assignment-card--skeleton">
                <div className="student-course-detail-architectural__assignment-body">
                  <div className="student-course-detail-architectural__assignment-top">
                    <Skeleton variant="text" width="82px" height="24px" style={{ borderRadius: 0 }} />
                    <Skeleton variant="text" width="132px" height="20px" style={{ borderRadius: 0 }} />
                  </div>

                  <Skeleton variant="text" width="78%" height="30px" style={{ borderRadius: 0 }} />
                </div>

                <div className="student-course-detail-architectural__assignment-footer">
                  <Skeleton variant="text" width="92px" height="18px" style={{ borderRadius: 0 }} />
                  <Skeleton variant="text" width="124px" height="18px" style={{ borderRadius: 0 }} />
                </div>
              </article>
            </FadeUp>
          ))}
        </StaggerGroup>
      </section>
    </Page>
  );
}

function CourseDetailError({ onBack }) {
  return (
    <Page className="student-course-detail-architectural" aria-label="Course detail unavailable">
      <section className="student-course-detail-architectural__empty-state">
        <p className="student-course-detail-architectural__empty-kicker">Course unavailable</p>
        <h1 className="student-course-detail-architectural__empty-title">Course Not Found</h1>
        <p className="student-course-detail-architectural__empty-copy">
          You are not enrolled in this course or it does not exist.
        </p>
        <button
          type="button"
          className="student-course-detail-architectural__empty-button"
          onClick={onBack}
        >
          Back to Courses
        </button>
      </section>
    </Page>
  );
}

function AssignmentCard({ assignment, status, onOpen }) {
  const assignmentId = getAssignmentId(assignment);
  const assignmentTitle = getAssignmentTitle(assignment);
  const dueDate = getAssignmentDueDate(assignment);
  const classification = getClassificationLabel(assignment);
  const dueLabel = getDueLabel(dueDate, status);
  const actionLabel = getAssignmentActionLabel(status);
  const ActionIcon = getAssignmentActionIcon(status);
  const isSubmitted = status === 'submitted';
  const isOverdue = status === 'overdue';
  const isDraft = status === 'draft';

  return (
    <article
      className={[
        'student-course-detail-architectural__assignment-card',
        `student-course-detail-architectural__assignment-card--${status}`,
      ].join(' ')}
    >
      <div className="student-course-detail-architectural__assignment-body">
        <div className="student-course-detail-architectural__assignment-top">
          <span
            className={[
              'student-course-detail-architectural__chip',
              `student-course-detail-architectural__chip--${status}`,
            ].join(' ')}
          >
            {getStatusLabel(status)}
          </span>

          <span
            className={[
              'student-course-detail-architectural__due',
              isSubmitted && 'student-course-detail-architectural__due--submitted',
              isOverdue && 'student-course-detail-architectural__due--overdue',
              isDraft && 'student-course-detail-architectural__due--draft',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {dueLabel}
          </span>
        </div>

        <h3
          className={[
            'student-course-detail-architectural__assignment-title',
            isSubmitted && 'student-course-detail-architectural__assignment-title--submitted',
            isOverdue && 'student-course-detail-architectural__assignment-title--overdue',
            isDraft && 'student-course-detail-architectural__assignment-title--draft',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {assignmentTitle}
        </h3>
      </div>

      <div
        className={[
          'student-course-detail-architectural__assignment-footer',
          isSubmitted && 'student-course-detail-architectural__assignment-footer--submitted',
          isOverdue && 'student-course-detail-architectural__assignment-footer--overdue',
          isDraft && 'student-course-detail-architectural__assignment-footer--draft',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className="student-course-detail-architectural__classification">{classification}</span>

        <button
          type="button"
          className={[
            'student-course-detail-architectural__assignment-action',
            isSubmitted && 'student-course-detail-architectural__assignment-action--submitted',
            isOverdue && 'student-course-detail-architectural__assignment-action--overdue',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => {
            if (assignmentId) {
              onOpen(assignmentId);
            }
          }}
          disabled={!assignmentId}
        >
          {actionLabel}
          <ActionIcon size={14} weight={isSubmitted ? 'fill' : 'regular'} />
        </button>
      </div>
    </article>
  );
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const fetchCourse = useCourseStore((state) => state.fetchCourse);
  const currentCourse = useCourseStore((state) => state.currentCourse);
  const isLoading = useCourseStore((state) => state.isLoading);

  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const mySubmissions = useSubmissionStore((state) => state.mySubmissions);

  const [assignments, setAssignments] = useState([]);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await fetchCourse(courseId);
        if (isMounted) {
          setAssignments(data.assignments ?? []);
          setFetchError(false);
        }
      } catch {
        if (isMounted) {
          setFetchError(true);
        }
      }
    };
    load();
    fetchMySubmissions().catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [courseId, fetchCourse, fetchMySubmissions]);

  const submittedAssignmentIds = useMemo(() => {
  return new Set(
    (mySubmissions ?? [])
      .map(
        (submission) =>
          normalizeId(
            submission?.assignment_id ??
              submission?.assignmentId ??
              submission?.assignment?.id ??
              submission?.assignment?._id
          )
      )
      .filter(Boolean)
  );
}, [mySubmissions]);

  const sortedAssignments = useMemo(() => sortAssignments(assignments), [assignments]);

  const assignmentViewModels = useMemo(() => {
    return sortedAssignments.map((assignment) => {
      const status = getAssignmentStatus(assignment, submittedAssignmentIds);

      return {
        assignment,
        status,
      };
    });
  }, [sortedAssignments, submittedAssignmentIds]);

  const courseCode = getCourseCode(currentCourse);
  const courseName = getCourseName(currentCourse);
  const courseDescription = getCourseDescription(currentCourse);

  if (fetchError) {
    return <CourseDetailError onBack={() => navigate('/student/courses')} />;
  }

  if (isLoading || !currentCourse) {
    return <CourseDetailSkeleton />;
  }

  return (
    <Page className="student-course-detail-architectural" aria-label="Course Detail - Student">
      <header className="student-course-detail-architectural__hero">
        <div className="student-course-detail-architectural__hero-copy">
          <span className="student-course-detail-architectural__code">COURSE CODE: {courseCode}</span>
          <h1 className="student-course-detail-architectural__title">{courseName}</h1>
          <p className="student-course-detail-architectural__subtitle">{courseDescription}</p>
        </div>
      </header>

      <section className="student-course-detail-architectural__section">
        <div className="student-course-detail-architectural__section-head">
          <h2 className="student-course-detail-architectural__section-title">
            Assignments in this course
          </h2>
          <span className="student-course-detail-architectural__section-badge">
            {assignmentViewModels.length} total
          </span>
        </div>

        {assignmentViewModels.length === 0 ? (
          <div className="student-course-detail-architectural__empty-state student-course-detail-architectural__empty-state--inline">
            <p className="student-course-detail-architectural__empty-kicker">No assignments yet</p>
            <h3 className="student-course-detail-architectural__empty-title">This course is still empty</h3>
            <p className="student-course-detail-architectural__empty-copy">
              Assignments will appear here once the instructor publishes them.
            </p>
          </div>
        ) : (
          <StaggerGroup className="student-course-detail-architectural__grid">
            {assignmentViewModels.map(({ assignment, status }) => {
              const assignmentId = getAssignmentId(assignment);

              return (
                <FadeUp key={assignmentId ?? `${getAssignmentTitle(assignment)}-${getAssignmentDueDate(assignment) ?? 'no-due'}`}>
                  <AssignmentCard
                    assignment={assignment}
                    status={status}
                    onOpen={(targetAssignmentId) => {
                      navigate(`/student/assignments/${targetAssignmentId}`);
                    }}
                  />
                </FadeUp>
              );
            })}
          </StaggerGroup>
        )}
      </section>
    </Page>
  );
}
