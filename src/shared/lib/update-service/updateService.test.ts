import { File } from 'expo-file-system'
import { Platform } from 'react-native'
import { downloadUpdateZip } from './updateService'

jest.mock('expo-file-system', () => {
  class MockFile {
    public constructor(_parent: unknown, name: string) {
      this.uri = `file:///cache/updates/${name}`
      mockFileInstances.push(this)
    }

    public static createDownloadTask = jest.fn()
    public delete = jest.fn(() => {
      if (mockFileState.deleteThrows) throw new Error('delete failed')
    })
    public uri: string

    public get exists(): boolean {
      return mockFileState.zipExists || mockFileState.downloadStarted
    }
  }

  class MockDirectory {
    public constructor(_parent: unknown, _name: string) {}

    public create = jest.fn()
    public exists = true
  }

  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { cache: 'file:///cache' },
  }
})

jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn(),
}))

jest.mock('react-native-zip-archive', () => ({
  listContents: jest.fn(),
  unzip: jest.fn(),
}))

const mockFileState = { deleteThrows: false, downloadStarted: false, zipExists: false }
const mockFileInstances: Array<{ delete: jest.Mock; uri: string }> = []

const mockedCreateDownloadTask = File.createDownloadTask as jest.Mock

let capturedSignal: AbortSignal | undefined

const EXAMPLE_URL = 'https://example.com/slovo-propovedi-update.zip'
const DOWNLOADED_URI = 'file:///cache/updates/slovo-propovedi-update.zip'
const TIMEOUT_MS = 50
const TIMEOUT_ERROR_MESSAGE = 'Update download timed out after 0.05s'

const mockDownloadTask = (downloadAsync: jest.Mock): void => {
  mockedCreateDownloadTask.mockImplementation((_url, _destination, options) => {
    mockFileState.downloadStarted = true
    capturedSignal = options?.signal
    return { downloadAsync }
  })
}

const getZipFile = () =>
  mockFileInstances.find(file => file.uri.includes('slovo-propovedi-update.zip'))

describe('downloadUpdateZip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFileInstances.length = 0
    mockFileState.deleteThrows = false
    mockFileState.downloadStarted = false
    mockFileState.zipExists = false
    capturedSignal = undefined
    jest.replaceProperty(Platform, 'OS', 'android')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('downloads the zip and returns its uri', async () => {
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)

    const uri = await downloadUpdateZip(EXAMPLE_URL)

    expect(uri).toBe(DOWNLOADED_URI)
    expect(mockedCreateDownloadTask).toHaveBeenCalledWith(
      EXAMPLE_URL,
      expect.any(File),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  test('deletes a stale zip before downloading', async () => {
    mockFileState.zipExists = true
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)

    await downloadUpdateZip(EXAMPLE_URL)

    expect(getZipFile()?.delete).toHaveBeenCalledTimes(1)
  })

  test('rejects with a timeout error when the download hangs', async () => {
    const downloadAsync = jest.fn().mockReturnValue(new Promise(() => {}))
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, TIMEOUT_MS)).rejects.toThrow(
      TIMEOUT_ERROR_MESSAGE,
    )
    expect(capturedSignal?.aborted).toBe(true)
  })

  test('deletes the partial zip file when the download times out', async () => {
    const downloadAsync = jest.fn().mockReturnValue(new Promise(() => {}))
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, TIMEOUT_MS)).rejects.toThrow(
      TIMEOUT_ERROR_MESSAGE,
    )

    expect(getZipFile()?.delete).toHaveBeenCalledTimes(1)
  })

  test('keeps partial-file cleanup best-effort when delete throws', async () => {
    mockFileState.deleteThrows = true
    const downloadAsync = jest.fn().mockReturnValue(new Promise(() => {}))
    mockDownloadTask(downloadAsync)
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(downloadUpdateZip(EXAMPLE_URL, undefined, TIMEOUT_MS)).rejects.toThrow(
      TIMEOUT_ERROR_MESSAGE,
    )
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  test('propagates non-timeout download errors unchanged', async () => {
    const downloadAsync = jest.fn().mockRejectedValue(new Error('network down'))
    mockDownloadTask(downloadAsync)

    await expect(downloadUpdateZip(EXAMPLE_URL)).rejects.toThrow('network down')
    expect(getZipFile()?.delete).toHaveBeenCalledTimes(1)
  })

  test('reports download progress through the callback', async () => {
    const downloadAsync = jest.fn().mockResolvedValue({ uri: DOWNLOADED_URI })
    mockDownloadTask(downloadAsync)
    const onProgress = jest.fn()

    await downloadUpdateZip(EXAMPLE_URL, onProgress)

    const options = mockedCreateDownloadTask.mock.calls[0][2]
    options?.onProgress?.({ bytesWritten: 50, totalBytes: 100 })
    expect(onProgress).toHaveBeenCalledWith(50)
  })
})
