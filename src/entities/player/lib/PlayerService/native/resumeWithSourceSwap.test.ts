import { ctx } from 'shared/lib/reatom-ctx'
import { positionAtom } from '../../../model'
import { resumeWithSourceSwap } from './resumeWithSourceSwap'

const AUDIO_URL = 'https://example.com/audio.mp3'
const CACHED_URI = 'file:///data/cache/audio.mp3'

const mockGetCachedUri = jest.fn<Promise<null | string>, [string]>()
const mockGetCurrentIndex = jest.fn<number, []>()
const mockGetTrackAt = jest.fn<{ audioUrl: string } | null, [number]>()

jest.mock('entities/offline-cache/@x/player', () => ({
  audioCacheService: {
    getCachedUri: (url: string) => mockGetCachedUri(url),
  },
  PART_SUFFIX: '.cache.mp3',
}))

jest.mock('./PlaylistEngine', () => ({
  playlistEngine: {
    getCurrentIndex: () => mockGetCurrentIndex(),
    getTrackAt: (index: number) => mockGetTrackAt(index),
  },
}))

const createPlayerStub = () => {
  const play = jest.fn().mockResolvedValue(undefined)
  const getCurrentSourceUri = jest.fn<null | string, []>()
  const swapSource = jest.fn().mockResolvedValue(true)
  return { getCurrentSourceUri, play, swapSource }
}

describe('resumeWithSourceSwap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    positionAtom(ctx, 0)
    mockGetCachedUri.mockResolvedValue(null)
    mockGetCurrentIndex.mockReturnValue(-1)
    mockGetTrackAt.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('uncached → only play called', async () => {
    const player = createPlayerStub()
    player.getCurrentSourceUri.mockReturnValue(AUDIO_URL)
    mockGetCachedUri.mockResolvedValue(null)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.swapSource).not.toHaveBeenCalled()
  })

  test('cached + current source file:// → only play called', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(CACHED_URI)
    player.getCurrentSourceUri.mockReturnValue(CACHED_URI)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.swapSource).not.toHaveBeenCalled()
  })

  test('cached + current source partial file:// → swaps to the final file then plays', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue('file:///data/cache/audio-final.mp3')
    player.getCurrentSourceUri.mockReturnValue('file:///data/cache/audio-hash.cache.mp3')
    positionAtom(ctx, 123456)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.swapSource).toHaveBeenCalledWith('file:///data/cache/audio-final.mp3', 123456)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  test('cached + current source network URL → swaps to the cached file then plays', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(CACHED_URI)
    player.getCurrentSourceUri.mockReturnValue(AUDIO_URL)
    positionAtom(ctx, 123456)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.swapSource).toHaveBeenCalledWith(CACHED_URI, 123456)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  test('cached + current source null → swaps then plays', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(CACHED_URI)
    player.getCurrentSourceUri.mockReturnValue(null)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.swapSource).toHaveBeenCalledWith(CACHED_URI, 0)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  test('getCachedUri rejects → only play called', async () => {
    const player = createPlayerStub()
    player.getCurrentSourceUri.mockReturnValue(AUDIO_URL)
    mockGetCachedUri.mockRejectedValue(new Error('cache check failed'))

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.swapSource).not.toHaveBeenCalled()
  })

  test('stale requested URL → resumes the engine current track URL, no foreign swap', async () => {
    const STALE_URL = 'https://example.com/first.mp3'
    const ENGINE_URL = 'https://example.com/second.mp3'
    mockGetCurrentIndex.mockReturnValue(1)
    mockGetTrackAt.mockReturnValue({ audioUrl: ENGINE_URL })
    // Only the stale track is cached; the engine track is not. Resolving from
    // the engine keeps the source in agreement, so no swap may happen.
    mockGetCachedUri.mockImplementation(url =>
      Promise.resolve(url === STALE_URL ? CACHED_URI : null),
    )
    const player = createPlayerStub()
    player.getCurrentSourceUri.mockReturnValue(ENGINE_URL)

    await resumeWithSourceSwap(player, STALE_URL)

    expect(mockGetCachedUri).toHaveBeenCalledWith(ENGINE_URL)
    expect(player.swapSource).not.toHaveBeenCalled()
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  // Disabling sermon caching wipes the cache directory under the running queue,
  // so `getCachedUri` answers null while the queue stays bound to the deleted
  // file:// source. A bare play is a silent no-op there — the source must be rebound.
  test('uncached + current source file:// → swaps to the network URL then plays', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(null)
    player.getCurrentSourceUri.mockReturnValue(CACHED_URI)
    positionAtom(ctx, 123456)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.swapSource).toHaveBeenCalledWith(AUDIO_URL, 123456)
    expect(player.play).toHaveBeenCalledTimes(1)
  })
})
