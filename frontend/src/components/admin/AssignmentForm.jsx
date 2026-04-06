import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, SpinnerGap } from '@phosphor-icons/react';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import RichTextEditor from '../common/RichTextEditor';
import { Page, PageHeader } from '../common/Page';
import groupService from '../../services/groupService';
import {
  formatAssignmentInputDate,
  getTomorrowDateInputValue,
  toAssignmentDueDate,
} from '../../utils/assignmentDates';
import { getRichTextPlainText, sanitizedRichTextHtml } from '../../utils/richText';

const GROUP_PAGE_SIZE = 50;

function getErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error?.message || fallbackMessage;
}

function buildSchema() {
  const tomorrow = getTomorrowDateInputValue();

  return z
    .object({
      title: z.string().trim().min(3).max(100),
      description: z
        .string()
        .optional()
        .or(z.literal(''))
        .refine((value) => getRichTextPlainText(value).length <= 2000, {
          message: 'Description must be 2000 characters or less',
        }),
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

  return <span className="field__error">{message}</span>;
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
  const descriptionValue = watch('description') ?? '';
  const selectedGroupIds = watch('group_ids');
  const descriptionRegistration = register('description');

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
      description: sanitizedRichTextHtml(values.description) || undefined,
      due_date: toAssignmentDueDate(values.due_date),
      onedrive_link: values.onedrive_link.trim(),
      assign_to: values.assign_to,
      group_ids: values.assign_to === 'specific' ? values.group_ids : undefined,
    });
  });

  return (
    <Page>
      <PageHeader
        eyebrow="Assignment Workspace"
        eyebrowAccent
        title={heading}
        description={description}
        actions={
          <Button type="button" variant="secondary" onClick={onBack}>
            <ArrowLeft size={16} />
            {backLabel}
          </Button>
        }
      />

      <Card>
        {isLoadingInitial ? (
          <LoadingSpinner fullPage={false} size={32} />
        ) : (
          <form onSubmit={handleFormSubmit} className="surface-grid">
            <div className="surface-grid surface-grid--equal">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="assignment-title" className="field__label">
                  Title
                </label>
                <input id="assignment-title" className="input" type="text" {...register('title')} />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="assignment-description" className="field__label">
                  Description
                </label>
                <RichTextEditor
                  value={descriptionValue}
                  placeholder="Add the brief, key instructions, and important notes here."
                  ariaLabel="Assignment description"
                  onChange={(nextValue) =>
                    setValue('description', nextValue, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  }
                />
                <input
                  id="assignment-description"
                  type="hidden"
                  {...descriptionRegistration}
                  value={descriptionValue}
                  readOnly
                />
                <span className="field__hint">
                  Select text, then use the toolbar to make it bold, italic, or underlined.
                </span>
                <FieldError message={errors.description?.message} />
              </div>

              <div className="field">
                <label htmlFor="assignment-due-date" className="field__label">
                  Due Date
                </label>
                <input
                  id="assignment-due-date"
                  className="input"
                  type="date"
                  min={getTomorrowDateInputValue()}
                  {...register('due_date')}
                />
                <FieldError message={errors.due_date?.message} />
              </div>

              <div className="field">
                <label htmlFor="assignment-link" className="field__label">
                  OneDrive Link
                </label>
                <input
                  id="assignment-link"
                  className="input"
                  type="url"
                  {...register('onedrive_link')}
                />
                <FieldError message={errors.onedrive_link?.message} />
              </div>
            </div>

            <Card as="section" className="surface-grid">
              <div className="section-heading">
                <p className="eyebrow">Assign To</p>
                <h2 className="section-heading__title">Choose the audience</h2>
                <p className="page-description">
                  Decide whether this assignment goes to every group or only a selected set.
                </p>
              </div>

              <div className="segmented">
                {[
                  {
                    value: 'all',
                    label: 'All Groups',
                    hint: 'Every student group will see this assignment immediately.',
                  },
                  {
                    value: 'specific',
                    label: 'Specific Groups',
                    hint: 'Limit visibility to the groups you choose below.',
                  },
                ].map((option) => {
                  const isActive = assignTo === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`segmented__option ${
                        isActive ? 'segmented__option--active' : ''
                      }`}
                      onClick={() => handleAssignToChange(option.value)}
                    >
                      <strong>{option.label}</strong>
                      <span className="muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {assignTo === 'specific' ? (
                <div className="surface-grid">
                  <div className="toolbar">
                    <p className="toolbar__meta">
                      {selectedGroupIds.length} group{selectedGroupIds.length === 1 ? '' : 's'} selected
                    </p>
                    {isLoadingGroups ? <LoadingSpinner fullPage={false} size={18} /> : null}
                  </div>

                  <div className="check-list">
                    {groups.map((group) => {
                      const isChecked = selectedGroupIds.includes(group.id);

                      return (
                        <button
                          key={group.id}
                          type="button"
                          className={`check-list__item ${
                            isChecked ? 'check-list__item--active' : ''
                          }`}
                          onClick={() => handleGroupToggle(group.id)}
                        >
                          <div>
                            <div className="table__title">{group.name}</div>
                            <span className="table__description">
                              {group.description || 'No description provided.'}
                            </span>
                          </div>
                          <span
                            className={`check-list__indicator ${
                              isChecked ? 'check-list__indicator--active' : ''
                            }`}
                          />
                        </button>
                      );
                    })}

                    {!isLoadingGroups && groups.length === 0 ? (
                      <p className="empty-state__message" style={{ textAlign: 'left' }}>
                        No groups are available yet. Create student groups first or switch this assignment to all groups.
                      </p>
                    ) : null}
                  </div>

                  <FieldError message={groupsError || errors.group_ids?.message} />
                </div>
              ) : null}
            </Card>

            <div className="toolbar">
              <p className="toolbar__meta">
                Students will see the assignment immediately after this change is saved.
              </p>
              <Button type="submit" disabled={isSubmitting || isLoadingInitial}>
                {isSubmitting ? <SpinnerGap size={16} className="spinner" /> : null}
                {isSubmitting ? submitLabelPending : submitLabel}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </Page>
  );
}
