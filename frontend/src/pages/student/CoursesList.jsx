import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Books, Clock, FileText } from '@phosphor-icons/react';
import { FadeUp, Page, StaggerGroup } from '../../components/common/Page';
import Skeleton from '../../components/common/Skeleton';
import { useCourseStore } from '../../stores/courseStore';

function normalizeCount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

function getCourseCode(course) {
  return String(course?.code ?? course?.course_code ?? 'COURSE').trim().toUpperCase() || 'COURSE';
}

function getCourseName(course) {
  return String(course?.name ?? course?.title ?? 'Untitled Course').trim() || 'Untitled Course';
}

function getCourseDescription(course) {
  return String(course?.description ?? '').trim() || 'No description available.';
}

function CourseLoadingCard() {
  return (
    <article className="student-courses-architectural__skeleton-card" aria-hidden="true">
      <div className="student-courses-architectural__skeleton-media">
        <Skeleton variant="card" style={{ width: '100%', height: '160px', borderRadius: 0 }} />
      </div>

      <div className="student-courses-architectural__skeleton-body">
        <Skeleton variant="text" width="70px" style={{ height: '18px', borderRadius: 0 }} />
        <Skeleton variant="text" width="84%" style={{ height: '30px', borderRadius: 0 }} />
        <Skeleton variant="text" width="100%" style={{ height: '14px', borderRadius: 0 }} />
        <Skeleton variant="text" width="88%" style={{ height: '14px', borderRadius: 0 }} />
        <div className="student-courses-architectural__skeleton-stats">
          <Skeleton variant="text" width="96px" style={{ height: '16px', borderRadius: 0 }} />
          <Skeleton variant="text" width="104px" style={{ height: '16px', borderRadius: 0 }} />
        </div>
      </div>
    </article>
  );
}

function CourseCard({ course, onOpen }) {
  const courseId = course?._id ?? course?.id ?? null;
  const code = getCourseCode(course);
  const name = getCourseName(course);
  const description = getCourseDescription(course);
  const totalAssignments = normalizeCount(course?.assignmentCount ?? course?.assignment_count);
  const pendingAssignments = normalizeCount(course?.pendingCount ?? course?.pending_count);

  return (
    <article className="student-courses-architectural__card">
      <button
        type="button"
        className="student-courses-architectural__card-button"
        onClick={() => {
          if (courseId) {
            onOpen(courseId);
          }
        }}
        aria-label={`Open ${name}`}
        disabled={!courseId}
      >
        <div className="student-courses-architectural__media" aria-hidden="true">
          <span className="student-courses-architectural__code">{code}</span>
        </div>

        <div className="student-courses-architectural__body">
          <h2 className="student-courses-architectural__name">{name}</h2>
          <p className="student-courses-architectural__description">{description}</p>

          <div className="student-courses-architectural__stats">
            <span className="student-courses-architectural__stat student-courses-architectural__stat--primary">
              <FileText size={14} weight="bold" />
              {totalAssignments} total
            </span>

            <span className="student-courses-architectural__stat student-courses-architectural__stat--secondary">
              <Clock size={14} weight="bold" />
              {pendingAssignments} pending
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

export default function CoursesList() {
  const navigate = useNavigate();
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const courses = useCourseStore((state) => state.courses);
  const isLoading = useCourseStore((state) => state.isLoading);
  const error = useCourseStore((state) => state.error);

  useEffect(() => {
    void fetchCourses().catch(() => {});
  }, [fetchCourses]);

  const visibleCourses = (courses ?? []).filter(Boolean);

  return (
    <Page className="student-courses-architectural" aria-label="Student courses">
      <header className="student-courses-architectural__hero">
        <p className="student-courses-architectural__eyebrow">Student Workspace</p>
        <h1 className="student-courses-architectural__title">My Courses</h1>
        <p className="student-courses-architectural__subtitle">
          Course enrollment and module tracking.
        </p>
      </header>

      {isLoading ? (
        <StaggerGroup className="student-courses-architectural__grid" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <FadeUp key={`student-courses-loading-${index}`}>
              <CourseLoadingCard />
            </FadeUp>
          ))}
        </StaggerGroup>
      ) : error ? (
        <section className="student-courses-architectural__panel" role="status" aria-live="polite">
          <p className="student-courses-architectural__status-kicker">Load Error</p>
          <h2 className="student-courses-architectural__status-title">
            Unable to load your courses.
          </h2>
          <p className="student-courses-architectural__status-copy">{String(error)}</p>
          <div className="student-courses-architectural__status-actions">
            <button
              type="button"
              className="student-courses-architectural__status-button"
              onClick={() => void fetchCourses().catch(() => {})}
            >
              Retry
            </button>
            <button
              type="button"
              className="student-courses-architectural__status-button student-courses-architectural__status-button--secondary"
              onClick={() => navigate('/student/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      ) : visibleCourses.length === 0 ? (
        <section className="student-courses-architectural__panel" role="status" aria-live="polite">
          <div className="student-courses-architectural__panel-mark" aria-hidden="true">
            <Books size={22} weight="bold" />
          </div>
          <p className="student-courses-architectural__status-kicker">Enrollment Empty</p>
          <h2 className="student-courses-architectural__status-title">
            You are not enrolled in any courses yet.
          </h2>
          <p className="student-courses-architectural__status-copy">
            Your courses will appear here once an instructor enrolls your student account. Use the
            dashboard to review assignments and group status in the meantime.
          </p>
          <div className="student-courses-architectural__status-actions">
            <button
              type="button"
              className="student-courses-architectural__status-button"
              onClick={() => void fetchCourses().catch(() => {})}
            >
              Refresh List
            </button>
            <button
              type="button"
              className="student-courses-architectural__status-button student-courses-architectural__status-button--secondary"
              onClick={() => navigate('/student/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      ) : (
        <StaggerGroup className="student-courses-architectural__grid">
          {visibleCourses.map((course) => {
            const courseKey =
              course?._id ?? course?.id ?? `${getCourseCode(course)}-${getCourseName(course)}`;

            return (
              <FadeUp key={courseKey}>
                <CourseCard course={course} onOpen={(id) => navigate(`/student/courses/${id}`)} />
              </FadeUp>
            );
          })}
        </StaggerGroup>
      )}
    </Page>
  );
}
