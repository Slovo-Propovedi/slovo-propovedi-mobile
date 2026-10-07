/**
 * Extracts an error's `name` without assuming a DOMException/Error shape.
 * @param error - Unknown thrown value.
 * @returns The error name, or an empty string when unavailable.
 */
export const getErrorName = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('name' in error)) return ''
  return String(error.name)
}
