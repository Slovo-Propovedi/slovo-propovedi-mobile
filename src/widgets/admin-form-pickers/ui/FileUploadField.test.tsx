import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { type AdminFileKind } from '../lib/fileKinds'
import { useAdminFiles } from '../lib/useAdminFiles'
import { useFileUpload } from '../lib/useFileUpload'
import { FileUploadField } from './FileUploadField'

jest.mock('../lib/useAdminFiles', () => ({ useAdminFiles: jest.fn() }))
jest.mock('../lib/useFileUpload', () => ({ useFileUpload: jest.fn() }))

const LIBRARY_LABEL = 'Выбрать из библиотеки'

const mockedUseAdminFiles = useAdminFiles as jest.MockedFunction<typeof useAdminFiles>
const mockedUseFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>

const renderField = (kind: AdminFileKind) =>
  renderWithProviders(<FileUploadField value='' kind={kind} label='Файл' onChange={jest.fn()} />)

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
    const { getByText, queryByText } = await renderField('audio')

    expect(queryByText(LIBRARY_LABEL)).toBeNull()
    expect(getByText('Загрузить аудио')).toBeTruthy()
  })

  test('hides the media library button for the text kind but keeps upload', async () => {
    const { getByText, queryByText } = await renderField('text')

    expect(queryByText(LIBRARY_LABEL)).toBeNull()
    expect(getByText('Загрузить файл')).toBeTruthy()
  })

  test('shows the media library button for the image kind', async () => {
    const { getByText } = await renderField('image')

    expect(getByText(LIBRARY_LABEL)).toBeTruthy()
    expect(getByText('Загрузить изображение')).toBeTruthy()
  })
})
