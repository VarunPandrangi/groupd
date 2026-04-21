import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Books, FileText, Users, Plus, TrashSimple, PencilSimple } from '@phosphor-icons/react';
import { Page, StaggerGroup, FadeUp } from '../../components/common/Page';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useCourseStore } from '../../stores/courseStore';
import toast from 'react-hot-toast';

export default function CoursesList() {
  const navigate = useNavigate();
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const courses = useCourseStore((state) => state.courses);
  const isLoading = useCourseStore((state) => state.isLoading);
  const error = useCourseStore((state) => state.error);
  
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [fetchCourses]);

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete._id);
      toast.success('Course deleted successfully.');
      setCourseToDelete(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete course.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <Page>
        <EmptyState icon={Books} title="Error Loading Courses" message={error} />
      </Page>
    );
  }

  return (
    <Page className="workspace-cool" aria-label="Admin courses">
      <header className="workspace-cool__hero" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="workspace-cool__eyebrow">Admin Workspace</p>
          <h1 className="workspace-cool__title">My Courses</h1>
          <p className="workspace-cool__subtitle">Manage courses and curriculum.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/admin/courses/new')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} weight="bold" />
          Create Course
        </button>
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
          message="You haven't created any courses yet."
          actionLabel="Create Course"
          onAction={() => navigate('/admin/courses/new')}
        />
      ) : (
        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <FadeUp key={course._id}>
              <Card
                style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="mono muted" style={{ fontSize: '13px' }}>{course.code}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/courses/${course._id}`)}
                        className="btn btn--ghost btn--icon"
                        aria-label="Edit course"
                        style={{ padding: '4px', height: 'auto', minHeight: 'auto' }}
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(course)}
                        className="btn btn--ghost btn--icon"
                        aria-label="Delete course"
                        style={{ padding: '4px', height: 'auto', minHeight: 'auto', color: 'var(--text-critical)' }}
                      >
                        <TrashSimple size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 
                    className="card__title" 
                    style={{ marginTop: '8px', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/courses/${course._id}`)}
                  >
                    {course.name}
                  </h3>
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
                    <Users size={16} className="muted" />
                    <span style={{ fontSize: '14px', color: 'var(--text-body)', fontWeight: 500 }}>
                      {course.studentCount ?? 0} students
                    </span>
                  </div>
                  <div className="cluster" style={{ gap: '6px', marginLeft: '16px' }}>
                    <FileText size={16} className="muted" />
                    <span style={{ fontSize: '14px', color: 'var(--text-body)', fontWeight: 500 }}>
                      {course.assignmentCount ?? 0} assignments
                    </span>
                  </div>
                </div>
              </Card>
            </FadeUp>
          ))}
        </StaggerGroup>
      )}

      <ConfirmDialog
        isOpen={Boolean(courseToDelete)}
        title="Delete course"
        message={`Are you sure you want to delete "${courseToDelete?.name}"? Students will no longer see it.`}
        confirmText={isDeleting ? 'Deleting...' : 'Delete Course'}
        cancelText="Cancel"
        onCancel={() => {
          if (!isDeleting) setCourseToDelete(null);
        }}
        onConfirm={handleDelete}
        variant="danger"
      />
    </Page>
  );
}
