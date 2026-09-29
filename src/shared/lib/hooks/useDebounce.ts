import debounce from 'debounce'
import { useEffect, useMemo } from 'react'
import type { AnyFunction } from '../../model/aliases'

/**
 * Trailing-edge debounced callback whose pending timer dies with the component.
 *
 * The action MUST be memoized with `useCallback` (or a module-level function):
 * an inline arrow changes identity on every render, which discards the memo and
 * re-creates the debounced wrapper — the timer then restarts from scratch and
 * the debounce silently degrades to "fires on the next render".
 * The returned function exposes `.clear()` for callers that need to cancel a
 * pending call explicitly (e.g. "going online cancels the pending resume").
 * @param action - The function to debounce; must have a stable identity.
 * @param delay - Quiet period in milliseconds before the action runs.
 */
export const useDebounce = <F extends AnyFunction>(action: F, delay: number) => {
  const debounced = useMemo(() => debounce(action, delay), [action, delay])

  useEffect(() => () => debounced.clear(), [debounced])

  return debounced
}
