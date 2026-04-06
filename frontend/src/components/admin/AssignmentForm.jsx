import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Sparkles } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import groupService from '../../services/groupService';
import {
  formatAssignmentInputDate,
  getTomorrowDateInputValue,
  toAssignmentDueDate,
} from '../../utils/assignmentDates';

const GROUP_PAGE_SIZE = 50;

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function buildSchema() {
  const tomorrow = getTomorrowDateInputValue();

  return z
    .object({
      title: z.string().trim().min(3).max(100),
      description: z.string().trim().max(2000).optional().or(z.literal('')),
      due_date: z.string().min(1, 'Due date is required').refine((value) => value >= tomorrow, {
        message: 'Due date must be in the future',
      }),
      onedrive_link: z
        .string()
        .trim()
        .url('OneDrive link must be a valid URL')
        .refine((value) => /^https?:\/\//i.test(value), {
          message: 'OneDrive link must start with http:// or https://',
        }),
      assign_to: z.enum(['all', 'specific']),
      group_ids: z.array(z.string()).default([]),
    })
    .superRefine((value, context) => {
      if (value.assign_to === 'specific' && value.group_ids.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one group must be selected',
          path: ['group_ids'],
        });
      }
    });
}

async function getAllGroups() {
  const groups = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await groupService.getAllGroups(page, GROUP_PAGE_SIZE);
    groups.push(...response.groups);
    totalPages = response.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return groups;
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p style={{ margin: '8px 0 0', fontSize: '0.86rem', color: 'var(--accent-danger)' }}>
      {message}
    </p>
  );
}

