import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  SpinnerGap,
  UserList,
  UsersThree,
} from '@phosphor-icons/react';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import RichTextEditor from '../common/RichTextEditor';
import { Page, PageHeader } from '../common/Page';
import groupService from '../../services/groupService';
import {
  formatAssignmentInputDate,
  formatAssignmentInputTime,
  getTomorrowDateInputValue,
  toAssignmentDueDate,
} from '../../utils/assignmentDates';
import { getRichTextPlainText, sanitizedRichTextHtml } from '../../utils/richText';

const GROUP_PAGE_SIZE = 50;
const DEFAULT_DUE_TIME = '23:59';
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

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
      due_time: z
        .string()
        .min(1, 'Due time is required')
        .regex(TIME_INPUT_PATTERN, 'Due time must be valid'),
      onedrive_link: z
        .string()
        .trim()
        .url('Link must be a valid URL')
        .refine((value) => /^https?:\/\//i.test(value), {
          message: 'Link must start with http:// or https://',
        }),
      assign_to: z.enum(['all', 'specific']),
      group_ids: z.array(z.string()).default([]),
    })
    .superRefine((value, context) => {
      if (value.due_date && TIME_INPUT_PATTERN.test(value.due_time)) {
        const dueAt = new Date(`${value.due_date}T${value.due_time}:00`);
        if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() <= Date.now()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Due date and time must be in the future',
            path: ['due_time'],
          });
        }
      }

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

  return <span className="text-xs field__error">{message}</span>;
}

