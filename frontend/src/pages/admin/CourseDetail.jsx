import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  CaretLeft,
  PencilSimple,
  SpinnerGap,
  Users,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { FadeUp, Page, StaggerGroup } from '../../components/common/Page';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useCourseStore } from '../../stores/courseStore';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const MAX_STUDENT_PREVIEW = 4;

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
  if (!message) {
    return null;
  }

  return <span className="field__error">{message}</span>;
}

function getStudentName(student) {
  return (
    student?.fullName ??
    student?.full_name ??
    student?.name ??
    student?.displayName ??
    'Student'
  );
}

function getStudentIdentifier(student) {
  return (
    student?.studentId ??
    student?.student_id ??
    student?.email ??
    student?.identifier ??
    ''
  );
}

function getAssignmentId(assignment) {
  return assignment?._id ?? assignment?.id ?? assignment?.assignment_id ?? null;
}

function getAssignmentTitle(assignment) {
  return assignment?.title ?? assignment?.name ?? assignment?.assignment_title ?? 'Untitled Assignment';
}

function getAssignmentDueDate(assignment) {
  return assignment?.dueDate ?? assignment?.due_date ?? assignment?.deadline ?? null;
}

function getSubmissionType(assignment) {
  return String(assignment?.submissionType ?? assignment?.submission_type ?? 'group')
    .trim()
    .toLowerCase();
}

function getComparableTimestamp(dateValue) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(dateValue).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function getLedgerStatus(dueDate) {
  if (!dueDate) {
    return { key: 'draft', label: 'Draft' };
  }

  const dueAt = new Date(dueDate).getTime();
  if (!Number.isFinite(dueAt)) {
    return { key: 'draft', label: 'Draft' };
  }

  if (dueAt < Date.now()) {
    return { key: 'closed', label: 'Closed' };
  }

  return { key: 'upcoming', label: 'Upcoming' };
}

function getLedgerClassification(assignment) {
  return getSubmissionType(assignment) === 'individual'
    ? { key: 'individual', label: 'Individual' }
    : { key: 'group', label: 'Group' };
}

function formatLedgerDate(dueDate) {
  if (!dueDate) {
    return 'TBD';
  }

  const formatted = formatAssignmentDate(dueDate);
  return formatted === 'TBD' ? formatted : formatted.toUpperCase();
}

function sortAssignments(assignments = []) {
  return [...assignments].sort((left, right) => {
    return getComparableTimestamp(getAssignmentDueDate(left)) - getComparableTimestamp(getAssignmentDueDate(right));
  });
}

