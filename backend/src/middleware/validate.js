/**
 * Factory that returns middleware validating req.body against a Zod schema.
 * On success, replaces req.body with the parsed (and transformed) data so
 * downstream handlers receive trimmed/lowercased values.
 * On failure, forwards the ZodError to the global error handler, which
 * formats it into a standard 400 VALIDATION_ERROR response.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(result.error);
  }
  req.body = result.data;
  return next();
};
