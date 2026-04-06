import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AssignmentForm from '../../components/admin/AssignmentForm';
import { useAssignmentStore } from '../../stores/assignmentStore';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function EditAssignment() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentAssignment = useAssignmentStore((state) => state.currentAssignment);
  const fetchAssignment = useAssignmentStore((state) => state.fetchAssignment);
  const updateAssignment = useAssignmentStore((state) => state.updateAssignment);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignment() {
      try {
        await fetchAssignment(id);
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error, 'Unable to load this assignment.'));
          navigate('/admin/assignments', { replace: true });
        }
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadAssignment();

    return () => {
      isMounted = false;
    };
  }, [fetchAssignment, id, navigate]);

  const initialValues = useMemo(() => {
    if (!currentAssignment || currentAssignment.id !== id) {
      return null;
    }

    return {
      title: currentAssignment.title,
      description: currentAssignment.description ?? '',
      due_date: currentAssignment.due_date,
      onedrive_link: currentAssignment.onedrive_link,
      assign_to: currentAssignment.assign_to,
      group_ids: currentAssignment.groups?.map((group) => group.id) ?? [],
    };
  }, [currentAssignment, id]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      await updateAssignment(id, values);
      toast.success('Assignment updated successfully.');
      navigate('/admin/assignments', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update this assignment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AssignmentForm
      heading="Edit assignment"
      description="Adjust the brief, refresh the deadline, or change the assignment scope without losing the original workflow."
      submitLabel="Save Changes"
      submitLabelPending="Saving..."
      onSubmit={handleSubmit}
      onBack={() => navigate('/admin/assignments')}
      backLabel="Back to Assignments"
      initialValues={
        initialValues ?? {
          title: '',
          description: '',
          due_date: '',
          onedrive_link: '',
          assign_to: 'all',
          group_ids: [],
        }
      }
      isSubmitting={isSubmitting}
      isLoadingInitial={isLoadingInitial}
    />
  );
}
