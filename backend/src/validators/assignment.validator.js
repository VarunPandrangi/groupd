import { z } from 'zod';

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
    .url('OneDrive link must be a valid URL')
    .refine((value) => /^https?:\/\//i.test(value), {
      message: 'OneDrive link must start with http:// or https://',
    }),
  assign_to: z.enum(['all', 'specific']),
  group_ids: z
    .array(z.string().uuid('Each group ID must be a valid UUID'))
    .min(1, 'At least one group must be selected')
    .optional(),
});

export const createAssignmentSchema = assignmentSchema.refine(
  (data) => data.assign_to !== 'specific' || Boolean(data.group_ids?.length),
  {
    message: 'At least one group must be selected',
    path: ['group_ids'],
  }
);

export const updateAssignmentSchema = assignmentSchema
  .partial()
  .refine(
    (data) => data.assign_to !== 'specific' || Boolean(data.group_ids?.length),
    {
      message: 'At least one group must be selected',
      path: ['group_ids'],
    }
  );
