import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Books, SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Page } from '../../components/common/Page';
import { useCourseStore } from '../../stores/courseStore';

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

  return <span className="create-course-architectural__field-error">{message}</span>;
}

export default function CreateCourse() {
  const navigate = useNavigate();
  const createCourse = useCourseStore((state) => state.createCourse);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
    },
  });

  const onSubmit = async (values) => {
    setIsSubmitting(true);

    try {
      await createCourse({
        ...values,
        code: values.code.toUpperCase(),
      });
      toast.success('Course created successfully.');
      navigate('/admin/courses', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page className="create-course-architectural" aria-label="Admin create course">
      <div className="create-course-architectural__masthead">
        <button
          type="button"
          className="create-course-architectural__back-btn"
          onClick={() => navigate('/admin/courses')}
        >
          <ArrowLeft size={18} weight="bold" />
          <span>Back to Courses</span>
        </button>
      </div>

      <header className="create-course-architectural__hero">
        <div className="create-course-architectural__brand-pill" aria-hidden="true">
          <Books size={15} weight="fill" />
          <span>Curriculum Engine</span>
        </div>
        <h1 className="create-course-architectural__title">
          Create new course
          <span className="create-course-architectural__title-accent">.</span>
        </h1>
        <div className="create-course-architectural__subtitle-row">
          <span className="create-course-architectural__subtitle-marker" aria-hidden="true" />
          <p className="create-course-architectural__subtitle">
            Set up a new course to manage enrollments and assignments.
          </p>
        </div>
      </header>

      <section className="create-course-architectural__shell" aria-label="Create course form">
        <div className="create-course-architectural__shell-bar" aria-hidden="true">
          <span className="create-course-architectural__shell-dot" />
          <span className="create-course-architectural__shell-dot" />
          <span className="create-course-architectural__shell-dot create-course-architectural__shell-dot--accent" />
        </div>

        <form className="create-course-architectural__form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="create-course-architectural__fields">
            <div className="create-course-architectural__field">
              <label htmlFor="course-name" className="create-course-architectural__label">
                Course Name
              </label>
              <input
                id="course-name"
                className="create-course-architectural__input"
                type="text"
                placeholder="e.g. Introduction to Computer Science"
                autoComplete="off"
                {...register('name')}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="create-course-architectural__field">
              <label htmlFor="course-code" className="create-course-architectural__label">
                Course Code
              </label>
              <input
                id="course-code"
                className="create-course-architectural__input"
                type="text"
                placeholder="E.G. CS-101"
                autoComplete="off"
                spellCheck="false"
                style={{ textTransform: 'uppercase' }}
                {...register('code', {
                  setValueAs: (value) => String(value ?? '').toUpperCase(),
                })}
              />
              <FieldError message={errors.code?.message} />
            </div>

            <div className="create-course-architectural__field create-course-architectural__field--span-2">
              <label htmlFor="course-description" className="create-course-architectural__label">
                Description
              </label>
              <textarea
                id="course-description"
                className="create-course-architectural__textarea"
                rows={7}
                placeholder="Enter course brief and learning objectives..."
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>
          </div>

          <div className="create-course-architectural__footer">
            <button
              type="button"
              className="create-course-architectural__cancel"
              onClick={() => navigate('/admin/courses')}
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button type="submit" className="create-course-architectural__submit" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={16} className="spinner" /> : null}
              <span>{isSubmitting ? 'Creating...' : 'Create Course'}</span>
              {!isSubmitting ? <ArrowRight size={18} weight="bold" /> : null}
            </button>
          </div>
        </form>
      </section>
    </Page>
  );
}
