import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import {
  type ImportedSermonData,
  type ImportedSermonMetadata,
  type ImportSettings,
} from './importTypes'
import { ImportSourceError } from './sourceErrors'
import { useAudioImport } from './useAudioImport'

const mockImportAudio = jest.fn()

jest.mock('./importAudio', () => ({
  importAudio: (...args: unknown[]) => mockImportAudio(...args),
}))

jest.mock('shared/model', () => ({ showToast: jest.fn() }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedShowToast = showToast as jest.MockedFunction<typeof showToast>
const mockedReportError = reportError as jest.MockedFunction<typeof reportError>

const SETTINGS: ImportSettings = {
  invidiousBaseUrl: 'https://inv.phobos.observer',
  source: 'invidious',
}

const METADATA: ImportedSermonMetadata = {
  description: 'Текст проповеди',
  title: 'Проповедь о покаянии',
}

const IMPORTED: ImportedSermonData = { ...METADATA, audioUrl: 'https://cdn.test/sermon.m4a' }

const VIDEO_URL = 'https://www.youtube.com/watch?v=lV6YkF7ytxs'

// Известные причины, которые пользователь решает сам (сменить ссылку/инстанс):
// им достаточно короткого toast'а, а не диалога с копируемыми деталями.
const ACTIONABLE_CODES = [
  'parse',
  'video-unavailable',
  'login-required',
  'live',
  'no-audio',
  'service-unavailable',
] as const

// Импорт, который не завершается сам: сигнал отмены даёт тест сам, дёрнув abort
// через переданный в хук signal.
const renderImport = async ({
  hasAudio = false,
  onAudioImported = jest.fn(),
  onMetadata = jest.fn(),
}: {
  hasAudio?: boolean
  onAudioImported?: (audioUrl: string) => void
  onMetadata?: (metadata: ImportedSermonMetadata) => void
} = {}) => {
  const view = await renderHookWithProviders(() =>
    useAudioImport({ hasAudio, onAudioImported, onMetadata, settings: SETTINGS, url: VIDEO_URL }),
  )

  return { ...view, onAudioImported, onMetadata }
}

const startImportRejecting = async (error: unknown) => {
  mockImportAudio.mockRejectedValue(error)
  const { result } = await renderImport()

  await act(async () => {
    await result.current.startImport()
  })
}

describe('useAudioImport', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('passes an abort signal and reports progress', async () => {
    mockImportAudio.mockImplementation(
      ({ onPhase }: { onPhase: (progress: { percent: number; phase: 'download' }) => void }) =>
        new Promise<ImportedSermonData>(() => {
          onPhase({ percent: 30, phase: 'download' })
        }),
    )
    const { result } = await renderImport()

    await act(async () => {
      void result.current.startImport()
    })

    expect(mockImportAudio).toHaveBeenCalledWith(
      expect.objectContaining({ settings: SETTINGS, url: VIDEO_URL, withAudio: true }),
    )
    expect(result.current.progress).toEqual({ percent: 30, phase: 'download' })
    expect(result.current.isImporting).toBe(true)
  })

  test('skips the success effects when the import is cancelled after resolution', async () => {
    let resolveImport: ((data: ImportedSermonData) => void) | undefined
    mockImportAudio.mockImplementation(
      (_args: { signal: AbortSignal }) =>
        new Promise<ImportedSermonData>(resolve => {
          resolveImport = resolve
        }),
    )
    const onAudioImported = jest.fn()
    const { result, unmount } = await renderImport({ onAudioImported })

    await act(async () => {
      void result.current.startImport()
    })
    await act(async () => {
      unmount()
    })
    await act(async () => {
      resolveImport?.(IMPORTED)
    })

    expect(onAudioImported).not.toHaveBeenCalled()
    expect(mockedShowToast).not.toHaveBeenCalled()
  })

  test('shows a success toast and reports the uploaded audio on success', async () => {
    mockImportAudio.mockResolvedValue(IMPORTED)
    const { onAudioImported, result } = await renderImport()

    await act(async () => {
      await result.current.startImport()
    })

    expect(mockedShowToast).toHaveBeenCalledWith(expect.anything(), 'Импортировано из YouTube')
    expect(onAudioImported).toHaveBeenCalledWith(IMPORTED.audioUrl)
    expect(mockedReportError).not.toHaveBeenCalled()
  })

  test('fills metadata only and skips the download when the form already has audio', async () => {
    mockImportAudio.mockImplementation(
      (args: { onMetadata?: (metadata: ImportedSermonMetadata) => void }) => {
        args.onMetadata?.(METADATA)

        return Promise.resolve({ ...METADATA, audioUrl: null })
      },
    )
    const { onAudioImported, onMetadata, result } = await renderImport({ hasAudio: true })

    await act(async () => {
      await result.current.startImport()
    })

    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ withAudio: false }))
    expect(onMetadata).toHaveBeenCalledWith(METADATA)
    expect(mockedShowToast).toHaveBeenCalledWith(expect.anything(), 'Название и описание заполнены')
    expect(onAudioImported).not.toHaveBeenCalled()
  })

  test.each(ACTIONABLE_CODES)('shows a toast for the actionable %s failure', async code => {
    await startImportRejecting(new ImportSourceError(code))

    expect(mockedShowToast).toHaveBeenCalledTimes(1)
    expect(mockedReportError).not.toHaveBeenCalled()
  })

  test('shows a dialog for the upload-failed failure', async () => {
    const error = new ImportSourceError('upload-failed', new Error('multipart'))

    await startImportRejecting(error)

    expect(mockedReportError).toHaveBeenCalledWith(error, expect.any(String))
    expect(mockedShowToast).not.toHaveBeenCalled()
  })

  test('shows a dialog for an unexpected failure', async () => {
    const error = new Error('boom')

    await startImportRejecting(error)

    expect(mockedReportError).toHaveBeenCalledWith(error, expect.any(String))
    expect(mockedShowToast).not.toHaveBeenCalled()
  })
})
