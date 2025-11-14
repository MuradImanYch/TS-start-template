import type { Response as ExpressResponse } from "express";

export default function response<TData = unknown, TErrors = unknown>(
  res: ExpressResponse,
  code: number,
  message: string,
  data: TData | null = null,
  errorCode: string | null = null,
  errors: TErrors | null = null
): ExpressResponse {
  return res.status(code).json({
    message,
    data: (data as any)?.data ?? data ?? null,
    errorCode,
    errors,
  });
}
