import { type Directory } from 'expo-file-system'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'
import { getPartialFileUri } from './partialFile'

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public constructor(_dir: unknown, fileName: string) {
      this.name = fileName
      this.uri = `file://cache/${fileName}`
    }

    public exists = mockFileState.exists
    public size = mockFileState.size
    public uri: string
    public name: string
  },
}))

jest.mock('./getAudioCacheDirectory', () => ({
  getAudioCacheDirectory: jest.fn(),
}))

jest.mock('./cacheDownloader', () => ({
  getUrlHash: jest.fn().mockReturnValue('abc'),
  PART_SUFFIX: '.cache.mp3',
}))

const mockFileState = { exists: false, size: 0 }

const mockCacheDir = {} as unknown as Directory

const mockedGetAudioCacheDirectory = jest.mocked(getAudioCacheDirectory)

const EXAMPLE_URL = 'https://example.com/a.mp3'

describe('getPartialFileUri', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFileState.exists = false
    mockFileState.size = 0
    mockedGetAudioCacheDirectory.mockReturnValue(mockCacheDir)
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns uri when file exists with size > 0', async () => {
    mockFileState.exists = true
    mockFileState.size = 1024

    const result = await getPartialFileUri(EXAMPLE_URL)

    expect(result).toBe('file://cache/abc.cache.mp3')
  })

  test('returns null when file is missing', async () => {
    mockFileState.exists = false
    mockFileState.size = 1024

    const result = await getPartialFileUri(EXAMPLE_URL)

    expect(result).toBeNull()
  })

  test('returns null when size is 0', async () => {
    mockFileState.exists = true
    mockFileState.size = 0

    const result = await getPartialFileUri(EXAMPLE_URL)

    expect(result).toBeNull()
  })

  test('returns null when File constructor throws (web safety)', async () => {
    mockedGetAudioCacheDirectory.mockImplementation(() => {
      throw new Error('file system is not available on web')
    })

    const result = await getPartialFileUri(EXAMPLE_URL)

    expect(result).toBeNull()
  })

  test('returns null for empty url', async () => {
    const result = await getPartialFileUri('')

    expect(result).toBeNull()
  })
})
