import { createCtx } from '@reatom/framework'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { reportError } from 'shared/model/error-dialog'
import { toastAtom } from 'shared/model/toast'
import { type ImportedSermonData } from '../lib/importTypes'
import { ImportSourceError } from '../lib/sourceErrors'
import { ImportFromYoutube } from './ImportFromYoutube'

const VIDEO_URL = 'https://www.youtube.com/watch?v=lV6YkF7ytxs'
const IMPORT_LABEL = 'Импортировать'
const INSTANCE_LABEL = 'Инстанс Invidious'
const INVIDIOUS_LABEL = 'Invidious'
const YOUTUBE_LABEL = 'YouTube'
const DISABLED_SOURCE_HINT = 'На вебе доступен только источник Invidious'
const SUCCESS_MESSAGE = 'Импортировано из YouTube'
const VIDEO_UNAVAILABLE_MESSAGE = 'Видео недоступно'
const DOWNLOAD_PHASE_LABEL = 'Скачивание…'

const mockImportAudio = jest.fn()
const mockUpdateSettings = jest.fn()
const mockSettings = { invidiousBaseUrl: 'https://inv.phobos.observer', source: 'invidious' }

jest.mock('../lib/importAudio', () => ({
  importAudio: (...args: unknown[]) => mockImportAudio(...args),
}))

jest.mock('../lib/importSettings', () => ({
  useImportSettings: () => ({ settings: mockSettings, updateSettings: mockUpdateSettings }),
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const IMPORTED: ImportedSermonData = {
  audioUrl: 'https://cdn.test/sermon.m4a',
  description: 'Текст проповеди',
  title: 'Проповедь о покаянии',
}

const renderImport = async ({
  disabled = false,
  onImported = jest.fn(),
  url = VIDEO_URL,
}: { disabled?: boolean; onImported?: (data: ImportedSermonData) => void; url?: string } = {}) => {
  const ctx = createCtx()

  const view = await renderWithProviders(
    <ImportFromYoutube youtubeUrl={url} disabled={disabled} onImported={onImported} />,
    { ctx },
  )

  return { ...view, ctx, onImported }
}

// Импорт завершается сбросом прогресса уже после показа toast: ждём его в
// отдельном act-цикле, иначе обновление состояния прилетает вне act().
const waitForImportToFinish = () =>
  waitFor(() => {
    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeEnabled()
  })

describe('<ImportFromYoutube>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettings.source = 'invidious'
    mockImportAudio.mockResolvedValue(IMPORTED)
  })

  test('renders the source picker and the import button', async () => {
    await renderImport()

    expect(screen.getByRole('button', { name: YOUTUBE_LABEL })).toBeTruthy()
    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeEnabled()
  })

  test('shows the instance field only for the invidious source', async () => {
    await renderImport()

    expect(screen.getByLabelText(INSTANCE_LABEL)).toBeTruthy()
  })

  test('hides the instance field for the youtube source', async () => {
    mockSettings.source = 'youtube'

    await renderImport()

    expect(screen.queryByLabelText(INSTANCE_LABEL)).toBeNull()
  })

  test('disables the import when there is no url', async () => {
    await renderImport({ disabled: true })

    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeDisabled()
  })

  test('imports the url from the form and reports the imported data', async () => {
    const { onImported } = await renderImport()

    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ url: VIDEO_URL }))
    await waitFor(() => {
      expect(onImported).toHaveBeenCalledWith(IMPORTED)
    })
  })

  test('shows a success toast after the import', async () => {
    const { ctx } = await renderImport()

    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    await waitFor(() => {
      expect(ctx.get(toastAtom)).toBe(SUCCESS_MESSAGE)
    })
    await waitForImportToFinish()
  })

  test('shows an actionable import error as a toast, not in the error dialog', async () => {
    const error = new ImportSourceError('video-unavailable')
    mockImportAudio.mockRejectedValue(error)
    const { ctx } = await renderImport()

    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    await waitFor(() => {
      expect(ctx.get(toastAtom)).toBe(VIDEO_UNAVAILABLE_MESSAGE)
    })
    expect(reportError).not.toHaveBeenCalled()
    await waitForImportToFinish()
  })

  test('shows the download progress while importing', async () => {
    mockImportAudio.mockImplementation(
      ({ onPhase }: { onPhase: (progress: { percent: number; phase: 'download' }) => void }) =>
        new Promise<ImportedSermonData>(() => {
          onPhase({ percent: 40, phase: 'download' })
        }),
    )

    await renderImport()
    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    expect(await screen.findByText('Скачивание… 40%')).toBeTruthy()
    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeDisabled()
  })

  test('renders a progress bar for the download phase while importing', async () => {
    mockImportAudio.mockImplementation(
      ({ onPhase }: { onPhase: (progress: { percent: number; phase: 'download' }) => void }) =>
        new Promise<ImportedSermonData>(() => {
          onPhase({ percent: 40, phase: 'download' })
        }),
    )

    await renderImport()
    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    expect(
      await screen.findByRole('progressbar', { name: DOWNLOAD_PHASE_LABEL }),
    ).toHaveAccessibilityValue({ max: 100, min: 0, now: 40 })
  })

  test('shows the upload progress of a late phase', async () => {
    mockImportAudio.mockImplementation(
      ({ onPhase }: { onPhase: (progress: { percent: number; phase: 'upload' }) => void }) =>
        new Promise<ImportedSermonData>(() => {
          onPhase({ percent: 80, phase: 'upload' })
        }),
    )

    await renderImport()
    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    expect(await screen.findByText('Загрузка на сервер… 80%')).toBeTruthy()
  })

  test('shows searching while the source has not reported a phase yet', async () => {
    mockImportAudio.mockImplementation(() => new Promise<ImportedSermonData>(() => {}))

    await renderImport()
    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    expect(await screen.findByText('Поиск видео…')).toBeTruthy()
  })
})

describe('<ImportFromYoutube> on web', () => {
  let restorePlatform: { restore: () => void }

  beforeEach(() => {
    jest.clearAllMocks()
    // Even a stored "youtube" choice must fall back to Invidious on web.
    mockSettings.source = 'youtube'
    mockImportAudio.mockResolvedValue(IMPORTED)
    restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
  })

  afterEach(() => {
    restorePlatform.restore()
  })

  test('disables YouTube but still imports through Invidious', async () => {
    const { onImported } = await renderImport()

    expect(screen.getByRole('button', { name: YOUTUBE_LABEL })).toBeDisabled()
    expect(screen.getByHintText(DISABLED_SOURCE_HINT)).toBeTruthy()
    expect(screen.getByRole('button', { name: INVIDIOUS_LABEL })).toBeSelected()
    expect(screen.getByLabelText(INSTANCE_LABEL)).toBeTruthy()

    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ url: VIDEO_URL }))
    await waitFor(() => {
      expect(onImported).toHaveBeenCalledWith(IMPORTED)
    })
  })

  test('does not switch to YouTube when its disabled chip is pressed', async () => {
    await renderImport()

    fireEvent.press(screen.getByRole('button', { name: YOUTUBE_LABEL }))

    expect(mockUpdateSettings).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: INVIDIOUS_LABEL })).toBeSelected()
  })
})
