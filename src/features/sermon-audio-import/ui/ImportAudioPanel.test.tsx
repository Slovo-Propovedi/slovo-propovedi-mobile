import { createCtx } from '@reatom/framework'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { Platform } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { reportError } from 'shared/model/error-dialog'
import { toastAtom } from 'shared/model/toast'
import { type ImportedSermonData, type ImportedSermonMetadata } from '../lib/importTypes'
import { ImportSourceError } from '../lib/sourceErrors'
import { ImportAudioPanel } from './ImportAudioPanel'

const VIDEO_URL = 'https://www.youtube.com/watch?v=lV6YkF7ytxs'
const IMPORT_LABEL = 'Импортировать'
const BASE_INSTANCE = 'https://inv.phobos.observer'
const ALT_INSTANCE = 'https://invidious.f5.si'
const LOCAL_INSTANCE = 'http://192.168.1.10:8080'
const TRIGGER_LABEL = 'Invidious: inv.phobos.observer'
const ALT_LABEL = 'Invidious: invidious.f5.si'
const CUSTOM_OPTION_LABEL = 'Свой инстанс…'
const CUSTOM_INPUT_LABEL = 'Свой инстанс'
const YOUTUBE_LABEL = 'YouTube'
const URL_LABEL = 'YouTube (URL)'
const DISABLED_SOURCE_HINT = 'На вебе доступен только источник Invidious'
const SUCCESS_MESSAGE = 'Импортировано из YouTube'
const VIDEO_UNAVAILABLE_MESSAGE = 'Видео недоступно'
const DOWNLOAD_PHASE_LABEL = 'Скачивание…'
const PROCESSING_LABEL = 'Обработка на сервере…'

const mockImportAudio = jest.fn()
const mockUpdateSettings = jest.fn()
const mockSettings = { invidiousBaseUrl: BASE_INSTANCE, source: 'invidious' }

jest.mock('../lib/importAudio', () => ({
  importAudio: (...args: unknown[]) => mockImportAudio(...args),
}))

jest.mock('../lib/importSettings', () => ({
  normalizeInvidiousBaseUrl: jest.requireActual('../lib/importSettings').normalizeInvidiousBaseUrl,
  useImportSettings: () => ({ settings: mockSettings, updateSettings: mockUpdateSettings }),
}))

