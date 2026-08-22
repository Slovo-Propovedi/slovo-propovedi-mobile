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
