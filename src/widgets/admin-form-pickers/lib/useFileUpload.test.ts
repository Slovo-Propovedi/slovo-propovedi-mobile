import { act } from '@testing-library/react-native'
import { renderHookWithProviders } from 'shared/mocks'
import { type AdminFileKind, getFileKindConfig } from './fileKinds'
import { useFileUpload } from './useFileUpload'

const REJECTED_NAME = 'cover.gif'
const IMAGE_NAME = 'cover.png'
const UPLOAD_ERROR_MESSAGE = 'Сеть недоступна'

const mockGetDocumentAsync = jest.fn()
const mockUploadSermonFile = jest.fn()
const mockShowToast = jest.fn()

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}))

jest.mock('shared/api', () => ({
  uploadSermonFile: (...args: unknown[]) => mockUploadSermonFile(...args),
}))

jest.mock('shared/model', () => ({
  ...jest.requireActual('shared/model'),
  showToast: (...args: unknown[]) => mockShowToast(...args),
}))

const pickedAsset = (name: string) => ({ name, uri: `file://${name}` })

const renderUpload = (kind: AdminFileKind, onUploaded = jest.fn()) =>
  renderHookWithProviders(() => useFileUpload(kind, onUploaded))

describe('useFileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('toasts and keeps the inline error when the picked extension is rejected', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      assets: [pickedAsset(REJECTED_NAME)],
      canceled: false,
    })

    const { result } = await renderUpload('image')
    await act(async () => {
      await result.current.pickAndUpload()
    })

    expect(mockUploadSermonFile).not.toHaveBeenCalled()
    expect(result.current.error).toBe(getFileKindConfig('image').rejectMessage)
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.anything(),
      getFileKindConfig('image').rejectMessage,
    )
  })

  test('does nothing when the picker is canceled', async () => {
    mockGetDocumentAsync.mockResolvedValue({ assets: [], canceled: true })

    const { result } = await renderUpload('image')
    await act(async () => {
      await result.current.pickAndUpload()
    })

    expect(result.current.error).toBeNull()
    expect(mockShowToast).not.toHaveBeenCalled()
  })

  test('toasts and keeps the inline error when the upload fails', async () => {
    mockGetDocumentAsync.mockResolvedValue({ assets: [pickedAsset(IMAGE_NAME)], canceled: false })
    mockUploadSermonFile.mockRejectedValue(new Error(UPLOAD_ERROR_MESSAGE))

    const onUploaded = jest.fn()
    const { result } = await renderUpload('image', onUploaded)
    await act(async () => {
      await result.current.pickAndUpload()
    })

    expect(onUploaded).not.toHaveBeenCalled()
    expect(result.current.error).toBe(UPLOAD_ERROR_MESSAGE)
    expect(mockShowToast).toHaveBeenCalledWith(expect.anything(), UPLOAD_ERROR_MESSAGE)
  })
})
