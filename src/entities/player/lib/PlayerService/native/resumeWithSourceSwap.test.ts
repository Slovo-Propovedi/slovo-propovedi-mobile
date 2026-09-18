import { ctx } from 'shared/lib/reatom-ctx'
import { positionAtom } from '../../../model'
import { audioLoader } from './AudioLoader'
import { resumeWithSourceSwap } from './resumeWithSourceSwap'

const AUDIO_URL = 'https://example.com/audio.mp3'
const CACHED_URI = 'file:///data/cache/audio.mp3'

const mockGetCachedUri = jest.fn<Promise<null | string>, [string]>()

jest.mock('shared/lib/audio-cache', () => ({
  audioCacheService: {
    getCachedUri: (url: string) => mockGetCachedUri(url),
  },
}))

jest.mock('./AudioLoader', () => ({
  audioLoader: { getLastResolvedUrl: jest.fn() },
}))

const mockedGetLastResolvedUrl = jest.mocked(audioLoader.getLastResolvedUrl)

const createPlayerStub = () => {
  const play = jest.fn().mockResolvedValue(undefined)
  const replaceAudio = jest.fn().mockResolvedValue(undefined)
  return { play, replaceAudio }
}

describe('resumeWithSourceSwap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    positionAtom(ctx, 0)
    mockGetCachedUri.mockResolvedValue(null)
    mockedGetLastResolvedUrl.mockReturnValue(null)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('uncached → only play called', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(null)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.replaceAudio).not.toHaveBeenCalled()
  })

  test('cached + lastResolvedUrl file:// → only play called', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedGetLastResolvedUrl.mockReturnValue(CACHED_URI)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.replaceAudio).not.toHaveBeenCalled()
  })

  test('cached + lastResolvedUrl network URL → replaceAudio with position then play', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedGetLastResolvedUrl.mockReturnValue(AUDIO_URL)
    positionAtom(ctx, 123456)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 123456)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  test('cached + lastResolvedUrl null → replaceAudio then play', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockResolvedValue(CACHED_URI)
    mockedGetLastResolvedUrl.mockReturnValue(null)

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.replaceAudio).toHaveBeenCalledWith(AUDIO_URL, 0)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  test('getCachedUri rejects → only play called', async () => {
    const player = createPlayerStub()
    mockGetCachedUri.mockRejectedValue(new Error('cache check failed'))

    await resumeWithSourceSwap(player, AUDIO_URL)

    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.replaceAudio).not.toHaveBeenCalled()
  })
})
