import { Response } from "express";

type PageInfo = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

export default function responsePaginated<T>(
  res: Response,
  code: number,
  message: string,
  allItems: T[],
  pageRaw?: number,
  pageSizeRaw?: number,
  totalItemsOverride?: number,
  errorCode?: string | null,
  errors?: any | null
) {
  const pageSize = Math.max(1, Number(pageSizeRaw) || 10);
  const totalItems = Number.isFinite(totalItemsOverride as number)
    ? Number(totalItemsOverride)
    : allItems.length;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = clamp(Number(pageRaw) || 1, 1, totalPages);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const items = Number.isFinite(totalItemsOverride as number)
    ? allItems
    : allItems.slice(start, end);

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const pageInfo: PageInfo = {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPrev,
    hasNext,
    prevPage: hasPrev ? page - 1 : null,
    nextPage: hasNext ? page + 1 : null,
  };

  return res.status(code).json({
    message,
    data: { ...pageInfo, items },
    errorCode: errorCode ?? null,
    errors: errors ?? null,
  });
}
