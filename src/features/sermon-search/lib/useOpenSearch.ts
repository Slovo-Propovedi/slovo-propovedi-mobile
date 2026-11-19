import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { openSearch } from '../model-session'

/**
 * Opens the search route from the closed search circle.
 *
 * The open state (bar expanded + field visible) is written in ONE transaction
 * before navigation: the morph drivers start from atom subscriptions, so waiting
 * for the `/search` route commit would start the pill a frame late. One
 * transaction also keeps the island's morph target from flipping expand-then-
 * collapse in the same tick. The returned callback is stable so the island does
 * not re-render per tick.
 */
export const useOpenSearch = () => {
  const router = useRouter()
  const openSearchAction = useAction(openSearch)

  return useCallback(() => {
    openSearchAction()
    router.navigate('/search')
  }, [openSearchAction, router])
}
