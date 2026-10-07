/* eslint-disable camelcase -- форматы InnerTube приходят в snake_case */
import {
  assertVideoIsDownloadable,
  isYoutubeForbiddenError,
  pickAudioFormat,
  readYoutubeHttpStatus,
  toImportErrorCode,
  type YoutubeAudioFormat,
} from './youtubeFormat'

const MP4_AUDIO = 'audio/mp4; codecs="mp4a.40.2"'
const OPUS_AUDIO = 'audio/webm; codecs="opus"'
const MP4_VIDEO = 'video/mp4; codecs="avc1.42001E"'

const buildFormat = (overrides: Partial<YoutubeAudioFormat> = {}): YoutubeAudioFormat => ({
  bitrate: 128_000,
  itag: 140,
  mime_type: MP4_AUDIO,
  ...overrides,
})

describe('toImportErrorCode', () => {
  test('maps LOGIN_REQUIRED to a login error', () => {
    expect(toImportErrorCode('LOGIN_REQUIRED')).toBe('login-required')
  })

  test('maps other statuses to an unavailable video', () => {
    expect(toImportErrorCode('ERROR')).toBe('video-unavailable')
    expect(toImportErrorCode('UNPLAYABLE')).toBe('video-unavailable')
  })

  test('allows an OK or missing status', () => {
    expect(toImportErrorCode('OK')).toBeNull()
    expect(toImportErrorCode(undefined)).toBeNull()
  })
})

describe('assertVideoIsDownloadable', () => {
  test('throws a login error for LOGIN_REQUIRED', () => {
    expect(() => assertVideoIsDownloadable({ isLive: false, status: 'LOGIN_REQUIRED' })).toThrow(
      expect.objectContaining({ code: 'login-required' }),
    )
  })

  test('throws an unavailable error for ERROR', () => {
    expect(() => assertVideoIsDownloadable({ isLive: false, status: 'ERROR' })).toThrow(
      expect.objectContaining({ code: 'video-unavailable' }),
    )
  })

  test('throws for a live stream', () => {
    expect(() => assertVideoIsDownloadable({ isLive: true, status: 'OK' })).toThrow(
      expect.objectContaining({ code: 'live' }),
    )
  })

  test('passes for a normal downloadable video', () => {
    expect(() => assertVideoIsDownloadable({ isLive: false, status: 'OK' })).not.toThrow()
    expect(() => assertVideoIsDownloadable({ isLive: false, status: undefined })).not.toThrow()
  })
})

describe('readYoutubeHttpStatus', () => {
  test('reads the status from a youtubei.js request error', () => {
    const error = new Error(
      'Request to https://youtubei.googleapis.com failed with status code 403',
    )

    expect(readYoutubeHttpStatus(error)).toBe(403)
  })

  test('returns undefined for network errors and non-errors', () => {
    expect(readYoutubeHttpStatus(new Error('Network request failed'))).toBeUndefined()
    expect(readYoutubeHttpStatus('403')).toBeUndefined()
  })
})

describe('isYoutubeForbiddenError', () => {
  test('is true only for a 403', () => {
    expect(isYoutubeForbiddenError(new Error('failed with status code 403'))).toBe(true)
    expect(isYoutubeForbiddenError(new Error('failed with status code 500'))).toBe(false)
    expect(isYoutubeForbiddenError(new Error('Network request failed'))).toBe(false)
  })
})

describe('pickAudioFormat', () => {
  test('prefers itag 140 over a higher bitrate opus track', () => {
    const opus = buildFormat({ bitrate: 256_000, itag: 251, mime_type: OPUS_AUDIO })

    expect(pickAudioFormat([opus, buildFormat()])).toMatchObject({ itag: 140 })
  })

  test('takes the first itag 140 when the response duplicates it', () => {
    const first = buildFormat({ bitrate: 128_000 })
    const duplicate = buildFormat({ bitrate: 96_000 })

    expect(pickAudioFormat([first, duplicate])).toBe(first)
  })

  test('falls back to the highest bitrate mp4 audio', () => {
    const low = buildFormat({ bitrate: 64_000, itag: 139 })
    const high = buildFormat({ bitrate: 192_000, itag: 141 })

    expect(pickAudioFormat([low, high])).toBe(high)
  })

  test('prefers the original track over a dubbed track with the same itag', () => {
    const dubbed = buildFormat({ audio_track: { display_name: 'French dubbed' } })
    const original = buildFormat({ audio_track: { display_name: 'English (US) original' } })

    expect(pickAudioFormat([dubbed, original])).toBe(original)
  })

  test('treats a format without audio_track as the original single track', () => {
    const dubbed = buildFormat({ audio_track: { display_name: 'French dubbed' } })
    const untagged = buildFormat({ itag: 139 })

    expect(pickAudioFormat([dubbed, untagged])).toBe(untagged)
  })

  test('keeps the plain itag/bitrate logic when every track is dubbed', () => {
    const dubbed140 = buildFormat({ audio_track: { display_name: 'French dubbed' } })
    const dubbedHigh = buildFormat({
      audio_track: { display_name: 'German dubbed' },
      bitrate: 192_000,
      itag: 141,
    })

    expect(pickAudioFormat([dubbed140, dubbedHigh])).toBe(dubbed140)
  })

  test('returns null without audio/mp4 formats', () => {
    expect(pickAudioFormat([buildFormat({ mime_type: OPUS_AUDIO })])).toBeNull()
    expect(pickAudioFormat([buildFormat({ mime_type: MP4_VIDEO })])).toBeNull()
    expect(pickAudioFormat([])).toBeNull()
  })
})
