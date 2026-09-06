import { cleanupOrphanedDownloads, STALE_MS } from './cleanupOrphans.web'
import { openAudioCache } from './openAudioCache'
import { deleteAudioEntry } from './webCacheApi'
import { isUrlCommitted, readCommittedUrls } from './webCacheManifest'
import { getActiveDownloads, removeActiveDownloadEntries } from './webDownloadJournal'

jest.mock('./openAudioCache', () => ({
  openAudioCache: jest.fn(),
}))

jest.mock('./webCacheApi', () => ({
  deleteAudioEntry: jest.fn(),
}))

jest.mock('./webCacheManifest', () => ({
  isUrlCommitted: jest.fn(),
  readCommittedUrls: jest.fn(),
}))

jest.mock('./webDownloadJournal', () => ({
  getActiveDownloads: jest.fn(),
  removeActiveDownloadEntries: jest.fn(),
}))

const mockedGetActiveDownloads = jest.mocked(getActiveDownloads)
const mockedRemoveActiveDownloadEntries = jest.mocked(removeActiveDownloadEntries)
const mockedDeleteAudioEntry = jest.mocked(deleteAudioEntry)
const mockedOpenAudioCache = jest.mocked(openAudioCache)
const mockedReadCommittedUrls = jest.mocked(readCommittedUrls)
const mockedIsUrlCommitted = jest.mocked(isUrlCommitted)

const entry = (url: string, lastSeenAt: number) => ({
  lastSeenAt,
  sessionId: 'session',
  url,
})

describe('cleanupOrphanedDownloads (web)', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetActiveDownloads.mockResolvedValue([])
    mockedDeleteAudioEntry.mockResolvedValue(true)
    mockedOpenAudioCache.mockResolvedValue({} as Cache)
    mockedReadCommittedUrls.mockResolvedValue(new Set())
    mockedIsUrlCommitted.mockReturnValue(false)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
  })

  test('does not touch caches when journal is empty', async () => {
    await cleanupOrphanedDownloads()

    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
    expect(mockedOpenAudioCache).not.toHaveBeenCalled()
    expect(mockedRemoveActiveDownloadEntries).not.toHaveBeenCalled()
  })

  test('skips fresh entries without any cache access', async () => {
    mockedGetActiveDownloads.mockResolvedValue([entry('https://cdn.example.com/a.mp3', Date.now())])

    await cleanupOrphanedDownloads()

    expect(mockedOpenAudioCache).not.toHaveBeenCalled()
    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
    expect(mockedRemoveActiveDownloadEntries).not.toHaveBeenCalled()
  })

  test('deletes stale uncommitted entries and drops their journal rows', async () => {
    const staleUrl = 'https://cdn.example.com/a.mp3'
    mockedGetActiveDownloads.mockResolvedValue([entry(staleUrl, Date.now() - STALE_MS - 1)])

    await cleanupOrphanedDownloads()

    expect(mockedDeleteAudioEntry).toHaveBeenCalledWith(staleUrl)
    expect(mockedRemoveActiveDownloadEntries).toHaveBeenCalledWith([
      expect.objectContaining({ url: staleUrl }),
    ])
  })

  test('keeps the cache entry for a stale committed download, only drops the journal row', async () => {
    const committedUrl = 'https://cdn.example.com/a.mp3'
    mockedGetActiveDownloads.mockResolvedValue([entry(committedUrl, Date.now() - STALE_MS - 1)])
    mockedIsUrlCommitted.mockReturnValue(true)

    await cleanupOrphanedDownloads()

    expect(mockedDeleteAudioEntry).not.toHaveBeenCalled()
    expect(mockedRemoveActiveDownloadEntries).toHaveBeenCalledWith([
      expect.objectContaining({ url: committedUrl }),
    ])
  })

  test('continues past a failed delete and never throws', async () => {
    mockedGetActiveDownloads.mockResolvedValue([
      entry('https://cdn.example.com/a.mp3', Date.now() - STALE_MS - 1),
      entry('https://cdn.example.com/b.mp3', Date.now() - STALE_MS - 1),
    ])
    mockedDeleteAudioEntry.mockRejectedValueOnce(new Error('delete failed'))

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()

    expect(mockedDeleteAudioEntry).toHaveBeenCalledTimes(2)
    expect(mockedRemoveActiveDownloadEntries).toHaveBeenCalledTimes(1)
  })

  test('never throws when reading the journal fails', async () => {
    mockedGetActiveDownloads.mockRejectedValue(new Error('journal read failed'))

    await expect(cleanupOrphanedDownloads()).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})
