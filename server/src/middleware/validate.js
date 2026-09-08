/**
 * Middleware generator for Zod request validation.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate req.body
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: result.error.flatten().fieldErrors,
        },
      });
    }
    req[source] = result.data;
    next();
  };
}
