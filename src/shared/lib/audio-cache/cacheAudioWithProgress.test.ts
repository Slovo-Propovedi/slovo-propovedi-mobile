import { createCtx } from '@reatom/framework'
import { cachedUrlsAtom, playlistDownloadProgressAtom } from '../cache-triggers'
import { audioCacheService } from './AudioCacheService'
import { cacheAudioWithProgress } from './cacheAudioWithProgress'
import { CacheCancelledError } from './CacheCancelledError'
import { resolveCacheState } from './resolveCacheState'

const AUDIO_URL = 'http://example.com/sermon.mp3'
const CACHED_URI = 'file:///cached.mp3'

describe('cacheAudioWithProgress', () => {
  let cacheAudioSpy: jest.SpyInstance
  let ctx: ReturnType<typeof createCtx>

  beforeEach(() => {
    ctx = createCtx()
    cacheAudioSpy = jest.spyOn(audioCacheService, 'cacheAudio')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('pre-sets progress 0 while the download is in flight', async () => {
    let resolveDownload!: (value: string) => void
    cacheAudioSpy.mockReturnValue(
      new Promise<string>(resolve => {
        resolveDownload = resolve
      }),
    )

    const promise = cacheAudioWithProgress(ctx, AUDIO_URL)
    await Promise.resolve()

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({ [AUDIO_URL]: 0 })

    resolveDownload(CACHED_URI)
    await promise
  })

  test('propagates onProgress ticks to the atom', async () => {
    let onProgressCb: ((progress: number) => void) | undefined
    let resolveDownload!: (value: string) => void
    cacheAudioSpy.mockImplementation((_url: string, onProgress?: (progress: number) => void) => {
      onProgressCb = onProgress
      return new Promise<string>(resolve => {
        resolveDownload = resolve
      })
    })

    const promise = cacheAudioWithProgress(ctx, AUDIO_URL)
    await Promise.resolve()

    expect(onProgressCb).toBeDefined()
    onProgressCb?.(0.25)
    onProgressCb?.(0.5)

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({ [AUDIO_URL]: 0.5 })

    resolveDownload(CACHED_URI)
    await promise
  })

  test('removes the progress entry after a successful download', async () => {
    cacheAudioSpy.mockResolvedValue(CACHED_URI)

    const uri = await cacheAudioWithProgress(ctx, AUDIO_URL)

    expect(uri).toBe(CACHED_URI)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('rejects and removes the progress entry on failure', async () => {
    const error = new Error('download failed')
    cacheAudioSpy.mockRejectedValue(error)

    await expect(cacheAudioWithProgress(ctx, AUDIO_URL)).rejects.toBe(error)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('removes the progress entry when cacheAudio resolves without onProgress ticks', async () => {
    // The native skip-cached path resolves cacheAudio without ever invoking
    // onProgress(1); cleanup still runs via the finally block.
    cacheAudioSpy.mockResolvedValue(CACHED_URI)

    await cacheAudioWithProgress(ctx, AUDIO_URL)

    expect(cacheAudioSpy).toHaveBeenCalledWith(AUDIO_URL, expect.any(Function), undefined)
    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
  })

  test('marks the URL in the cached overlay on success (progress removed, overlay present)', async () => {
    cacheAudioSpy.mockResolvedValue(CACHED_URI)

    await cacheAudioWithProgress(ctx, AUDIO_URL)

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
    expect(ctx.get(cachedUrlsAtom)).toEqual({ [AUDIO_URL]: true })
  })

  test('does not mark the URL in the cached overlay on failure', async () => {
    cacheAudioSpy.mockRejectedValue(new Error('download failed'))

    await expect(cacheAudioWithProgress(ctx, AUDIO_URL)).rejects.toThrow('download failed')

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
    expect(ctx.get(cachedUrlsAtom)).toEqual({})
  })

  test('does not mark the URL in the cached overlay on cancel', async () => {
    cacheAudioSpy.mockRejectedValue(new CacheCancelledError(AUDIO_URL))

    await expect(cacheAudioWithProgress(ctx, AUDIO_URL)).rejects.toBeInstanceOf(CacheCancelledError)

    expect(ctx.get(playlistDownloadProgressAtom)).toEqual({})
    expect(ctx.get(cachedUrlsAtom)).toEqual({})
  })

  test('download completion never resolves to a cloud visual state (flicker regression)', async () => {
    let resolveDownload!: (value: string) => void
    cacheAudioSpy.mockReturnValue(
      new Promise<string>(resolve => {
        resolveDownload = resolve
      }),
    )

    // Record the ORDER of the two writes: markUrlCached (overlay) and the
    // progress-entry removal (finally). The overlay must land BEFORE the
    // progress entry disappears, else the row would flash a cloud frame.
    // Note: ctx.subscribe fires immediately with the current value, so the
    // progress-gone marker is only recorded after the entry was seen present.
    const writeOrder: string[] = []
    let sawProgressEntry = false
    ctx.subscribe(cachedUrlsAtom, () => {
      if (Object.hasOwn(ctx.get(cachedUrlsAtom), AUDIO_URL)) writeOrder.push('overlay')
    })
    ctx.subscribe(playlistDownloadProgressAtom, () => {
      const hasProgress = Object.hasOwn(ctx.get(playlistDownloadProgressAtom), AUDIO_URL)
      if (hasProgress) sawProgressEntry = true
      if (sawProgressEntry && !hasProgress) writeOrder.push('progress-gone')
    })

    const promise = cacheAudioWithProgress(ctx, AUDIO_URL)
    await Promise.resolve()

    // In-flight: progress present, no overlay → downloading.
    const inFlight = resolveCacheState({
      isCached: Object.hasOwn(ctx.get(cachedUrlsAtom), AUDIO_URL),
      isDownloading: Object.hasOwn(ctx.get(playlistDownloadProgressAtom), AUDIO_URL),
      isPlaying: false,
      isQueued: false,
    })
    expect(inFlight).toBe('downloading')

    resolveDownload(CACHED_URI)
    await promise

    // Settled: overlay present, progress removed → cached, never cloud.
    const settled = resolveCacheState({
      isCached: Object.hasOwn(ctx.get(cachedUrlsAtom), AUDIO_URL),
      isDownloading: Object.hasOwn(ctx.get(playlistDownloadProgressAtom), AUDIO_URL),
      isPlaying: false,
      isQueued: false,
    })
    expect(settled).toBe('cached')

    // Ordering guard: the first observed state where the progress entry is gone
    // must already have the overlay present (overlay write precedes removal).
    const overlayIndex = writeOrder.indexOf('overlay')
    const progressGoneIndex = writeOrder.indexOf('progress-gone')
    expect(overlayIndex).toBeGreaterThan(-1)
    expect(progressGoneIndex).toBeGreaterThan(-1)
    expect(overlayIndex).toBeLessThan(progressGoneIndex)
  })
})