function AudienceOption({
  value,
  label,
  hint,
  isActive,
  icon: Icon,
  onSelect,
}) {
  return (
    <button
      type="button"
      className={`assignment-create-screen__audience-card${
        isActive ? ' assignment-create-screen__audience-card--active' : ''
      }`}
      onClick={() => onSelect(value)}
      aria-pressed={isActive}
    >
      <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
      <strong>{label}</strong>
      <span>{hint}</span>
    </button>
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
  visualVariant = 'default',
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
      due_time: formatAssignmentInputTime(initialValues?.due_date) || DEFAULT_DUE_TIME,
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
  const selectedGroupIds = watch('group_ids') ?? [];
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
      due_date: toAssignmentDueDate(values.due_date, values.due_time),
      onedrive_link: values.onedrive_link.trim(),
      assign_to: values.assign_to,
      group_ids: values.assign_to === 'specific' ? values.group_ids : undefined,
    });
  });

  const selectedGroupOptions = useMemo(() => {
    return selectedGroupIds.map((groupId) => {
      const matchedGroup = groups.find((group) => group.id === groupId);
      return {
        id: groupId,
        name: matchedGroup?.name || 'Selected Group',
      };
    });
  }, [groups, selectedGroupIds]);

  if (visualVariant === 'architectural-edit') {
    return (
      <Page className="assignment-edit-architectural">
        <header className="assignment-edit-architectural__header">
          <h1 className="assignment-edit-architectural__title">{heading}</h1>
          {description ? (
            <p className="assignment-edit-architectural__description">{description}</p>
          ) : null}
        </header>

        <form onSubmit={handleFormSubmit} className="assignment-edit-architectural__form">
          {isLoadingInitial ? (
            <div className="assignment-edit-architectural__loading">
              <LoadingSpinner fullPage={false} size={32} />
            </div>
          ) : (
            <>
              <section className="assignment-edit-architectural__section">
                <div className="assignment-edit-architectural__section-tag">Core Details</div>

                <div className="assignment-edit-architectural__field">
                  <label htmlFor="assignment-title" className="assignment-edit-architectural__label">
                    Assignment Title
                  </label>
                  <input
                    id="assignment-title"
                    className="assignment-edit-architectural__input"
                    type="text"
                    {...register('title')}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="assignment-edit-architectural__field">
                  <label
                    htmlFor="assignment-description"
                    className="assignment-edit-architectural__label"
                  >
                    Detailed Brief
                  </label>
                  <div className="assignment-edit-architectural__editor">
                    <RichTextEditor
                      value={descriptionValue}
                      placeholder="Provide assignment details and instructions..."
                      ariaLabel="Assignment description"
                      toolbarVariant="letters"
                      onChange={(nextValue) =>
                        setValue('description', nextValue, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                  <input
                    id="assignment-description"
                    type="hidden"
                    {...descriptionRegistration}
                    value={descriptionValue}
                    readOnly
                  />
                  <FieldError message={errors.description?.message} />
                </div>
              </section>

              <section className="assignment-edit-architectural__section">
                <div className="assignment-edit-architectural__section-tag">
                  Logistics &amp; Timeline
                </div>

                <div className="assignment-edit-architectural__grid-2">
                  <div className="assignment-edit-architectural__field">
                    <label htmlFor="assignment-due-date" className="assignment-edit-architectural__label">
                      Due Date
                    </label>
                    <input
                      id="assignment-due-date"
                      className="assignment-edit-architectural__input"
                      type="date"
                      min={getTomorrowDateInputValue()}
                      {...register('due_date')}
                    />
                    <FieldError message={errors.due_date?.message} />
                  </div>

                  <div className="assignment-edit-architectural__field">
                    <label htmlFor="assignment-due-time" className="assignment-edit-architectural__label">
                      Due Time
                    </label>
                    <input
                      id="assignment-due-time"
                      className="assignment-edit-architectural__input"
                      type="time"
                      {...register('due_time')}
                    />
                    <FieldError message={errors.due_time?.message} />
                  </div>

                  <div className="assignment-edit-architectural__field assignment-edit-architectural__field--full">
                    <label htmlFor="assignment-link" className="assignment-edit-architectural__label">
                      External Resource Link
                    </label>
                    <input
                      id="assignment-link"
                      className="assignment-edit-architectural__input"
                      type="url"
                      placeholder="https://"
                      {...register('onedrive_link')}
                    />
                    <FieldError message={errors.onedrive_link?.message} />
                  </div>
                </div>
              </section>

              <section className="assignment-edit-architectural__section">
                <div className="assignment-edit-architectural__section-tag">Audience Selection</div>

                <label className="assignment-edit-architectural__label">Choose The Audience</label>
                <div className="assignment-edit-architectural__audience-grid">
                  {[
                    {
                      value: 'all',
                      label: 'All Groups',
                      hint: 'Broadcast this assignment to every active cohort.',
                    },
                    {
                      value: 'specific',
                      label: 'Specific Groups',
                      hint: 'Target specific engineering cohorts for this task.',
                    },
                  ].map((option) => {
                    const isActive = assignTo === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`assignment-edit-architectural__audience-option${
                          isActive ? ' assignment-edit-architectural__audience-option--active' : ''
                        }`}
                        onClick={() => handleAssignToChange(option.value)}
                      >
                        <span
                          className={`assignment-edit-architectural__audience-check${
                            isActive ? ' assignment-edit-architectural__audience-check--active' : ''
                          }`}
                          aria-hidden="true"
                        >
                          {isActive ? <Check size={11} weight="bold" /> : null}
                        </span>
                        <span className="assignment-edit-architectural__audience-copy">
                          <strong>{option.label}</strong>
                          <small>{option.hint}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {assignTo === 'specific' ? (
                  <div className="assignment-edit-architectural__groups-panel">
                    <div className="assignment-edit-architectural__chip-list">
                      {selectedGroupOptions.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className="assignment-edit-architectural__group-chip"
                          onClick={() => handleGroupToggle(group.id)}
                        >
                          {group.name}
                          <span aria-hidden="true">×</span>
                        </button>
                      ))}
                      {!isLoadingGroups ? (
                        <span className="assignment-edit-architectural__group-count">
                          {selectedGroupOptions.length} selected
                        </span>
                      ) : (
                        <LoadingSpinner fullPage={false} size={16} />
                      )}
                    </div>

                    <div className="assignment-edit-architectural__group-pool">
                      {groups.map((group) => {
                        const isChecked = selectedGroupIds.includes(group.id);

                        return (
                          <button
                            key={group.id}
                            type="button"
                            className={`assignment-edit-architectural__group-pool-item${
                              isChecked
                                ? ' assignment-edit-architectural__group-pool-item--active'
                                : ''
                            }`}
                            onClick={() => handleGroupToggle(group.id)}
                          >
                            {group.name}
                          </button>
                        );
                      })}
                    </div>

                    <FieldError message={groupsError || errors.group_ids?.message} />
                  </div>
                ) : null}
              </section>

              <footer className="assignment-edit-architectural__footer">
                <button
                  type="button"
                  className="assignment-edit-architectural__cancel"
                  onClick={onBack}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="assignment-edit-architectural__save"
                  disabled={isSubmitting || isLoadingInitial}
                >
                  {isSubmitting ? (
                    <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" />
                  ) : null}
                  {isSubmitting ? submitLabelPending : submitLabel}
                </button>
              </footer>
            </>
          )}
        </form>
      </Page>
    );
  }

  if (visualVariant === 'architectural-create') {
    return (
      <Page className="assignment-create-screen">
        <div className="assignment-create-screen__frame">
          <div className="assignment-create-screen__crumbs" aria-label="Page breadcrumb">
            <span>Assignment Workspace</span>
            <span>//</span>
            <span>Create</span>
          </div>

          <div className="assignment-create-screen__heading">
            <h1 className="assignment-create-screen__title">{heading}</h1>
            {description ? (
              <p className="assignment-create-screen__description">{description}</p>
            ) : null}
          </div>

          <section className="assignment-create-screen__panel">
            {isLoadingInitial ? (
              <div className="assignment-create-screen__loading">
                <LoadingSpinner fullPage={false} size={32} />
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="assignment-create-screen__form">
                <div className="assignment-create-screen__field">
                  <label htmlFor="assignment-title" className="assignment-create-screen__label">
                    Title
                  </label>
                  <input
                    id="assignment-title"
                    className="assignment-create-screen__input"
                    type="text"
                    placeholder="Enter assignment title"
                    {...register('title')}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="assignment-create-screen__field">
                  <label
                    htmlFor="assignment-description"
                    className="assignment-create-screen__label"
                  >
                    Description
                  </label>
                  <div className="assignment-create-screen__editor">
                    <RichTextEditor
                      value={descriptionValue}
                      placeholder="Provide assignment details and instructions..."
                      ariaLabel="Assignment description"
                      toolbarVariant="letters"
                      onChange={(nextValue) =>
                        setValue('description', nextValue, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                  <input
                    id="assignment-description"
                    type="hidden"
                    {...descriptionRegistration}
                    value={descriptionValue}
                    readOnly
                  />
                  <FieldError message={errors.description?.message} />
                </div>

                <div className="assignment-create-screen__row">
                  <div className="assignment-create-screen__field">
                    <label
                      htmlFor="assignment-due-date"
                      className="assignment-create-screen__label"
                    >
                      Due Date
                    </label>
                    <input
                      id="assignment-due-date"
                      className="assignment-create-screen__input"
                      type="date"
                      min={getTomorrowDateInputValue()}
                      {...register('due_date')}
                    />
                    <FieldError message={errors.due_date?.message} />
                  </div>

                  <div className="assignment-create-screen__field">
                    <label
                      htmlFor="assignment-due-time"
                      className="assignment-create-screen__label"
                    >
                      Due Time
                    </label>
                    <input
                      id="assignment-due-time"
                      className="assignment-create-screen__input"
                      type="time"
                      {...register('due_time')}
                    />
                    <FieldError message={errors.due_time?.message} />
                  </div>
                </div>

                <div className="assignment-create-screen__field">
                  <label htmlFor="assignment-link" className="assignment-create-screen__label">
                    Link
                  </label>
                  <input
                    id="assignment-link"
                    className="assignment-create-screen__input"
                    type="url"
                    placeholder="https://example.com/submission"
                    {...register('onedrive_link')}
                  />
                  <FieldError message={errors.onedrive_link?.message} />
                </div>

                <div className="assignment-create-screen__divider" aria-hidden="true" />

                <section className="assignment-create-screen__audience">
                  <div className="assignment-create-screen__section-copy">
                    <h2>Choose the audience</h2>
                    <p>
                      Decide whether this assignment goes to every group or only a selected
                      set.
                    </p>
                  </div>

                  <div className="assignment-create-screen__audience-grid">
                    <AudienceOption
                      value="all"
                      label="All Groups"
                      hint="Every student group will see this assignment immediately."
                      isActive={assignTo === 'all'}
                      icon={UsersThree}
                      onSelect={handleAssignToChange}
                    />
                    <AudienceOption
                      value="specific"
                      label="Specific Groups"
                      hint="Limit visibility to the groups you choose below."
                      isActive={assignTo === 'specific'}
                      icon={UserList}
                      onSelect={handleAssignToChange}
                    />
                  </div>

                  {assignTo === 'specific' ? (
                    <div className="assignment-create-screen__group-box">
                      <div className="assignment-create-screen__group-meta">
                        <p>
                          {selectedGroupIds.length} group
                          {selectedGroupIds.length === 1 ? '' : 's'} selected
                        </p>
                        {isLoadingGroups ? <LoadingSpinner fullPage={false} size={18} /> : null}
                      </div>

                      <div className="assignment-create-screen__group-list">
                        {groups.map((group) => {
                          const isChecked = selectedGroupIds.includes(group.id);

                          return (
                            <button
                              key={group.id}
                              type="button"
                              className={`assignment-create-screen__group-item${
                                isChecked ? ' assignment-create-screen__group-item--active' : ''
                              }`}
                              onClick={() => handleGroupToggle(group.id)}
                              aria-pressed={isChecked}
                            >
                              <span
                                className={`assignment-create-screen__group-check${
                                  isChecked
                                    ? ' assignment-create-screen__group-check--active'
                                    : ''
                                }`}
                                aria-hidden="true"
                              >
                                {isChecked ? <Check size={12} weight="bold" /> : null}
                              </span>
                              <span className="assignment-create-screen__group-copy">
                                <strong>{group.name}</strong>
                                <small>
                                  {group.description || 'No description provided for this group.'}
                                </small>
                              </span>
                            </button>
                          );
                        })}

                        {!isLoadingGroups && groups.length === 0 ? (
                          <p className="assignment-create-screen__group-empty">
                            No groups are available yet. Create student groups first or switch this
                            assignment to all groups.
                          </p>
                        ) : null}
                      </div>

                      <FieldError message={groupsError || errors.group_ids?.message} />
                    </div>
                  ) : null}
                </section>

                <div className="assignment-create-screen__footer">
                  <p className="assignment-create-screen__footer-note">
                    Students will see the assignment immediately after this change is saved.
                  </p>

                  <div className="assignment-create-screen__footer-actions">
                    <button
                      type="button"
                      className="assignment-create-screen__ghost-btn"
                      onClick={onBack}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="assignment-create-screen__submit-btn"
                      disabled={isSubmitting || isLoadingInitial}
                    >
                      {isSubmitting ? (
                        <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" />
                      ) : null}
                      {isSubmitting ? submitLabelPending : submitLabel}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        </div>
      </Page>
    );
  }

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
          <form onSubmit={handleFormSubmit} className="grid gap-4 surface-grid">
            <div className="grid gap-4 sm:grid-cols-2 surface-grid surface-grid--equal">
              <div className="grid gap-2 field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="assignment-title" className="text-sm font-medium field__label">
                  Title
                </label>
                <input id="assignment-title" className="w-full rounded-md input" type="text" {...register('title')} />
                <FieldError message={errors.title?.message} />
              </div>

              <div className="grid gap-2 field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="assignment-description" className="text-sm font-medium field__label">
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
                <span className="text-xs field__hint">
                  Select text, then use the toolbar to make it bold, italic, or underlined.
                </span>
                <FieldError message={errors.description?.message} />
              </div>

              <div className="grid gap-2 field">
                <label htmlFor="assignment-due-date" className="text-sm font-medium field__label">
                  Due Date
                </label>
                <input
                  id="assignment-due-date"
                  className="w-full rounded-md input"
                  type="date"
                  min={getTomorrowDateInputValue()}
                  {...register('due_date')}
                />
                <FieldError message={errors.due_date?.message} />
              </div>

              <div className="grid gap-2 field">
                <label htmlFor="assignment-due-time" className="text-sm font-medium field__label">
                  Due Time
                </label>
                <input
                  id="assignment-due-time"
                  className="w-full rounded-md input"
                  type="time"
                  {...register('due_time')}
                />
                <FieldError message={errors.due_time?.message} />
              </div>

              <div className="grid gap-2 field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="assignment-link" className="text-sm font-medium field__label">
                  Link
                </label>
                <input
                  id="assignment-link"
                  className="w-full rounded-md input"
                  type="url"
                  {...register('onedrive_link')}
                />
                <FieldError message={errors.onedrive_link?.message} />
              </div>
            </div>

            <Card as="section" className="grid gap-4 surface-grid">
              <div className="grid gap-2 section-heading">
                <p className="text-xs font-medium uppercase tracking-wide eyebrow">Assign To</p>
                <h2 className="text-2xl font-bold tracking-tight section-heading__title">Choose the audience</h2>
                <p className="text-base leading-relaxed page-description">
                  Decide whether this assignment goes to every group or only a selected set.
                </p>
              </div>

              <div className="grid gap-3 segmented">
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
                      <span className="text-sm muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>

              {assignTo === 'specific' ? (
                <div className="grid gap-4 surface-grid">
                  <div className="flex items-center justify-between gap-4 toolbar">
                    <p className="text-sm toolbar__meta">
                      {selectedGroupIds.length} group{selectedGroupIds.length === 1 ? '' : 's'} selected
                    </p>
                    {isLoadingGroups ? <LoadingSpinner fullPage={false} size={18} /> : null}
                  </div>

                  <div className="grid gap-2 overflow-y-auto rounded-lg check-list">
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
                            <div className="text-sm font-semibold table__title">{group.name}</div>
                            <span className="text-sm leading-relaxed table__description">
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
                      <p className="text-base leading-relaxed empty-state__message" style={{ textAlign: 'left' }}>
                        No groups are available yet. Create student groups first or switch this assignment to all groups.
                      </p>
                    ) : null}
                  </div>

                  <FieldError message={groupsError || errors.group_ids?.message} />
                </div>
              ) : null}
            </Card>

            <div className="flex items-center justify-between gap-4 toolbar">
              <p className="text-sm toolbar__meta">
                Students will see the assignment immediately after this change is saved.
              </p>
              <Button type="submit" disabled={isSubmitting || isLoadingInitial}>
                {isSubmitting ? <SpinnerGap size={16} className="inline-flex items-center justify-center spinner" /> : null}
                {isSubmitting ? submitLabelPending : submitLabel}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </Page>
  );
}
