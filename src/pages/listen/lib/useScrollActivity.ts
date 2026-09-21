import { useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useRef } from 'react'
import { isListenScrollingAtom } from '../model'

export const SCROLL_IDLE_MS = 200

export const useScrollActivity = () => {
  const [isScrolling, setIsListenScrolling] = useAtom(isListenScrollingAtom)
  const idleTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(
    () => () => {
      if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    },
    [],
  )

  const onScroll = useCallback(() => {
    // Один флаг на всю серию событий скролла — не перезаписываем атом каждый кадр.
    if (!isScrolling) setIsListenScrolling(true)

    if (idleTimerRef.current !== null) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null
      setIsListenScrolling(false)
    }, SCROLL_IDLE_MS)
  }, [isScrolling, setIsListenScrolling])

  return { onScroll }
}
