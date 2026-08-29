import { useCallback, useEffect, useRef, useState } from 'react'

interface SeekControls {
  isSeeking: boolean
  startSeek: (direction: 'backward' | 'forward') => void
  stopSeek: () => void
}

interface UseSeekControlsParams {
  duration: number
  position: number
  seekTo: (position: number) => Promise<void>
}

export const useSeekControls = ({
  duration,
  position,
  seekTo,
}: UseSeekControlsParams): SeekControls => {
  const seekIntervalRef = useRef<null | ReturnType<typeof setInterval>>(null)
  const seekSpeedRef = useRef(0)
  const seekDirectionRef = useRef<'backward' | 'forward'>('backward')
  const positionRef = useRef(position)
  const tickCountRef = useRef(0)
  const [isSeeking, setIsSeeking] = useState(false)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  const stopSeek = useCallback(() => {
    if (seekIntervalRef.current) {
      clearInterval(seekIntervalRef.current)
      seekIntervalRef.current = null
    }
    seekSpeedRef.current = 0
    setIsSeeking(false)
  }, [])

  const startSeek = useCallback(
    (direction: 'backward' | 'forward') => {
      seekDirectionRef.current = direction
      seekSpeedRef.current = 5000 // Start with 5 seconds
      tickCountRef.current = 0
      setIsSeeking(true)

      const doSeek = () => {
        // Guard: don't seek if duration not available or invalid
        if (!duration || duration <= 0) return

        const currentPos = positionRef.current
        const delta =
          seekDirectionRef.current === 'forward' ? seekSpeedRef.current : -seekSpeedRef.current

        // Calculate new position with proper clamping
        const maxPos = duration - 100 // 100ms buffer before end
        const newPos = Math.max(0, Math.min(maxPos, currentPos + delta))
        // Sync the base synchronously so the next 200ms tick computes from the
        // fresh position instead of the pre-render prop value (bounce fix).
        positionRef.current = newPos

        // Stop seeking if we've reached the boundary
        if (
          (seekDirectionRef.current === 'forward' && newPos >= maxPos) ||
          (seekDirectionRef.current === 'backward' && newPos <= 0)
        ) {
          void seekTo(newPos)
          stopSeek()
          return
        }

        void seekTo(newPos)
      }

      const accelerate = () => {
        // Increase speed over time: 5s -> 10s -> 20s -> 30s
        if (seekSpeedRef.current < 30000)
          seekSpeedRef.current = Math.min(seekSpeedRef.current + 5000, 30000)
      }

      seekIntervalRef.current = setInterval(() => {
        tickCountRef.current++
        if (tickCountRef.current % 3 === 0) accelerate() // Accelerate every 600ms
        doSeek()
      }, 200)
    },
    [duration, seekTo, stopSeek],
  )

  return { isSeeking, startSeek, stopSeek }
}
