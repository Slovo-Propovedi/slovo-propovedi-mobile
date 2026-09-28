import { classifyUpdateError } from './installErrorMessage'

const GENERIC_MESSAGE = 'Не удалось установить обновление'
const SIGNATURE_MESSAGE =
  'Обновление несовместимо: подписи установленной и новой версии различаются. Удалите приложение и установите его заново'
const ABORTED_MESSAGE = 'Установка отменена'
const BLOCKED_MESSAGE = 'Установка заблокирована системой'
const CONFLICT_MESSAGE = 'Конфликт версий: обновление несовместимо с установленной версией'
const INCOMPATIBLE_MESSAGE = 'Обновление несовместимо с этим устройством или версией Android'
const INVALID_MESSAGE = 'Файл обновления повреждён'
const STORAGE_MESSAGE = 'Недостаточно места для установки обновления'
const DOWNLOAD_MESSAGE = 'Не удалось скачать обновление. Проверьте подключение и попробуйте снова'
const OFFLINE_MESSAGE = 'Нет подключения к интернету'
const EXTRACT_MESSAGE =
  'Не удалось распаковать обновление. Повторите попытку или скачайте его из браузера'

const nativeInstallError = (statusName: string, statusMessage = 'null'): Error =>
  new Error(`Install failed: ${statusName}, message=${statusMessage}, legacyStatus=-1`)

describe('classifyUpdateError', () => {
  test('classifies a non-Error input as unknown', () => {
    expect(classifyUpdateError(null)).toEqual({ kind: 'unknown', message: GENERIC_MESSAGE })
    expect(classifyUpdateError(undefined)).toEqual({ kind: 'unknown', message: GENERIC_MESSAGE })
    expect(classifyUpdateError('STATUS_FAILURE_ABORTED')).toEqual({
      kind: 'unknown',
      message: GENERIC_MESSAGE,
    })
  })

  test('classifies an Error without a message as unknown', () => {
    expect(classifyUpdateError(new Error(''))).toEqual({
      kind: 'unknown',
      message: GENERIC_MESSAGE,
    })
  })

  test('detects the signature mismatch hint over the status name', () => {
    const error = nativeInstallError(
      'STATUS_FAILURE_INCOMPATIBLE',
      'INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package signatures do not match',
    )

    expect(classifyUpdateError(error)).toEqual({
      kind: 'install-signature',
      message: SIGNATURE_MESSAGE,
    })
  })

  test.each([
    ['STATUS_FAILURE_ABORTED', 'install-aborted', ABORTED_MESSAGE],
    ['STATUS_FAILURE_BLOCKED', 'install-blocked', BLOCKED_MESSAGE],
    ['STATUS_FAILURE_CONFLICT', 'install-conflict', CONFLICT_MESSAGE],
    ['STATUS_FAILURE_INCOMPATIBLE', 'install-incompatible', INCOMPATIBLE_MESSAGE],
    ['STATUS_FAILURE_INVALID', 'install-invalid', INVALID_MESSAGE],
    ['STATUS_FAILURE_STORAGE', 'install-storage', STORAGE_MESSAGE],
  ])('maps %s to a dedicated install error', (status, kind, message) => {
    expect(classifyUpdateError(nativeInstallError(status))).toEqual({ kind, message })
  })

  test.each([
    ['ERR_DOWNLOAD'],
    ['Network request failed'],
    ['[updateService] Download failed or was cancelled: https://example.com/update.zip'],
    ['[updateService] Update download timed out after 600s'],
  ])('classifies %s as a download error', hint => {
    expect(classifyUpdateError(new Error(hint))).toEqual({
      kind: 'download',
      message: DOWNLOAD_MESSAGE,
    })
  })

  test('classifies the offline hint', () => {
    expect(classifyUpdateError(new Error(OFFLINE_MESSAGE))).toEqual({
      kind: 'offline',
      message: OFFLINE_MESSAGE,
    })
  })

  test.each([
    ['[updateService] No .apk file found inside the update archive'],
    ['[updateService] Extracted APK is missing at: file:///cache/updates/update.apk'],
    ['Failed to unzip'],
  ])('classifies %s as an extract error', rawMessage => {
    expect(classifyUpdateError(new Error(rawMessage))).toEqual({
      kind: 'extract',
      message: EXTRACT_MESSAGE,
    })
  })

  test('classifies a generic STATUS_FAILURE as a generic install error', () => {
    expect(classifyUpdateError(nativeInstallError('STATUS_FAILURE'))).toEqual({
      kind: 'install-generic',
      message: GENERIC_MESSAGE,
    })
  })

  test('classifies an unrecognised Error as a generic install error', () => {
    expect(classifyUpdateError(new Error('Something went wrong'))).toEqual({
      kind: 'install-generic',
      message: GENERIC_MESSAGE,
    })
  })
})
