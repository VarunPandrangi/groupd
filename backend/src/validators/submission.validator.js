import { z } from 'zod';

const assignmentIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'assignment_id must be a valid ObjectId');

export const prepareSubmissionSchema = z.object({
  assignment_id: assignmentIdSchema,
});

export const confirmSubmissionSchema = z.object({
  assignment_id: assignmentIdSchema,
  confirmation_token: z
    .string()
    .trim()
    .min(1, 'confirmation_token is required'),
});