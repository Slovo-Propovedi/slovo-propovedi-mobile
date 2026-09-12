import { type Directory, File } from 'expo-file-system'
import { _resetInflightCacheForTesting, audioCacheService } from './AudioCacheService'
import { CacheCancelledError } from './CacheCancelledError'
import { PROGRESS_TICK_MIN_INTERVAL_MS } from './cacheDownloader'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'
import { inflightCache } from './inflightCache'

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public constructor(_dir: unknown, fileName: string) {
      this.name = fileName
      this.exists = mockFileState.exists
      this.uri = `file://cache/${fileName}`
      this.delete = jest.fn()
      this.rename = jest.fn()
      this.size = 1024
    }

    public static downloadFileAsync = jest.fn()
    public exists: boolean
    public uri: string
    public delete: jest.Mock
    public rename: jest.Mock
    public size: number
    public name: string
  },
}))

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue({ isConnected: true }) },
}))

// Skip real backoff delays between download retries — retries stay instant in tests
jest.mock('./downloadRetryPolicy', () => ({
  ...jest.requireActual('./downloadRetryPolicy'),
  sleepAbortable: jest.fn().mockResolvedValue(undefined),
}))

const mockFileState = { exists: false }

jest.mock('./getAudioCacheDirectory', () => ({
  getAudioCacheDirectory: jest.fn().mockReturnValue(mockCacheDir),
}))

const mockCacheDir = {
  create: jest.fn(),
  delete: jest.fn(),
  exists: true,
  list: jest.fn(),
} as unknown as Directory

const EXAMPLE_URL = 'http://example.com/a.mp3'

const mockedGetAudioCacheDirectory = jest.mocked(getAudioCacheDirectory)

