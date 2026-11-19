import { ctx } from 'shared/lib/reatom-ctx'
import { isBufferingAtom, isPlayingAtom, positionAtom } from '../../../model'
import { isStalledOfflineAtom } from '../../stalledOffline'
import { recoverStreamAfterReconnect } from './reconnectHeal'

const STALE_URL = 'https://example.com/first.mp3'
const ENGINE_URL = 'https://example.com/second.mp3'
const CACHED_URI = 'file:///data/cache/second.mp3'

const mockGetCurrentIndex = jest.fn<number, []>()
const mockGetCurrentSourceUri = jest.fn<null | string, []>()
const mockGetTrackAt = jest.fn<{ audioUrl: string } | null, [number]>()
const mockIsLoaded = jest.fn<boolean, []>()

jest.mock('./PlaylistEngine', () => ({
  playlistEngine: {
    getCurrentIndex: () => mockGetCurrentIndex(),
    getCurrentSourceUri: () => mockGetCurrentSourceUri(),
    getTrackAt: (index: number) => mockGetTrackAt(index),
    isLoaded: () => mockIsLoaded(),
  },
}))

const createServiceStub = () => ({
  loadAudio: jest.fn().mockResolvedValue({}),
  play: jest.fn().mockResolvedValue(undefined),
  reassertLockScreenMetadata: jest.fn(),
  replaceAudio: jest.fn().mockResolvedValue({}),
})

describe('recoverStreamAfterReconnect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    isPlayingAtom(ctx, false)
    isBufferingAtom(ctx, false)
    isStalledOfflineAtom(ctx, false)
    positionAtom(ctx, 0)
    mockGetCurrentIndex.mockReturnValue(1)
    mockGetTrackAt.mockReturnValue({ audioUrl: ENGINE_URL })
    mockGetCurrentSourceUri.mockReturnValue(ENGINE_URL)
    mockIsLoaded.mockReturnValue(true)
  })

  test('targets the engine current track instead of the passed stale URL', async () => {
    const service = createServiceStub()

    await recoverStreamAfterReconnect(service, STALE_URL)

    expect(mockGetTrackAt).toHaveBeenCalledWith(1)
    expect(service.replaceAudio).toHaveBeenCalledWith(ENGINE_URL, 0)
    expect(service.loadAudio).not.toHaveBeenCalled()
  })

  test('bails when the engine source is null or already cached', async () => {
    const service = createServiceStub()

    mockGetCurrentSourceUri.mockReturnValue(null)
    await recoverStreamAfterReconnect(service, STALE_URL)
    mockGetCurrentSourceUri.mockReturnValue(CACHED_URI)
    await recoverStreamAfterReconnect(service, STALE_URL)

    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(service.loadAudio).not.toHaveBeenCalled()
  })

  test('loads a fresh queue when the engine is not loaded, replacing it otherwise', async () => {
    const service = createServiceStub()
    positionAtom(ctx, 123456)

    mockIsLoaded.mockReturnValue(false)
    await recoverStreamAfterReconnect(service, STALE_URL)
    expect(service.loadAudio).toHaveBeenCalledWith(ENGINE_URL, 123456)
    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(service.play).not.toHaveBeenCalled()

    mockIsLoaded.mockReturnValue(true)
    await recoverStreamAfterReconnect(service, STALE_URL)
    expect(service.replaceAudio).toHaveBeenCalledWith(ENGINE_URL, 123456)
  })

  test('resumes after the swap only when playback was underway or stalled offline', async () => {
    const service = createServiceStub()

    isPlayingAtom(ctx, true)
    isBufferingAtom(ctx, true)
    await recoverStreamAfterReconnect(service, STALE_URL)
    expect(service.play).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
    isPlayingAtom(ctx, false)
    isStalledOfflineAtom(ctx, true)
    await recoverStreamAfterReconnect(service, STALE_URL)
    expect(service.play).toHaveBeenCalledTimes(1)

    jest.clearAllMocks()
    isStalledOfflineAtom(ctx, false)
    await recoverStreamAfterReconnect(service, STALE_URL)
    expect(service.play).not.toHaveBeenCalled()

    jest.clearAllMocks()
    isPlayingAtom(ctx, true)
    isBufferingAtom(ctx, false)
    await recoverStreamAfterReconnect(service, STALE_URL)
    expect(service.replaceAudio).not.toHaveBeenCalled()
    expect(service.play).not.toHaveBeenCalled()
  })
})
