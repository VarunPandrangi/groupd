import { z } from 'zod';

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid ObjectId');

const futureIsoDateSchema = z
  .string()
  .trim()
  .datetime({
    offset: true,
    message: 'Due date must be a valid ISO date string',
  })
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Due date must be a valid date',
  })
  .refine((value) => new Date(value).getTime() > Date.now(), {
    message: 'Due date must be in the future',
  });

// Base shape — all fields are kept as-is so .partial() works cleanly for update.
// course_id and submission_type are optional here; createAssignmentSchema overrides both.
const assignmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title must be at most 100 characters long'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters long')
    .optional(),
  due_date: futureIsoDateSchema,
  onedrive_link: z
    .string()
    .trim()
    .url('Link must be a valid URL')
    .refine((value) => /^https?:\/\//i.test(value), {
      message: 'Link must start with http:// or https://',
    }),
  assign_to: z.enum(['all', 'specific']),
  group_ids: z
    .array(objectIdSchema)
    .min(1, 'At least one group must be selected')
    .optional(),
  // Kept optional in base — update callers may omit these
  course_id: objectIdSchema.optional(),
  submission_type: z.enum(['individual', 'group']).optional(),
});

// Create: course_id required; submission_type defaults to 'group'
export const createAssignmentSchema = assignmentSchema
  .extend({
    course_id: objectIdSchema,
    submission_type: z.enum(['individual', 'group']).default('group'),
  })
  .refine(
    (data) => data.assign_to !== 'specific' || Boolean(data.group_ids?.length),
    {
      message: 'At least one group must be selected',
      path: ['group_ids'],
    }
  );

// Update: all fields optional
export const updateAssignmentSchema = assignmentSchema
  .partial()
  .refine(
    (data) => data.assign_to !== 'specific' || Boolean(data.group_ids?.length),
    {
      message: 'At least one group must be selected',
      path: ['group_ids'],
    }
  );