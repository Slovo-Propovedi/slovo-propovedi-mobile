import { useCallback } from 'react'

interface UseRevealGestureHandlersParams {
  handleDragStart: () => void
  handleMomentumStart: () => void
  revealNow: () => void
}

// User touch = show the real list immediately; the auto-scroll retries stop
// fighting the finger (scrollGuards drops them while dragging/flinging).
export const useRevealGestureHandlers = ({
  handleDragStart,
  handleMomentumStart,
  revealNow,
}: UseRevealGestureHandlersParams) => {
  const handleDragStartWithReveal = useCallback(() => {
    revealNow()
    handleDragStart()
  }, [handleDragStart, revealNow])

  const handleMomentumStartWithReveal = useCallback(() => {
    revealNow()
    handleMomentumStart()
  }, [handleMomentumStart, revealNow])

  return { handleDragStartWithReveal, handleMomentumStartWithReveal }
}
