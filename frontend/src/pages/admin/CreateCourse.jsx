import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { Page, PageHeader } from '../../components/common/Page';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
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
  if (!message) return null;
  return <span className="text-xs text-red-500 mt-1 block">{message}</span>;
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
    <Page>
      <PageHeader
        eyebrow="Admin Workspace"
        eyebrowAccent
        title="Create new course"
        description="Set up a new course to manage enrollments and assignments."
        actions={
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft size={16} />
            Back to Courses
          </Button>
        }
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 surface-grid">
          <div className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--equal">
            <div className="grid gap-2 field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="course-name" className="text-sm font-medium field__label">
                Course Name
              </label>
              <input
                id="course-name"
                className="w-full rounded-md input"
                type="text"
                placeholder="e.g. Introduction to Computer Science"
                {...register('name')}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="grid gap-2 field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="course-code" className="text-sm font-medium field__label">
                Course Code
              </label>
              <input
                id="course-code"
                className="w-full rounded-md input"
                type="text"
                placeholder="e.g. CS-101"
                style={{ textTransform: 'uppercase' }}
                {...register('code')}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
              <FieldError message={errors.code?.message} />
            </div>

            <div className="grid gap-2 field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="course-description" className="text-sm font-medium field__label">
                Description
              </label>
              <textarea
                id="course-description"
                className="w-full rounded-md input"
                rows={4}
                placeholder="Brief description of the course..."
                {...register('description')}
              />
              <FieldError message={errors.description?.message} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </Page>
  );
}
