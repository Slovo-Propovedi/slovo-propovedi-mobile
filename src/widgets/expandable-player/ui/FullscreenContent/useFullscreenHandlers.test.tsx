import { act } from '@testing-library/react-native'
import { currentAudioAtom } from 'entities/player'
import { cacheQueueAtom, cancelCacheDownload, enqueueCache } from 'shared/lib/audio-cache'
import { cacheUpdateTriggerAtom } from 'shared/lib/cache-triggers'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import { useFullscreenHandlers } from './useFullscreenHandlers'

const AUDIO_CACHE_MODULE = 'shared/lib/audio-cache'

jest.mock('shared/lib/audio-cache', () => {
  const actual = jest.requireActual('shared/lib/audio-cache')
  return {
    ...actual,
    cancelCacheDownload: jest.fn(),
    enqueueCache: jest.fn().mockResolvedValue('file:///cached.mp3'),
    removeFromCache: jest.fn(),
    useIsCached: jest.fn(),
  }
})

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

const mockedEnqueueCache = jest.mocked(enqueueCache)
const mockedCancelCacheDownload = jest.mocked(cancelCacheDownload)
const mockedRemoveFromCache = jest.requireMock(AUDIO_CACHE_MODULE).removeFromCache as jest.Mock
const mockedUseIsCached = jest.requireMock(AUDIO_CACHE_MODULE).useIsCached as jest.Mock

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    currentAudioAtom: atom(null, 'mockCurrentAudioAtom'),
    currentPlaylistAtom: atom(null, 'mockCurrentPlaylistAtom'),
    downloadingAudioUrlAtom: atom(null, 'mockDownloadingAudioUrlAtom'),
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
    mockedEnqueueCache.mockResolvedValue('file:///cached.mp3')
    mockedRemoveFromCache.mockResolvedValue(true)
    currentAudioAtom(ctx, null)
    isOnlineAtom(ctx, true)
    cacheQueueAtom(ctx, {})
    const { downloadingAudioUrlAtom, isDownloadingAtom } = jest.requireMock('entities/player')
    isDownloadingAtom(ctx, false)
    downloadingAudioUrlAtom(ctx, null)
  })

  test('enqueues via enqueueCache with manual source and increments the cache trigger', async () => {
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedUseIsCached).toHaveBeenCalledWith(AUDIO_URL, initialTrigger)
    expect(mockedEnqueueCache).toHaveBeenCalledWith(ctx, AUDIO_URL, 'manual')
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
    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
  })

  test('does not enqueue when offline and not cached', async () => {
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      isOnlineAtom(ctx, false)
    })

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger)
  })

  test('removes from cache when offline and cached', async () => {
    mockedUseIsCached.mockReturnValue(true)
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      isOnlineAtom(ctx, false)
    })

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
  })

  test('cancels the download when the current audio is downloading', async () => {
    currentAudioAtom(ctx, mockAudio)
    const { downloadingAudioUrlAtom, isDownloadingAtom } = jest.requireMock('entities/player')

    const { result } = await renderHandlers()

    await act(async () => {
      isDownloadingAtom(ctx, true)
      downloadingAudioUrlAtom(ctx, AUDIO_URL)
    })

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedCancelCacheDownload).toHaveBeenCalledWith(ctx, AUDIO_URL)
    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(mockedRemoveFromCache).not.toHaveBeenCalled()
  })

  test('cancels the queue entry when the current audio is queued', async () => {
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()

    await act(async () => {
      cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
    })

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedCancelCacheDownload).toHaveBeenCalledWith(ctx, AUDIO_URL)
    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(mockedRemoveFromCache).not.toHaveBeenCalled()
  })

  test('exposes isQueued and visualState from the resolver', async () => {
    currentAudioAtom(ctx, mockAudio)

    const { result } = await renderHandlers()

    expect(result.current.isQueued).toBe(false)
    expect(result.current.visualState).toBe('cloud')

    await act(async () => {
      cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
    })

    expect(result.current.isQueued).toBe(true)
    expect(result.current.visualState).toBe('queued')
  })
})
