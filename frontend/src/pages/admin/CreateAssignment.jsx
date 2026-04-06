import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AssignmentForm from '../../components/admin/AssignmentForm';
import { useAssignmentStore } from '../../stores/assignmentStore';

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function CreateAssignment() {
  const navigate = useNavigate();
  const createAssignment = useAssignmentStore((state) => state.createAssignment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      await createAssignment(values);
      toast.success('Assignment created successfully.');
      navigate('/admin/assignments', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create this assignment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <AssignmentForm
        heading="Create a new assignment"
        description="Capture the brief, set a clear due date, and decide whether it should reach every group or only a hand-picked set."
        submitLabel="Create Assignment"
        submitLabelPending="Creating..."
        onSubmit={handleSubmit}
        onBack={() => navigate('/admin/assignments')}
        backLabel="Back to Assignments"
        initialValues={{
          title: '',
          description: '',
          due_date: '',
          onedrive_link: '',
          assign_to: 'all',
          group_ids: [],
        }}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
