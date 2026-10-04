import { type ImportErrorCode } from './importTypes'
import { resolveInvidiousAudio } from './invidiousSource'
import { ImportSourceError } from './sourceErrors'

const VIDEO_ID = 'lV6YkF7ytxs'
const BASE_URL = 'https://inv.phobos.observer'
const FIRST_MP4_URL = 'https://inv.phobos.observer/videoplayback?audio=first'
const SECOND_MP4_URL = 'https://inv.phobos.observer/videoplayback?audio=second'
const OPUS_URL = 'https://inv.phobos.observer/videoplayback?audio=opus'

const TITLE = 'Проповедь о покаянии'
const DESCRIPTION = 'Текст проповеди из YouTube'

// Форма ответа инстанса: числовые поля приходят строками, itag 140 дублируется.
const VIDEO_FIXTURE = {
  adaptiveFormats: [
    { bitrate: '133546', itag: '140', type: 'audio/mp4; codecs="mp4a.40.2"', url: FIRST_MP4_URL },
    {
      bitrate: '133549',
      itag: '140',
      type: 'audio/mp4; codecs="mp4a.40.2"',
      url: SECOND_MP4_URL,
    },
    { bitrate: '139480', itag: '251', type: 'audio/webm; codecs="opus"', url: OPUS_URL },
    {
      bitrate: '900000',
      itag: '137',
      type: 'video/mp4; codecs="avc1"',
      url: 'https://inv.test/720p',
    },
  ],
  description: DESCRIPTION,
  lengthSeconds: '2965',
  title: TITLE,
}

const jsonResponse = (payload: unknown, ok = true) =>
  ({ json: async () => payload, ok }) as unknown as Response

const expectFailure = async (importPromise: Promise<unknown>, code: ImportErrorCode) => {
  await expect(importPromise).rejects.toMatchObject({ code })
}

describe('resolveInvidiousAudio', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('takes the first itag 140 mp4 format and maps the metadata', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(VIDEO_FIXTURE))

    const resolved = await resolveInvidiousAudio(BASE_URL, VIDEO_ID)

    expect(resolved).toEqual({
      audioUrl: FIRST_MP4_URL,
      description: DESCRIPTION,
      durationSec: 2965,
      title: TITLE,
      videoId: VIDEO_ID,
    })
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/videos/${VIDEO_ID}?local=true`,
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    )
  })

  test('trims trailing slashes of the instance url', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(VIDEO_FIXTURE))

    await resolveInvidiousAudio('  https://x.example//  ', VIDEO_ID)

    expect(fetchMock).toHaveBeenCalledWith(
      `https://x.example/api/v1/videos/${VIDEO_ID}?local=true`,
      expect.any(Object),
    )
  })

  test('falls back to the highest bitrate audio format', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({
        adaptiveFormats: VIDEO_FIXTURE.adaptiveFormats.filter(format => format.itag !== '140'),
        lengthSeconds: '10',
        title: TITLE,
      }),
    )

    const resolved = await resolveInvidiousAudio(BASE_URL, VIDEO_ID)

    expect(resolved.audioUrl).toBe(OPUS_URL)
    expect(resolved.description).toBeNull()
  })

  test('reports the instance error as an unavailable video', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ error: 'Video unavailable' }))

    await expectFailure(resolveInvidiousAudio(BASE_URL, VIDEO_ID), 'video-unavailable')
  })

  test('reports a network failure as an unavailable service', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'))

    await expectFailure(resolveInvidiousAudio(BASE_URL, VIDEO_ID), 'service-unavailable')
  })

  test('reports an http error as an unavailable service', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, false))

    await expectFailure(resolveInvidiousAudio(BASE_URL, VIDEO_ID), 'service-unavailable')
  })

  test('reports a response without audio formats', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ adaptiveFormats: [] }))

    await expectFailure(resolveInvidiousAudio(BASE_URL, VIDEO_ID), 'no-audio')
  })

  test('raises our own errors, not raw ones', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, false))

    await expect(resolveInvidiousAudio(BASE_URL, VIDEO_ID)).rejects.toBeInstanceOf(
      ImportSourceError,
    )
  })
})
