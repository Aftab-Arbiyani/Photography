import type { SortOrder } from './enums';

/** Standard envelope returned by the API transform interceptor. */
export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

/** Standard error shape returned by the global exception filter. */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Cursor pagination — used by the gallery infinite-scroll endpoint. */
export interface CursorPaginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
