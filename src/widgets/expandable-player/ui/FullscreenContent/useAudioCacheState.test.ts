import { act } from '@testing-library/react-native'
import {
  cacheQueueAtom,
  cacheUpdateTriggerAtom,
  cancelCacheDownload,
  enqueueCache,
} from 'entities/offline-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import { useAudioCacheState } from './useAudioCacheState'

const AUDIO_CACHE_MODULE = 'entities/offline-cache'
const AUDIO_URL = 'https://example.com/audio.mp3'

jest.mock('entities/offline-cache', () => {
  const actual = jest.requireActual('entities/offline-cache')
  return {
    ...actual,
    cancelCacheDownload: jest.fn(),
    enqueueCache: jest.fn().mockResolvedValue('file:///cached.mp3'),
    removeFromCache: jest.fn(),
    useIsCached: jest.fn(),
  }
})

const mockedEnqueueCache = jest.mocked(enqueueCache)
const mockedCancelCacheDownload = jest.mocked(cancelCacheDownload)
const mockedRemoveFromCache = jest.requireMock(AUDIO_CACHE_MODULE).removeFromCache as jest.Mock
const mockedUseIsCached = jest.requireMock(AUDIO_CACHE_MODULE).useIsCached as jest.Mock

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    downloadingAudioUrlAtom: atom(null, 'mockDownloadingAudioUrlAtom'),
    isDownloadingAtom: atom(false, 'mockIsDownloadingAtom'),
  }
})

const { downloadingAudioUrlAtom, isDownloadingAtom } = jest.requireMock('entities/player')

const renderCacheState = () => renderHookWithProviders(() => useAudioCacheState(AUDIO_URL), { ctx })

describe('useAudioCacheState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseIsCached.mockReturnValue(false)
    mockedEnqueueCache.mockResolvedValue('file:///cached.mp3')
    mockedRemoveFromCache.mockResolvedValue(true)
    isOnlineAtom(ctx, true)
    cacheQueueAtom(ctx, {})
    isDownloadingAtom(ctx, false)
    downloadingAudioUrlAtom(ctx, null)
  })

  test('checks the cache with the audio url and the update trigger', async () => {
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    const { result } = await renderCacheState()

    expect(mockedUseIsCached).toHaveBeenCalledWith(AUDIO_URL, initialTrigger)
    expect(result.current.isCached).toBe(false)
  })

  test('enqueues via enqueueCache with manual source and increments the cache trigger', async () => {
    const { result } = await renderCacheState()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedEnqueueCache).toHaveBeenCalledWith(ctx, AUDIO_URL, 'manual')
    expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
  })

  test('removes from cache and increments the trigger when already cached', async () => {
    mockedUseIsCached.mockReturnValue(true)
    const { result } = await renderCacheState()
    const initialTrigger = ctx.get(cacheUpdateTriggerAtom)

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(ctx.get(cacheUpdateTriggerAtom)).toBe(initialTrigger + 1)
  })

  test('does not enqueue when offline and not cached', async () => {
    const { result } = await renderCacheState()
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
    const { result } = await renderCacheState()

    await act(async () => {
      isOnlineAtom(ctx, false)
    })

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedRemoveFromCache).toHaveBeenCalledWith(AUDIO_URL)
    expect(mockedEnqueueCache).not.toHaveBeenCalled()
  })

  test('cancels the download when the audio is downloading', async () => {
    const { result } = await renderCacheState()

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

  test('cancels the queue entry when the audio is queued', async () => {
    const { result } = await renderCacheState()

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
    const { result } = await renderCacheState()

    expect(result.current.isQueued).toBe(false)
    expect(result.current.visualState).toBe('cloud')

    await act(async () => {
      cacheQueueAtom(ctx, { [AUDIO_URL]: { enqueuedAt: 0, source: 'manual' } })
    })

    expect(result.current.isQueued).toBe(true)
    expect(result.current.visualState).toBe('queued')
  })

  test('does nothing without an audio url', async () => {
    const { result } = await renderHookWithProviders(() => useAudioCacheState(undefined), { ctx })

    await act(async () => {
      await result.current.handleToggleCache()
    })

    expect(mockedEnqueueCache).not.toHaveBeenCalled()
    expect(mockedRemoveFromCache).not.toHaveBeenCalled()
    expect(mockedCancelCacheDownload).not.toHaveBeenCalled()
    expect(result.current.isQueued).toBe(false)
  })
})
