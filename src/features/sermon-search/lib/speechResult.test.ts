import { extractSpeechTranscript } from './speechResult'

const RESULTS_KEY = 'android.speech.extra.RESULTS'
const PHRASE = 'проповедь о любви'

describe('extractSpeechTranscript', () => {
  test('returns undefined when the extras are missing', () => {
    expect(extractSpeechTranscript(undefined)).toBeUndefined()
    expect(extractSpeechTranscript(null)).toBeUndefined()
  })

  test('reads the first phrase out of the standard results array', () => {
    expect(extractSpeechTranscript({ [RESULTS_KEY]: [PHRASE, 'второй вариант'] })).toBe(PHRASE)
  })

  test('reads index-keyed results (Bundle/ArrayList serialized as an object)', () => {
    expect(extractSpeechTranscript({ [RESULTS_KEY]: { 0: PHRASE, 1: 'второй вариант' } })).toBe(
      PHRASE,
    )
  })

  test('skips non-string entries and blank phrases', () => {
    expect(extractSpeechTranscript({ [RESULTS_KEY]: [null, 42, '   ', PHRASE] })).toBe(PHRASE)
  })

  test('accepts the whole activity result with a nested extra bundle', () => {
    const result = { data: 'intent://speech', extra: { [RESULTS_KEY]: [PHRASE] }, resultCode: -1 }

    expect(extractSpeechTranscript(result)).toBe(PHRASE)
  })

  test('accepts a bare string result', () => {
    expect(extractSpeechTranscript({ [RESULTS_KEY]: PHRASE })).toBe(PHRASE)
  })

  test('falls back to the plain results key', () => {
    expect(extractSpeechTranscript({ results: [PHRASE] })).toBe(PHRASE)
  })

  test('trims the recognized phrase', () => {
    expect(extractSpeechTranscript({ [RESULTS_KEY]: [`  ${PHRASE}  `] })).toBe(PHRASE)
  })

  test('never throws on unexpected payloads', () => {
    const hostile = {
      get [RESULTS_KEY](): string[] {
        throw new Error('unreadable extras')
      },
    }

    expect(() => extractSpeechTranscript(hostile)).not.toThrow()
    expect(extractSpeechTranscript(hostile)).toBeUndefined()
    expect(extractSpeechTranscript('garbage')).toBeUndefined()
    expect(extractSpeechTranscript([1, 2, 3])).toBeUndefined()
    expect(extractSpeechTranscript({ [RESULTS_KEY]: [] })).toBeUndefined()
  })
})
