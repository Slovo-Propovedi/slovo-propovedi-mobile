import { type Directory, File } from 'expo-file-system'
import { audioCacheService } from './AudioCacheService'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public constructor(_dir: unknown, name: string) {
      this.exists = mockFileState.exists
      this.uri = `file://cache/${name}`
      this.delete = jest.fn()
      this.size = 1024
    }

    public static downloadFileAsync = jest.fn()
    public exists: boolean
    public uri: string
    public delete: jest.Mock
    public size: number
  },
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
    test('throws for empty string', async () => {
      await expect(audioCacheService.cacheAudio('')).rejects.toThrow('audioUrl is required')
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
      expect(result).toBe('file://downloaded.mp3')
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
