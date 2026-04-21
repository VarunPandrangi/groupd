import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CaretLeft, Users, UserMinus, Plus, SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Page, PageHeader } from '../../components/common/Page';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useCourseStore } from '../../stores/courseStore';

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
        if (isMounted) setFetchError(false);
      } catch (err) {
        if (isMounted) setFetchError(true);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [courseId, fetchCourse]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setIsEnrolling(true);
    setEnrollError('');

    const payload = identifier.includes('@') 
      ? { email: identifier.trim() } 
      : { studentId: identifier.trim() };

    try {
      await enrollStudent(courseId, payload);
      toast.success('Student enrolled successfully.');
      setIdentifier('');
      // Refresh course to get updated student list
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
    if (!studentToRemove) return;
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

  if (isLoading && !currentCourse) {
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
    <Page className="workspace-cool" aria-label="Enrollment Manager">
      <PageHeader
        eyebrow="Admin Workspace"
        eyebrowAccent
        title={`Enrollment: ${currentCourse?.code}`}
        description={`Manage students enrolled in ${currentCourse?.name}.`}
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate(`/admin/courses/${courseId}`)}>
            <CaretLeft size={16} />
            Back to Course
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card>
          <div style={{ padding: '8px 0' }}>
            <h2 className="text-lg font-bold mb-2">Enroll a Student</h2>
            <p className="muted mb-4">Enter a student's email address or Student ID to add them to this course.</p>
            
            <form onSubmit={handleEnroll} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="text"
                  className="w-full rounded-md input"
                  placeholder="Email or Student ID..."
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setEnrollError('');
                  }}
                  disabled={isEnrolling}
                />
                {enrollError && <span className="text-xs text-red-500 mt-1">{enrollError}</span>}
              </div>
              <Button type="submit" variant="primary" disabled={isEnrolling || !identifier.trim()}>
                {isEnrolling ? <SpinnerGap className="spinner" size={16} /> : <Plus size={16} />}
                {isEnrolling ? 'Enrolling...' : 'Enroll'}
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="text-lg font-bold">Enrolled Students ({currentCourseStudents.length})</h2>
            </div>

            {currentCourseStudents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No Students Enrolled"
                message="Enroll a student using the form above."
              />
            ) : (
              <div className="grid gap-3">
                {currentCourseStudents.map(student => (
                  <div 
                    key={student._id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '16px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={20} className="muted" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px' }}>{student.fullName}</p>
                        <p className="muted" style={{ fontSize: '12px' }}>{student.studentId || student.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setStudentToRemove(student)}
                      style={{ color: 'var(--text-critical)' }}
                      title="Remove student"
                    >
                      <UserMinus size={18} />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={Boolean(studentToRemove)}
        title="Remove student"
        message={`Are you sure you want to remove ${studentToRemove?.fullName} from this course? They will lose access to course assignments.`}
        confirmText={isRemoving ? 'Removing...' : 'Remove Student'}
        cancelText="Cancel"
        onCancel={() => {
          if (!isRemoving) setStudentToRemove(null);
        }}
        onConfirm={handleRemove}
        variant="danger"
      />
    </Page>
  );
}
