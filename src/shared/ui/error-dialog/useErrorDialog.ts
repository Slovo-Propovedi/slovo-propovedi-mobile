import { useState } from 'react'

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Неизвестная ошибка'
}

export const getErrorDetail = (error: unknown): string => {
  if (error instanceof Error) return error.stack || error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object')
    try {
      return JSON.stringify(error, null, 2)
    } catch {
      return String(error)
    }

  return 'Нет деталей'
}

export const useErrorDialog = () => {
  const [errorDetail, setErrorDetail] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<null | string>(null)

  const showError = (error: unknown, customMessage?: string) => {
    setErrorMessage(customMessage || getErrorMessage(error))
    setErrorDetail(getErrorDetail(error))
  }

  const dismissError = () => {
    setErrorMessage(null)
    setErrorDetail('')
  }

  const showErrorWithMessage = (message: string, detail: string) => {
    setErrorMessage(message)
    setErrorDetail(detail)
  }

  return {
    dismissError,
    errorDetail,
    errorMessage,
    showError,
    showErrorWithMessage,
  }
}
