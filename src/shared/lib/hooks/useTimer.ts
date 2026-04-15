import { useEffect, useRef, useState } from 'react'

export const useTimer = (startValue: number, timeout = 1000) => {
  const [countdownValue, setCountdownValue] = useState(startValue)

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const createTimer = () => {
    intervalIdRef.current = setInterval(() => {
      if (countdownValue <= 0) clearInterval(intervalIdRef.current)
      else setCountdownValue(countdownValue - 1)
    }, timeout)
  }

  const restartTimer = () => {
    setCountdownValue(startValue)
  }

  const resumeTimer = () => {
    createTimer()
  }

  const pauseTimer = () => {
    clearInterval(intervalIdRef.current)
  }

  useEffect(() => {
    createTimer()
    return () => clearInterval(intervalIdRef.current)
  }, [countdownValue])

  useEffect(() => {
    if (startValue) restartTimer()
  }, [])

  return { countdownValue, pauseTimer, restartTimer, resumeTimer, setCountdownValue }
}
