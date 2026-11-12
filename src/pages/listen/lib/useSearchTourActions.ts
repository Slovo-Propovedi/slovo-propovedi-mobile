import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useRef } from 'react'
import { useTourActionRegistrar } from 'features/onboarding'
import { typeSearchInput } from 'features/sermon-search'
import { type SermonData } from 'entities/sermon'

const OPEN_SEARCH_ACTION_ID = 'open-listen-search'
const TYPE_QUERY_ACTION_ID = 'type-search-query'
const PRESS_FIRST_SERMON_ACTION_ID = 'press-first-sermon'
const SEARCH_QUERY = 'лицемерие'
// Each prefix lands ~100ms after the previous one, so the whole word (8 prefixes,
// first one synchronous) types in ~700ms while the «Вводим запрос» card floats over
// the live field; the user then presses «Далее» to advance.
const TYPE_STEP_MS = 100

/**
 * Registers the search tour's actions on behalf of the page: the tour opens the
 * search overlay, then types the demo query into the real search input (prefix by
 * prefix, cancellable) so the field shows it and the grouped-results card has a
 * target to spotlight, then presses the first rendered sermon. The page owns these
 * because `features/sermon-search` must not import `features/onboarding`
 * (dependency inversion).
 * @param root0 - Hook input.
 * @param root0.getFirstSermon - Reads the first result currently rendered by the search page.
 * @param root0.onOpenSearch - Page-owned handler that opens the search overlay.
 * @param root0.onPressFirstSermon - Page-owned handler that starts playback of a sermon.
 */
export const useSearchTourActions = ({
  getFirstSermon,
  onOpenSearch,
  onPressFirstSermon,
}: {
  getFirstSermon: () => SermonData | undefined
  onOpenSearch: () => void
  onPressFirstSermon: (sermon: SermonData) => void
}) => {
  const typeSearchInputAction = useAction(typeSearchInput)
  const typingTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const typeQuery = useCallback(() => {
    if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
    let typedCount = 0

    const typeNextChar = () => {
      typedCount += 1
      typeSearchInputAction(SEARCH_QUERY.slice(0, typedCount))
      typingTimerRef.current =
        typedCount < SEARCH_QUERY.length ? setTimeout(typeNextChar, TYPE_STEP_MS) : null
    }

    typeNextChar()
  }, [typeSearchInputAction])

  const pressFirstSermon = useCallback(() => {
    const firstSermon = getFirstSermon()
    if (firstSermon === undefined) return

    onPressFirstSermon(firstSermon)
  }, [getFirstSermon, onPressFirstSermon])

  useEffect(
    () => () => {
      if (typingTimerRef.current !== null) clearTimeout(typingTimerRef.current)
    },
    [],
  )

  useTourActionRegistrar(OPEN_SEARCH_ACTION_ID, onOpenSearch)
  useTourActionRegistrar(TYPE_QUERY_ACTION_ID, typeQuery)
  useTourActionRegistrar(PRESS_FIRST_SERMON_ACTION_ID, pressFirstSermon)
}
