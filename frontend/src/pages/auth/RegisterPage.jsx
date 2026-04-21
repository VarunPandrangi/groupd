import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

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
    <div className="stitch-auth-signup">
      <main className="stitch-auth-signup__main">
        <section className="stitch-auth-signup__card" aria-label="Create account form">
          <span className="stitch-auth-signup__corner stitch-auth-signup__corner--top" aria-hidden="true" />
          <span className="stitch-auth-signup__corner stitch-auth-signup__corner--bottom" aria-hidden="true" />

          <div className="stitch-auth-signup__header">
            <h1 className="stitch-auth-signup__brand">GROUPD</h1>
            <h2 className="stitch-auth-signup__title">Join your class workspace</h2>
            <p className="stitch-auth-signup__subtitle">
              Create a student account to join a group, track assignments, and confirm submissions with your team.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="stitch-auth-signup__form" noValidate>
            {fields.map((field) => (
              <div key={field.name} className="stitch-auth-signup__field">
                <label htmlFor={`register-${field.name}`} className="stitch-auth-signup__label">
                  {field.label.toUpperCase()}
                </label>
                <input
                  id={`register-${field.name}`}
                  type={field.type}
                  className="stitch-auth-signup__input"
                  placeholder={field.placeholder}
                  autoComplete={field.type === 'email' ? 'email' : 'off'}
                  {...register(field.name)}
                />
                <span className="stitch-auth-signup__error">{errors[field.name]?.message || ' '}</span>
              </div>
            ))}

            <button type="submit" disabled={isSubmitting} className="stitch-auth-signup__submit">
              {isSubmitting ? <SpinnerGap size={16} className="spinner" /> : null}
              <span>{isSubmitting ? 'CREATING ACCOUNT' : 'CREATE ACCOUNT'}</span>
              <span aria-hidden="true" className="stitch-auth-signup__submit-arrow">
                -&gt;
              </span>
              <span aria-hidden="true" className="stitch-auth-signup__submit-depth" />
            </button>
          </form>

          <div className="stitch-auth-signup__switch">
            <p>
              Already have an account?
              <Link to="/login" className="stitch-auth-signup__switch-link">
                SIGN IN
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
