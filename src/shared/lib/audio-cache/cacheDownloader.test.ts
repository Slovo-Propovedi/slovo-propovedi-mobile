import { type Directory, File } from 'expo-file-system'
import { downloadToCache } from './cacheDownloader'
import { DOWNLOAD_STALL_TIMEOUT_MS, STALL_CHECK_INTERVAL_MS } from './downloadRetryPolicy'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue({ isConnected: true }) },
}))

// Skip real backoff delays between download retries — retries stay instant in tests
jest.mock('./downloadRetryPolicy', () => ({
  ...jest.requireActual('./downloadRetryPolicy'),
  sleep: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public constructor(_dir: unknown, name: string) {
      this.uri = `file://cache/${name}`
      mockFileInstances.push(this)
    }

    public static downloadFileAsync = jest.fn()
    public delete = jest.fn()
    public rename = jest.fn()
    public size = 1024
    public uri: string

    public get exists(): boolean {
      return this.uri.includes('.part') ? mockFileState.part : mockFileState.cached
    }
  },
}))

jest.mock('./getAudioCacheDirectory', () => ({
  getAudioCacheDirectory: jest.fn().mockReturnValue({}),
}))

const mockFileState = { cached: false, part: false }
const mockFileInstances: Array<{ delete: jest.Mock; rename: jest.Mock; uri: string }> = []

const mockCacheDir = {
  create: jest.fn(),
  exists: true,
} as unknown as Directory

const mockedGetAudioCacheDirectory = jest.mocked(getAudioCacheDirectory)

const EXAMPLE_URL = 'http://example.com/a.mp3'

// Download that never completes and rejects when the stall guard aborts it.
// The extra no-op catch marks the rejection as handled for fake-timer ticks.
const createStalledDownload = (signal: AbortSignal): Promise<unknown> => {
  const stalled = new Promise<unknown>((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Aborted')))
  })
  stalled.catch(() => {})
  return stalled
}

const getPartFile = () => mockFileInstances.find(file => file.uri.includes('.part'))

describe('downloadToCache', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockFileInstances.length = 0
    mockFileState.cached = false
    mockFileState.part = false
    mockCacheDir.exists = true
    mockedGetAudioCacheDirectory.mockReturnValue(mockCacheDir)
    ;(File.downloadFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://downloaded.mp3' })
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    consoleErrorSpy.mockRestore()
  })

  test('returns cached uri without downloading when file already cached', async () => {
    mockFileState.cached = true

    const result = await downloadToCache(EXAMPLE_URL)

    expect(result).toContain('file://cache/')
    expect(File.downloadFileAsync).not.toHaveBeenCalled()
  })

  test('downloads on first attempt without retries', async () => {
    const onProgress = jest.fn()

    const result = await downloadToCache(EXAMPLE_URL, onProgress)

    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenCalledWith(0)
    expect(onProgress).toHaveBeenCalledWith(1)
    expect(getPartFile()?.rename).toHaveBeenCalled()
    expect(getPartFile()?.delete).not.toHaveBeenCalled()
    expect(result).toContain('file://cache/')
  })

  test('succeeds on third attempt after two failures', async () => {
    const onProgress = jest.fn()
    ;(File.downloadFileAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('network lost'))
      .mockRejectedValueOnce(new Error('network lost'))
      .mockResolvedValueOnce({ uri: 'file://downloaded.mp3' })

    const result = await downloadToCache(EXAMPLE_URL, onProgress)

    expect(File.downloadFileAsync).toHaveBeenCalledTimes(3)
    expect(onProgress.mock.calls.filter(([progress]) => progress === 0)).toHaveLength(3)
    expect(getPartFile()?.delete).not.toHaveBeenCalled()
    expect(result).toContain('file://cache/')
  })

  test('throws last error and deletes .part after all attempts exhausted', async () => {
    mockFileState.part = true
    ;(File.downloadFileAsync as jest.Mock).mockRejectedValue(new Error('download failed'))

    await expect(downloadToCache(EXAMPLE_URL)).rejects.toThrow('download failed')

    expect(File.downloadFileAsync).toHaveBeenCalledTimes(3)
    expect(getPartFile()?.delete).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('aborts stalled attempt via stall guard and retries', async () => {
    jest.useFakeTimers()
    ;(File.downloadFileAsync as jest.Mock)
      .mockImplementationOnce((_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
        createStalledDownload(opts.signal),
      )
      .mockResolvedValueOnce({ uri: 'file://downloaded.mp3' })

    const promise = downloadToCache(EXAMPLE_URL)
    await jest.advanceTimersByTimeAsync(DOWNLOAD_STALL_TIMEOUT_MS + STALL_CHECK_INTERVAL_MS)

    await expect(promise).resolves.toContain('file://cache/')
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(2)
  })

  test('throws last error when every attempt stalls', async () => {
    jest.useFakeTimers()
    mockFileState.part = true
    ;(File.downloadFileAsync as jest.Mock).mockImplementation(
      (_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
        createStalledDownload(opts.signal),
    )

    const promise = downloadToCache(EXAMPLE_URL)
    // Attach the rejection assertion up-front: the promise rejects during timer advancement
    const rejectionAssertion = expect(promise).rejects.toThrow('Aborted')
    const maxStallMs = DOWNLOAD_STALL_TIMEOUT_MS + STALL_CHECK_INTERVAL_MS
    await jest.advanceTimersByTimeAsync(maxStallMs * MAX_ATTEMPTS_FOR_TEST)

    await rejectionAssertion
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(3)
    expect(getPartFile()?.delete).toHaveBeenCalled()
  })
})

const MAX_ATTEMPTS_FOR_TEST = 3
