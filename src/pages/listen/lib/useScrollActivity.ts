import { useAtom } from '@reatom/npm-react'
import { useCallback, useEffect } from 'react'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { isListenScrollingAtom } from '../model'

export const SCROLL_IDLE_MS = 200

export const useScrollActivity = () => {
  const [isScrolling, setIsListenScrolling] = useAtom(isListenScrollingAtom)

  const markNotScrolling = useCallback(() => {
    setIsListenScrolling(false)
  }, [setIsListenScrolling])

  const markIdle = useDebounce(markNotScrolling, SCROLL_IDLE_MS)

  // The ScrollView is swapped mid-scroll (e.g. search-activated results). The
  // hook drops the pending timer on unmount, so without an explicit reset the
  // flag would stay true and the glow would freeze until the next event.
  useEffect(
    () => () => {
      markNotScrolling()
    },
    [markNotScrolling],
  )

  const onScroll = useCallback(() => {
    // Один флаг на всю серию событий скролла — не перезаписываем атом каждый кадр.
    if (!isScrolling) setIsListenScrolling(true)

    markIdle()
  }, [isScrolling, markIdle, setIsListenScrolling])

  return { onScroll }
}
