/**
 * Normalizes an optional string: `''` (as well as `null`/`undefined`) becomes
 * `null`, any non-empty value passes through. Used at API mapper boundaries
 * where the backend types a field as a non-null string but returns `''` for
 * "not set" (e.g. Artwork), so downstream `?? Fallback` works honestly.
 * @param value - Raw optional string.
 * @returns The value, or `null` when empty/absent.
 */
export const nullIfEmpty = (value: null | string | undefined): null | string =>
  value ? value : null
