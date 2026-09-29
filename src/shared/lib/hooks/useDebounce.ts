import debounce from 'debounce'
import { useCallback, useEffect } from 'react'
import type { AnyFunction } from '../../model/aliases'

/**
 * Trailing-edge debounced callback whose pending timer dies with the component.
 *
 * `deps` plays the same role as the deps of `useMemo`/`useCallback`: pass every
 * reactive input of `action` (the atom setters, ctx and callbacks it closes
 * over), so a stale closure is rebuilt instead of being invoked later. The
 * action itself stays a plain inline arrow — it no longer needs a `useCallback`
 * wrapper, the hook owns the identity. Omit `deps` (or pass `[]`) for an action
 * that closes over nothing reactive.
 * The returned function exposes `.clear()` for callers that need to cancel a
 * pending call explicitly (e.g. "going online cancels the pending resume").
 * @param action - The function to debounce; every reactive input goes into deps.
 * @param delay - Quiet period in milliseconds before the action runs.
 * @param deps - Reactive inputs of the action, rebuilt when any of them changes.
 */
export const useDebounce = <F extends AnyFunction>(
  action: F,
  delay: number,
  deps?: React.DependencyList,
) => {
  // The dependency list comes from the caller, so the compiler rule cannot
  // verify it statically (it only accepts an inline array literal). The contract
  // documented above — deps mirror the action's reactive inputs — is the
  // invariant, and callers own it.
  // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps -- caller-supplied deps array: mirror the action's reactive inputs
  const debounced = useCallback(debounce(action, delay), deps || [])

  useEffect(() => () => debounced.clear(), [debounced])

  return debounced
}
