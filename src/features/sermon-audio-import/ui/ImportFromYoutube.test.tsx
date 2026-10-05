import { createCtx } from '@reatom/framework'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { toastAtom } from 'shared/model/toast'
import { type ImportedSermonData } from '../lib/importTypes'
import { ImportSourceError } from '../lib/sourceErrors'
import { ImportFromYoutube } from './ImportFromYoutube'

const VIDEO_URL = 'https://www.youtube.com/watch?v=lV6YkF7ytxs'
const IMPORT_LABEL = 'Импортировать'
const INSTANCE_LABEL = 'Инстанс Invidious'
const YOUTUBE_LABEL = 'YouTube'
const SUCCESS_MESSAGE = 'Импортировано из YouTube'
const VIDEO_UNAVAILABLE_MESSAGE = 'Видео недоступно'

const mockImportAudio = jest.fn()
const mockUpdateSettings = jest.fn()
const mockSettings = { invidiousBaseUrl: 'https://inv.phobos.observer', source: 'invidious' }

jest.mock('../lib/importAudio', () => ({
  importAudio: (...args: unknown[]) => mockImportAudio(...args),
}))

jest.mock('../lib/importSettings', () => ({
  useImportSettings: () => ({ settings: mockSettings, updateSettings: mockUpdateSettings }),
}))

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

  test('maps an import error to a toast', async () => {
    mockImportAudio.mockRejectedValue(new ImportSourceError('video-unavailable'))
    const { ctx } = await renderImport()

    await fireEvent.press(screen.getByRole('button', { name: IMPORT_LABEL }))

    await waitFor(() => {
      expect(ctx.get(toastAtom)).toBe(VIDEO_UNAVAILABLE_MESSAGE)
    })
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
