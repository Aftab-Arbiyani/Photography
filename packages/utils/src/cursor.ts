/**
 * Opaque cursor encoding for keyset (infinite-scroll) pagination.
 * A cursor carries the last seen sort key + id so the next query can resume deterministically.
 */
export interface CursorPayload {
  /** ISO timestamp or numeric value of the sort column of the last item */
  value: string;
  /** tie-breaker id */
  id: string;
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as CursorPayload;
    if (typeof parsed.value === 'string' && typeof parsed.id === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
