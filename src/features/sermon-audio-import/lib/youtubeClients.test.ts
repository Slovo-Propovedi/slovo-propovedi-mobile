/* eslint-disable camelcase -- Innertube-поля приходят в snake_case */
import { type Innertube } from 'youtubei.js'
import { getImportErrorMessage, ImportSourceError } from './sourceErrors'
import { resolveYoutubeAudioWithFallback } from './youtubeClients'

// `resolveYoutubeAudioWithFallback` — чистая оркестрация поверх сессии InnerTube:
// динамический `import('youtubei.js')` в Jest не мокается (babel-preset-expo
// сохраняет нативный import под Metro), поэтому сессию подменяем фейком.
const mockGetBasicInfo = jest.fn()
const mockDecipher = jest.fn()

const VIDEO_ID = 'lV6YkF7ytxs'
const FORBIDDEN = new Error('Request to https://x failed with status code 403')

const AUDIO_FORMAT = {
  bitrate: 128_000,
  decipher: (...args: unknown[]) => mockDecipher(...args),
  itag: 140,
  mime_type: 'audio/mp4; codecs="mp4a.40.2"',
}

const buildInfo = () => ({
  basic_info: { is_live: false, short_description: 'Текст проповеди', title: 'Проповедь' },
  playability_status: { status: 'OK' },
  streaming_data: { adaptive_formats: [AUDIO_FORMAT] },
})

const innertube = {
  getBasicInfo: (...args: unknown[]) => mockGetBasicInfo(...args),
  session: { player: { player_id: 'player' } },
} as unknown as Innertube

const captureFailure = async (promise: Promise<unknown>): Promise<ImportSourceError> => {
  try {
    await promise
  } catch (error) {
    if (error instanceof ImportSourceError) return error
    throw error
  }

  throw new Error('expected the import to fail')
}

describe('resolveYoutubeAudioWithFallback', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('resolves audio with the ANDROID_VR client', async () => {
    mockGetBasicInfo.mockResolvedValue(buildInfo())
    mockDecipher.mockResolvedValue('https://cdn.test/audio.m4a')

    const resolved = await resolveYoutubeAudioWithFallback(innertube, VIDEO_ID)

    expect(mockGetBasicInfo).toHaveBeenCalledWith(VIDEO_ID, { client: 'ANDROID_VR' })
    expect(resolved).toEqual({
      audioUrl: 'https://cdn.test/audio.m4a',
      description: 'Текст проповеди',
      title: 'Проповедь',
      videoId: VIDEO_ID,
    })
  })

  test('falls back to WEB_EMBEDDED when ANDROID_VR is forbidden', async () => {
    mockGetBasicInfo.mockImplementation((_videoId: unknown, options: { client: string }) =>
      options.client === 'ANDROID_VR' ? Promise.reject(FORBIDDEN) : Promise.resolve(buildInfo()),
    )
    mockDecipher.mockResolvedValue('https://cdn.test/audio.m4a')

    const resolved = await resolveYoutubeAudioWithFallback(innertube, VIDEO_ID)

    expect(mockGetBasicInfo).toHaveBeenNthCalledWith(1, VIDEO_ID, { client: 'ANDROID_VR' })
    expect(mockGetBasicInfo).toHaveBeenNthCalledWith(2, VIDEO_ID, { client: 'WEB_EMBEDDED' })
    expect(resolved.audioUrl).toBe('https://cdn.test/audio.m4a')
  })

  test('reports both clients when the fallback chain is exhausted', async () => {
    mockGetBasicInfo.mockRejectedValue(FORBIDDEN)

    const error = await captureFailure(resolveYoutubeAudioWithFallback(innertube, VIDEO_ID))

    expect(getImportErrorMessage(error)).toContain('ANDROID_VR: 403')
    expect(getImportErrorMessage(error)).toContain('WEB_EMBEDDED: 403')
  })

  test('does not fall back on a non-403 failure', async () => {
    mockGetBasicInfo.mockRejectedValue(new Error('Network request failed'))

    const error = await captureFailure(resolveYoutubeAudioWithFallback(innertube, VIDEO_ID))

    expect(mockGetBasicInfo).toHaveBeenCalledTimes(1)
    expect(getImportErrorMessage(error)).toContain('ANDROID_VR')
  })

  test('does not retry a client-independent playability error', async () => {
    mockGetBasicInfo.mockResolvedValue({
      ...buildInfo(),
      playability_status: { status: 'LOGIN_REQUIRED' },
    })

    await expect(resolveYoutubeAudioWithFallback(innertube, VIDEO_ID)).rejects.toMatchObject({
      code: 'login-required',
    })
    expect(mockGetBasicInfo).toHaveBeenCalledTimes(1)
  })
})
