import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { fetchDistinctValues } from '../model-distinctValues'

/**
 * Loads distinct artists/books once the search route opens. The bar stays
 * mounted while other tabs are shown, so the fetch follows the open state
 * instead of the mount.
 * @param isOpen - Whether the search route owns the tabs navigator.
 */
export const useDistinctValuesOnOpen = (isOpen: boolean) => {
  const fetchDistinctValuesAction = useAction(fetchDistinctValues)

  useEffect(() => {
    if (!isOpen) return

    void fetchDistinctValuesAction()
  }, [fetchDistinctValuesAction, isOpen])
}
