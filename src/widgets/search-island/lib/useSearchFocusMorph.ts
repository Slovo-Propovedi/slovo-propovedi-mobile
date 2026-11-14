import { useAction, useAtom } from '@reatom/npm-react'
import { isSearchFieldFocusedAtom } from 'features/sermon-search/@x/barMorph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { isSearchCloseVisibleAtom, searchCloseMorphDriver } from '../model/searchCloseDriver'

/**
 * Morph of the search pill's external close circle.
 *
 * The ✕ is shown while the field is focused OR the query is active, so losing
 * focus with a typed query keeps it on screen. One module-level driver owns the
 * fade, so the search frame's reserved slot and the shade's close cutout read
 * the exact same progress value.
 *
 * `settledClose` lags the derived target until the fade lands: a target flip
 * commits the START of the new fade in the same React commit as the live flag,
 * then the completion commits the target (Issue #63). A redundant focus write is
 * a Reatom no-op, so it cannot interrupt an in-flight fade.
 */
export const useSearchFocusMorph = () => {
  const setFocusedAtom = useAction(isSearchFieldFocusedAtom)
  const [shouldShowClose] = useAtom(isSearchCloseVisibleAtom)
  const { progress: closeProgress, settled: settledClose } =
    useAtomMorphDriver(searchCloseMorphDriver)

  return {
    closeProgress,
    handleCloseFocusChange: setFocusedAtom,
    settledClose,
    shouldShowClose,
  }
}
