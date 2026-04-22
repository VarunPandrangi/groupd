import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StitchAssignmentsPage from '../../components/student/StitchAssignmentsPage';
import { useAuthStore } from '../../stores/authStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useSubmissionStore } from '../../stores/submissionStore';
import { useCourseStore } from '../../stores/courseStore';
import { sortAssignmentsByDueDate } from '../../utils/assignmentDates';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function AssignmentList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const assignments = useAssignmentStore((state) => state.assignments);
  const isLoading = useAssignmentStore((state) => state.isLoading);
  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);
  const mySubmissions = useSubmissionStore((state) => state.mySubmissions);
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const courses = useCourseStore((state) => state.courses);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        await Promise.all([
          fetchCourses(),
          fetchAssignments(),
          fetchMySubmissions().catch(() => []),
        ]);

        if (isMounted) {
          setLoadError(false);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(true);
          toast.error(getErrorMessage(error, 'Unable to load assignments right now.'));
        }
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, [fetchAssignments, fetchCourses, fetchMySubmissions]);

  const courseIdSet = useMemo(
    () => new Set((courses ?? []).map((course) => course?._id).filter(Boolean)),
    [courses]
  );

  const submittedAssignmentIds = useMemo(() => {
    const ids = new Set(
      (mySubmissions ?? []).map((submission) => submission?.assignment_id).filter(Boolean)
    );

    (assignments ?? []).forEach((assignment) => {
      if (assignment?.submission_status?.is_submitted && assignment?.id) {
        ids.add(assignment.id);
      }
    });

    return ids;
  }, [assignments, mySubmissions]);

  const scopedAssignments = useMemo(() => {
    return (assignments ?? []).filter((assignment) => {
      const assignmentCourseId = assignment?.course_id;
      return Boolean(assignmentCourseId && courseIdSet.has(assignmentCourseId));
    });
  }, [assignments, courseIdSet]);

  const pendingAssignments = useMemo(() => {
    return sortAssignmentsByDueDate(
      scopedAssignments.filter((assignment) => !submittedAssignmentIds.has(assignment.id))
    );
  }, [scopedAssignments, submittedAssignmentIds]);

  const canAccessAssignments = useMemo(() => {
    if (user?.group_id) {
      return true;
    }

    return scopedAssignments.some((assignment) => assignment.submission_type === 'individual');
  }, [scopedAssignments, user?.group_id]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (loadError) {
    return (
      <StitchAssignmentsPage
        hasGroup={canAccessAssignments}
        assignments={[]}
        onFindGroup={() => navigate('/student/group')}
        onOpenAssignment={(assignmentId) => {
          if (assignmentId) {
            navigate(`/student/assignments/${assignmentId}`);
          }
        }}
      />
    );
  }

  return (
    <StitchAssignmentsPage
      hasGroup={canAccessAssignments}
      assignments={pendingAssignments}
      onFindGroup={() => navigate('/student/group')}
      onOpenAssignment={(assignmentId) => {
        if (assignmentId) {
          navigate(`/student/assignments/${assignmentId}`);
        }
      }}
    />
  );
}
