import { z } from 'zod';

export const confirmSubmissionSchema = z.object({
  assignment_id: z
    .string()
    .uuid('assignment_id must be a valid UUID'),
});
