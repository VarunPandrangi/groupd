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

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Welcome back!');

      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-page">
      <Card className="rounded-xl border w-full max-w-md auth-card">
        <p className="text-xs font-medium uppercase tracking-wide eyebrow eyebrow--accent">Sign in</p>
        <h1 className="text-3xl font-bold tracking-tight page-title" style={{ marginTop: 10 }}>
          Welcome back
        </h1>
        <p className="text-base leading-relaxed page-description">
          Sign in to continue to your workspace and pick up where your team left off.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 surface-grid" style={{ marginTop: 24 }}>
          <div className="grid gap-2 field">
            <label htmlFor="login-email" className="text-sm font-medium field__label">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="w-full rounded-md input"
              placeholder="you@example.com"
              autoComplete="email"
              {...register('email')}
            />
            <span className="text-xs field__error">{errors.email?.message}</span>
          </div>

          <div className="grid gap-2 field">
            <label htmlFor="login-password" className="text-sm font-medium field__label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="w-full rounded-md input"
              placeholder="password"
              autoComplete="current-password"
              {...register('password')}
            />
            <span className="text-xs field__error">{errors.password?.message}</span>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" /> : null}
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-sm toolbar__meta" style={{ marginTop: 20 }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
