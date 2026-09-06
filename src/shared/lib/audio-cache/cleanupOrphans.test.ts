import { type Directory, File } from 'expo-file-system'
import { cleanupOrphanedDownloads } from './cleanupOrphans'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'

jest.mock('expo-file-system', () => ({
  File: class MockFile {
    public constructor(_dir: unknown, fileName: string) {
      this.name = fileName
      this.delete = jest.fn()
    }

    public delete: jest.Mock
    public name: string
  },
}))

jest.mock('./getAudioCacheDirectory', () => ({
  getAudioCacheDirectory: jest.fn(),
}))

const mockedGetAudioCacheDirectory = jest.mocked(getAudioCacheDirectory)

const PART_FILE_NAME = 'abc.mp3.part'

const mockCacheDir = {
  exists: true,
  list: jest.fn(),
} as unknown as Directory

describe('cleanupOrphanedDownloads (native)', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockCacheDir.exists = true
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([])
    mockedGetAudioCacheDirectory.mockReturnValue(mockCacheDir)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('deletes .mp3.part files', async () => {
    const partFile = new File(mockCacheDir, PART_FILE_NAME)
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([partFile])

    await cleanupOrphanedDownloads()

    expect(partFile.delete).toHaveBeenCalledTimes(1)
  })

  test('keeps .mp3 files', async () => {
    const mp3File = new File(mockCacheDir, 'abc.mp3')
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([mp3File])

    await cleanupOrphanedDownloads()

    expect(mp3File.delete).not.toHaveBeenCalled()
  })

  test('no-ops when cache directory is missing', async () => {
    mockCacheDir.exists = false

    await cleanupOrphanedDownloads()

    expect(mockCacheDir.list).not.toHaveBeenCalled()
  })

  test('never throws when listing the directory fails', async () => {
    ;(mockCacheDir.list as jest.Mock).mockImplementation(() => {
      throw new Error('listing failed')
    })

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('never throws when a delete fails', async () => {
    const partFile = new File(mockCacheDir, PART_FILE_NAME)
    ;(partFile.delete as jest.Mock).mockImplementation(() => {
      throw new Error('delete failed')
    })
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([partFile])

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  test('a failing delete does not stop the sweep of remaining part files', async () => {
    const failingPart = new File(mockCacheDir, PART_FILE_NAME)
    ;(failingPart.delete as jest.Mock).mockImplementation(() => {
      throw new Error('delete failed')
    })
    const okPart = new File(mockCacheDir, 'def.mp3.part')
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([failingPart, okPart])

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()

    expect(failingPart.delete).toHaveBeenCalledTimes(1)
    expect(okPart.delete).toHaveBeenCalledTimes(1)
  })
})
