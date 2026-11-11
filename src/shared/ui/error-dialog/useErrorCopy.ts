import { setStringAsync } from 'expo-clipboard'
import { useEffect, useRef, useState } from 'react'

const COPY_RESET_DELAY = 2000

export const useErrorCopy = (message: string, detail: string) => {
  const [copied, setCopied] = useState(false)
  const resetTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current)
    },
    [],
  )

  const handleCopy = async () => {
    const text = `ОШИБКА: ${message}\n\nДЕТАЛИ:\n${detail}`.trim()
    await setStringAsync(text)
    setCopied(true)
    if (resetTimerRef.current !== null) clearTimeout(resetTimerRef.current)

    resetTimerRef.current = setTimeout(() => setCopied(false), COPY_RESET_DELAY)
  }

  return { copied, handleCopy }
}
