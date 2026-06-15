import { ApiError } from '../utils/ApiError.js';

const validatePart = (schema, source) => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(
      new ApiError(
        400,
        'Validation failed',
        result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
      )
    );
  }
  req[source] = result.data;
  return next();
};

export const validateBody = (schema) => validatePart(schema, 'body');
export const validateQuery = (schema) => validatePart(schema, 'query');
export const validateParams = (schema) => validatePart(schema, 'params');
