import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { type ImportedSermonData, type ImportSettings } from './importTypes'
import { useAudioImport } from './useAudioImport'

const mockImportAudio = jest.fn()

jest.mock('./importAudio', () => ({
  importAudio: (...args: unknown[]) => mockImportAudio(...args),
}))

const SETTINGS: ImportSettings = {
  invidiousBaseUrl: 'https://inv.phobos.observer',
  source: 'invidious',
}

const IMPORTED: ImportedSermonData = {
  audioUrl: 'https://cdn.test/sermon.m4a',
  description: 'Текст проповеди',
  title: 'Проповедь о покаянии',
}

const VIDEO_URL = 'https://www.youtube.com/watch?v=lV6YkF7ytxs'

// Импорт, который не завершается сам: сигнал отмены даёт тест сам, дёрнув abort
// через переданный в хук signal.
const renderImport = async (onImported = jest.fn()) => {
  const view = await renderHookWithProviders(() =>
    useAudioImport({ onImported, settings: SETTINGS, url: VIDEO_URL }),
  )

  return { ...view, onImported }
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
      expect.objectContaining({ settings: SETTINGS, url: VIDEO_URL }),
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
    const onImported = jest.fn()
    const { result, unmount } = await renderImport(onImported)

    await act(async () => {
      void result.current.startImport()
    })
    await act(async () => {
      unmount()
    })
    await act(async () => {
      resolveImport?.(IMPORTED)
    })

    expect(onImported).not.toHaveBeenCalled()
  })
})
