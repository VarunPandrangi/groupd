import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CaretLeft, CalendarDots, Users, User, ArrowRight } from '@phosphor-icons/react';
import { Page, StaggerGroup, FadeUp, SectionHeading } from '../../components/common/Page';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { useCourseStore } from '../../stores/courseStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

function computeStatus(dueDate) {
  if (!dueDate) return 'pending';
  const dueAt = new Date(dueDate).getTime();
  const now = Date.now();
  if (dueAt <= now) return 'overdue';
  if (dueAt <= now + THREE_DAYS_IN_MS) return 'active';
  return 'upcoming';
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
      } catch (err) {
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

  if (fetchError) {
    return (
      <Page>
        <EmptyState
          title="Course Not Found"
          message="You are not enrolled in this course or it does not exist."
          actionLabel="Back to Courses"
          onAction={() => navigate('/student/courses')}
        />
      </Page>
    );
  }

  if (isLoading || !currentCourse) {
    return (
      <Page>
        <div style={{ display: 'grid', gap: '32px' }}>
          <div>
            <Skeleton variant="text" width="100px" style={{ marginBottom: '8px' }} />
            <Skeleton variant="text" width="60%" height="32px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="text" width="40%" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
             <Skeleton variant="card" />
             <Skeleton variant="card" />
             <Skeleton variant="card" />
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page className="workspace-cool" aria-label="Course Detail">
      <div style={{ marginBottom: '32px' }}>
        <button
          type="button"
          onClick={() => navigate('/student/courses')}
          className="btn btn--ghost btn--sm"
          style={{ marginBottom: '16px', paddingLeft: 0 }}
        >
          <CaretLeft size={16} /> Back to Courses
        </button>
        <header className="workspace-cool__hero" style={{ padding: 0, marginTop: '8px', background: 'transparent' }}>
          <p className="workspace-cool__eyebrow">{currentCourse.code}</p>
          <h1 className="workspace-cool__title" style={{ fontSize: 'clamp(28px, 4vw, 32px)' }}>{currentCourse.name}</h1>
          <p className="workspace-cool__subtitle">{currentCourse.description}</p>
        </header>
      </div>

      <section style={{ marginTop: '48px' }}>
        <SectionHeading title="Assignments in this course" />
        
        {assignments.length === 0 ? (
          <div style={{ marginTop: '24px' }}>
            <Card style={{ padding: '32px', textAlign: 'center' }}>
              <p className="muted">No assignments have been posted yet.</p>
            </Card>
          </div>
        ) : (
          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5" style={{ marginTop: '24px' }}>
            {assignments.sort((a, b) => new Date(a.dueDate || a.due_date).getTime() - new Date(b.dueDate || b.due_date).getTime()).map(_a => {
              const dueDate = _a.dueDate || _a.due_date;
              const submissionType = _a.submissionType || _a.submission_type || 'group';
              const isSubmitted = mySubmissions.some(s => s.assignment_id === _a._id || s.assignment_id === _a.id);
              const finalStatus = isSubmitted ? 'submitted' : computeStatus(dueDate);

              return (
                <FadeUp key={_a._id}>
                  <Card 
                    interactive 
                    onClick={() => navigate(`/student/assignments/${_a._id}`)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <StatusBadge status={finalStatus} />
                        <span className={`pill ${submissionType === 'individual' ? 'pill--blue' : 'pill--amber'}`} style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}>
                          {submissionType === 'individual' ? <User size={12} /> : <Users size={12} />}
                          {submissionType === 'individual' ? 'Individual' : 'Group'}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="card__title" style={{ marginBottom: '8px' }}>{_a.title}</h3>
                    
                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="cluster faint" style={{ fontSize: '13px', gap: '6px' }}>
                        <CalendarDots size={16} />
                        <span>{dueDate ? formatAssignmentDate(dueDate) : 'No due date'}</span>
                      </div>
                      <ArrowRight size={16} className="muted" />
                    </div>
                  </Card>
                </FadeUp>
              );
            })}
          </StaggerGroup>
        )}
      </section>
    </Page>
  );
}
