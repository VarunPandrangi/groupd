import { z } from 'zod';

const emptyStringToUndefined = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Group name must be at least 3 characters long')
    .max(50, 'Group name must be at most 50 characters long')
    .regex(
      /^[A-Za-z0-9 -]+$/,
      'Group name can only contain letters, numbers, spaces, and hyphens'
    ),
  description: z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .trim()
      .max(200, 'Description must be at most 200 characters long')
      .optional()
  ),
});

export const addMemberSchema = z
  .object({
    email: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .toLowerCase()
        .email('Please provide a valid email address')
        .optional()
    ),
    student_id: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().optional()
    ),
  })
  .refine((value) => value.email || value.student_id, {
    message: 'Either email or student_id is required',
    path: ['email'],
  });
