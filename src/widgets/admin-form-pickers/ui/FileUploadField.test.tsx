import { type AdminFileKind } from 'shared/lib/file-drop'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { FileUploadField } from './FileUploadField'

jest.mock('../lib/useAdminFiles', () => ({ useAdminFiles: jest.fn() }))
jest.mock('../lib/useFileUpload', () => ({ useFileUpload: jest.fn() }))

const LIBRARY_LABEL = 'Выбрать из библиотеки'

const mockedUseAdminFiles = useAdminFiles as jest.MockedFunction<typeof useAdminFiles>
const mockedUseFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>

const renderField = (kind: AdminFileKind, value = '') =>
  renderWithProviders(
    <FileUploadField kind={kind} label='Файл' value={value} onChange={jest.fn()} />,
  )

describe('<FileUploadField>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseAdminFiles.mockReturnValue({ files: [], isError: false, isLoading: false })
    mockedUseFileUpload.mockReturnValue({
      error: null,
      isUploading: false,
      pickAndUpload: jest.fn(),
      progress: 0,
    })
  })

  test('hides the media library button for the audio kind but keeps upload', async () => {
    const { getByRole, queryByRole } = await renderField('audio')

    expect(queryByRole('button', { name: LIBRARY_LABEL })).toBeNull()
    expect(getByRole('button', { name: 'Загрузить аудио' })).toBeTruthy()
  })

  test('hides the media library button for the text kind but keeps upload', async () => {
    const { getByRole, queryByRole } = await renderField('text')

    expect(queryByRole('button', { name: LIBRARY_LABEL })).toBeNull()
    expect(getByRole('button', { name: 'Загрузить файл' })).toBeTruthy()
  })

  test('shows the media library button for the image kind', async () => {
    const { getByRole } = await renderField('image')

    expect(getByRole('button', { name: LIBRARY_LABEL })).toBeTruthy()
    expect(getByRole('button', { name: 'Загрузить изображение' })).toBeTruthy()
  })

  test('names the upload action as a replacement when the field already has a value', async () => {
    const { getByRole } = await renderField('audio', 'https://cdn.test/a.mp3')

    expect(getByRole('button', { name: 'Заменить аудио' })).toBeTruthy()
  })
})
