import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { isEscapeKey } from './isEscapeKey'

interface UseEscapeKeyOptions {
  capture?: boolean
  enabled: boolean
  onEscape: (event: KeyboardEvent) => void
  scope?: 'document' | 'window'
}

const isKeyboardEvent = (event: Event): event is KeyboardEvent => 'key' in event

export const useEscapeKey = ({
  capture = false,
  enabled,
  onEscape,
  scope = 'document',
}: UseEscapeKeyOptions): void => {
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return

    const handleKeyDown = (event: Event) => {
      if (!isKeyboardEvent(event)) return
      if (!isEscapeKey(event)) return
      // A claimed Escape must not reach lower-priority bubble listeners —
      // modal-first-then-player layering.
      event.stopPropagation()
      onEscapeRef.current(event)
    }

    const target = window[scope]
    target.addEventListener('keydown', handleKeyDown, { capture })

    return () => {
      target.removeEventListener('keydown', handleKeyDown, { capture })
    }
  }, [enabled, scope, capture])
}
