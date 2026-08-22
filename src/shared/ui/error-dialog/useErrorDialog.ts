import { useState } from 'react'
import { getErrorDetail, getErrorMessage } from '../../lib/error-utils'

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
