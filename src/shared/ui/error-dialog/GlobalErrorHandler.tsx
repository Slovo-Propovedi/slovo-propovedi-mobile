import { useEffect } from 'react'
import { useErrorDialog } from './useErrorDialog'

export const GlobalErrorHandler = () => {
  const { showError } = useErrorDialog()

  useEffect(() => {
    const handleError = (error: Error, isFatal?: boolean) => {
      const message = isFatal ? 'Фатальная ошибка приложения' : 'Произошла непредвиденная ошибка'

      showError(error, message)
    }

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

      showError(error, 'Произошла ошибка асинхронной операции')
    }

    // Глобальный обработчик ошибок React Native
    if (ErrorUtils) {
      const originalHandler = ErrorUtils.getGlobalHandler()
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        handleError(error, isFatal)
        originalHandler(error, isFatal)
      })
    }

    // Обработчик Promise rejections (для web и сред с DOM)
    if (typeof window !== 'undefined' && 'addEventListener' in window)
      window.addEventListener('unhandledrejection', handlePromiseRejection)

    return () => {
      if (typeof window !== 'undefined' && 'removeEventListener' in window)
        window.removeEventListener('unhandledrejection', handlePromiseRejection)
    }
  }, [showError])

  return null
}
