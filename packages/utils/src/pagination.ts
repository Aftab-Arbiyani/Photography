import type { Paginated, PaginationMeta } from '@photography/types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** Clamp incoming page/limit query params to safe bounds. */
export function normalizePagination(
  page?: number,
  limit?: number,
): {
  page: number;
  limit: number;
  skip: number;
} {
  const safePage =
    Number.isFinite(page) && (page as number) > 0 ? Math.floor(page as number) : DEFAULT_PAGE;
  const rawLimit =
    Number.isFinite(limit) && (limit as number) > 0 ? Math.floor(limit as number) : DEFAULT_LIMIT;
  const safeLimit = Math.min(rawLimit, MAX_LIMIT);
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function buildPaginationMeta(
  totalItems: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function paginate<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { items, meta: buildPaginationMeta(totalItems, page, limit) };
}
