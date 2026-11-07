import { useAction } from '@reatom/npm-react'
import { useCallback } from 'react'
import { openSearch } from '../model-session'

// The search toggle's press handler: opens the search overlay. Shared so the
// onboarding tour performs the same action instead of duplicating the open logic.
// The returned callback is stable so tour-action registration does not churn.
export const useOpenSearch = () => {
  const openSearchAction = useAction(openSearch)

  return useCallback(() => void openSearchAction(), [openSearchAction])
}