describe('AudioCacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    _resetInflightCacheForTesting()
    mockFileState.exists = false
    mockCacheDir.exists = true
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([])
    mockedGetAudioCacheDirectory.mockReturnValue(mockCacheDir)
    ;(File.downloadFileAsync as jest.Mock).mockResolvedValue({
      uri: 'file://downloaded.mp3',
    })
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('getCachedUri', () => {
    test('returns null for empty string', async () => {
      const result = await audioCacheService.getCachedUri('')
      expect(result).toBeNull()
    })

    test('returns null when file does not exist', async () => {
      mockFileState.exists = false
      const result = await audioCacheService.getCachedUri(EXAMPLE_URL)
      expect(result).toBeNull()
    })

    test('returns file uri when file exists', async () => {
      mockFileState.exists = true
      const result = await audioCacheService.getCachedUri(EXAMPLE_URL)
      expect(result).toContain('file://cache/')
    })
  })

  describe('isCached', () => {
    test('returns false for empty string', async () => {
      const result = await audioCacheService.isCached('')
      expect(result).toBe(false)
    })

    test('returns false when file does not exist', async () => {
      mockFileState.exists = false
      const result = await audioCacheService.isCached(EXAMPLE_URL)
      expect(result).toBe(false)
    })

    test('returns true when file exists', async () => {
      mockFileState.exists = true
      const result = await audioCacheService.isCached(EXAMPLE_URL)
      expect(result).toBe(true)
    })
  })

  describe('cacheAudio', () => {
    test('throws for empty string', () => {
      expect(() => audioCacheService.cacheAudio('')).toThrow('audioUrl is required')
    })

    test('returns existing uri when already cached', async () => {
      mockFileState.exists = true
      const result = await audioCacheService.cacheAudio(EXAMPLE_URL)
      expect(result).toContain('file://cache/')
      expect(File.downloadFileAsync).not.toHaveBeenCalled()
    })

    test('downloads when not cached and calls onProgress', async () => {
      mockFileState.exists = false
      const onProgress = jest.fn()
      const result = await audioCacheService.cacheAudio(EXAMPLE_URL, onProgress)
      expect(File.downloadFileAsync).toHaveBeenCalled()
      expect(onProgress).toHaveBeenCalledWith(0)
      expect(onProgress).toHaveBeenCalledWith(1)
      expect(result).toContain('file://cache/')
    })

    describe('single-flight dedup', () => {
      test('second concurrent call returns same promise', async () => {
        mockFileState.exists = false
        let resolveDownload!: (value: unknown) => void
        ;(File.downloadFileAsync as jest.Mock).mockReturnValueOnce(
          new Promise(r => {
            resolveDownload = r
          }),
        )

        const p1 = audioCacheService.cacheAudio(EXAMPLE_URL)
        const p2 = audioCacheService.cacheAudio(EXAMPLE_URL)

        expect(p1).toBe(p2)

        resolveDownload({ uri: 'file://dl.mp3' })
        await expect(p1).resolves.toContain('file://cache/')
      })

      test('does not re-invoke download for duplicate URL', async () => {
        mockFileState.exists = false
        ;(File.downloadFileAsync as jest.Mock).mockReturnValue(new Promise(() => {}))

        audioCacheService.cacheAudio(EXAMPLE_URL)
        audioCacheService.cacheAudio(EXAMPLE_URL)

        expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
      })

      test('allows new download after previous completes', async () => {
        mockFileState.exists = false
        ;(File.downloadFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://dl.mp3' })

        await audioCacheService.cacheAudio(EXAMPLE_URL)
        ;(File.downloadFileAsync as jest.Mock).mockClear()
        ;(File.downloadFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://dl2.mp3' })

        await audioCacheService.cacheAudio(EXAMPLE_URL)
        expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
      })

      test('allows new download after previous fails', async () => {
        mockFileState.exists = false
        ;(File.downloadFileAsync as jest.Mock).mockRejectedValue(new Error('fail'))

        await expect(audioCacheService.cacheAudio(EXAMPLE_URL)).rejects.toThrow('fail')
        ;(File.downloadFileAsync as jest.Mock).mockClear()
        ;(File.downloadFileAsync as jest.Mock).mockResolvedValue({ uri: 'file://dl.mp3' })

        await audioCacheService.cacheAudio(EXAMPLE_URL)
        expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)
      })

      test('second caller onProgress receives fan-out ticks and retroactive seed', async () => {
        jest.useFakeTimers()
        mockFileState.exists = false
        let downloadOnProgress:
          ((data: { bytesWritten: number; totalBytes: number }) => void) | undefined
        let resolveDownload!: (value: unknown) => void
        ;(File.downloadFileAsync as jest.Mock).mockImplementation(
          (
            _url: string,
            _file: unknown,
            opts: { onProgress?: (data: { bytesWritten: number; totalBytes: number }) => void },
          ) => {
            downloadOnProgress = opts.onProgress
            return new Promise(r => {
              resolveDownload = r
            })
          },
        )

        const cb1 = jest.fn()
        audioCacheService.cacheAudio(EXAMPLE_URL, cb1)

        // Simulate download tick (via downloadToCache's throttled progress)
        downloadOnProgress?.({ bytesWritten: 400, totalBytes: 1000 })

        const cb2 = jest.fn()
        audioCacheService.cacheAudio(EXAMPLE_URL, cb2)

        // cb2 receives retroactive seed
        expect(cb2).toHaveBeenCalledWith(0.4)

        // Next tick fans out to both — after the throttle interval elapses
        jest.advanceTimersByTime(PROGRESS_TICK_MIN_INTERVAL_MS)
        downloadOnProgress?.({ bytesWritten: 800, totalBytes: 1000 })
        expect(cb1).toHaveBeenCalledWith(0.8)
        expect(cb2).toHaveBeenCalledWith(0.8)

        resolveDownload({ uri: 'file://dl.mp3' })
        await expect(audioCacheService.cacheAudio(EXAMPLE_URL, cb2)).resolves.toContain(
          'file://cache/',
        )
      })
    })

    test('starts a fresh download when the inflight entry is aborted (Bug B chokepoint)', async () => {
      mockFileState.exists = false
      // A dying inflight entry created through cacheAudio, then cancelled so it
      // is marked aborted but has not settled yet.
      ;(File.downloadFileAsync as jest.Mock).mockImplementation(
        (_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
          new Promise<string>((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => reject(new Error('Aborted')))
          }),
      )
      const dying = audioCacheService.cacheAudio(EXAMPLE_URL)
      audioCacheService.cancelAudioDownload(EXAMPLE_URL)
      expect(inflightCache.get(EXAMPLE_URL)?.aborted).toBe(true)

      // A fresh cacheAudio must NOT join the dying promise.
      let resolveFresh!: (value: unknown) => void
      ;(File.downloadFileAsync as jest.Mock).mockClear()
      ;(File.downloadFileAsync as jest.Mock).mockReturnValueOnce(
        new Promise(r => {
          resolveFresh = r
        }),
      )
      const fresh = audioCacheService.cacheAudio(EXAMPLE_URL)

      expect(fresh).not.toBe(dying)
      expect(File.downloadFileAsync).toHaveBeenCalledTimes(1)

      // Let the dying entry settle (reject) — its identity-guarded cleanup must
      // NOT delete the fresh entry from the inflight cache.
      await expect(dying).rejects.toBeInstanceOf(CacheCancelledError)
      expect(inflightCache.get(EXAMPLE_URL)).toBeDefined()

      resolveFresh({ uri: 'file://dl.mp3' })
      await expect(fresh).resolves.toContain('file://cache/')
    })
  })

  describe('cancelAudioDownload', () => {
    test('returns false when nothing is inflight', () => {
      expect(audioCacheService.cancelAudioDownload(EXAMPLE_URL)).toBe(false)
    })

    test('rejects the inflight promise for the creator and a joiner', async () => {
      mockFileState.exists = false
      ;(File.downloadFileAsync as jest.Mock).mockImplementation(
        (_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => reject(new Error('Aborted')))
          }),
      )

      const creatorPromise = audioCacheService.cacheAudio(EXAMPLE_URL)
      const joinerPromise = audioCacheService.cacheAudio(EXAMPLE_URL)

      expect(audioCacheService.cancelAudioDownload(EXAMPLE_URL)).toBe(true)

      await expect(creatorPromise).rejects.toBeInstanceOf(CacheCancelledError)
      await expect(joinerPromise).rejects.toBeInstanceOf(CacheCancelledError)
    })

    test('marks the inflight entry aborted so re-enqueue treats it as non-joinable (Bug B)', async () => {
      mockFileState.exists = false
      ;(File.downloadFileAsync as jest.Mock).mockImplementation(
        (_url: string, _file: unknown, opts: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            opts.signal.addEventListener('abort', () => reject(new Error('Aborted')))
          }),
      )

      audioCacheService.cacheAudio(EXAMPLE_URL)
      expect(audioCacheService.cancelAudioDownload(EXAMPLE_URL)).toBe(true)

      // Synchronously after cancel the dying entry is still present but marked
      // aborted — the queue's inflightIsJoinable then starts a fresh download.
      expect(inflightCache.get(EXAMPLE_URL)?.aborted).toBe(true)
    })
  })

  describe('clearCache', () => {
    test('deletes directory when it exists', async () => {
      mockCacheDir.exists = true
      await audioCacheService.clearCache()
      expect(mockCacheDir.delete).toHaveBeenCalled()
    })
  })

  describe('removeFromCache', () => {
    test('returns false for empty string', async () => {
      const result = await audioCacheService.removeFromCache('')
      expect(result).toBe(false)
    })

    test('returns true and deletes file when it exists', async () => {
      mockFileState.exists = true
      const result = await audioCacheService.removeFromCache(EXAMPLE_URL)
      expect(result).toBe(true)
    })

    test('returns false when file does not exist', async () => {
      mockFileState.exists = false
      const result = await audioCacheService.removeFromCache(EXAMPLE_URL)
      expect(result).toBe(false)
    })
  })

  describe('getCacheInfo', () => {
    test('excludes .mp3.part files from count and size', async () => {
      const mp3File = new File(mockCacheDir, 'abc.mp3')
      const partFile = new File(mockCacheDir, 'abc.mp3.part')
      ;(mockCacheDir.list as jest.Mock).mockReturnValue([mp3File, partFile])

      const result = await audioCacheService.getCacheInfo()

      expect(result).toEqual({ fileCount: 1, totalSize: 1024 })
    })

    test('counts only committed .mp3 files', async () => {
      const mp3File = new File(mockCacheDir, 'abc.mp3')
      const partFile = new File(mockCacheDir, 'def.mp3.part')
      ;(mockCacheDir.list as jest.Mock).mockReturnValue([mp3File, partFile])

      const result = await audioCacheService.getCacheInfo()

      expect(result.fileCount).toBe(1)
    })
  })

  describe('error handling', () => {
    test('getCachedUri returns null when getAudioCacheDirectory throws', async () => {
      mockedGetAudioCacheDirectory.mockImplementation(() => {
        throw new Error('dir error')
      })
      const result = await audioCacheService.getCachedUri(EXAMPLE_URL)
      expect(result).toBeNull()
    })

    test('cacheAudio rethrows on download error', async () => {
      mockFileState.exists = false
      ;(File.downloadFileAsync as jest.Mock).mockRejectedValue(new Error('download failed'))
      await expect(audioCacheService.cacheAudio(EXAMPLE_URL)).rejects.toThrow('download failed')
    })
  })
})
