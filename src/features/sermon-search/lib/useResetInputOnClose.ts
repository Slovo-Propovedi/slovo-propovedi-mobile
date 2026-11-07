import { useEffect, useRef } from 'react'

/**
 * Runs `onClose` only when `isOpen` transitions from true to false. The search
 * bar stays mounted for the island's exit animation, so its local input has to
 * be cleared on close instead of on unmount.
 * @param isOpen - Whether search is open.
 * @param onClose - Called once on the open→closed transition.
 */
export const useResetInputOnClose = (isOpen: boolean, onClose: () => void) => {
  const wasOpenRef = useRef(isOpen)

  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = isOpen

    if (!wasOpen || isOpen) return

    onClose()
  }, [isOpen, onClose])
}
