import { Response } from 'express';

/**
 * Check for empty val
 */
function isEmptyValue(value: any): boolean {
  if (value === undefined || value === null) return true;

  // string
  if (typeof value === 'string') {
    const s = value.trim();
    if (s === '') return true;

    // check JSON str
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.length === 0;
      } catch {

      }
    }

    return false;
  }

  // array
  if (Array.isArray(value)) return value.length === 0;

  return false;
}

interface ExpectedFields {
  [key: string]: string;
}

/**
 * Checking required fields.
 * 
 * @param expected
 * @param rawBody
 * @param res
 * @throws
 */
export async function errHandle(
  expected: ExpectedFields,
  rawBody: any,
  res: Response
): Promise<void> {
  const body = rawBody && typeof rawBody === 'object' ? rawBody : {};
  const errors: Record<string, string> = {};

  for (const [key, message] of Object.entries(expected || {})) {
    if (isEmptyValue(body[key])) {
      errors[key] = message;
    }
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors,
    });

    throw new Error('VALIDATION_ABORT');
  }
}

export default errHandle;
