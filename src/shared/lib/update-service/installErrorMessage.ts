const GENERIC_ERROR_MESSAGE = 'Не удалось установить обновление'

const SIGNATURE_MISMATCH_HINT = 'INSTALL_FAILED_UPDATE_INCOMPATIBLE'
const SIGNATURE_MISMATCH_MESSAGE =
  'Обновление несовместимо: подписи установленной и новой версии различаются'

// STATUS_FAILURE (generic) intentionally falls through to GENERIC_ERROR_MESSAGE.
const STATUS_MESSAGES: Record<string, string> = {
  STATUS_FAILURE_ABORTED: 'Установка отменена',
  STATUS_FAILURE_BLOCKED: 'Установка заблокирована системой',
  STATUS_FAILURE_CONFLICT: 'Конфликт версий: обновление несовместимо с установленной версией',
  STATUS_FAILURE_INCOMPATIBLE: 'Обновление несовместимо с этим устройством или версией Android',
  STATUS_FAILURE_INVALID: 'Файл обновления повреждён',
  STATUS_FAILURE_STORAGE: 'Недостаточно места для установки обновления',
}

export const getInstallErrorMessage = (rawError: unknown): string => {
  if (!(rawError instanceof Error) || !rawError.message) return GENERIC_ERROR_MESSAGE

  if (rawError.message.includes(SIGNATURE_MISMATCH_HINT)) return SIGNATURE_MISMATCH_MESSAGE

  const statusName = Object.keys(STATUS_MESSAGES).find(status => rawError.message.includes(status))
  return statusName ? STATUS_MESSAGES[statusName] : GENERIC_ERROR_MESSAGE
}