export default function AssignmentForm({
  heading,
  description,
  submitLabel,
  submitLabelPending,
  onSubmit,
  onBack,
  backLabel,
  initialValues,
  isSubmitting,
  isLoadingInitial = false,
}) {
  const [groups, setGroups] = useState([]);
  const [groupsError, setGroupsError] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [hasLoadedGroups, setHasLoadedGroups] = useState(false);
  const defaultValues = useMemo(
    () => ({
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      due_date: formatAssignmentInputDate(initialValues?.due_date),
      onedrive_link: initialValues?.onedrive_link ?? '',
      assign_to: initialValues?.assign_to ?? 'all',
      group_ids: initialValues?.group_ids ?? [],
    }),
    [initialValues]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
    reset,
  } = useForm({
    resolver: zodResolver(buildSchema()),
    defaultValues,
  });

  const assignTo = watch('assign_to');
  const selectedGroupIds = watch('group_ids');

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (assignTo !== 'specific' || hasLoadedGroups) {
      return;
    }

    let isMounted = true;

    async function loadGroups() {
      setIsLoadingGroups(true);
      setGroupsError('');

      try {
        const nextGroups = await getAllGroups();
        if (isMounted) {
          setGroups(nextGroups);
          setHasLoadedGroups(true);
        }
      } catch (error) {
        if (isMounted) {
          setGroupsError(getErrorMessage(error, 'Unable to load groups right now.'));
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      }
    }

    loadGroups();
    return () => {
      isMounted = false;
    };
  }, [assignTo, hasLoadedGroups]);

  const inputStyle = {
    width: '100%',
    padding: '16px 18px',
    borderRadius: '18px',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '1rem',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '0.82rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  };

  const handleGroupToggle = (groupId) => {
    const nextValue = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter((value) => value !== groupId)
      : [...selectedGroupIds, groupId];

    setValue('group_ids', nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleAssignToChange = (nextValue) => {
    setValue('assign_to', nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    if (nextValue !== 'specific') {
      clearErrors('group_ids');
    }
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      due_date: toAssignmentDueDate(values.due_date),
      onedrive_link: values.onedrive_link.trim(),
      assign_to: values.assign_to,
      group_ids: values.assign_to === 'specific' ? values.group_ids : undefined,
    });
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <section
        style={{
          width: '100%',
          maxWidth: '880px',
          borderRadius: '32px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--accent-primary) 16%, transparent), transparent 36%), var(--bg-secondary)',
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.18)',
          padding: 'clamp(24px, 4vw, 40px)',
          display: 'grid',
          gap: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: '620px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '999px',
                background: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)',
                color: 'var(--accent-primary)',
                fontSize: '0.82rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <Sparkles size={16} />
              Assignment Workspace
            </div>
            <h1 style={{ marginTop: '18px', fontSize: 'clamp(2.2rem, 5vw, 3.1rem)', letterSpacing: '-0.05em' }}>
              {heading}
            </h1>
            <p style={{ margin: '14px 0 0', maxWidth: '58ch', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
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
            }}
          >
            <ArrowLeft size={18} />
            {backLabel}
          </button>
        </div>

        {isLoadingInitial ? (
          <div style={{ minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner fullPage={false} size={40} />
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} style={{ display: 'grid', gap: '22px' }}>
            <div>
              <label htmlFor="assignment-title" style={labelStyle}>
                Title
              </label>
              <input id="assignment-title" type="text" {...register('title')} style={inputStyle} />
              <FieldError message={errors.title?.message} />
            </div>

            <div>
              <label htmlFor="assignment-description" style={labelStyle}>
                Description
              </label>
              <textarea id="assignment-description" rows={6} {...register('description')} style={{ ...inputStyle, minHeight: '160px', resize: 'vertical' }} />
              <FieldError message={errors.description?.message} />
            </div>

            <div style={{ display: 'grid', gap: '22px', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div>
                <label htmlFor="assignment-due-date" style={labelStyle}>
                  Due Date
                </label>
                <input id="assignment-due-date" type="date" min={getTomorrowDateInputValue()} {...register('due_date')} style={inputStyle} />
                <FieldError message={errors.due_date?.message} />
              </div>

              <div>
                <label htmlFor="assignment-link" style={labelStyle}>
                  OneDrive Link
                </label>
                <input id="assignment-link" type="url" {...register('onedrive_link')} style={inputStyle} />
                <FieldError message={errors.onedrive_link?.message} />
              </div>
            </div>

            <div style={{ padding: '22px', borderRadius: '24px', border: '1px solid var(--border-default)', background: 'color-mix(in srgb, var(--bg-secondary) 82%, black)', display: 'grid', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, ...labelStyle }}>Assign To</p>
                <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  Choose whether this assignment goes to every group or only a selected set.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {[
                  { value: 'all', label: 'All Groups', hint: 'Every student group will see this assignment.' },
                  { value: 'specific', label: 'Specific Groups', hint: 'Limit visibility to the groups you choose below.' },
                ].map((option) => {
                  const isActive = assignTo === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAssignToChange(option.value)}
                      style={{
                        textAlign: 'left',
                        padding: '18px',
                        borderRadius: '20px',
                        border: isActive ? '1px solid color-mix(in srgb, var(--accent-primary) 36%, transparent)' : '1px solid var(--border-default)',
                        background: isActive ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{option.label}</div>
                      <p style={{ margin: '10px 0 0', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                        {option.hint}
                      </p>
                    </button>
                  );
                })}
              </div>

              {assignTo === 'specific' ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {selectedGroupIds.length} group{selectedGroupIds.length === 1 ? '' : 's'} selected
                    </p>
                    {isLoadingGroups ? <LoadingSpinner fullPage={false} size={18} /> : null}
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '8px', borderRadius: '18px', border: '1px solid var(--border-default)', background: 'var(--bg-primary)', display: 'grid', gap: '8px' }}>
                    {groups.map((group) => {
                      const isChecked = selectedGroupIds.includes(group.id);

                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => handleGroupToggle(group.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '14px',
                            width: '100%',
                            padding: '14px 16px',
                            borderRadius: '16px',
                            border: isChecked ? '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)' : '1px solid transparent',
                            background: isChecked ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'transparent',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-body)',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontWeight: 700 }}>{group.name}</p>
                            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                              {group.description || 'No description provided.'}
                            </p>
                          </div>
                          <span style={{ width: '18px', height: '18px', borderRadius: '6px', border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--border-hover)', background: isChecked ? 'var(--accent-primary)' : 'transparent', flexShrink: 0 }} />
                        </button>
                      );
                    })}

                    {!isLoadingGroups && groups.length === 0 ? (
                      <p style={{ margin: 0, padding: '16px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        No groups are available yet. Create student groups first or switch this assignment to all groups.
                      </p>
                    ) : null}
                  </div>

                  <FieldError message={groupsError || errors.group_ids?.message} />
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, maxWidth: '42ch', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                Students will see the assignment immediately after this change is saved.
              </p>

              <button
                type="submit"
                disabled={isSubmitting || isLoadingInitial}
                style={{
                  minWidth: '190px',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: isSubmitting || isLoadingInitial ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || isLoadingInitial ? 0.8 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 18px 40px rgba(79, 123, 247, 0.22)',
                }}
              >
                {isSubmitting ? <LoadingSpinner fullPage={false} size={18} /> : null}
                {isSubmitting ? submitLabelPending : submitLabel}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
