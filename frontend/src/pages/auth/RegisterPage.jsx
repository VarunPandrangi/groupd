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
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),
    studentId: z
      .string()
      .min(3, 'Student ID must be at least 3 characters')
      .max(50, 'Student ID must be 50 characters or fewer'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least 1 number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
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
    } catch (err) {
      const message =
        err?.response?.data?.error?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe', autoComplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
    { name: 'studentId', label: 'Student ID', type: 'text', placeholder: 'STU-2024-001', autoComplete: 'off' },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
  ];

  return (
    <>
      <style>{`
        @keyframes registerFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .register-card {
          opacity: 0;
          animation: registerFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        }

        .register-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        .register-input::placeholder {
          color: var(--text-tertiary);
        }
        .register-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(79, 123, 247, 0.15);
        }

        .register-btn {
          width: 100%;
          padding: 13px;
          background: var(--accent-primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .register-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(79, 123, 247, 0.25);
        }
        .register-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .register-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .register-link {
          color: var(--accent-primary);
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s ease;
        }
        .register-link:hover {
          opacity: 0.8;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          className="register-card"
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            padding: '40px 36px',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <Link
              to="/"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                textDecoration: 'none',
                display: 'block',
                marginBottom: '20px',
              }}
            >
              JoinEazy
            </Link>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                letterSpacing: '-0.02em',
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Join your classmates and start collaborating
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {fields.map((field) => (
              <div key={field.name} style={{ marginBottom: '18px' }}>
                <label
                  htmlFor={`register-${field.name}`}
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {field.label}
                </label>
                <input
                  id={`register-${field.name}`}
                  type={field.type}
                  className="register-input"
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  {...register(field.name)}
                />
                {errors[field.name] && (
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8rem',
                      color: 'var(--accent-danger)',
                      margin: '6px 0 0',
                    }}
                  >
                    {errors[field.name].message}
                  </p>
                )}
              </div>
            ))}

            {/* Submit */}
            <button
              type="submit"
              className="register-btn"
              disabled={isSubmitting}
              style={{ marginTop: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <SpinnerGap size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginTop: '24px',
              marginBottom: 0,
            }}
          >
            Already have an account?{' '}
            <Link to="/login" className="register-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
