import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CaretLeft, Users, PencilSimple, FileText, SpinnerGap, CalendarDots, ArrowRight } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Page, StaggerGroup, FadeUp, SectionHeading } from '../../components/common/Page';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { useCourseStore } from '../../stores/courseStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const courseSchema = z.object({
  name: z.string().trim().min(3, 'Course name must be at least 3 characters long').max(100),
  code: z
    .string()
    .trim()
    .min(3, 'Course code must be at least 3 characters long')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/, 'Only alphanumeric characters and hyphens allowed'),
  description: z.string().trim().max(2000, 'Maximum 2000 characters').optional().or(z.literal('')),
});

function FieldError({ message }) {
  if (!message) return null;
  return <span className="text-xs text-red-500 mt-1 block">{message}</span>;
}

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
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const currentCourse = useCourseStore((state) => state.currentCourse);
  const currentCourseStudents = useCourseStore((state) => state.currentCourseStudents);
  const isLoading = useCourseStore((state) => state.isLoading);

  const [assignments, setAssignments] = useState([]);
  const [fetchError, setFetchError] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
  });

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
        if (isMounted) setFetchError(true);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [courseId, fetchCourse]);

  useEffect(() => {
    if (currentCourse) {
      reset({
        name: currentCourse.name,
        code: currentCourse.code,
        description: currentCourse.description || '',
      });
    }
  }, [currentCourse, reset]);

  const onUpdate = async (values) => {
    setIsUpdating(true);
    try {
      await updateCourse(courseId, {
        ...values,
        code: values.code.toUpperCase(),
      });
      toast.success('Course updated successfully.');
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update course.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (fetchError) {
    return (
      <Page>
        <EmptyState
          title="Course Not Found"
          message="You do not own this course or it does not exist."
          actionLabel="Back to Courses"
          onAction={() => navigate('/admin/courses')}
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
          <Skeleton variant="card" height="200px" />
        </div>
      </Page>
    );
  }

  return (
    <Page className="workspace-cool" aria-label="Admin Course Detail">
      <div style={{ marginBottom: '32px' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/courses')}
          className="btn btn--ghost btn--sm"
          style={{ marginBottom: '16px', paddingLeft: 0 }}
        >
          <CaretLeft size={16} /> Back to Courses
        </button>
        <header className="workspace-cool__hero" style={{ padding: 0, marginTop: '8px', background: 'transparent' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="workspace-cool__eyebrow">{currentCourse.code}</p>
              <h1 className="workspace-cool__title" style={{ fontSize: 'clamp(28px, 4vw, 32px)' }}>{currentCourse.name}</h1>
              <p className="workspace-cool__subtitle">{currentCourse.description}</p>
            </div>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
              <PencilSimple size={16} /> Edit Course
            </Button>
          </div>
        </header>
      </div>

      <section style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeading title={`Enrolled Students (${currentCourseStudents.length})`} />
          <Button variant="secondary" onClick={() => navigate(`/admin/courses/${courseId}/enroll`)}>
            Manage Enrollment
          </Button>
        </div>

        {currentCourseStudents.length === 0 ? (
          <div style={{ marginTop: '24px' }}>
            <Card style={{ padding: '32px', textAlign: 'center' }}>
              <p className="muted">No students enrolled yet.</p>
            </Card>
          </div>
        ) : (
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {currentCourseStudents.slice(0, 8).map(student => (
              <Card key={student._id} style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} className="muted" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{student.fullName}</p>
                    <p className="muted" style={{ fontSize: '12px' }}>{student.studentId || student.email}</p>
                  </div>
                </div>
              </Card>
            ))}
            {currentCourseStudents.length > 8 && (
              <Card interactive onClick={() => navigate(`/admin/courses/${courseId}/enroll`)} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <p style={{ fontWeight: 500, color: 'var(--accent-blue)' }}>View all {currentCourseStudents.length} students</p>
              </Card>
            )}
          </div>
        )}
      </section>

      <section style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SectionHeading title={`Assignments in this course (${assignments.length})`} />
          <Button variant="secondary" onClick={() => navigate('/admin/assignments/new')}>
            Create Assignment
          </Button>
        </div>

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
              const status = computeStatus(dueDate);

              return (
                <FadeUp key={_a._id}>
                  <Card 
                    interactive 
                    onClick={() => navigate(`/admin/assignments/${_a._id}`)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <StatusBadge status={status} />
                        <span className={`pill ${submissionType === 'individual' ? 'pill--blue' : 'pill--amber'}`} style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}>
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

      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Course"
        description="Update the course details."
        showClose
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onUpdate)} disabled={isUpdating}>
              {isUpdating ? <SpinnerGap className="spinner" size={16} /> : null}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onUpdate)} className="grid gap-4" style={{ padding: '16px 0' }}>
          <div className="grid gap-2 field">
            <label htmlFor="edit-course-name" className="text-sm font-medium field__label">Course Name</label>
            <input id="edit-course-name" className="w-full rounded-md input" type="text" {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid gap-2 field">
            <label htmlFor="edit-course-code" className="text-sm font-medium field__label">Course Code</label>
            <input 
              id="edit-course-code" 
              className="w-full rounded-md input" 
              type="text" 
              style={{ textTransform: 'uppercase' }}
              {...register('code')} 
              onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
            />
            <FieldError message={errors.code?.message} />
          </div>

          <div className="grid gap-2 field">
            <label htmlFor="edit-course-description" className="text-sm font-medium field__label">Description</label>
            <textarea id="edit-course-description" className="w-full rounded-md input" rows={4} {...register('description')} />
            <FieldError message={errors.description?.message} />
          </div>
        </form>
      </Modal>
    </Page>
  );
}
