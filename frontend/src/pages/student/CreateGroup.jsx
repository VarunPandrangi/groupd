import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  SpinnerGap,
} from '@phosphor-icons/react';
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
    <div className="stitch-dashboard__module-wrap stitch-create-shell" aria-label="Create group workspace">
      <section className="stitch-create-team" aria-labelledby="stitch-create-team-title">
        <div className="stitch-create-team__bar">
          <span className="stitch-create-team__crumb">SYSTEM / GROUPS / NEW</span>

          <button
            type="button"
            className="stitch-create-team__back"
            onClick={() => navigate('/student/group')}
          >
            <ArrowLeft size={14} />
            BACK TO GROUP
          </button>
        </div>

        <form className="stitch-create-team__body" onSubmit={handleSubmit(onSubmit)}>
          <header className="stitch-create-team__header">
            <h2 id="stitch-create-team-title" className="stitch-create-team__title">
              CREATE A TEAM
              <br />
              WORTH RALLYING
              <br />
              AROUND.
            </h2>

            <p className="stitch-create-team__description">
              Pick a name your classmates will recognize, add a short description if you want one,
              and you will become the group leader automatically.
            </p>
          </header>

          <div className="stitch-create-team__field-wrap">
            <label htmlFor="group-name" className="stitch-create-team__label">
              GROUP NAME
            </label>
            <input
              id="group-name"
              type="text"
              className="stitch-create-team__input"
              placeholder="Team Polaris"
              autoComplete="off"
              {...register('name')}
            />
            {errors.name?.message ? <p className="stitch-create-team__error">{errors.name.message}</p> : null}
          </div>

          <div className="stitch-create-team__field-wrap">
            <label htmlFor="group-description" className="stitch-create-team__label">
              DESCRIPTION
            </label>
            <textarea
              id="group-description"
              rows={4}
              className="stitch-create-team__textarea"
              placeholder="What is this team working toward?"
              {...register('description')}
            />
            {errors.description?.message ? (
              <p className="stitch-create-team__error">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="stitch-create-team__actions">
            <p className="stitch-create-team__hint">
              You can invite up to five more students after the group is created.
            </p>

            <button type="submit" className="stitch-create-team__submit" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={16} className="spinner" /> : null}
              <span>{isSubmitting ? 'CREATING...' : 'CREATE GROUP'}</span>
              {!isSubmitting ? <ArrowRight size={14} weight="bold" /> : null}
            </button>
          </div>
        </form>

        <div className="stitch-create-team__accent" aria-hidden="true" />
      </section>
    </div>
  );
}
