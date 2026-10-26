/* eslint-disable camelcase -- Innertube-поля приходят в snake_case */
import { type Innertube } from 'youtubei.js'
import { getImportErrorMessage, ImportSourceError } from './sourceErrors'
import { resolveYoutubeAudioFromInnertube } from './youtubeClients'

// `resolveYoutubeAudioFromInnertube` — чистая оркестрация поверх сессии InnerTube:
// динамический `import('youtubei.js')` в Jest не мокается (babel-preset-expo
// сохраняет нативный import под Metro), поэтому сессию подменяем фейком.
const mockGetBasicInfo = jest.fn()
const mockDecipher = jest.fn()

const VIDEO_ID = 'lV6YkF7ytxs'
const AUDIO_URL = 'https://cdn.test/audio.m4a'
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

describe('resolveYoutubeAudioFromInnertube', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('resolves audio with the ANDROID_VR client', async () => {
    mockGetBasicInfo.mockResolvedValue(buildInfo())
    mockDecipher.mockResolvedValue(AUDIO_URL)

    const resolved = await resolveYoutubeAudioFromInnertube(innertube, VIDEO_ID)

    expect(mockGetBasicInfo).toHaveBeenCalledWith(VIDEO_ID, { client: 'ANDROID_VR' })
    expect(resolved).toEqual({
      audioUrl: AUDIO_URL,
      description: 'Текст проповеди',
      title: 'Проповедь',
      videoId: VIDEO_ID,
    })
  })

  test('takes the stream URL as is, never handing the player to decipher', async () => {
    mockGetBasicInfo.mockResolvedValue(buildInfo())
    mockDecipher.mockResolvedValue(AUDIO_URL)

    await resolveYoutubeAudioFromInnertube(innertube, VIDEO_ID)

    expect(mockDecipher).toHaveBeenCalledWith()
  })

  test('fails instead of evaluating player JS when the stream URL is ciphered', async () => {
    mockGetBasicInfo.mockResolvedValue(buildInfo())
    mockDecipher.mockResolvedValue('')

    const error = await captureFailure(resolveYoutubeAudioFromInnertube(innertube, VIDEO_ID))

    expect(error.code).toBe('service-unavailable')
    expect(getImportErrorMessage(error)).toContain('ANDROID_VR: ciphered stream URL')
  })

  test('reports the client and status when the client is forbidden', async () => {
    mockGetBasicInfo.mockRejectedValue(FORBIDDEN)

    const error = await captureFailure(resolveYoutubeAudioFromInnertube(innertube, VIDEO_ID))

    expect(mockGetBasicInfo).toHaveBeenCalledTimes(1)
    expect(error.code).toBe('service-unavailable')
    expect(getImportErrorMessage(error)).toContain('ANDROID_VR: 403')
  })

  test('reports the client and message on a network failure', async () => {
    mockGetBasicInfo.mockRejectedValue(new Error('Network request failed'))

    const error = await captureFailure(resolveYoutubeAudioFromInnertube(innertube, VIDEO_ID))

    expect(getImportErrorMessage(error)).toContain('ANDROID_VR: Network request failed')
  })

  test('passes through a playability error', async () => {
    mockGetBasicInfo.mockResolvedValue({
      ...buildInfo(),
      playability_status: { status: 'LOGIN_REQUIRED' },
    })

    await expect(resolveYoutubeAudioFromInnertube(innertube, VIDEO_ID)).rejects.toMatchObject({
      code: 'login-required',
    })
  })
})
