/**
 * Returns only the entries of `current` that differ from `initial`. Used by admin
 * edit forms to tell a pristine form (no entries → save disabled) from a touched
 * one. Values compare shallowly; arrays compare by value so a reorder counts as a
 * change. Keys of `current` absent from `initial` always count as changed.
 * @param initial - Baseline snapshot loaded into the form.
 * @param current - Current form values.
 */
export const omitEqualFields = <T extends object>(initial: T, current: T): Partial<T> => {
  const changed: Partial<T> = {}

  for (const key of Object.keys(current) as (keyof T)[])
    if (!isEqual(initial[key], current[key])) changed[key] = current[key]

  return changed
}

const isEqual = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) && Array.isArray(b)) return a.join('\u0000') === b.join('\u0000')

  return a === b
}
