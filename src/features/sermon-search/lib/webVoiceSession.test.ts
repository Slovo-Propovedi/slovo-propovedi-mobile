import { isWebVoiceUnavailableError } from './webVoiceSession'

describe('isWebVoiceUnavailableError', () => {
  test.each([
    'not-allowed',
    'service-not-allowed',
    'not-found',
    'audio-capture',
    'language-not-supported',
  ])('%s means the recognizer cannot run here', error => {
    expect(isWebVoiceUnavailableError(error)).toBe(true)
  })

  test.each(['aborted', 'no-speech', 'network', '', 'unknown'])(
    '%s stays a normal outcome or a real error',
    error => {
      expect(isWebVoiceUnavailableError(error)).toBe(false)
    },
  )
})
