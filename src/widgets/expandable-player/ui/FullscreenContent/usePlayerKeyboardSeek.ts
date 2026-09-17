import { useAtom } from '@reatom/npm-react'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { isPlayerExpandedAtom } from 'entities/player'
import { hasModifier, useEscapeKey } from 'shared/lib/escape-key'
import {
  getSeekDirection,
  isEditableTarget,
  isInteractiveTarget,
  type SeekDirection,
} from './keyboardTargetGuards'

interface PlayerKeyboardSeekProps {
  collapsePlayer: () => void
  startSeek: (direction: SeekDirection) => void
  stopSeek: () => void
  tapSeek: (direction: SeekDirection) => void
  togglePlay: () => void
}

const KEY_HOLD_DELAY_MS = 500

const SPACE_KEY = ' '

export const usePlayerKeyboardSeek = ({
  collapsePlayer,
  startSeek,
  stopSeek,
  tapSeek,
  togglePlay,
}: PlayerKeyboardSeekProps) => {
  const [expanded] = useAtom(isPlayerExpandedAtom)
  const activeDirectionRef = useRef<null | SeekDirection>(null)
  const holdTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const handlersRef = useRef({ collapsePlayer, startSeek, stopSeek, tapSeek, togglePlay })

  useEffect(() => {
    handlersRef.current = { collapsePlayer, startSeek, stopSeek, tapSeek, togglePlay }
  })

  // Escape is a layer in the shared escape stack (LIFO by open order), not a
  // window-bubble listener: a modal or search opened after the player wins.
  useEscapeKey({
    enabled: Platform.OS === 'web' && expanded,
    onEscape: event => {
      if (isEditableTarget(event.target)) return
      event.preventDefault()
      handlersRef.current.collapsePlayer()
    },
  })

  useEffect(() => {
    if (Platform.OS !== 'web' || !expanded) return

    const clearHoldTimeout = () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
        holdTimeoutRef.current = null
      }
    }

    const resetGesture = () => {
      clearHoldTimeout()
      handlersRef.current.stopSeek()
      activeDirectionRef.current = null
    }

    const handleSeekKeyDown = (event: KeyboardEvent, direction: SeekDirection) => {
      event.preventDefault()
      // OS auto-repeat would double-fire taps; the hold timer owns continuous seeking.
      if (event.repeat) return
      // Direction switch while holding: stop the current gesture, then start fresh.
      if (activeDirectionRef.current && activeDirectionRef.current !== direction) {
        clearHoldTimeout()
        handlersRef.current.stopSeek()
      }
      if (activeDirectionRef.current === direction) return
      activeDirectionRef.current = direction
      handlersRef.current.tapSeek(direction)
      holdTimeoutRef.current = setTimeout(() => {
        handlersRef.current.startSeek(direction)
      }, KEY_HOLD_DELAY_MS)
    }

    const handleSpaceKeyDown = (event: KeyboardEvent) => {
      // A focused button activates natively on Space — skip so it is not double-fired.
      if (isInteractiveTarget(event.target)) return
      event.preventDefault()
      if (event.repeat) return
      void handlersRef.current.togglePlay()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (hasModifier(event)) return
      if (isEditableTarget(event.target)) return

      const direction = getSeekDirection(event.key)
      if (direction) {
        handleSeekKeyDown(event, direction)
        return
      }

      if (event.key === SPACE_KEY) {
        handleSpaceKeyDown(event)
        return
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      const direction = getSeekDirection(event.key)
      if (!direction || activeDirectionRef.current !== direction) return
      resetGesture()
    }

    const handleBlur = () => resetGesture()

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
      resetGesture()
    }
  }, [expanded])
}
