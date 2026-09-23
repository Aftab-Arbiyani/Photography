import { describe, expect, it } from 'vitest';
import { slugify, uniqueSlug } from './slug';
import { normalizePagination, buildPaginationMeta } from './pagination';
import { encodeCursor, decodeCursor } from './cursor';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Golden Hour Over Patagonia')).toBe('golden-hour-over-patagonia');
  });
  it('strips diacritics and punctuation', () => {
    expect(slugify('Café   del/Mar!!')).toBe('cafe-del-mar');
  });
  it('falls back for empty input', () => {
    expect(uniqueSlug('', 'abc')).toBe('item-abc');
  });
});

describe('normalizePagination', () => {
  it('applies defaults and clamps the max limit', () => {
    expect(normalizePagination(undefined, undefined)).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(normalizePagination(3, 500).limit).toBe(100);
    expect(normalizePagination(3, 10).skip).toBe(20);
  });
});

describe('buildPaginationMeta', () => {
  it('computes total pages and navigation flags', () => {
    const meta = buildPaginationMeta(45, 2, 20);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.hasPreviousPage).toBe(true);
  });
});

describe('cursor encode/decode', () => {
  it('round-trips a payload', () => {
    const cursor = encodeCursor({ value: '2024-01-01T00:00:00.000Z', id: 'abc' });
    expect(decodeCursor(cursor)).toEqual({ value: '2024-01-01T00:00:00.000Z', id: 'abc' });
  });
  it('returns null for garbage', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
  });
});
