import { InvidiousInstanceError, validateInvidiousInstance } from './validateInvidiousInstance'

const BASE_URL = 'https://inv.phobos.observer'
const CREDENTIALS_BASE_URL = 'https://admin:secret@inv.phobos.observer//'
const AUDIO_URL = 'https://inv.phobos.observer/videoplayback?audio=140'
const VIDEO_ID = 'dQw4w9WgXcQ'

const AUDIO_FIXTURE = {
  adaptiveFormats: [
    { bitrate: '133546', itag: '140', type: 'audio/mp4; codecs="mp4a.40.2"', url: AUDIO_URL },
    {
      bitrate: '900000',
      itag: '137',
      type: 'video/mp4; codecs="avc1"',
      url: 'https://inv.phobos.observer/720p',
    },
  ],
  title: 'Test video',
}

const jsonResponse = (payload: unknown, status = 200) =>
  ({
    headers: { get: () => 'application/json' },
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(payload),
  }) as unknown as Response

const htmlResponse = (status = 200) =>
  ({
    headers: { get: () => 'text/html; charset=utf-8' },
    ok: status >= 200 && status < 300,
    status,
    text: async () => '<!DOCTYPE html><html><body>Anubis anti-bot challenge</body></html>',
  }) as unknown as Response

const binaryResponse = () =>
  ({
    headers: { get: () => 'application/octet-stream' },
    ok: true,
    status: 200,
    text: async () => 'not json',
  }) as unknown as Response

describe('validateInvidiousInstance', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('passes when the api returns an audio/mp4 format with url', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(AUDIO_FIXTURE))

    await expect(validateInvidiousInstance(BASE_URL)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/videos/${VIDEO_ID}?local=true`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
          'User-Agent': expect.any(String),
        }),
      }),
    )
  })

  test('trims trailing slashes and moves credentials into the auth header', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(AUDIO_FIXTURE))

    await validateInvidiousInstance(CREDENTIALS_BASE_URL)

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/videos/${VIDEO_ID}?local=true`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Basic ${btoa('admin:secret')}` }),
      }),
    )
  })

  test('reports an anti-bot html body as a known failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(htmlResponse(200))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.toThrow(
      'Инстанс закрыт антиботом — API недоступен',
    )
  })

  test('reports 401 as a known authorization failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, 401))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.toBeInstanceOf(InvidiousInstanceError)
  })

  test('reports 403 as a known authorization failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({}, 403))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.toThrow(
      'Инстанс требует авторизацию — API недоступен',
    )
  })

  test('reports a json body without audio formats as a known failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ adaptiveFormats: [] }))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.toThrow(
      'API инстанса не отдаёт аудио для тестового видео',
    )
  })

  test('reports an instance error body as a known failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ error: 'Video unavailable' }))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.toBeInstanceOf(InvidiousInstanceError)
  })

  test('rethrows a network failure as unknown', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network request failed'))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.toThrow('Network request failed')
  })

  test('reports a non-200 json response as unknown, not a known failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ error: 'oops' }, 500))

    await expect(validateInvidiousInstance(BASE_URL)).rejects.not.toBeInstanceOf(
      InvidiousInstanceError,
    )
  })

  test('reports a non-json 200 body as unknown', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(binaryResponse())

    await expect(validateInvidiousInstance(BASE_URL)).rejects.not.toBeInstanceOf(
      InvidiousInstanceError,
    )
  })
})
