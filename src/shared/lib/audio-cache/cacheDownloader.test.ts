import NetInfo from '@react-native-community/netinfo'
import { type Directory, File } from 'expo-file-system'
import { CacheCancelledError } from './CacheCancelledError'
import {
  createThrottledProgress,
  downloadToCache,
  PROGRESS_TICK_MIN_INTERVAL_MS,
} from './cacheDownloader'
import {
  DOWNLOAD_STALL_TIMEOUT_MS,
  RETRY_BACKOFF_DELAYS_MS,
  sleepAbortable,
  STALL_CHECK_INTERVAL_MS,
} from './downloadRetryPolicy'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue({ isConnected: true }) },
}))

// Skip real backoff delays between download retries — retries stay instant in tests
jest.mock('./downloadRetryPolicy', () => ({
  ...jest.requireActual('./downloadRetryPolicy'),
  sleepAbortable: jest.fn().mockResolvedValue(undefined),
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
const mockedSleepAbortable = jest.mocked(sleepAbortable)

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
    ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true })
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

  test('deletes stale .part file before downloading', async () => {
    mockFileState.part = true
    const onProgress = jest.fn()

    const result = await downloadToCache(EXAMPLE_URL, onProgress)

    // A `.part` orphaned by a killed app must be dropped before the retry loop.
    expect(getPartFile()?.delete).toHaveBeenCalledTimes(1)
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
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

  test('cancels mid-attempt: one attempt, .part deleted, rejects with CacheCancelledError', async () => {
    mockFileState.part = true
    const controller = new AbortController()
    ;(File.downloadFileAsync as jest.Mock).mockImplementation(
      (_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          opts.signal.addEventListener('abort', () => reject(new Error('Aborted')))
        }),
    )

    const promise = downloadToCache(EXAMPLE_URL, undefined, controller.signal)
    controller.abort()

    await expect(promise).rejects.toBeInstanceOf(CacheCancelledError)
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
    expect(getPartFile()?.delete).toHaveBeenCalled()
  })

  test('rejects immediately with CacheCancelledError when already aborted before start', async () => {
    mockFileState.part = true
    const controller = new AbortController()
    controller.abort()

    await expect(downloadToCache(EXAMPLE_URL, undefined, controller.signal)).rejects.toBeInstanceOf(
      CacheCancelledError,
    )
    expect(File.downloadFileAsync).not.toHaveBeenCalled()
    expect(getPartFile()?.delete).toHaveBeenCalled()
  })

  test('stall guard still retries when an external signal is present but not aborted', async () => {
    jest.useFakeTimers()
    const controller = new AbortController()
    ;(File.downloadFileAsync as jest.Mock)
      .mockImplementationOnce((_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
        createStalledDownload(opts.signal),
      )
      .mockResolvedValueOnce({ uri: 'file://downloaded.mp3' })

    const promise = downloadToCache(EXAMPLE_URL, undefined, controller.signal)
    await jest.advanceTimersByTimeAsync(DOWNLOAD_STALL_TIMEOUT_MS + STALL_CHECK_INTERVAL_MS)

    await expect(promise).resolves.toContain('file://cache/')
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(2)
  })

  test('aborts mid-backoff-sleep: prompt CacheCancelledError, .part deleted, no retry', async () => {
    mockFileState.part = true
    const controller = new AbortController()
    ;(File.downloadFileAsync as jest.Mock).mockRejectedValueOnce(new Error('network lost'))

    // sleepAbortable resolves only when abort fires — no timer needed.
    mockedSleepAbortable.mockImplementation(
      (_ms: number, signal?: AbortSignal) =>
        new Promise<void>(resolve => {
          if (signal?.aborted) return resolve()
          signal?.addEventListener('abort', () => resolve(), { once: true })
        }),
    )

    const promise = downloadToCache(EXAMPLE_URL, undefined, controller.signal)
    // Flush: first attempt fails → waitForOnline resolves → sleepAbortable blocks.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockedSleepAbortable).toHaveBeenCalled()

    controller.abort()
    await expect(promise).rejects.toBeInstanceOf(CacheCancelledError)
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
    expect(getPartFile()?.delete).toHaveBeenCalled()
  })

  test('aborts while waitForOnline is waiting: prompt CacheCancelledError', async () => {
    jest.useFakeTimers()
    mockFileState.part = true
    const controller = new AbortController()
    ;(File.downloadFileAsync as jest.Mock).mockRejectedValueOnce(new Error('network lost'))
    ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false })

    const promise = downloadToCache(EXAMPLE_URL, undefined, controller.signal)
    // Attach the rejection assertion up-front: the promise rejects during timer advancement
    // when the poll interval fires and waitForOnline re-checks the aborted signal.
    const rejectionAssertion = expect(promise).rejects.toBeInstanceOf(CacheCancelledError)

    // First attempt fails; waitForOnline starts polling (offline) and suspends at sleep(1000).
    await jest.advanceTimersByTimeAsync(0)
    // Abort during the poll sleep.
    controller.abort()
    // Advance past the poll interval so waitForOnline re-checks the signal → false →
    // sleepAbortable resolves → throwIfCancelled throws CacheCancelledError.
    await jest.advanceTimersByTimeAsync(60_000)

    await rejectionAssertion
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
    expect(getPartFile()?.delete).toHaveBeenCalled()
  })

  test('non-aborted backoff waits the full delay before retrying', async () => {
    jest.useFakeTimers()
    mockFileState.part = true
    ;(File.downloadFileAsync as jest.Mock)
      .mockRejectedValueOnce(new Error('network lost'))
      .mockResolvedValueOnce({ uri: 'file://downloaded.mp3' })

    mockedSleepAbortable.mockImplementation(
      (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)),
    )

    const promise = downloadToCache(EXAMPLE_URL)
    // Flush microtasks: first attempt fails → waitForOnline resolves → sleepAbortable called.
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockedSleepAbortable).toHaveBeenCalledWith(RETRY_BACKOFF_DELAYS_MS[0], undefined)

    // Before the backoff elapses, no second attempt.
    await jest.advanceTimersByTimeAsync(RETRY_BACKOFF_DELAYS_MS[0] - 1)
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)

    // After the full delay, the retry proceeds.
    await jest.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toContain('file://cache/')
    expect(File.downloadFileAsync).toHaveBeenCalledTimes(2)
  })

  describe('createThrottledProgress', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('emits the first qualifying tick immediately', () => {
      const onProgress = jest.fn()
      const throttled = createThrottledProgress(onProgress)

      throttled({ bytesWritten: 500, totalBytes: 1000 })

      expect(onProgress).toHaveBeenCalledTimes(1)
      expect(onProgress).toHaveBeenCalledWith(0.5)
    })

    test('suppresses ticks below 1% delta even after the interval elapses', () => {
      const onProgress = jest.fn()
      const throttled = createThrottledProgress(onProgress)

      throttled({ bytesWritten: 500, totalBytes: 1000 })
      jest.advanceTimersByTime(PROGRESS_TICK_MIN_INTERVAL_MS)

      throttled({ bytesWritten: 505, totalBytes: 1000 })

      expect(onProgress).toHaveBeenCalledTimes(1)
    })

    test('suppresses ticks within the interval even when the delta qualifies', () => {
      const onProgress = jest.fn()
      const throttled = createThrottledProgress(onProgress)

      throttled({ bytesWritten: 500, totalBytes: 1000 })
      throttled({ bytesWritten: 600, totalBytes: 1000 })

      expect(onProgress).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(PROGRESS_TICK_MIN_INTERVAL_MS)
      throttled({ bytesWritten: 700, totalBytes: 1000 })

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenLastCalledWith(0.7)
    })

    test('always emits the final fraction === 1 tick regardless of delta and interval', () => {
      const onProgress = jest.fn()
      const throttled = createThrottledProgress(onProgress)

      throttled({ bytesWritten: 500, totalBytes: 1000 })
      throttled({ bytesWritten: 1000, totalBytes: 1000 })

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenLastCalledWith(1)
    })

    test('ignores non-positive totalBytes', () => {
      const onProgress = jest.fn()
      const throttled = createThrottledProgress(onProgress)

      throttled({ bytesWritten: 500, totalBytes: 0 })
      throttled({ bytesWritten: 500, totalBytes: -1 })

      expect(onProgress).not.toHaveBeenCalled()
    })

    test('direct 0/1 progress calls bypass the throttle', async () => {
      const onProgress = jest.fn()
      ;(File.downloadFileAsync as jest.Mock).mockImplementation(
        (
          _url: string,
          _file: unknown,
          opts: { onProgress?: (data: { bytesWritten: number; totalBytes: number }) => void },
        ) => {
          opts.onProgress?.({ bytesWritten: 100, totalBytes: 1000 })
          opts.onProgress?.({ bytesWritten: 200, totalBytes: 1000 })
          opts.onProgress?.({ bytesWritten: 300, totalBytes: 1000 })
          return Promise.resolve({ uri: 'file://downloaded.mp3' })
        },
      )

      const result = await downloadToCache(EXAMPLE_URL, onProgress)

      expect(onProgress).toHaveBeenCalledWith(0)
      expect(onProgress).toHaveBeenCalledWith(1)
      expect(onProgress).not.toHaveBeenCalledWith(0.2)
      expect(onProgress).not.toHaveBeenCalledWith(0.3)
      expect(result).toContain('file://cache/')
    })
  })
})

const MAX_ATTEMPTS_FOR_TEST = 3
