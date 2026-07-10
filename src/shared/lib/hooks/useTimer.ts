import { useCallback, useEffect, useRef, useState } from 'react'

export const useTimer = (startValue: number, timeout = 1000) => {
  const [countdownValue, setCountdownValue] = useState(startValue)

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const countdownValueRef = useRef(countdownValue)
  countdownValueRef.current = countdownValue

  const createTimer = useCallback(() => {
    clearInterval(intervalIdRef.current)
    intervalIdRef.current = setInterval(() => {
      if (countdownValueRef.current <= 0) clearInterval(intervalIdRef.current)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentional countdown tick
      else setCountdownValue(prev => prev - 1)
    }, timeout)
  }, [timeout])

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
  }, [createTimer])

  return { countdownValue, pauseTimer, restartTimer, resumeTimer, setCountdownValue }
}
