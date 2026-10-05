/* eslint-disable camelcase -- форматы InnerTube приходят в snake_case */
import {
  assertVideoIsDownloadable,
  pickAudioFormat,
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

  test('returns null without audio/mp4 formats', () => {
    expect(pickAudioFormat([buildFormat({ mime_type: OPUS_AUDIO })])).toBeNull()
    expect(pickAudioFormat([buildFormat({ mime_type: MP4_VIDEO })])).toBeNull()
    expect(pickAudioFormat([])).toBeNull()
  })
})
