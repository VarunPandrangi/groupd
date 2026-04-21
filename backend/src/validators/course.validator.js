import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Course name must be at least 3 characters long')
    .max(100, 'Course name must be at most 100 characters long'),

  code: z
    .string()
    .trim()
    .min(3, 'Course code must be at least 3 characters long')
    .max(20, 'Course code must be at most 20 characters long')
    .regex(
      /^[A-Za-z0-9-]+$/,
      'Course code can only contain alphanumeric characters and hyphens'
    )
    .transform((val) => val.toUpperCase()),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters long')
    .optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const enrollStudentSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .optional(),
    studentId: z.string().trim().optional(),
  })
  .refine((value) => value.email || value.studentId, {
    message: 'Either email or studentId is required',
    path: ['email'],
  });
