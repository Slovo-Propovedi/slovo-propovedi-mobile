import { getInstallErrorMessage } from './installErrorMessage'

const GENERIC_MESSAGE = 'Не удалось установить обновление'

const nativeInstallError = (statusName: string, statusMessage = 'null'): Error =>
  new Error(`Install failed: ${statusName}, message=${statusMessage}, legacyStatus=-1`)

describe('getInstallErrorMessage', () => {
  test('returns the generic message for a non-Error input', () => {
    expect(getInstallErrorMessage(null)).toBe(GENERIC_MESSAGE)
    expect(getInstallErrorMessage(undefined)).toBe(GENERIC_MESSAGE)
    expect(getInstallErrorMessage('Install failed: STATUS_FAILURE_ABORTED')).toBe(GENERIC_MESSAGE)
  })

  test('returns the generic message for an Error without a message', () => {
    expect(getInstallErrorMessage(new Error(''))).toBe(GENERIC_MESSAGE)
  })

  test('maps STATUS_FAILURE_ABORTED to a cancellation message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE_ABORTED'))).toBe(
      'Установка отменена',
    )
  })

  test('maps STATUS_FAILURE_STORAGE to a storage message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE_STORAGE'))).toBe(
      'Недостаточно места для установки обновления',
    )
  })

  test('maps STATUS_FAILURE_CONFLICT to a version conflict message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE_CONFLICT'))).toBe(
      'Конфликт версий: обновление несовместимо с установленной версией',
    )
  })

  test('maps STATUS_FAILURE_INCOMPATIBLE to an incompatibility message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE_INCOMPATIBLE'))).toBe(
      'Обновление несовместимо с этим устройством или версией Android',
    )
  })

  test('maps STATUS_FAILURE_INVALID to a corrupted file message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE_INVALID'))).toBe(
      'Файл обновления повреждён',
    )
  })

  test('maps STATUS_FAILURE_BLOCKED to a blocked message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE_BLOCKED'))).toBe(
      'Установка заблокирована системой',
    )
  })

  test('maps STATUS_FAILURE to the generic message', () => {
    expect(getInstallErrorMessage(nativeInstallError('STATUS_FAILURE'))).toBe(GENERIC_MESSAGE)
  })

  test('detects the signature mismatch hint over the status name', () => {
    const error = nativeInstallError(
      'STATUS_FAILURE_INCOMPATIBLE',
      'INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package signatures do not match',
    )

    expect(getInstallErrorMessage(error)).toBe(
      'Обновление несовместимо: подписи установленной и новой версии различаются',
    )
  })

  test('returns the generic message for an unknown error', () => {
    expect(getInstallErrorMessage(new Error('Something went wrong'))).toBe(GENERIC_MESSAGE)
  })
})
