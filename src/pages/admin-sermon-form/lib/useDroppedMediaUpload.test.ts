import { act } from '@testing-library/react-native'
import { getFileKindConfig } from 'widgets/admin-form-pickers'
import { renderHookWithProviders } from 'shared/mocks'
import { useDroppedMediaUpload } from './useDroppedMediaUpload'

const COVER_NAME = 'cover.png'
const AUDIO_NAME = 'sermon.mp3'
const TEXT_NAME = 'notes.txt'
const FIRST_IMAGE_NAME = 'first.png'
const SECOND_IMAGE_NAME = 'second.png'
const IMAGE_MIME = 'image/png'
const AUDIO_MIME = 'audio/mpeg'
const TEXT_MIME = 'text/plain'

const mockUploadSermonFile = jest.fn()
const mockCreateObjectURL = jest.fn((file: File) => `blob:mock/${file.name}`)
const mockRevokeObjectURL = jest.fn()

jest.mock('shared/api', () => ({
  uploadSermonFile: (...args: unknown[]) => mockUploadSermonFile(...args),
}))

jest.mock('widgets/admin-form-pickers', () => {
  const fileKinds = jest.requireActual('widgets/admin-form-pickers/lib/fileKinds')

  return {
    detectFileKind: fileKinds.detectFileKind,
    getFileKindConfig: fileKinds.getFileKindConfig,
    isAllowedExtension: fileKinds.isAllowedExtension,
  }
})

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: mockCreateObjectURL,
    writable: true,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: mockRevokeObjectURL,
    writable: true,
  })
})

const droppedFile = (name: string, type: string) => ({ name, size: 1, type }) as unknown as File

const fileUrl = (name: string) => `https://cdn.test/${name}`

const renderDrop = (onChange = jest.fn()) =>
  renderHookWithProviders(() => useDroppedMediaUpload(onChange))

describe('useDroppedMediaUpload', () => {
  beforeEach(() => {
    mockUploadSermonFile.mockReset()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
  })

  test('uploads image, audio and text from a batch and writes each to its field', async () => {
    mockUploadSermonFile
      .mockResolvedValueOnce({ fileName: COVER_NAME, fileUrl: fileUrl(COVER_NAME) })
      .mockResolvedValueOnce({ fileName: AUDIO_NAME, fileUrl: fileUrl(AUDIO_NAME) })
      .mockResolvedValueOnce({ fileName: TEXT_NAME, fileUrl: fileUrl(TEXT_NAME) })

    const onChange = jest.fn()
    const { result } = await renderDrop(onChange)

    await act(async () => {
      await result.current.handleFiles([
        droppedFile(TEXT_NAME, TEXT_MIME),
        droppedFile(AUDIO_NAME, AUDIO_MIME),
        droppedFile(COVER_NAME, IMAGE_MIME),
      ])
    })

    expect(mockUploadSermonFile).toHaveBeenCalledTimes(3)
    expect(mockUploadSermonFile.mock.calls[0][0]).toMatchObject({ name: COVER_NAME })
    expect(onChange).toHaveBeenCalledWith('artwork', fileUrl(COVER_NAME))
    expect(onChange).toHaveBeenCalledWith('audioUrl', fileUrl(AUDIO_NAME))
    expect(onChange).toHaveBeenCalledWith('textFileUrl', fileUrl(TEXT_NAME))
    expect(result.current.status.isUploading).toBe(false)
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(3)
  })

  test('ignores unknown files without an error', async () => {
    const onChange = jest.fn()
    const { result } = await renderDrop(onChange)

    await act(async () => {
      await result.current.handleFiles([droppedFile('archive.zip', 'application/zip')])
    })

    expect(mockUploadSermonFile).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.status.error).toBeNull()
  })

  test('reports the kind rejection when an allowed kind has a wrong extension', async () => {
    const { result } = await renderDrop()

    await act(async () => {
      await result.current.handleFiles([droppedFile('animation.gif', 'image/gif')])
    })

    expect(mockUploadSermonFile).not.toHaveBeenCalled()
    expect(result.current.status.error).toBe(getFileKindConfig('image').rejectMessage)
  })

  test('keeps only the first file of the same kind', async () => {
    mockUploadSermonFile.mockResolvedValue({
      fileName: FIRST_IMAGE_NAME,
      fileUrl: fileUrl(FIRST_IMAGE_NAME),
    })

    const onChange = jest.fn()
    const { result } = await renderDrop(onChange)

    await act(async () => {
      await result.current.handleFiles([
        droppedFile(FIRST_IMAGE_NAME, IMAGE_MIME),
        droppedFile(SECOND_IMAGE_NAME, IMAGE_MIME),
      ])
    })

    expect(mockUploadSermonFile).toHaveBeenCalledTimes(1)
    expect(mockUploadSermonFile.mock.calls[0][0]).toMatchObject({ name: FIRST_IMAGE_NAME })
    expect(onChange).toHaveBeenCalledWith('artwork', fileUrl(FIRST_IMAGE_NAME))
  })

  test('sets an error when an upload fails', async () => {
    mockUploadSermonFile.mockRejectedValue(new Error('Сеть недоступна'))

    const onChange = jest.fn()
    const { result } = await renderDrop(onChange)

    await act(async () => {
      await result.current.handleFiles([droppedFile(COVER_NAME, IMAGE_MIME)])
    })

    expect(onChange).not.toHaveBeenCalled()
    expect(result.current.status.error).toBe('Сеть недоступна')
    expect(result.current.status.isUploading).toBe(false)
  })
})