// Пресеты приходят с бэкенда; в тесте компонента список фиксирован — сам fetch
// покрыт отдельным тестом useInvidiousInstances.
jest.mock('../lib/useInvidiousInstances', () => ({
  useInvidiousInstances: () => [BASE_INSTANCE, ALT_INSTANCE],
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const METADATA: ImportedSermonMetadata = {
  description: 'Текст проповеди',
  title: 'Проповедь о покаянии',
}

const IMPORTED: ImportedSermonData = { ...METADATA, audioUrl: 'https://cdn.test/sermon.m4a' }

const renderImport = async ({
  hasAudio = false,
  onAudioImported = jest.fn(),
  onImportUrl = jest.fn(),
  onMetadata = jest.fn(),
  url = VIDEO_URL,
}: {
  hasAudio?: boolean
  onAudioImported?: (audioUrl: string) => void
  onImportUrl?: (url: string) => void
  onMetadata?: (metadata: ImportedSermonMetadata) => void
  url?: string
} = {}) => {
  const ctx = createCtx()

  const view = await renderWithProviders(
    <ImportAudioPanel
      youtubeUrl={url}
      hasAudio={hasAudio}
      onMetadata={onMetadata}
      onImportUrl={onImportUrl}
      onAudioImported={onAudioImported}
    />,
    { ctx },
  )

  return { ...view, ctx, onAudioImported, onImportUrl, onMetadata }
}

const openSourceSelect = async () => {
  await fireEvent.press(screen.getByRole('button', { name: /Invidious: inv\.phobos\.observer/ }))
}

const pressImport = () => fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

// Импорт завершается сбросом прогресса уже после показа toast: ждём его в
// отдельном act-цикле, иначе обновление состояния прилетает вне act().
const waitForImportToFinish = () =>
  waitFor(() => {
    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeEnabled()
  })

describe('<ImportAudioPanel>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSettings.source = 'invidious'
    mockSettings.invidiousBaseUrl = BASE_INSTANCE
    mockImportAudio.mockResolvedValue(IMPORTED)
  })

  test('renders the source selector and the import button', async () => {
    await renderImport()

    expect(screen.getByText(TRIGGER_LABEL)).toBeTruthy()
    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeEnabled()
  })

  test('reflects the stored youtube source in the selector', async () => {
    mockSettings.source = 'youtube'
    await renderImport()

    expect(screen.getByText(YOUTUBE_LABEL)).toBeTruthy()
  })

  test('persists the youtube source when selected', async () => {
    await renderImport()
    await openSourceSelect()

    await fireEvent.press(screen.getByRole('button', { name: YOUTUBE_LABEL }))

    expect(mockUpdateSettings).toHaveBeenCalledWith({ source: 'youtube' })
  })

  test('persists another saved instance when selected', async () => {
    await renderImport()
    await openSourceSelect()

    await fireEvent.press(screen.getByRole('button', { name: ALT_LABEL }))

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      invidiousBaseUrl: ALT_INSTANCE,
      source: 'invidious',
    })
  })

  test('reveals the custom instance input without persisting anything yet', async () => {
    await renderImport()
    await openSourceSelect()

    await fireEvent.press(screen.getByRole('button', { name: CUSTOM_OPTION_LABEL }))

    expect(mockUpdateSettings).not.toHaveBeenCalled()
    expect(screen.getByLabelText(CUSTOM_INPUT_LABEL)).toBeTruthy()
  })

  test('commits a custom instance on blur', async () => {
    await renderImport()
    await openSourceSelect()
    await fireEvent.press(screen.getByRole('button', { name: CUSTOM_OPTION_LABEL }))

    // Элемент перезапрашивается после ввода: fireEvent работает со снимком
    // дерева, а после changeText хендлер blur уже новый (с черновиком).
    await fireEvent.changeText(screen.getByLabelText(CUSTOM_INPUT_LABEL), ` ${LOCAL_INSTANCE} `)
    await fireEvent(screen.getByLabelText(CUSTOM_INPUT_LABEL), 'blur')

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      invidiousBaseUrl: LOCAL_INSTANCE,
      source: 'invidious',
    })
  })

  test('adds a scheme to a bare lan host on blur', async () => {
    await renderImport()
    await openSourceSelect()
    await fireEvent.press(screen.getByRole('button', { name: CUSTOM_OPTION_LABEL }))

    await fireEvent.changeText(screen.getByLabelText(CUSTOM_INPUT_LABEL), ' 192.168.1.10:8080 ')
    await fireEvent(screen.getByLabelText(CUSTOM_INPUT_LABEL), 'blur')

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      invidiousBaseUrl: LOCAL_INSTANCE,
      source: 'invidious',
    })
  })

  test('ignores an empty custom instance', async () => {
    await renderImport()
    await openSourceSelect()
    await fireEvent.press(screen.getByRole('button', { name: CUSTOM_OPTION_LABEL }))

    await fireEvent.changeText(screen.getByLabelText(CUSTOM_INPUT_LABEL), '   ')
    await fireEvent(screen.getByLabelText(CUSTOM_INPUT_LABEL), 'blur')

    expect(mockUpdateSettings).not.toHaveBeenCalled()
  })

  test('disables the import while the url draft is empty', async () => {
    await renderImport({ url: '' })

    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeDisabled()
  })

  test('saves the pasted url into the form and starts the import with it', async () => {
    const { onImportUrl } = await renderImport({ url: '' })

    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeDisabled()

    await fireEvent.changeText(screen.getByLabelText(URL_LABEL), VIDEO_URL)

    // Черновик уходит в форму только по нажатию импорта, не при вводе.
    expect(onImportUrl).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: IMPORT_LABEL })).toBeEnabled()

    await pressImport()

    expect(onImportUrl).toHaveBeenCalledWith(VIDEO_URL)
    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ url: VIDEO_URL }))
  })

  test('imports the url and reports the metadata and the uploaded audio', async () => {
    mockImportAudio.mockImplementation(
      (args: { onMetadata?: (metadata: ImportedSermonMetadata) => void }) => {
        args.onMetadata?.(METADATA)

        return Promise.resolve(IMPORTED)
      },
    )
    const { onAudioImported, onMetadata } = await renderImport()

    await pressImport()

    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ url: VIDEO_URL }))
    await waitFor(() => {
      expect(onMetadata).toHaveBeenCalledWith(METADATA)
    })
    await waitFor(() => {
      expect(onAudioImported).toHaveBeenCalledWith(IMPORTED.audioUrl)
    })
  })

  test('fills metadata without downloading when the form already has audio', async () => {
    mockImportAudio.mockImplementation(
      (args: { onMetadata?: (metadata: ImportedSermonMetadata) => void }) => {
        args.onMetadata?.(METADATA)

        return Promise.resolve({ ...METADATA, audioUrl: null })
      },
    )
    const { ctx, onAudioImported, onMetadata } = await renderImport({ hasAudio: true })

    await pressImport()

    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ withAudio: false }))
    await waitFor(() => {
      expect(onMetadata).toHaveBeenCalledWith(METADATA)
    })
    await waitFor(() => {
      expect(ctx.get(toastAtom)).toBe('Название и описание заполнены')
    })
    expect(onAudioImported).not.toHaveBeenCalled()
  })

  test('shows a success toast after the import', async () => {
    const { ctx } = await renderImport()

    await pressImport()

    await waitFor(() => {
      expect(ctx.get(toastAtom)).toBe(SUCCESS_MESSAGE)
    })
    await waitForImportToFinish()
  })

  test('shows an actionable import error as a toast, not in the error dialog', async () => {
    const error = new ImportSourceError('video-unavailable')
    mockImportAudio.mockRejectedValue(error)
    const { ctx } = await renderImport()

    await pressImport()

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
    await pressImport()

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
    await pressImport()

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
    await pressImport()

    expect(await screen.findByText('Загрузка на сервер… 80%')).toBeTruthy()
  })

  test('shows server processing once the upload body is fully sent', async () => {
    mockImportAudio.mockImplementation(
      ({ onPhase }: { onPhase: (progress: { percent: number; phase: 'upload' }) => void }) =>
        new Promise<ImportedSermonData>(() => {
          onPhase({ percent: 100, phase: 'upload' })
        }),
    )

    await renderImport()
    await pressImport()

    expect(await screen.findByText(PROCESSING_LABEL)).toBeTruthy()
    expect(screen.queryByText('Загрузка на сервер… 100%')).toBeNull()
    expect(screen.getByRole('progressbar', { name: PROCESSING_LABEL })).toHaveAccessibilityValue({
      max: 100,
      min: 0,
      now: 100,
    })
  })

  test('shows searching while the source has not reported a phase yet', async () => {
    mockImportAudio.mockImplementation(() => new Promise<ImportedSermonData>(() => {}))

    await renderImport()
    await pressImport()

    expect(await screen.findByText('Поиск видео…')).toBeTruthy()
  })
})

