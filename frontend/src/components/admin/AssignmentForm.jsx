import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Check,
  SpinnerGap,
} from '@phosphor-icons/react';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import Button from '../common/Button';
import RichTextEditor from '../common/RichTextEditor';
import { Page, PageHeader } from '../common/Page';
import groupService from '../../services/groupService';
import courseService from '../../services/courseService';
import { useCourseStore } from '../../stores/courseStore';
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
const SUBMISSION_TYPE_OPTIONS = [
  {
    value: 'group',
    label: 'Group Submission',
    hint: 'Group leader confirms once for the whole group.',
  },
  {
    value: 'individual',
    label: 'Individual Submission',
    hint: 'Each student submits and confirms independently.',
  },
];

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
      course_id: z.string().trim().min(1, 'Course is required'),
      submission_type: z.enum(['group', 'individual']),
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

      if (
        value.submission_type === 'group' &&
        value.assign_to === 'specific' &&
        value.group_ids.length === 0
      ) {
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

async function getGroupsForCourse(courseId) {
  if (!courseId) {
    return [];
  }

  const [courseData, allGroups] = await Promise.all([
    courseService.getCourse(courseId),
    getAllGroups(),
  ]);

  const enrolledStudents = Array.isArray(courseData?.enrolledStudents)
    ? courseData.enrolledStudents
    : [];

  const enrolledStudentIds = new Set(
    enrolledStudents
      .map((student) => student?._id ?? student?.id ?? null)
      .filter(Boolean)
      .map((id) => String(id))
  );

  if (enrolledStudentIds.size === 0) {
    return [];
  }

  const detailedGroups = await Promise.all(
    allGroups.map((group) =>
      groupService
        .getGroupDetail(group.id)
        .then((detail) => ({ ...group, detail }))
        .catch(() => null)
    )
  );

  return detailedGroups
    .filter(Boolean)
    .filter((entry) => {
      const members = Array.isArray(entry.detail?.members) ? entry.detail.members : [];
      if (members.length === 0) {
        return false;
      }

      return members.every((member) => enrolledStudentIds.has(String(member.id)));
    })
    .map((entry) => ({
      ...entry,
      leader_name:
        entry.detail?.members?.find((member) => member.id === entry.created_by)?.full_name ??
        null,
    }));
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
  onSelect,
  disabled = false,
}) {
  return (
    <button
      type="button"
      className={`assignment-create-screen__audience-card${
        isActive ? ' assignment-create-screen__audience-card--active' : ''
      }`}
      onClick={() => onSelect(value)}
      aria-pressed={isActive}
      disabled={disabled}
    >
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
  const courses = useCourseStore((state) => state.courses);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const [groups, setGroups] = useState([]);
  const [groupsError, setGroupsError] = useState('');
  const [coursesError, setCoursesError] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [loadedGroupCourseId, setLoadedGroupCourseId] = useState(null);
  const defaultValues = useMemo(
    () => ({
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      due_date: formatAssignmentInputDate(initialValues?.due_date),
      due_time: formatAssignmentInputTime(initialValues?.due_date) || DEFAULT_DUE_TIME,
      onedrive_link: initialValues?.onedrive_link ?? '',
      course_id: initialValues?.course_id ?? '',
      submission_type: initialValues?.submission_type ?? 'group',
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
  const selectedCourseId = watch('course_id') ?? '';
  const submissionType = watch('submission_type') ?? 'group';
  const descriptionValue = watch('description') ?? '';
  const selectedGroupIds = watch('group_ids');
  const activeGroupIds = useMemo(
    () => (Array.isArray(selectedGroupIds) ? selectedGroupIds : []),
    [selectedGroupIds]
  );
  const previousCourseIdRef = useRef(defaultValues.course_id ?? '');
  const descriptionRegistration = register('description');

  useEffect(() => {
    previousCourseIdRef.current = defaultValues.course_id ?? '';
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      setIsLoadingCourses(true);
      setCoursesError('');

      try {
        await fetchCourses();
      } catch (error) {
        if (isMounted) {
          setCoursesError(getErrorMessage(error, 'Unable to load courses right now.'));
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [fetchCourses]);

  useEffect(() => {
    const previousCourseId = previousCourseIdRef.current;
    previousCourseIdRef.current = selectedCourseId;

    if (!previousCourseId || previousCourseId === selectedCourseId) {
      return;
    }

    setValue('group_ids', [], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setGroups([]);
    setGroupsError('');
    setLoadedGroupCourseId(null);
    clearErrors('group_ids');
  }, [clearErrors, selectedCourseId, setValue]);

  useEffect(() => {
    if (submissionType !== 'group') {
      setValue('assign_to', 'all', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('group_ids', [], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      clearErrors('group_ids');
    }
  }, [clearErrors, setValue, submissionType]);

  useEffect(() => {
    if (
      submissionType !== 'group' ||
      !selectedCourseId ||
      assignTo !== 'specific' ||
      loadedGroupCourseId === selectedCourseId
    ) {
      return;
    }

    let isMounted = true;

    async function loadGroups() {
      setIsLoadingGroups(true);
      setGroupsError('');

      try {
        const nextGroups = await getGroupsForCourse(selectedCourseId);
        if (isMounted) {
          setGroups(nextGroups);
          setLoadedGroupCourseId(selectedCourseId);
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
  }, [assignTo, loadedGroupCourseId, selectedCourseId, submissionType]);

  const handleGroupToggle = (groupId) => {
    const nextValue = activeGroupIds.includes(groupId)
      ? activeGroupIds.filter((value) => value !== groupId)
      : [...activeGroupIds, groupId];

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

  const handleSubmissionTypeChange = (nextValue) => {
    setValue('submission_type', nextValue, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    const validGroupIds = new Set(groups.map((group) => group.id));
    const groupTargets =
      values.submission_type === 'group' && values.assign_to === 'specific'
        ? values.group_ids.filter((groupId) => validGroupIds.has(groupId))
        : [];

    await onSubmit({
      title: values.title.trim(),
      description: sanitizedRichTextHtml(values.description) || '',
      due_date: toAssignmentDueDate(values.due_date, values.due_time),
      onedrive_link: values.onedrive_link.trim(),
      course: values.course_id,
      submissionType: values.submission_type,
      assignTo:
        values.submission_type === 'group' && groupTargets.length > 0 ? 'groups' : 'all',
      groupTargets,
    });
  });

  const selectedGroupOptions = useMemo(() => {
    return activeGroupIds.map((groupId) => {
      const matchedGroup = groups.find((group) => group.id === groupId);
      return {
        id: groupId,
        name: matchedGroup?.name || 'Selected Group',
      };
    });
  }, [activeGroupIds, groups]);

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

                <div className="assignment-edit-architectural__grid-2">
                  <div className="assignment-edit-architectural__field assignment-edit-architectural__field--full">
                    <label htmlFor="assignment-course" className="assignment-edit-architectural__label">
                      Course
                    </label>
                    <select
                      id="assignment-course"
                      className="assignment-edit-architectural__input"
                      {...register('course_id')}
                      disabled={isLoadingCourses}
                    >
                      <option value="">Select course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={coursesError || errors.course_id?.message} />
                  </div>
                </div>

                <div className="assignment-edit-architectural__field">
                  <label className="assignment-edit-architectural__label">Submission Type</label>
                  <div className="assignment-edit-architectural__audience-grid">
                    {SUBMISSION_TYPE_OPTIONS.map((option) => {
                      const isActive = submissionType === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`assignment-edit-architectural__audience-option${
                            isActive ? ' assignment-edit-architectural__audience-option--active' : ''
                          }`}
                          onClick={() => handleSubmissionTypeChange(option.value)}
                          aria-pressed={isActive}
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
                  <input type="hidden" {...register('submission_type')} value={submissionType} readOnly />
                  <FieldError message={errors.submission_type?.message} />
                </div>

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

              {submissionType === 'group' ? (
                <section className="assignment-edit-architectural__section">
                <div className="assignment-edit-architectural__section-tag">Audience Selection</div>

                <label className="assignment-edit-architectural__label">Choose The Audience</label>
                <div className="assignment-edit-architectural__audience-grid">
                  {[
                    {
                      value: 'all',
                      label: 'All Groups in Course',
                      hint: 'Broadcast this assignment to every group in the selected course.',
                    },
                    {
                      value: 'specific',
                      label: 'Specific Groups in Course',
                      hint: 'Target only selected groups from the chosen course.',
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
                        disabled={!selectedCourseId}
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
                          <span aria-hidden="true">x</span>
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
                        const isChecked = activeGroupIds.includes(group.id);

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
              ) : null}

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
                  <label htmlFor="assignment-course" className="assignment-create-screen__label">
                    Course
                  </label>
                  <select
                    id="assignment-course"
                    className="assignment-create-screen__input"
                    {...register('course_id')}
                    disabled={isLoadingCourses}
                  >
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={coursesError || errors.course_id?.message} />
                </div>

                <div className="assignment-create-screen__field">
                  <label className="assignment-create-screen__label">Submission Type</label>
                  <div className="assignment-create-screen__audience-grid">
                    {SUBMISSION_TYPE_OPTIONS.map((option) => (
                      <AudienceOption
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        hint={option.hint}
                        isActive={submissionType === option.value}
                        onSelect={handleSubmissionTypeChange}
                      />
                    ))}
                  </div>
                  <input type="hidden" {...register('submission_type')} value={submissionType} readOnly />
                  <FieldError message={errors.submission_type?.message} />
                </div>

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

                {submissionType === 'individual' ? (
                  <p className="assignment-create-screen__footer-note">
                    Audience is automatically set to all students enrolled in the selected course.
                  </p>
                ) : null}

                {submissionType === 'group' ? (
                  <section className="assignment-create-screen__audience">
                  <div className="assignment-create-screen__section-copy">
                    <h2>Choose the audience</h2>
                    <p>
                      Decide whether this assignment goes to every group in the selected course
                      or only a selected set.
                    </p>
                  </div>

                  <div className="assignment-create-screen__audience-grid">
                    <AudienceOption
                      value="all"
                      label="All Groups in Course"
                      hint="Every group in the selected course will see this assignment."
                      isActive={assignTo === 'all'}
                      onSelect={handleAssignToChange}
                      disabled={!selectedCourseId}
                    />
                    <AudienceOption
                      value="specific"
                      label="Specific Groups in Course"
                      hint="Limit visibility to selected groups from this course."
                      isActive={assignTo === 'specific'}
                      onSelect={handleAssignToChange}
                      disabled={!selectedCourseId}
                    />
                  </div>

                  {assignTo === 'specific' ? (
                    <div className="assignment-create-screen__group-box">
                      <div className="assignment-create-screen__group-meta">
                        <p>
                          {activeGroupIds.length} group
                          {activeGroupIds.length === 1 ? '' : 's'} selected
                        </p>
                        {isLoadingGroups ? <LoadingSpinner fullPage={false} size={18} /> : null}
                      </div>

                      <div className="assignment-create-screen__group-list">
                        {groups.map((group) => {
                          const isChecked = activeGroupIds.includes(group.id);

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
                            No eligible groups were found for this course. Switch to all groups in
                            course or enroll students first.
                          </p>
                        ) : null}
                      </div>

                      <FieldError message={groupsError || errors.group_ids?.message} />
                    </div>
                  ) : null}
                  </section>
                ) : null}

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
              <div className="grid gap-2 field">
                <label htmlFor="assignment-course" className="text-sm font-medium field__label">
                  Course
                </label>
                <select
                  id="assignment-course"
                  className="w-full rounded-md input"
                  {...register('course_id')}
                  disabled={isLoadingCourses}
                >
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
                <FieldError message={coursesError || errors.course_id?.message} />
              </div>

              <div className="grid gap-2 field">
                <label className="text-sm font-medium field__label">Submission Type</label>
                <div className="grid gap-2 segmented">
                  {SUBMISSION_TYPE_OPTIONS.map((option) => {
                    const isActive = submissionType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`segmented__option ${isActive ? 'segmented__option--active' : ''}`}
                        onClick={() => handleSubmissionTypeChange(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span className="text-sm muted" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                          {option.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register('submission_type')} value={submissionType} readOnly />
                <FieldError message={errors.submission_type?.message} />
              </div>

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

            {submissionType === 'group' ? (
              <Card as="section" className="grid gap-4 surface-grid">
                <div className="grid gap-2 section-heading">
                  <p className="text-xs font-medium uppercase tracking-wide eyebrow">Assign To</p>
                  <h2 className="text-2xl font-bold tracking-tight section-heading__title">Choose the audience</h2>
                  <p className="text-base leading-relaxed page-description">
                    Decide whether this assignment goes to every group in the selected course or only a selected set.
                  </p>
                </div>

                <div className="grid gap-3 segmented">
                  {[
                    {
                      value: 'all',
                      label: 'All Groups in Course',
                      hint: 'Every group in the selected course will see this assignment.',
                    },
                    {
                      value: 'specific',
                      label: 'Specific Groups in Course',
                      hint: 'Limit visibility to selected groups from this course.',
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
                        disabled={!selectedCourseId}
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
                        {activeGroupIds.length} group{activeGroupIds.length === 1 ? '' : 's'} selected
                      </p>
                      {isLoadingGroups ? <LoadingSpinner fullPage={false} size={18} /> : null}
                    </div>

                    <div className="grid gap-2 overflow-y-auto rounded-lg check-list">
                      {groups.map((group) => {
                        const isChecked = activeGroupIds.includes(group.id);

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
                          No eligible groups were found for this course.
                        </p>
                      ) : null}
                    </div>

                    <FieldError message={groupsError || errors.group_ids?.message} />
                  </div>
                ) : null}
              </Card>
            ) : (
              <Card as="section" className="grid gap-2 surface-grid">
                <p className="text-xs font-medium uppercase tracking-wide eyebrow">Audience</p>
                <p className="text-base leading-relaxed page-description">
                  All students enrolled in the selected course.
                </p>
              </Card>
            )}

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
