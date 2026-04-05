import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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
    <>
      <style>{`
        @keyframes createGroupFade {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .create-group-card {
          animation: createGroupFade 0.45s ease forwards;
        }

        .create-group-input:focus,
        .create-group-textarea:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 4px rgba(79, 123, 247, 0.15);
        }

        .create-group-submit:hover:not(:disabled),
        .create-group-back:hover {
          transform: translateY(-1px);
        }
      `}</style>

      <div
        style={{
          minHeight: 'calc(100vh - var(--navbar-height) - 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0',
        }}
      >
        <div
          className="create-group-card"
          style={{
            width: '100%',
            maxWidth: '760px',
            borderRadius: '32px',
            border: '1px solid var(--border-default)',
            background:
              'radial-gradient(circle at top left, rgba(79, 123, 247, 0.18), transparent 32%), linear-gradient(180deg, rgba(26, 29, 39, 0.98), rgba(19, 22, 31, 1))',
            boxShadow: '0 30px 70px rgba(0, 0, 0, 0.18)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 'clamp(24px, 4vw, 40px)',
              display: 'grid',
              gap: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ maxWidth: '560px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: 'rgba(79, 123, 247, 0.12)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <Sparkles size={16} />
                  New Group
                </div>

                <h1
                  style={{
                    marginTop: '18px',
                    fontSize: 'clamp(2.3rem, 5vw, 3.2rem)',
                    lineHeight: 0.96,
                    letterSpacing: '-0.05em',
                    color: 'var(--text-primary)',
                  }}
                >
                  Create a team worth rallying around
                </h1>

                <p
                  style={{
                    margin: '14px 0 0',
                    maxWidth: '52ch',
                    fontSize: '1rem',
                    lineHeight: 1.8,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Pick a name your classmates will recognize, add a short description if you want one, and we will make you the group leader automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/student/group')}
                className="create-group-back"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-default)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'transform 180ms ease',
                }}
              >
                <ArrowLeft size={18} />
                Back to Group
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              style={{
                display: 'grid',
                gap: '20px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gap: '20px',
                }}
              >
                <div>
                  <label
                    htmlFor="group-name"
                    style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Group Name
                  </label>
                  <input
                    id="group-name"
                    type="text"
                    placeholder="Team Polaris"
                    className="create-group-input"
                    {...register('name')}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      borderRadius: '18px',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 180ms ease, box-shadow 180ms ease',
                    }}
                  />
                  {errors.name ? (
                    <p
                      style={{
                        margin: '8px 0 0',
                        fontSize: '0.86rem',
                        color: 'var(--accent-danger)',
                      }}
                    >
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="group-description"
                    style={{
                      display: 'block',
                      marginBottom: '10px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    id="group-description"
                    rows={5}
                    placeholder="What is this team working toward?"
                    className="create-group-textarea"
                    {...register('description')}
                    style={{
                      width: '100%',
                      padding: '16px 18px',
                      borderRadius: '18px',
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '1rem',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '144px',
                      transition: 'border-color 180ms ease, box-shadow 180ms ease',
                    }}
                  />
                  {errors.description ? (
                    <p
                      style={{
                        margin: '8px 0 0',
                        fontSize: '0.86rem',
                        color: 'var(--accent-danger)',
                      }}
                    >
                      {errors.description.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '16px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  paddingTop: '8px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    maxWidth: '38ch',
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                    color: 'var(--text-secondary)',
                  }}
                >
                  You will be the leader automatically and can invite up to five more students after the group is created.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="create-group-submit"
                  style={{
                    minWidth: '170px',
                    padding: '14px 20px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.8 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'transform 180ms ease',
                    boxShadow: '0 18px 40px rgba(79, 123, 247, 0.22)',
                  }}
                >
                  {isSubmitting ? <LoadingSpinner fullPage={false} size={18} /> : null}
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
