import { useCallback, useEffect, useRef, useState } from 'react'

interface SeekHandling {
  isDragging: boolean
  onSeekCancel: () => void
  onSeekEnd: () => void
  onSeekStart: (position: number) => void
  onSeekUpdate: (position: number) => void
  previewPosition: number
}

export const useSeekHandling = (
  position: number,
  onSeek?: (position: number) => void,
): SeekHandling => {
  const [isDragging, setIsDragging] = useState(false)
  const [previewPosition, setPreviewPosition] = useState(position)

  const isDraggingRef = useRef(false)
  const previewPositionRef = useRef(position)
  const onSeekRef = useRef(onSeek)
  const pendingSeekPositionRef = useRef<null | number>(null)

  useEffect(() => {
    onSeekRef.current = onSeek
  }, [onSeek])

  useEffect(() => {
    if (position < 1000 && previewPositionRef.current > 5000) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentionally syncing state from prop with guards
      setPreviewPosition(position)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentionally syncing state from prop with guards
      setIsDragging(false)
      pendingSeekPositionRef.current = null
    } else if (
      isDraggingRef.current &&
      pendingSeekPositionRef.current !== null &&
      Math.abs(position - pendingSeekPositionRef.current) < 100
    ) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentionally syncing state from prop with guards
      setIsDragging(false)
      pendingSeekPositionRef.current = null
    }
  }, [position])

  const onSeekStart = useCallback((pos: number) => {
    setIsDragging(true)
    setPreviewPosition(pos)
    isDraggingRef.current = true
    previewPositionRef.current = pos
  }, [])

  const onSeekUpdate = useCallback((pos: number) => {
    setPreviewPosition(pos)
    previewPositionRef.current = pos
  }, [])

  const onSeekEnd = useCallback(() => {
    if (isDraggingRef.current && onSeekRef.current) onSeekRef.current(previewPositionRef.current)

    pendingSeekPositionRef.current = previewPositionRef.current
  }, [])

  const onSeekCancel = useCallback(() => {
    setIsDragging(false)
    isDraggingRef.current = false
    pendingSeekPositionRef.current = null
  }, [])

  return {
    isDragging,
    onSeekCancel,
    onSeekEnd,
    onSeekStart,
    onSeekUpdate,
    previewPosition,
  }
}
