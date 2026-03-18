import { useCallback, useRef } from 'react'

interface SeekControls {
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

  // Keep position ref updated
  positionRef.current = position

  const startSeek = useCallback(
    (direction: 'backward' | 'forward') => {
      seekDirectionRef.current = direction
      seekSpeedRef.current = 5000 // Start with 5 seconds
      tickCountRef.current = 0

      const doSeek = () => {
        const currentPos = positionRef.current // Use ref instead of closure
        const delta =
          seekDirectionRef.current === 'forward' ? seekSpeedRef.current : -seekSpeedRef.current
        const newPos = Math.max(0, Math.min(duration, currentPos + delta))
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
    [duration, seekTo],
  )

  const stopSeek = useCallback(() => {
    if (seekIntervalRef.current) {
      clearInterval(seekIntervalRef.current)
      seekIntervalRef.current = null
    }
    seekSpeedRef.current = 0
  }, [])

  return { startSeek, stopSeek }
}
