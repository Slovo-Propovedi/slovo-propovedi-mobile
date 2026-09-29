jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

jest.mock('shared/lib/update-service/updateService', () => ({
  apkFileExists: jest.fn(),
  canRequestPackageInstalls: jest.fn(),
  cleanupUpdateFiles: jest.fn(),
  extractApkFromZip: jest.fn(),
  installApk: jest.fn(),
}))

jest.mock('./updateInstallFallback', () => ({
  downloadUpdateZipWithFallback: jest.fn(),
}))

jest.mock('./updateInstallStartDecision', () => ({
  getStartDecision: jest.fn(),
}))

import { createCtx } from '@reatom/framework'
import {
  canRequestPackageInstalls,
  cleanupUpdateFiles,
  extractApkFromZip,
  installApk,
} from '../lib/update-service/updateService'
import { reportError } from './error-dialog'
import { updateErrorAtom, updateErrorKindAtom, updateStateAtom } from './updateInstall'
import { downloadUpdateZipWithFallback } from './updateInstallFallback'
import { startUpdateAction } from './updateInstallFlow'
import { getStartDecision } from './updateInstallStartDecision'

const ZIP_URL = 'https://example.com/update.zip'
const ZIP_PATH = '/cache/updates/slovo-propovedi-update.zip'
const APK_PATH = '/cache/updates/update.apk'
const REPORT_MESSAGE = 'Ошибка обновления приложения'
const DOWNLOAD_ERROR_MESSAGE =
  'Не удалось скачать обновление. Проверьте подключение и попробуйте снова'

const mockedGetStartDecision = jest.mocked(getStartDecision)
const mockedDownload = jest.mocked(downloadUpdateZipWithFallback)
const mockedCleanup = jest.mocked(cleanupUpdateFiles)
const mockedExtract = jest.mocked(extractApkFromZip)
const mockedCanInstall = jest.mocked(canRequestPackageInstalls)
const mockedInstall = jest.mocked(installApk)
const mockedReportError = jest.mocked(reportError)

describe('handleUpdateFailure (via startUpdateAction)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedCleanup.mockResolvedValue(undefined)
    mockedDownload.mockResolvedValue(ZIP_PATH)
    mockedExtract.mockResolvedValue(APK_PATH)
    mockedCanInstall.mockResolvedValue(true)
  })

  test('a foreseen download error stays in the dialog without the global modal', async () => {
    const ctx = createCtx()
    mockedGetStartDecision.mockResolvedValue(ZIP_URL)
    mockedDownload.mockRejectedValue(new Error('Network request failed'))

    await startUpdateAction(ctx)

    expect(mockedReportError).not.toHaveBeenCalled()
    expect(ctx.get(updateStateAtom)).toBe('error')
    expect(ctx.get(updateErrorKindAtom)).toBe('download')
    expect(ctx.get(updateErrorAtom)).toBe(DOWNLOAD_ERROR_MESSAGE)
  })

  test('a deliberate install cancel is foreseen and skips the global modal', async () => {
    const ctx = createCtx()
    mockedGetStartDecision.mockResolvedValue(ZIP_URL)
    mockedInstall.mockRejectedValue(new Error('Install failed: STATUS_FAILURE_ABORTED'))

    await startUpdateAction(ctx)

    expect(mockedReportError).not.toHaveBeenCalled()
    expect(ctx.get(updateErrorKindAtom)).toBe('install-aborted')
  })

  test('an unexpected generic error also opens the global modal with the raw error', async () => {
    const ctx = createCtx()
    const error = new Error('Something went wrong')
    mockedGetStartDecision.mockResolvedValue(ZIP_URL)
    mockedDownload.mockRejectedValue(error)

    await startUpdateAction(ctx)

    expect(mockedReportError).toHaveBeenCalledTimes(1)
    expect(mockedReportError).toHaveBeenCalledWith(error, REPORT_MESSAGE)
    expect(ctx.get(updateErrorKindAtom)).toBe('install-generic')
  })

  test('a non-Error input is unexpected and opens the global modal', async () => {
    const ctx = createCtx()
    mockedGetStartDecision.mockResolvedValue(ZIP_URL)
    mockedDownload.mockRejectedValue('boom')

    await startUpdateAction(ctx)

    expect(mockedReportError).toHaveBeenCalledWith('boom', REPORT_MESSAGE)
    expect(ctx.get(updateErrorKindAtom)).toBe('unknown')
  })
})
