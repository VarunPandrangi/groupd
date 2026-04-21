import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Books, FileText, Clock } from '@phosphor-icons/react';
import { Page, StaggerGroup, FadeUp } from '../../components/common/Page';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { useCourseStore } from '../../stores/courseStore';

export default function CoursesList() {
  const navigate = useNavigate();
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const courses = useCourseStore((state) => state.courses);
  const isLoading = useCourseStore((state) => state.isLoading);
  const error = useCourseStore((state) => state.error);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [fetchCourses]);

  if (error) {
    return (
      <Page>
        <EmptyState icon={Books} title="Error Loading Courses" message={error} />
      </Page>
    );
  }

  return (
    <Page className="workspace-cool" aria-label="Student courses">
      <header className="workspace-cool__hero" style={{ marginBottom: '32px' }}>
        <p className="workspace-cool__eyebrow">Student Workspace</p>
        <h1 className="workspace-cool__title">My Courses</h1>
        <p className="workspace-cool__subtitle">Course enrollment and module tracking.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={Books}
          title="No Courses"
          message="You're not enrolled in any courses yet"
        />
      ) : (
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <FadeUp key={course._id}>
              <Card
                interactive
                onClick={() => navigate(`/student/courses/${course._id}`)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ flex: 1 }}>
                  <span className="mono muted" style={{ fontSize: '13px' }}>{course.code}</span>
                  <h3 className="card__title" style={{ marginTop: '8px' }}>{course.name}</h3>
                  <p className="card__copy line-clamp-2" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginTop: '12px'
                  }}>
                    {course.description || 'No description available.'}
                  </p>
                </div>
                <div className="cluster" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-default)', justifyContent: 'flex-start' }}>
                  <div className="cluster" style={{ gap: '6px' }}>
                    <FileText size={16} className="muted" />
                    <span style={{ fontSize: '14px', color: 'var(--text-body)', fontWeight: 500 }}>
                      {course.assignmentCount} total
                    </span>
                  </div>
                  <div className="cluster" style={{ gap: '6px', marginLeft: '16px' }}>
                    <Clock size={16} className="muted" />
                    <span style={{ fontSize: '14px', color: 'var(--text-body)', fontWeight: 500 }}>
                      {course.pendingCount} pending
                    </span>
                  </div>
                </div>
              </Card>
            </FadeUp>
          ))}
        </StaggerGroup>
      )}
    </Page>
  );
}
