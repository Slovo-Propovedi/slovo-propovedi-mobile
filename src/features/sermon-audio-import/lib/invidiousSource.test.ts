import { type ImportErrorCode } from './importTypes'
import { resolveInvidiousAudio } from './invidiousSource'
import { getImportErrorMessage, ImportSourceError } from './sourceErrors'

const VIDEO_ID = 'lV6YkF7ytxs'
const BASE_URL = 'https://inv.phobos.observer'
const CREDENTIALS_BASE_URL = 'https://admin:secret@inv.phobos.observer'
const BASIC_AUTH_HEADER = `Basic ${btoa('admin:secret')}`
const ORIGINAL_MP4_URL =
  'https://inv.phobos.observer/videoplayback?itag=140&xtags=acont%3Doriginal%3Alang%3Dru'
const DUBBED_MP4_URL =
  'https://inv.phobos.observer/videoplayback?itag=140&xtags=acont%3Ddubbed-auto%3Alang%3Den'
const OPUS_URL =
  'https://inv.phobos.observer/videoplayback?itag=251&xtags=acont%3Ddubbed-auto%3Alang%3Den'

const TITLE = 'Проповедь о покаянии'
const DESCRIPTION = 'Текст проповеди из YouTube'

// Форма ответа инстанса: числовые поля приходят строками, itag 140 дублируется:
// первым идёт дубль с большим битрейтом, за ним — оригинал (xtags=acont=original).
const VIDEO_FIXTURE = {
  adaptiveFormats: [
    {
      bitrate: '133549',
      itag: '140',
      type: 'audio/mp4; codecs="mp4a.40.2"',
      url: DUBBED_MP4_URL,
    },
    {
      bitrate: '133546',
      itag: '140',
      type: 'audio/mp4; codecs="mp4a.40.2"',
      url: ORIGINAL_MP4_URL,
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

const jsonResponse = (payload: unknown, ok = true, status = ok ? 200 : 500) =>
  ({
    headers: { get: () => 'application/json' },
    json: async () => payload,
    ok,
    status,
    text: async () => JSON.stringify(payload),
  }) as unknown as Response

const htmlResponse = (status = 200) => {
  const body = '<!DOCTYPE html><html><body>Anubis anti-bot challenge</body></html>'

  return {
    headers: { get: () => 'text/html; charset=utf-8' },
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  } as unknown as Response
}

const expectFailure = async (importPromise: Promise<unknown>, code: ImportErrorCode) => {
  await expect(importPromise).rejects.toMatchObject({ code })
}

const captureFailureMessage = async (importPromise: Promise<unknown>): Promise<string> => {
  try {
    await importPromise
  } catch (error) {
    return getImportErrorMessage(error)
  }

  throw new Error('expected the import to fail')
}

describe('resolveInvidiousAudio', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('prefers the original itag 140 mp4 format over a higher-bitrate dub and maps the metadata', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(VIDEO_FIXTURE))

    const resolved = await resolveInvidiousAudio(BASE_URL, VIDEO_ID)

    expect(resolved).toEqual({
      audioUrl: ORIGINAL_MP4_URL,
      description: DESCRIPTION,
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

  test('falls back to the plain itag 140 preference when no original track exists', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({
        adaptiveFormats: [
          {
            bitrate: '133549',
            itag: '140',
            type: 'audio/mp4; codecs="mp4a.40.2"',
            url: DUBBED_MP4_URL,
          },
          { bitrate: '139480', itag: '251', type: 'audio/webm; codecs="opus"', url: OPUS_URL },
        ],
        lengthSeconds: '10',
        title: TITLE,
      }),
    )

    const resolved = await resolveInvidiousAudio(BASE_URL, VIDEO_ID)

    expect(resolved.audioUrl).toBe(DUBBED_MP4_URL)
  })

  test('trims trailing slashes of the instance url', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(VIDEO_FIXTURE))

    await resolveInvidiousAudio('  https://x.example//  ', VIDEO_ID)

    expect(fetchMock).toHaveBeenCalledWith(
      `https://x.example/api/v1/videos/${VIDEO_ID}?local=true`,
      expect.any(Object),
    )
  })

  test('sends basic auth header and keeps credentials out of the request url', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(VIDEO_FIXTURE))

    await resolveInvidiousAudio(CREDENTIALS_BASE_URL, VIDEO_ID)

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/videos/${VIDEO_ID}?local=true`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: BASIC_AUTH_HEADER }),
      }),
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

  test('names the instance when it requires authorization', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, false, 401))

    const message = await captureFailureMessage(resolveInvidiousAudio(BASE_URL, VIDEO_ID))

    expect(message).toContain('inv.phobos.observer')
    expect(message).toContain('требует авторизацию')
  })

  test('keeps credentials out of the error message host', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, false, 401))

    const message = await captureFailureMessage(
      resolveInvidiousAudio(CREDENTIALS_BASE_URL, VIDEO_ID),
    )

    expect(message).toContain('inv.phobos.observer')
    expect(message).not.toContain('admin')
    expect(message).not.toContain('secret')
  })

  test('names the instance when it is closed by an anti-bot on 403', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, false, 403))

    const message = await captureFailureMessage(resolveInvidiousAudio(BASE_URL, VIDEO_ID))

    expect(message).toContain('inv.phobos.observer')
    expect(message).toContain('закрыт антиботом')
  })

  test('detects an anti-bot HTML body served with 200', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(htmlResponse(200))

    const message = await captureFailureMessage(resolveInvidiousAudio(BASE_URL, VIDEO_ID))

    expect(message).toContain('inv.phobos.observer')
    expect(message).toContain('закрыт антиботом')
  })

  test('detects an anti-bot HTML body served with 503', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(htmlResponse(503))

    const message = await captureFailureMessage(resolveInvidiousAudio(BASE_URL, VIDEO_ID))

    expect(message).toContain('закрыт антиботом')
  })

  test('keeps the plain service message for a JSON 500', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ error: 'oops' }, false, 500))

    const message = await captureFailureMessage(resolveInvidiousAudio(BASE_URL, VIDEO_ID))

    expect(message).toBe('Сервис недоступен')
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
