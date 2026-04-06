import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be 100 characters or fewer'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    studentId: z
      .string()
      .min(3, 'Student ID must be at least 3 characters')
      .max(50, 'Student ID must be 50 characters or fewer'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least 1 number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      studentId: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      await registerUser({
        full_name: formData.name,
        email: formData.email,
        student_id: formData.studentId,
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { name: 'studentId', label: 'Student ID', type: 'text', placeholder: 'STU-2024-001' },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'password' },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      placeholder: 'password',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center auth-page">
      <Card className="rounded-xl border w-full max-w-md auth-card">
        <p className="text-xs font-medium uppercase tracking-wide eyebrow eyebrow--accent">Create account</p>
        <h1 className="text-3xl font-bold tracking-tight page-title" style={{ marginTop: 10 }}>
          Join your class workspace
        </h1>
        <p className="text-base leading-relaxed page-description">
          Create a student account to join a group, track assignments, and confirm submissions with your team.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 surface-grid" style={{ marginTop: 24 }}>
          {fields.map((field) => (
            <div key={field.name} className="grid gap-2 field">
              <label htmlFor={`register-${field.name}`} className="text-sm font-medium field__label">
                {field.label}
              </label>
              <input
                id={`register-${field.name}`}
                type={field.type}
                className="w-full rounded-md input"
                placeholder={field.placeholder}
                autoComplete={field.type === 'email' ? 'email' : 'off'}
                {...register(field.name)}
              />
              <span className="text-xs field__error">{errors[field.name]?.message}</span>
            </div>
          ))}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" /> : null}
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-sm toolbar__meta" style={{ marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