function CourseDetailSkeleton() {
  return (
    <Page className="course-detail-architectural" aria-label="Loading admin course detail">
      <div className="course-detail-architectural__back-row">
        <Skeleton variant="text" width="128px" height="16px" />
      </div>

      <header className="course-detail-architectural__hero course-detail-architectural__hero--loading">
        <div className="course-detail-architectural__hero-copy">
          <Skeleton variant="text" width="56px" height="18px" style={{ marginBottom: '10px' }} />
          <Skeleton variant="text" width="66%" height="70px" style={{ marginBottom: '8px' }} />
          <Skeleton variant="text" width="48%" height="18px" />
        </div>
        <div className="course-detail-architectural__hero-action">
          <Skeleton variant="text" width="148px" height="44px" />
        </div>
      </header>

      <div className="course-detail-architectural__layout">
        <section className="course-detail-architectural__panel">
          <div className="course-detail-architectural__panel-head">
            <Skeleton variant="text" width="150px" height="24px" />
            <Skeleton variant="text" width="36px" height="22px" />
          </div>
          <div className="course-detail-architectural__panel-body">
            <div className="course-detail-architectural__roster-grid">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`roster-${index}`} variant="card" height="76px" style={{ borderRadius: '0px' }} />
              ))}
            </div>
          </div>
        </section>

        <section className="course-detail-architectural__panel course-detail-architectural__panel--ledger">
          <div className="course-detail-architectural__panel-head">
            <Skeleton variant="text" width="180px" height="24px" />
            <Skeleton variant="text" width="86px" height="22px" />
          </div>
          <div className="course-detail-architectural__ledger-shell">
            <Skeleton variant="text" height="38px" style={{ borderRadius: '0px' }} />
            <div className="course-detail-architectural__ledger-skeleton-stack">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`ledger-${index}`} variant="card" height="54px" style={{ borderRadius: '0px' }} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
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
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
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
        if (isMounted) {
          setFetchError(true);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [courseId, fetchCourse]);

  useEffect(() => {
    if (!currentCourse) {
      return;
    }

    reset({
      name: currentCourse.name ?? '',
      code: currentCourse.code ?? '',
      description: currentCourse.description ?? '',
    });
  }, [currentCourse, reset]);

  const sortedAssignments = useMemo(() => sortAssignments(assignments), [assignments]);
  const previewStudents = useMemo(
    () => currentCourseStudents.slice(0, MAX_STUDENT_PREVIEW),
    [currentCourseStudents]
  );
  const remainingStudents = Math.max(currentCourseStudents.length - MAX_STUDENT_PREVIEW, 0);

  const courseCode = String(currentCourse?.code ?? '').trim().toUpperCase() || 'COURSE';
  const courseName = String(currentCourse?.name ?? 'Untitled course').trim();
  const courseDescription =
    String(currentCourse?.description ?? '').trim() || 'No description provided yet.';

  const openEnrollmentManager = () => {
    navigate(`/admin/courses/${courseId}/enroll`);
  };

  const openCreateAssignment = () => {
    navigate('/admin/assignments/new');
  };

  const handleCourseEdit = async (values) => {
    setIsUpdating(true);

    try {
      await updateCourse(courseId, {
        ...values,
        code: String(values.code ?? '').toUpperCase(),
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
    return <CourseDetailSkeleton />;
  }

  return (
    <Page className="course-detail-architectural" aria-label="Admin Course Detail">
      <div className="course-detail-architectural__back-row">
        <button
          type="button"
          onClick={() => navigate('/admin/courses')}
          className="course-detail-architectural__back-link"
        >
          <CaretLeft size={16} weight="bold" />
          Back to Courses
        </button>
      </div>

      <header className="course-detail-architectural__hero">
        <div className="course-detail-architectural__hero-copy">
          <span className="course-detail-architectural__code">{courseCode}</span>
          <h1 className="course-detail-architectural__title">{courseName}</h1>
          <p className="course-detail-architectural__subtitle">{courseDescription}</p>
        </div>
        <div className="course-detail-architectural__hero-divider" aria-hidden="true" />
        <div className="course-detail-architectural__hero-action">
          <button
            type="button"
            className="course-detail-architectural__hero-btn"
            onClick={() => setIsEditModalOpen(true)}
          >
            <PencilSimple size={15} weight="bold" />
            Edit Course
          </button>
        </div>
      </header>

      <div className="course-detail-architectural__layout">
        <section className="course-detail-architectural__panel course-detail-architectural__panel--roster">
          <div className="course-detail-architectural__panel-head">
            <h2 className="course-detail-architectural__panel-title">Enrolled Roster</h2>
            <span className="course-detail-architectural__count-badge">{currentCourseStudents.length}</span>
          </div>

          <div className="course-detail-architectural__panel-body course-detail-architectural__panel-body--roster">
            {currentCourseStudents.length === 0 ? (
              <div className="course-detail-architectural__empty-card">
                <p>No students are enrolled yet.</p>
              </div>
            ) : (
              <StaggerGroup className="course-detail-architectural__roster-grid">
                {previewStudents.map((student) => {
                  const studentName = getStudentName(student);
                  const studentIdentifier = getStudentIdentifier(student);

                  return (
                    <FadeUp key={student?._id ?? student?.id ?? `${studentName}-${studentIdentifier}`}>
                      <article className="course-detail-architectural__student-card">
                        <div className="course-detail-architectural__student-avatar" aria-hidden="true">
                          <Users size={18} weight="regular" />
                        </div>
                        <div className="course-detail-architectural__student-copy">
                          <p className="course-detail-architectural__student-name">{studentName}</p>
                          <p className="course-detail-architectural__student-id">
                            {studentIdentifier || 'No student ID'}
                          </p>
                        </div>
                      </article>
                    </FadeUp>
                  );
                })}

                {remainingStudents > 0 ? (
                  <FadeUp className="course-detail-architectural__more-card-wrap">
                    <button
                      type="button"
                      className="course-detail-architectural__more-card"
                      onClick={openEnrollmentManager}
                    >
                      <span>{`+ ${remainingStudents} MORE RECORDS`}</span>
                    </button>
                  </FadeUp>
                ) : null}
              </StaggerGroup>
            )}
          </div>
        </section>

        <section className="course-detail-architectural__panel course-detail-architectural__panel--ledger">
          <div className="course-detail-architectural__panel-head course-detail-architectural__panel-head--ledger">
            <h2 className="course-detail-architectural__panel-title">Course Assignments</h2>
            <div className="course-detail-architectural__panel-actions">
              <button
                type="button"
                className="course-detail-architectural__ghost-btn"
                onClick={openCreateAssignment}
              >
                Create Assignment
              </button>
              <span className="course-detail-architectural__count-badge course-detail-architectural__count-badge--dark">
                TOTAL: {sortedAssignments.length}
              </span>
            </div>
          </div>

          <div className="course-detail-architectural__ledger-shell">
            <div className="course-detail-architectural__ledger-head">
              <div>SYS_ID</div>
              <div>TASK_DESCRIPTOR</div>
              <div className="course-detail-architectural__ledger-center">CLASSIFICATION</div>
              <div className="course-detail-architectural__ledger-end">DEADLINE_TS</div>
            </div>

            {sortedAssignments.length === 0 ? (
              <div className="course-detail-architectural__empty-card course-detail-architectural__empty-card--ledger">
                <p>No assignments have been posted yet.</p>
              </div>
            ) : (
              <StaggerGroup className="course-detail-architectural__ledger-rows">
                {sortedAssignments.map((assignment, index) => {
                  const assignmentId = getAssignmentId(assignment);
                  const assignmentTitle = getAssignmentTitle(assignment);
                  const dueDate = getAssignmentDueDate(assignment);
                  const status = getLedgerStatus(dueDate);
                  const classification = getLedgerClassification(assignment);
                  const rowId = `A${String(index + 1).padStart(2, '0')}`;
                  const deadline = formatLedgerDate(dueDate);
                  const isAltRow = index % 2 === 1;

                  return (
                    <FadeUp key={assignmentId ?? `${rowId}-${assignmentTitle}`}>
                      <button
                        type="button"
                        className={`course-detail-architectural__ledger-row course-detail-architectural__ledger-row--${status.key} ${
                          isAltRow ? 'course-detail-architectural__ledger-row--alt' : ''
                        }`}
                        onClick={() => {
                          if (assignmentId) {
                            navigate(`/admin/assignments/${assignmentId}`);
                          }
                        }}
                      >
                        <div className="course-detail-architectural__ledger-id">{rowId}</div>

                        <div className="course-detail-architectural__ledger-task">
                          <span
                            className={`course-detail-architectural__status-chip course-detail-architectural__status-chip--${status.key}`}
                          >
                            {status.label}
                          </span>
                          <strong className={`course-detail-architectural__ledger-title course-detail-architectural__ledger-title--${status.key}`}>
                            {assignmentTitle}
                          </strong>
                        </div>

                        <div className="course-detail-architectural__ledger-classification">
                          <span
                            className={`course-detail-architectural__classification-chip course-detail-architectural__classification-chip--${classification.key}`}
                          >
                            {classification.label}
                          </span>
                        </div>

                        <div
                          className={`course-detail-architectural__ledger-date course-detail-architectural__ledger-date--${status.key}`}
                        >
                          {deadline}
                        </div>

                        <div className="course-detail-architectural__ledger-go" aria-hidden="true">
                          <ArrowRight size={16} />
                        </div>
                      </button>
                    </FadeUp>
                  );
                })}
              </StaggerGroup>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Edit Course"
        description="Update the course details."
        showClose
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="course-edit-form" disabled={isUpdating}>
              {isUpdating ? <SpinnerGap className="spinner" size={16} /> : null}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form
          id="course-edit-form"
          onSubmit={handleSubmit(handleCourseEdit)}
          className="grid gap-4 course-detail-architectural__form"
        >
          <div className="grid gap-2 field">
            <label htmlFor="edit-course-name" className="field__label">
              Course Name
            </label>
            <input id="edit-course-name" className="w-full rounded-md input" type="text" {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid gap-2 field">
            <label htmlFor="edit-course-code" className="field__label">
              Course Code
            </label>
            <input
              id="edit-course-code"
              className="w-full rounded-md input"
              type="text"
              style={{ textTransform: 'uppercase' }}
              {...register('code', {
                setValueAs: (value) => String(value ?? '').toUpperCase(),
              })}
            />
            <FieldError message={errors.code?.message} />
          </div>

          <div className="grid gap-2 field">
            <label htmlFor="edit-course-description" className="field__label">
              Description
            </label>
            <textarea
              id="edit-course-description"
              className="w-full rounded-md input"
              rows={4}
              {...register('description')}
            />
            <FieldError message={errors.description?.message} />
          </div>
        </form>
      </Modal>
    </Page>
  );
}
