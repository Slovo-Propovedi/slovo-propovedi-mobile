import { act } from '@testing-library/react-native'
import { getFileKindConfig } from 'widgets/admin-form-pickers'
import { renderHookWithProviders } from 'shared/mocks'
import { useDroppedImageUpload } from './useDroppedImageUpload'

const IMAGE_NAME = 'cover.png'
const SECOND_IMAGE_NAME = 'second.png'
const ZIP_NAME = 'archive.zip'
const GIF_NAME = 'animation.gif'
const IMAGE_MIME = 'image/png'
const ZIP_MIME = 'application/zip'
const GIF_MIME = 'image/gif'

const mockShowToast = jest.fn()
const mockCreateObjectURL = jest.fn((file: File) => `blob:mock/${file.name}`)
const mockRevokeObjectURL = jest.fn()

jest.mock('shared/model', () => ({
  ...jest.requireActual('shared/model'),
  showToast: (...args: unknown[]) => mockShowToast(...args),
}))

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

const renderDrop = (upload: jest.Mock, isUploading = false) =>
  renderHookWithProviders(() => useDroppedImageUpload(upload, isUploading))

describe('useDroppedImageUpload', () => {
  beforeEach(() => {
    mockShowToast.mockClear()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
  })

  test('uploads the dropped image and revokes its object URL', async () => {
    const upload = jest.fn().mockResolvedValue(undefined)
    const { result } = await renderDrop(upload)

    await act(async () => {
      await result.current.handleFiles([droppedFile(IMAGE_NAME, IMAGE_MIME)])
    })

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toMatchObject({ mimeType: IMAGE_MIME, name: IMAGE_NAME })
    expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1)
  })

  test('uploads only the first image and silently ignores the other files', async () => {
    const upload = jest.fn().mockResolvedValue(undefined)
    const { result } = await renderDrop(upload)

    await act(async () => {
      await result.current.handleFiles([
        droppedFile(ZIP_NAME, ZIP_MIME),
        droppedFile(IMAGE_NAME, IMAGE_MIME),
        droppedFile(SECOND_IMAGE_NAME, IMAGE_MIME),
      ])
    })

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0][0]).toMatchObject({ name: IMAGE_NAME })
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  test('rejects a batch without an image and does not upload', async () => {
    const upload = jest.fn()
    const { result } = await renderDrop(upload)

    await act(async () => {
      await result.current.handleFiles([droppedFile(ZIP_NAME, ZIP_MIME)])
    })

    expect(upload).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.anything(),
      getFileKindConfig('image').rejectMessage,
    )
  })

  test('rejects an image with a disallowed extension', async () => {
    const upload = jest.fn()
    const { result } = await renderDrop(upload)

    await act(async () => {
      await result.current.handleFiles([droppedFile(GIF_NAME, GIF_MIME)])
    })

    expect(upload).not.toHaveBeenCalled()
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.anything(),
      getFileKindConfig('image').rejectMessage,
    )
  })

  test('ignores a drop while an upload is in progress', async () => {
    const upload = jest.fn()
    const { result } = await renderDrop(upload, true)

    await act(async () => {
      await result.current.handleFiles([droppedFile(IMAGE_NAME, IMAGE_MIME)])
    })

    expect(upload).not.toHaveBeenCalled()
    expect(mockShowToast).not.toHaveBeenCalled()
  })
})
