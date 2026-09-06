import { cleanupOrphanedDownloads } from './cleanupOrphans.web'
import { deleteAudioEntry } from './webCacheApi'
import { clearActiveDownloads, getActiveDownloads } from './webDownloadJournal'

jest.mock('./webCacheApi', () => ({
  deleteAudioEntry: jest.fn(),
}))

jest.mock('./webDownloadJournal', () => ({
  clearActiveDownloads: jest.fn(),
  getActiveDownloads: jest.fn(),
}))

const mockedGetActiveDownloads = jest.mocked(getActiveDownloads)
const mockedClearActiveDownloads = jest.mocked(clearActiveDownloads)
const mockedDeleteAudioEntry = jest.mocked(deleteAudioEntry)

describe('cleanupOrphanedDownloads (web)', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetActiveDownloads.mockResolvedValue([])
    mockedDeleteAudioEntry.mockResolvedValue(true)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('does not touch caches when journal is empty', async () => {
    await cleanupOrphanedDownloads()

    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
    expect(mockedClearActiveDownloads).not.toHaveBeenCalled()
  })

  test('deletes each journaled url and clears the journal', async () => {
    mockedGetActiveDownloads.mockResolvedValue([
      'https://cdn.example.com/a.mp3',
      'https://cdn.example.com/b.mp3',
    ])

    await cleanupOrphanedDownloads()

    expect(mockedDeleteAudioEntry).toHaveBeenCalledWith('https://cdn.example.com/a.mp3')
    expect(mockedDeleteAudioEntry).toHaveBeenCalledWith('https://cdn.example.com/b.mp3')
    expect(mockedClearActiveDownloads).toHaveBeenCalledTimes(1)
  })

  test('continues past a failed delete and never throws', async () => {
    mockedGetActiveDownloads.mockResolvedValue([
      'https://cdn.example.com/a.mp3',
      'https://cdn.example.com/b.mp3',
    ])
    mockedDeleteAudioEntry.mockRejectedValueOnce(new Error('delete failed'))

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()

    expect(mockedDeleteAudioEntry).toHaveBeenCalledTimes(2)
    expect(mockedClearActiveDownloads).toHaveBeenCalledTimes(1)
  })

  test('never throws when reading the journal fails', async () => {
    mockedGetActiveDownloads.mockRejectedValue(new Error('journal read failed'))

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