describe('<ImportAudioPanel> on web', () => {
  let restorePlatform: { restore: () => void }

  beforeEach(() => {
    jest.clearAllMocks()
    // Even a stored "youtube" choice must fall back to Invidious on web.
    mockSettings.source = 'youtube'
    mockSettings.invidiousBaseUrl = BASE_INSTANCE
    mockImportAudio.mockResolvedValue(IMPORTED)
    restorePlatform = jest.replaceProperty(Platform, 'OS', 'web')
  })

  afterEach(() => {
    restorePlatform.restore()
  })

  test('disables YouTube but still imports through Invidious', async () => {
    const { onAudioImported } = await renderImport()

    expect(screen.getByText(TRIGGER_LABEL)).toBeTruthy()
    await openSourceSelect()
    expect(screen.getByRole('button', { name: YOUTUBE_LABEL })).toBeDisabled()
    expect(screen.getByHintText(DISABLED_SOURCE_HINT)).toBeTruthy()

    await pressImport()

    expect(mockImportAudio).toHaveBeenCalledWith(expect.objectContaining({ url: VIDEO_URL }))
    await waitFor(() => {
      expect(onAudioImported).toHaveBeenCalledWith(IMPORTED.audioUrl)
    })
  })

  test('does not switch to YouTube when its disabled option is pressed', async () => {
    await renderImport()
    await openSourceSelect()

    await fireEvent.press(screen.getByRole('button', { name: YOUTUBE_LABEL }))

    expect(mockUpdateSettings).not.toHaveBeenCalled()
  })
})
