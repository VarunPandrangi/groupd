import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Books,
  FileText,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  TrashSimple,
  Users,
} from '@phosphor-icons/react';
import { FadeUp, Page, StaggerGroup } from '../../components/common/Page';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useCourseStore } from '../../stores/courseStore';
import toast from 'react-hot-toast';

const COURSE_SIGNAL_ICONS = [Books, FileText, Users];

function pickSignalIcon(course) {
  const seed = `${course.code || ''}${course.name || ''}`;
  const hash = seed.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return COURSE_SIGNAL_ICONS[hash % COURSE_SIGNAL_ICONS.length];
}

export default function CoursesList() {
  const navigate = useNavigate();
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const deleteCourse = useCourseStore((state) => state.deleteCourse);
  const courses = useCourseStore((state) => state.courses);
  const isLoading = useCourseStore((state) => state.isLoading);
  const error = useCourseStore((state) => state.error);
  
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState('');

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return courses;
    }

    return courses.filter((course) => {
      const code = (course.code || '').toLowerCase();
      const name = (course.name || '').toLowerCase();
      const description = (course.description || '').toLowerCase();

      return (
        code.includes(normalizedQuery) ||
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery)
      );
    });
  }, [courses, query]);

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
    <Page className="my-courses-architectural" aria-label="Admin courses">
      <header className="my-courses-architectural__hero">
        <div className="my-courses-architectural__copy">
          <p className="my-courses-architectural__eyebrow">Admin Workspace</p>
          <h1 className="my-courses-architectural__title">My Courses</h1>
          <p className="my-courses-architectural__subtitle">Manage courses and curriculum.</p>
        </div>

        <div className="my-courses-architectural__controls">
          <label className="my-courses-architectural__search" htmlFor="course-search">
            <MagnifyingGlass size={16} weight="bold" />
            <input
              id="course-search"
              type="search"
              placeholder="QUERY_ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search courses"
            />
          </label>

        <button
          type="button"
          className="my-courses-architectural__create"
          onClick={() => navigate('/admin/courses/new')}
        >
          <Plus size={16} weight="bold" />
          Create Course
        </button>
        </div>
      </header>

      {isLoading ? (
        <div className="my-courses-architectural__grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={`courses-skeleton-${index}`} variant="card" style={{ height: '236px', borderRadius: '0px' }} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={Books}
          title={courses.length === 0 ? 'No Courses' : 'No Matching Courses'}
          message={
            courses.length === 0
              ? "You haven't created any courses yet."
              : 'Try a different code or keyword in your query.'
          }
          actionLabel={courses.length === 0 ? 'Create Course' : 'Clear Search'}
          onAction={() => {
            if (courses.length === 0) {
              navigate('/admin/courses/new');
              return;
            }

            setQuery('');
          }}
        />
      ) : (
        <StaggerGroup className="my-courses-architectural__grid">
          {filteredCourses.map((course) => {
            const SignalIcon = pickSignalIcon(course);

            return (
            <FadeUp key={course._id}>
              <article className="my-courses-architectural__card">
                <div className="my-courses-architectural__card-head">
                  <span className="my-courses-architectural__course-code">{course.code || 'UNTITLED'}</span>

                  <div className="my-courses-architectural__card-tools">
                    <SignalIcon size={14} weight="bold" className="my-courses-architectural__signal" />

                    <div className="my-courses-architectural__admin-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/courses/${course._id}`)}
                        className="my-courses-architectural__icon-action"
                        aria-label="Edit course"
                      >
                        <PencilSimple size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCourseToDelete(course)}
                        className="my-courses-architectural__icon-action my-courses-architectural__icon-action--danger"
                        aria-label="Delete course"
                      >
                        <TrashSimple size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="my-courses-architectural__card-main"
                  onClick={() => navigate(`/admin/courses/${course._id}`)}
                >
                  <h3 className="my-courses-architectural__course-name">{course.name}</h3>
                  <p className="my-courses-architectural__course-description">
                    {course.description || 'No description available.'}
                  </p>
                </button>

                <div className="my-courses-architectural__stats">
                  <div className="my-courses-architectural__stat">
                    <span>
                      <Users size={12} weight="bold" />
                      Students
                    </span>
                    <strong>{course.studentCount ?? 0}</strong>
                  </div>

                  <div className="my-courses-architectural__stat">
                    <span>
                      <FileText size={12} weight="bold" />
                      Tasks
                    </span>
                    <strong>{course.assignmentCount ?? 0}</strong>
                  </div>
                </div>
              </article>
            </FadeUp>
            );
          })}
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
