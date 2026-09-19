import { createCtx, type Ctx } from '@reatom/framework'
import { type Directory, File } from 'expo-file-system'
import { type PlaylistData, type SermonData } from 'shared/model'
import { audioCacheService } from './AudioCacheService'
import { getUrlHash, PART_SUFFIX } from './cacheDownloader'
import { enqueueCacheMany } from './cacheQueueEnqueueMany'
import { getAudioCacheDirectory } from './getAudioCacheDirectory'
import { registerOfflineSermon } from './offlineSermonsRegistry'
import { deletePartialFile } from './partialFile'
import { reEnqueuePartialDownloads } from './reEnqueuePartials'

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

jest.mock('./partialFile', () => ({
  deletePartialFile: jest.fn(),
}))

jest.mock('./cacheQueueEnqueueMany', () => ({
  enqueueCacheMany: jest.fn(),
}))

jest.mock('./AudioCacheService', () => ({
  audioCacheService: {
    isCached: jest.fn(),
  },
}))

const mockedGetAudioCacheDirectory = jest.mocked(getAudioCacheDirectory)
const mockedEnqueueCacheMany = jest.mocked(enqueueCacheMany)
const mockedDeletePartialFile = jest.mocked(deletePartialFile)
const mockedIsCached = jest.mocked(audioCacheService.isCached)

const AUDIO_URL = 'https://example.com/audio.mp3'
const OTHER_AUDIO_URL = 'https://example.com/other.mp3'

const mockSermon: SermonData = {
  artist: 'Artist',
  artwork: 'https://example.com/art.jpg',
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Sermon 1',
}

const mockPlaylist: PlaylistData = {
  artwork: 'https://example.com/playlist.jpg',
  id: 'playlist-1',
  sermons: [mockSermon],
  title: 'Playlist 1',
}

const mockCacheDir = {
  exists: true,
  list: jest.fn(),
} as unknown as Directory

const partialFileName = (url: string): string => `${getUrlHash(url)}${PART_SUFFIX}`

describe('reEnqueuePartialDownloads', () => {
  let ctx: Ctx
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    ctx = createCtx()
    jest.clearAllMocks()
    mockCacheDir.exists = true
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([])
    mockedGetAudioCacheDirectory.mockReturnValue(mockCacheDir)
    mockedIsCached.mockResolvedValue(false)
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  test('re-enqueues a partial of a registered uncached URL', async () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    const partialFile = new File(mockCacheDir, partialFileName(AUDIO_URL))
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([partialFile])

    await reEnqueuePartialDownloads(ctx)

    expect(mockedEnqueueCacheMany).toHaveBeenCalledWith(ctx, [AUDIO_URL], 'auto')
    expect(mockedDeletePartialFile).not.toHaveBeenCalled()
  })

  test('deletes a stale partial when the final file is already cached', async () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    const partialFile = new File(mockCacheDir, partialFileName(AUDIO_URL))
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([partialFile])
    mockedIsCached.mockResolvedValue(true)

    await reEnqueuePartialDownloads(ctx)

    expect(mockedEnqueueCacheMany).not.toHaveBeenCalled()
    expect(mockedDeletePartialFile).toHaveBeenCalledWith(AUDIO_URL)
  })

  test('leaves unknown partial hashes alone', async () => {
    const partialFile = new File(mockCacheDir, 'unknown-hash.cache.mp3')
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([partialFile])

    await reEnqueuePartialDownloads(ctx)

    expect(mockedEnqueueCacheMany).not.toHaveBeenCalled()
    expect(mockedDeletePartialFile).not.toHaveBeenCalled()
  })

  test('no-ops when the cache directory is missing', async () => {
    mockCacheDir.exists = false

    await reEnqueuePartialDownloads(ctx)

    expect(mockCacheDir.list).not.toHaveBeenCalled()
    expect(mockedEnqueueCacheMany).not.toHaveBeenCalled()
  })

  test('never throws when listing the directory fails', async () => {
    ;(mockCacheDir.list as jest.Mock).mockImplementation(() => {
      throw new Error('listing failed')
    })

    await expect(reEnqueuePartialDownloads(ctx)).resolves.toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalled()
  })

  test('re-enqueues multiple registered uncached partials in one batch', async () => {
    registerOfflineSermon(ctx, AUDIO_URL, mockSermon, mockPlaylist)
    registerOfflineSermon(ctx, OTHER_AUDIO_URL, mockSermon, mockPlaylist)
    const firstPartial = new File(mockCacheDir, partialFileName(AUDIO_URL))
    const secondPartial = new File(mockCacheDir, partialFileName(OTHER_AUDIO_URL))
    ;(mockCacheDir.list as jest.Mock).mockReturnValue([firstPartial, secondPartial])

    await reEnqueuePartialDownloads(ctx)

    expect(mockedEnqueueCacheMany).toHaveBeenCalledWith(ctx, [AUDIO_URL, OTHER_AUDIO_URL], 'auto')
  })
})
