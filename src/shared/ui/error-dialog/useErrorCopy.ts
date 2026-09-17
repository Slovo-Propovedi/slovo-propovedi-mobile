import { setStringAsync } from 'expo-clipboard'
import { useState } from 'react'

export const useErrorCopy = (message: string, detail: string) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    const text = `ОШИБКА: ${message}\n\nДЕТАЛИ:\n${detail}`.trim()
    await setStringAsync(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return { copied, handleCopy }
}
