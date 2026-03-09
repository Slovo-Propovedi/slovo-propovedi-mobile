import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { debounce } from '.'

type UseDelayedState = <T>(
  props: UseDelayedStateProps<T>,
) => [T | undefined, Dispatch<SetStateAction<T | undefined>>, { resetStates: () => void }]

interface UseDelayedStateProps<T> {
  delay: number
  initialValue?: T
}

export const useDelayedState: UseDelayedState = ({ delay, initialValue }) => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const timerIdRef = useRef<null | number>(null)

  const debounceCallback = useMemo(
    () => debounce<typeof value>(debounceValue => setDebouncedValue(debounceValue), delay),
    [delay],
  )

  const resetStates = () => {
    if (timerIdRef.current) clearTimeout(timerIdRef.current)

    setValue(initialValue)
    setDebouncedValue(initialValue)
  }

  useEffect(() => {
    timerIdRef.current = debounceCallback(value)

    return () => {
      if (timerIdRef.current) clearTimeout(timerIdRef.current)
    }
  }, [debounceCallback, value])

  return [debouncedValue, setValue, { resetStates }]
}
