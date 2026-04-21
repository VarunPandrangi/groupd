import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

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
    <div className="stitch-auth-login">
      <header className="stitch-auth-login__header">
        <div className="stitch-auth-login__brand" aria-label="groupd">
          group<span className="stitch-auth-login__brand-accent">d</span>
        </div>

        <div className="stitch-auth-login__header-actions">
          <Link to="/register" className="stitch-auth-login__register-link">
            Register
          </Link>
        </div>
      </header>

      <main className="stitch-auth-login__main">
        <section className="stitch-auth-login__card" aria-label="Sign in form">
          <h1 className="stitch-auth-login__title">SIGN IN</h1>
          <p className="stitch-auth-login__subtitle">ACCESS YOUR RESEARCH DASHBOARD</p>

          <form onSubmit={handleSubmit(onSubmit)} className="stitch-auth-login__form" noValidate>
            <div className="stitch-auth-login__field">
              <label htmlFor="login-email" className="stitch-auth-login__label">
                EMAIL ADDRESS
              </label>
              <input
                id="login-email"
                type="email"
                className="stitch-auth-login__input"
                placeholder="USER@INSTITUTION.EDU"
                autoComplete="email"
                {...register('email')}
              />
              <span className="stitch-auth-login__error">{errors.email?.message || ' '}</span>
            </div>

            <div className="stitch-auth-login__field">
              <label htmlFor="login-password" className="stitch-auth-login__label">
                PASSWORD
              </label>
              <input
                id="login-password"
                type="password"
                className="stitch-auth-login__input"
                placeholder="........"
                autoComplete="current-password"
                {...register('password')}
              />
              <span className="stitch-auth-login__error">{errors.password?.message || ' '}</span>
            </div>

            <button type="submit" disabled={isSubmitting} className="stitch-auth-login__submit">
              {isSubmitting ? <SpinnerGap size={16} className="spinner" /> : null}
              {isSubmitting ? 'AUTHENTICATING' : 'AUTHENTICATE'}
            </button>

            <p className="stitch-auth-login__switch">
              DON&apos;T HAVE AN ACCOUNT?
              <Link to="/register" className="stitch-auth-login__switch-link">
                SIGN UP
              </Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
