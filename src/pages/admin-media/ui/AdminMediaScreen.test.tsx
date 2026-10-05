import { fireEvent, waitFor } from '@testing-library/react-native'
import { type filesMocks } from 'shared/api/generated'
import { renderWithProviders } from 'shared/mocks'
import { AdminMediaScreen } from './AdminMediaScreen'

const mockGetFiles = jest.fn()
const mockRemoveFile = jest.fn()
const mockUpload = jest.fn()
const mockGetOrphans = jest.fn()
const mockCleanup = jest.fn()
const mockPickDocument = jest.fn()
const mockShowToast = jest.fn()

jest.mock('shared/api', () => ({
  filesApi: {
    getFiles: () => ({
      appControllerCleanupOrphanedFiles: mockCleanup,
      appControllerGetOrphanedFiles: mockGetOrphans,
      appControllerRemoveFile: mockRemoveFile,
      getFiles: mockGetFiles,
    }),
  },
  uploadSermonFile: (...args: unknown[]) => mockUpload(...args),
}))

jest.mock('shared/model', () => ({
  ...jest.requireActual('shared/model'),
  showToast: (...args: unknown[]) => mockShowToast(...args),
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockPickDocument(...args),
}))

const catalogResponse = (
  files: ReturnType<typeof filesMocks.getGetFilesResponseMock>['files'],
) => ({
  count: files.length,
  files,
})

const imageFile = (
  overrides: Partial<ReturnType<typeof filesMocks.getGetFilesResponseMock>['files'][number]>,
) => ({
  fileName: 'cover.jpg',
  fileUrl: 'https://cdn.test/cover.jpg',
  lastModified: null,
  size: 2048,
  used: false,
  ...overrides,
})

const orphanFile = (fileName: string) => ({
  fileName,
  fileUrl: `https://cdn.test/${fileName}`,
  lastModified: null,
  size: 1024,
  used: false,
})

describe('<AdminMediaScreen>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetOrphans.mockResolvedValue({ count: 0, orphaned: [] })
    mockCleanup.mockResolvedValue({ deleted: [], failed: [] })
    mockRemoveFile.mockResolvedValue({ status: 'ok' })
    mockUpload.mockResolvedValue({ fileName: 'new.jpg', fileUrl: 'https://cdn.test/new.jpg' })
  })

  test('renders image files with size and the used badge', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([imageFile({ used: true })]))

    const { findByText } = await renderWithProviders(<AdminMediaScreen />)

    expect(await findByText('cover.jpg')).toBeTruthy()
    expect(await findByText('2.0 КБ')).toBeTruthy()
    expect(await findByText('используется')).toBeTruthy()
  })

  test('shows the empty state when the catalog is empty', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([]))

    const { findByText } = await renderWithProviders(<AdminMediaScreen />)

    expect(await findByText('Обложек пока нет')).toBeTruthy()
  })

  test('uploads a picked image and refreshes the catalog', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([]))
    mockPickDocument.mockResolvedValue({
      assets: [{ mimeType: 'image/jpeg', name: 'new.jpg', uri: 'file:///new.jpg' }],
      canceled: false,
    })

    const { findByLabelText } = await renderWithProviders(<AdminMediaScreen />)
    fireEvent.press(await findByLabelText('Загрузить файл'))

    await waitFor(() => expect(mockUpload).toHaveBeenCalledTimes(1))
    expect(mockUpload.mock.calls[0][0]).toMatchObject({ name: 'new.jpg' })
  })

  test('renders the media header with the upload action', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([]))

    const { findByLabelText, findByText } = await renderWithProviders(<AdminMediaScreen />)

    expect(await findByText('Медиа')).toBeTruthy()
    expect(await findByLabelText('Загрузить файл')).toBeTruthy()
  })

  test('keeps the header and skeleton visible while the catalog is loading', async () => {
    mockGetFiles.mockReturnValue(new Promise(() => undefined))

    const { findAllByTestId, findByLabelText, findByText } = await renderWithProviders(
      <AdminMediaScreen />,
    )

    expect(await findByText('Медиа')).toBeTruthy()
    expect(await findByLabelText('Загрузить файл')).toBeTruthy()
    expect((await findAllByTestId('admin-media-tile-skeleton')).length).toBeGreaterThan(0)
  })

  test('deletes a file after confirmation', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([imageFile({})]))

    const { findByLabelText, findByText, getAllByText } = await renderWithProviders(
      <AdminMediaScreen />,
    )
    fireEvent.press(await findByLabelText('Удалить cover.jpg'))

    expect(await findByText('Удалить обложку?')).toBeTruthy()
    const confirmButtons = getAllByText('Удалить', { includeHiddenElements: true })
    fireEvent.press(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(mockRemoveFile).toHaveBeenCalledWith('cover.jpg'))
  })

  test('scans for orphaned files and shows only audio/text as deletable', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([imageFile({})]))
    mockGetOrphans.mockResolvedValue({
      count: 2,
      orphaned: [
        imageFile({ fileName: 'old.jpg', used: false }),
        {
          fileName: 'lost.mp3',
          fileUrl: 'https://cdn.test/lost.mp3',
          lastModified: null,
          size: 1024,
          used: false,
        },
      ],
    })

    const { findByText } = await renderWithProviders(<AdminMediaScreen />)
    fireEvent.press(await findByText('Найти осиротевшие файлы'))

    expect(await findByText('lost.mp3')).toBeTruthy()
    // Only the audio orphan is deletable, so the cleanup button counts 1.
    expect(await findByText('Удалить (1)')).toBeTruthy()
  })

  test('treats an m4a orphan as deletable audio, not an image', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([imageFile({})]))
    mockGetOrphans.mockResolvedValue({ count: 1, orphaned: [orphanFile('lost.m4a')] })

    const { findByText } = await renderWithProviders(<AdminMediaScreen />)
    fireEvent.press(await findByText('Найти осиротевшие файлы'))

    expect(await findByText('lost.m4a')).toBeTruthy()
    expect(await findByText('Удалить (1)')).toBeTruthy()
  })

  test('deletes a single orphaned audio file after confirmation', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([imageFile({})]))
    mockGetOrphans.mockResolvedValue({ count: 1, orphaned: [orphanFile('lost.mp3')] })

    const { findByLabelText, findByText } = await renderWithProviders(<AdminMediaScreen />)
    fireEvent.press(await findByText('Найти осиротевшие файлы'))
    fireEvent.press(await findByLabelText('Удалить lost.mp3'))

    expect(await findByText('Удалить файл?')).toBeTruthy()
    fireEvent.press(await findByText('Удалить файл'))

    await waitFor(() => expect(mockRemoveFile).toHaveBeenCalledWith('lost.mp3'))
  })

  test('shows the in-use message when an orphan is still referenced (409)', async () => {
    mockGetFiles.mockResolvedValue(catalogResponse([imageFile({})]))
    mockGetOrphans.mockResolvedValue({ count: 1, orphaned: [orphanFile('used.mp3')] })
    mockRemoveFile.mockRejectedValue({ response: { status: 409 } })

    const { findByLabelText, findByText } = await renderWithProviders(<AdminMediaScreen />)
    fireEvent.press(await findByText('Найти осиротевшие файлы'))
    fireEvent.press(await findByLabelText('Удалить used.mp3'))
    fireEvent.press(await findByText('Удалить файл'))

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.anything(),
        'Файл используется в проповедях',
      ),
    )
  })
})
