import { useAtom } from '@reatom/npm-react'
import { useCallback, useEffect, useRef } from 'react'
import { Dimensions, type View } from 'react-native'
import { isGlowVisibleAtom, isListenScrollingAtom } from '../model'

interface UseGlowVisibilityOptions {
  isFocused: boolean
}

// Меряем только в «спокойные» моменты (монтирование, возврат фокуса, остановка
// скролла): во время скролла свечение и так на паузе, поэтому замер на каждый
// кадр не нужен.
export const useGlowVisibility = ({ isFocused }: UseGlowVisibilityOptions) => {
  const [isGlowVisible, setIsGlowVisible] = useAtom(isGlowVisibleAtom)
  const [isScrolling] = useAtom(isListenScrollingAtom)
  const ref = useRef<View>(null)
  const isMountedRef = useRef(true)
  const visibilityRef = useRef(isGlowVisible)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    visibilityRef.current = isGlowVisible
  }, [isGlowVisible])

  const measure = useCallback(() => {
    const node = ref.current

    if (node === null) return

    node.measureInWindow((_x, y, width, height) => {
      if (!isMountedRef.current) return

      // Нулевой размер — вьюха скрыта или уже размонтирована: оставляем прежнее
      // значение, чтобы не гасить анимацию из-за недостоверного замера.
      if (width <= 0 || height <= 0) return

      const windowHeight = Dimensions.get('window').height
      const nextVisible = y < windowHeight && y + height > 0

      if (visibilityRef.current === nextVisible) return

      visibilityRef.current = nextVisible
      setIsGlowVisible(nextVisible)
    })
  }, [setIsGlowVisible])

  useEffect(() => {
    if (isFocused && !isScrolling) measure()
  }, [isFocused, isScrolling, measure])

  const onLayout = useCallback(() => {
    if (isFocused) measure()
  }, [isFocused, measure])

  return { onLayout, ref }
}
