import { useRef } from 'react'

const REPEAT_TAP_SUPPRESS_MS = 1000

export const usePlayTapGuard = () => {
  const inFlightSermonIdsRef = useRef<Set<string>>(new Set())
  const lastTapRef = useRef<{ id: null | string; startedAt: number }>({ id: null, startedAt: 0 })

  const isRepeatTapSuppressed = (sermonId: string) =>
    inFlightSermonIdsRef.current.has(sermonId) ||
    (lastTapRef.current.id === sermonId &&
      Date.now() - lastTapRef.current.startedAt < REPEAT_TAP_SUPPRESS_MS)

  const markPlayStarted = (sermonId: string) => {
    inFlightSermonIdsRef.current.add(sermonId)
    lastTapRef.current = { id: sermonId, startedAt: Date.now() }
  }

  const clearSuppressionOnError = (sermonId: string) => {
    if (lastTapRef.current.id === sermonId) lastTapRef.current = { id: null, startedAt: 0 }
  }

  const markPlayFinished = (sermonId: string) => {
    inFlightSermonIdsRef.current.delete(sermonId)
  }

  return {
    clearSuppressionOnError,
    isRepeatTapSuppressed,
    markPlayFinished,
    markPlayStarted,
  }
}
