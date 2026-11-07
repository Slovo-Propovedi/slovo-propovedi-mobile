import { useAction } from '@reatom/npm-react'
import { useEffect } from 'react'
import { fetchDistinctValues } from '../model-distinctValues'

/**
 * Loads distinct artists/books once search opens. The bar stays mounted while
 * closed, so the fetch follows the open state instead of the mount.
 * @param isOpen - Whether search is open.
 */
export const useDistinctValuesOnOpen = (isOpen: boolean) => {
  const fetchDistinctValuesAction = useAction(fetchDistinctValues)

  useEffect(() => {
    if (!isOpen) return

    void fetchDistinctValuesAction()
  }, [fetchDistinctValuesAction, isOpen])
}
