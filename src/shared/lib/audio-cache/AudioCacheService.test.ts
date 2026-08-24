import { type Directory, File } from 'expo-file-system'
import { _resetInflightCacheForTesting, audioCacheService } from './AudioCacheService'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public constructor(_dir: unknown, name: string) {
      this.exists = mockFileState.exists
      this.uri = `file://cache/${name}`
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
  },
}))

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { fetch: jest.fn().mockResolvedValue({ isConnected: true }) },
}))

// Skip real backoff delays between download retries — retries stay instant in tests
jest.mock('./downloadRetryPolicy', () => ({
  ...jest.requireActual('./downloadRetryPolicy'),
  sleep: jest.fn().mockResolvedValue(undefined),
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

        // Next tick fans out to both
        downloadOnProgress?.({ bytesWritten: 800, totalBytes: 1000 })
        expect(cb1).toHaveBeenCalledWith(0.8)
        expect(cb2).toHaveBeenCalledWith(0.8)

        resolveDownload({ uri: 'file://dl.mp3' })
        await expect(audioCacheService.cacheAudio(EXAMPLE_URL, cb2)).resolves.toContain(
          'file://cache/',
        )
      })
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
