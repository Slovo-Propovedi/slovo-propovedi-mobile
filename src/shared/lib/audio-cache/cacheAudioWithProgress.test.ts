import { createCtx } from '@reatom/framework'
import { playlistDownloadProgressAtom } from '../cache-triggers'
import { audioCacheService } from './AudioCacheService'
import { cacheAudioWithProgress } from './cacheAudioWithProgress'

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
})
