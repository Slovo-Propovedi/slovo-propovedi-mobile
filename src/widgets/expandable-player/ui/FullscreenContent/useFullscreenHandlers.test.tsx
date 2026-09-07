import { act } from '@testing-library/react-native'
import { currentAudioAtom } from 'entities/player'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { useFullscreenHandlers } from './useFullscreenHandlers'

const AUDIO_CACHE_MODULE = 'shared/lib/audio-cache'

jest.mock('shared/lib/audio-cache', () => ({
  cacheAudioWithProgress: jest.fn(),
  removeFromCache: jest.fn(),
  useIsCached: jest.fn(),
}))

jest.mock('../../model/showMenuAtom', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { showMenuAtom: atom(false, 'mockShowMenuAtom') }
})

jest.mock('../../model/showPlaylistAtom', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { showPlaylistAtom: atom(false, 'mockShowPlaylistAtom') }
})

jest.mock('@gorhom/bottom-sheet', () => ({}))

const AUDIO_URL = 'https://example.com/audio.mp3'
const SERMON_ID = 'sermon-1'

const mockAudio = {
  artist: 'Author',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: SERMON_ID,
  title: 'Test Sermon',
}

const mockSeekTo = jest.fn().mockResolvedValue(undefined)
const mockTogglePlay = jest.fn().mockResolvedValue(undefined)

const mockedCacheAudioWithProgress = jest.requireMock(AUDIO_CACHE_MODULE)
  .cacheAudioWithProgress as jest.Mock
const mockedRemoveFromCache = jest.requireMock(AUDIO_CACHE_MODULE).removeFromCache as jest.Mock
const mockedUseIsCached = jest.requireMock(AUDIO_CACHE_MODULE).useIsCached as jest.Mock

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'mockCurrentAudioAtom'),
    currentPlaylistAtom: atom(null, 'mockCurrentPlaylistAtom'),
    downloadingAudioUrlAtom: atom(null, 'mockDownloadingAudioUrlAtom'),
    downloadProgressAtom: atom(0, 'mockDownloadProgressAtom'),
    durationAtom: atom(0, 'mockDurationAtom'),
    isDownloadingAtom: atom(false, 'mockIsDownloadingAtom'),
    positionAtom: atom(0, 'mockPositionAtom'),
    useGuardedTogglePlay: () => ({ togglePlay: mockTogglePlay }),
    usePlayer: () => ({ seekTo: mockSeekTo }),
    useSeekControls: () => ({
      startSeek: jest.fn(),
      stopSeek: jest.fn(),
    }),
  }
})

const renderHandlers = () => renderHookWithProviders(() => useFullscreenHandlers(), { ctx })

describe('useFullscreenHandlers handleTogglePlay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTogglePlay.mockResolvedValue(undefined)
    currentAudioAtom(ctx, null)
  })

  test('delegates to useGuardedTogglePlay', async () => {
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()

    await act(async () => {
      await result.current.handleTogglePlay()
    })

    expect(mockTogglePlay).toHaveBeenCalledTimes(1)
  })

  test('handleTogglePlay is the hook togglePlay reference', async () => {
    const { result } = await renderHandlers()

    expect(result.current.handleTogglePlay).toBe(mockTogglePlay)
  })
})

describe('useFullscreenHandlers handleToggleCache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseIsCached.mockReturnValue(false)
    mockedCacheAudioWithProgress.mockResolvedValue('file:///cached.mp3')
    mockedRemoveFromCache.mockResolvedValue(true)
    currentAudioAtom(ctx, null)
  })

  test('caches via cacheAudioWithProgress and increments the cache trigger', async () => {
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedUseIsCached).toHaveBeenCalledWith(AUDIO_URL, initialTrigger)
    expect(mockedCacheAudioWithProgress).toHaveBeenCalledWith(ctx, AUDIO_URL)
    expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
  })

  test('removes from cache and increments the trigger when already cached', async () => {
    mockedUseIsCached.mockReturnValue(true)
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedCacheAudioWithProgress).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
  })
})
