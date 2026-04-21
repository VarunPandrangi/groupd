import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StitchAssignmentsPage from '../../components/student/StitchAssignmentsPage';
import { useAuthStore } from '../../stores/authStore';
import { useAssignmentStore } from '../../stores/assignmentStore';
import { useSubmissionStore } from '../../stores/submissionStore';
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
  const fetchMySubmissions = useSubmissionStore((state) => state.fetchMySubmissions);
  const [loadError, setLoadError] = useState(false);
  const hasGroup = Boolean(user?.group_id);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const requests = [fetchAssignments()];

        if (user?.group_id) {
          requests.push(fetchMySubmissions());
        }

        await Promise.all(requests);
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
  }, [fetchAssignments, fetchMySubmissions, user?.group_id]);

  const sortedAssignments = useMemo(
    () => sortAssignmentsByDueDate(assignments),
    [assignments]
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (loadError) {
    return (
      <StitchAssignmentsPage
        hasGroup={hasGroup}
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
      hasGroup={hasGroup}
      assignments={sortedAssignments}
      onFindGroup={() => navigate('/student/group')}
      onOpenAssignment={(assignmentId) => {
        if (assignmentId) {
          navigate(`/student/assignments/${assignmentId}`);
        }
      }}
    />
  );
}
