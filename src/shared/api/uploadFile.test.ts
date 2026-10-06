import { Platform } from 'react-native'
import { filesApi } from './generated'
import { uploadSermonFile } from './uploadFile'

const mockUploadPart = jest.fn()
const mockPost = jest.fn()

jest.mock('./generated', () => ({ filesApi: { getFiles: jest.fn() } }))
jest.mock('./axiosInstance', () => ({
  axiosInstance: { post: (...args: unknown[]) => mockPost(...args) },
}))

const FILE_NAME = 'sermon.mp3'
const FILE_URL = 'https://cdn.test/sermon.mp3'
const MIME_TYPE = 'audio/mpeg'
const ASSET = { mimeType: MIME_TYPE, name: FILE_NAME, uri: 'file:///tmp/sermon.mp3' }

const ORIGINAL_PLATFORM = Platform.OS
const ORIGINAL_FORM_DATA = globalThis.FormData

class CapturingFormData extends FormData {
  public append(name: string, value: unknown): void {
    this.parts.push([name, value])
  }

  public readonly parts: Array<[string, unknown]> = []
}

const mockedGetFiles = filesApi.getFiles as jest.Mock

describe('uploadSermonFile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetFiles.mockReturnValue({ appControllerUploadFile: mockUploadPart })
    mockUploadPart.mockResolvedValue({ fileName: FILE_NAME, fileUrl: FILE_URL })
    mockPost.mockResolvedValue({ data: { fileName: FILE_NAME, fileUrl: FILE_URL } })
  })

  afterEach(() => {
    Platform.OS = ORIGINAL_PLATFORM
    globalThis.FormData = ORIGINAL_FORM_DATA
  })

  test('web: reads the blob: URI and uploads a browser File with the picked name', async () => {
    Platform.OS = 'web'
    const blob = new Blob(['audio'], { type: MIME_TYPE })
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(blob))

    await uploadSermonFile({ ...ASSET, uri: 'blob:http://localhost/abc' })

    expect(fetchSpy).toHaveBeenCalledWith('blob:http://localhost/abc')
    const [body] = mockUploadPart.mock.calls[0]
    expect(body.file).toBeInstanceOf(File)
    expect(body.file.name).toBe(FILE_NAME)
    expect(body.file.type).toBe(MIME_TYPE)
  })

  test('native: sends an explicit { uri, name, type } multipart part', async () => {
    Platform.OS = 'ios'
    globalThis.FormData = CapturingFormData

    await uploadSermonFile(ASSET)

    expect(mockPost).toHaveBeenCalledTimes(1)
    const [url, data, config] = mockPost.mock.calls[0]
    expect(url).toBe('/files')
    expect((data as CapturingFormData).parts).toEqual([
      ['file', { name: ASSET.name, type: MIME_TYPE, uri: ASSET.uri }],
    ])
    expect(config).toMatchObject({ timeout: 0 })
  })

  test('native: falls back to application/octet-stream without a mime type', async () => {
    Platform.OS = 'android'
    globalThis.FormData = CapturingFormData

    await uploadSermonFile({ name: FILE_NAME, uri: ASSET.uri })

    const [, data] = mockPost.mock.calls[0]
    expect((data as CapturingFormData).parts).toEqual([
      ['file', { name: FILE_NAME, type: 'application/octet-stream', uri: ASSET.uri }],
    ])
  })
})
