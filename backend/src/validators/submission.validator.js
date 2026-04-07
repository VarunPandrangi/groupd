import { z } from 'zod';

const assignmentIdSchema = z
  .string()
  .uuid('assignment_id must be a valid UUID');

export const prepareSubmissionSchema = z.object({
  assignment_id: z
    .string()
    .uuid('assignment_id must be a valid UUID'),
});

export const confirmSubmissionSchema = z.object({
  assignment_id: assignmentIdSchema,
  confirmation_token: z
    .string()
    .trim()
    .min(1, 'confirmation_token is required'),
});
