import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ArrowLeft, SpinnerGap } from '@phosphor-icons/react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { Page, PageHeader } from '../../components/common/Page';
import { useGroupStore } from '../../stores/groupStore';

const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Group name must be at least 3 characters long')
    .max(50, 'Group name must be at most 50 characters long')
    .regex(
      /^[A-Za-z0-9 -]+$/,
      'Group name can only contain letters, numbers, spaces, and hyphens'
    ),
  description: z
    .string()
    .trim()
    .max(200, 'Description must be at most 200 characters long')
    .optional()
    .or(z.literal('')),
});

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

export default function CreateGroup() {
  const navigate = useNavigate();
  const createGroup = useGroupStore((state) => state.createGroup);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      await createGroup({
        name: formData.name,
        description: formData.description || undefined,
      });
      toast.success('Group created successfully.');
      navigate('/student/group', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to create your group right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow="New Group"
        eyebrowAccent
        title="Create a team worth rallying around"
        description="Pick a name your classmates will recognize, add a short description if you want one, and you will become the group leader automatically."
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate('/student/group')}>
            <ArrowLeft size={16} />
            Back to Group
          </Button>
        }
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 surface-grid">
          <div className="grid gap-2 field">
            <label htmlFor="group-name" className="text-sm font-medium field__label">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              className="w-full rounded-md input"
              placeholder="Team Polaris"
              {...register('name')}
            />
            <span className="text-xs field__error">{errors.name?.message}</span>
          </div>

          <div className="grid gap-2 field">
            <label htmlFor="group-description" className="text-sm font-medium field__label">
              Description
            </label>
            <textarea
              id="group-description"
              rows={5}
              className="w-full rounded-md textarea"
              placeholder="What is this team working toward?"
              {...register('description')}
            />
            <span className="text-xs field__error">{errors.description?.message}</span>
          </div>

          <div className="flex items-center justify-between gap-4 toolbar">
            <p className="text-sm toolbar__meta">
              You can invite up to five more students after the group is created.
            </p>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" /> : null}
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
