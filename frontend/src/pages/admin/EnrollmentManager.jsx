import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CaretLeft,
  FunnelSimple,
  MagnifyingGlass,
  SpinnerGap,
  User,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { FadeUp, Page, StaggerGroup } from '../../components/common/Page';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useCourseStore } from '../../stores/courseStore';
import './EnrollmentManager.css';

const enrollmentDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

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

function getEnrollmentDate(student) {
  return (
    student?.enrolledAt ??
    student?.enrollmentDate ??
    student?.createdAt ??
    student?.created_at ??
    null
  );
}

function formatEnrollmentDate(value) {
  if (!value) {
    return 'N/A';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return enrollmentDateFormatter.format(date);
}

function EnrollmentLoadingState() {
  return (
    <Page className="enrollment-architectural enrollment-architectural--loading" aria-label="Loading enrollment workspace">
      <div className="enrollment-architectural__loading-stack">
        <div className="enrollment-architectural__loading-hero">
          <div className="enrollment-architectural__loading-copy">
            <Skeleton variant="text" width="148px" height="12px" />
            <Skeleton variant="text" width="340px" height="34px" />
            <Skeleton variant="text" width="460px" height="14px" />
          </div>
          <Skeleton variant="text" width="140px" height="40px" />
        </div>

        <div className="enrollment-architectural__loading-section">
          <Skeleton variant="text" width="160px" height="12px" />
          <Skeleton variant="card" height="150px" />
        </div>

        <div className="enrollment-architectural__loading-section">
          <div className="enrollment-architectural__loading-head">
            <Skeleton variant="text" width="220px" height="12px" />
            <Skeleton variant="text" width="64px" height="12px" />
          </div>
          <Skeleton variant="card" height="420px" />
        </div>
      </div>
    </Page>
  );
}

export default function EnrollmentManager() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const fetchCourse = useCourseStore((state) => state.fetchCourse);
  const enrollStudent = useCourseStore((state) => state.enrollStudent);
  const unenrollStudent = useCourseStore((state) => state.unenrollStudent);

  const currentCourse = useCourseStore((state) => state.currentCourse);
  const currentCourseStudents = useCourseStore((state) => state.currentCourseStudents);
  const isLoading = useCourseStore((state) => state.isLoading);

  const [identifier, setIdentifier] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        await fetchCourse(courseId);
        if (isMounted) {
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

  const enrolledStudents = Array.isArray(currentCourseStudents) ? currentCourseStudents : [];
  const enrolledCount = enrolledStudents.length;
  const courseCode = String(currentCourse?.code ?? '').trim().toUpperCase() || 'COURSE';
  const courseName = String(currentCourse?.name ?? 'Untitled course').trim() || 'Untitled course';
  const courseDescription = `Manage students enrolled in ${courseName}.`;

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return;
    }

    setIsEnrolling(true);
    setEnrollError('');

    const payload = identifier.includes('@')
      ? { email: identifier.trim() }
      : { studentId: identifier.trim() };

    try {
      await enrollStudent(courseId, payload);
      toast.success('Student enrolled successfully.');
      setIdentifier('');
      await fetchCourse(courseId);
    } catch (error) {
      const code = error?.response?.data?.error?.code;
      const message = error?.response?.data?.message || 'Unable to enroll student.';

      if (code === 'ALREADY_ENROLLED') {
        setEnrollError('Student is already enrolled');
      } else if (code === 'CANNOT_ENROLL_NON_STUDENT') {
        setEnrollError('Only students can be enrolled');
      } else if (code === 'STUDENT_NOT_FOUND' || error?.response?.status === 404) {
        setEnrollError('No student found with this identifier');
      } else {
        setEnrollError(message);
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemove = async () => {
    if (!studentToRemove) {
      return;
    }

    setIsRemoving(true);

    try {
      await unenrollStudent(courseId, studentToRemove._id);
      toast.success('Student removed from course.');
      setStudentToRemove(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to remove student.');
    } finally {
      setIsRemoving(false);
    }
  };

  if (fetchError) {
    return (
      <Page className="enrollment-architectural" aria-label="Enrollment workspace error">
        <EmptyState
          title="Course Not Found"
          message="You do not own this course or it does not exist."
          actionLabel="Back to Courses"
          onAction={() => navigate('/admin/courses')}
        />
      </Page>
    );
  }

  if (isLoading && !currentCourse) {
    return <EnrollmentLoadingState />;
  }

  return (
    <Page className="enrollment-architectural" aria-label="Enrollment Manager">
      <header className="enrollment-architectural__header">
        <div className="enrollment-architectural__header-cluster">
          <button
            type="button"
            className="enrollment-architectural__back-link"
            onClick={() => navigate(`/admin/courses/${courseId}`)}
          >
            <CaretLeft size={16} weight="bold" />
            <span>Back to Course</span>
          </button>
          <span className="enrollment-architectural__header-divider" aria-hidden="true" />

          <div className="enrollment-architectural__header-copy">
            <p className="enrollment-architectural__eyebrow">ADMIN WORKSPACE</p>
            <h1 className="enrollment-architectural__title">Enrollment: {courseCode}</h1>
            <p className="enrollment-architectural__subtitle">{courseDescription}</p>
          </div>
        </div>
      </header>

      <section className="enrollment-architectural__section" aria-label="Enroll a student">
        <h2 className="enrollment-architectural__section-title">Enroll a Student</h2>

        <div className="enrollment-architectural__enroll-card">
          <form onSubmit={handleEnroll} className="enrollment-architectural__enroll-form">
            <div className="enrollment-architectural__field">
              <label htmlFor="enrollment-identifier" className="enrollment-architectural__field-label">
                Student ID or Email
              </label>
              <div className="enrollment-architectural__input-shell">
                <MagnifyingGlass
                  size={18}
                  weight="bold"
                  className="enrollment-architectural__input-icon"
                  aria-hidden="true"
                />
                <input
                  id="enrollment-identifier"
                  type="text"
                  className="enrollment-architectural__input"
                  placeholder="e.g. STU-9921 or name@edu.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setEnrollError('');
                  }}
                  disabled={isEnrolling}
                  autoComplete="off"
                />
              </div>
              {enrollError ? <p className="enrollment-architectural__error">{enrollError}</p> : null}
            </div>

            <button
              type="submit"
              className="enrollment-architectural__primary-btn"
              disabled={isEnrolling || !identifier.trim()}
            >
              {isEnrolling ? <SpinnerGap className="spinner" size={16} /> : null}
              <span>{isEnrolling ? 'Enrolling...' : 'Enroll'}</span>
            </button>
          </form>
        </div>
      </section>

      <section className="enrollment-architectural__section" aria-label="Enrolled students">
        <div className="enrollment-architectural__ledger-headline">
          <h2 className="enrollment-architectural__ledger-title">
            Enrolled Students <span className="enrollment-architectural__ledger-count">({enrolledCount})</span>
          </h2>
          <button type="button" className="enrollment-architectural__filter-btn" aria-label="Filter enrolled students">
            <FunnelSimple size={15} weight="bold" />
            <span>Filter</span>
          </button>
        </div>

        <div className="enrollment-architectural__section-rule" aria-hidden="true" />

        <div className="enrollment-architectural__ledger-card">
          <div className="enrollment-architectural__ledger-grid enrollment-architectural__ledger-grid--head">
            <div>Student Name</div>
            <div className="enrollment-architectural__col-id">Student ID</div>
            <div className="enrollment-architectural__col-date">Enrollment Date</div>
            <div className="enrollment-architectural__col-action enrollment-architectural__ledger-action-head">
              Action
            </div>
          </div>

          {enrolledCount === 0 ? (
            <div className="enrollment-architectural__empty-card">
              <p>No students are enrolled yet.</p>
              <p>Use the form above to add the first student.</p>
            </div>
          ) : (
            <StaggerGroup className="enrollment-architectural__ledger-list">
              {enrolledStudents.map((student, index) => {
                const studentName = getStudentName(student);
                const studentIdentifier = getStudentIdentifier(student);
                const enrollmentDate = formatEnrollmentDate(getEnrollmentDate(student));
                const rowKey =
                  student?._id ?? student?.id ?? `${studentName}-${studentIdentifier || index}`;
                const isAltRow = index % 2 === 1;

                return (
                  <FadeUp key={rowKey}>
                    <div
                      className={`enrollment-architectural__ledger-row${
                        isAltRow ? ' enrollment-architectural__ledger-row--alt' : ''
                      }`}
                    >
                      <div className="enrollment-architectural__student-main">
                        <div className="enrollment-architectural__student-avatar" aria-hidden="true">
                          <User size={18} weight="fill" />
                        </div>
                        <div className="enrollment-architectural__student-copy">
                          <p className="enrollment-architectural__student-name">{studentName}</p>
                          <p className="enrollment-architectural__mobile-meta">
                            <span>{studentIdentifier || 'No student ID'}</span>
                            <span className="enrollment-architectural__mobile-meta-divider" aria-hidden="true">
                              -
                            </span>
                            <span>{enrollmentDate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="enrollment-architectural__ledger-id">
                        {studentIdentifier || 'N/A'}
                      </div>

                      <div className="enrollment-architectural__ledger-date">{enrollmentDate}</div>

                      <div className="enrollment-architectural__ledger-action">
                        <button
                          type="button"
                          className="enrollment-architectural__remove-btn"
                          onClick={() => setStudentToRemove(student)}
                          disabled={isRemoving}
                          title={`Remove ${studentName}`}
                          aria-label={`Remove ${studentName}`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </FadeUp>
                );
              })}
            </StaggerGroup>
          )}
        </div>
      </section>

      <ConfirmDialog
        isOpen={Boolean(studentToRemove)}
        title="Remove student"
        message={`Are you sure you want to remove ${getStudentName(studentToRemove)} from this course? They will lose access to course assignments.`}
        confirmText={isRemoving ? 'Removing...' : 'Remove Student'}
        cancelText="Cancel"
        onCancel={() => {
          if (!isRemoving) {
            setStudentToRemove(null);
          }
        }}
        onConfirm={handleRemove}
        variant="danger"
      />
    </Page>
  );
}
