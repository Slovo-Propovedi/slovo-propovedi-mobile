import { Platform } from 'react-native'
import {
  extractWebSpeechTranscript,
  getWebSpeechRecognitionCtor,
  isVoiceInputAvailable,
  type WebSpeechResult,
} from './webSpeechRecognition'

const PHRASE = 'привет мир'
const FakeRecognition = class {}
const FakePrefixedRecognition = class {}

const installWindow = (recognition?: unknown, prefixed?: unknown) => {
  const previousWindow = Object.getOwnPropertyDescriptor(global, 'window')
  const fakeWindow: Record<string, unknown> = {}
  if (recognition) fakeWindow.SpeechRecognition = recognition
  if (prefixed) fakeWindow.webkitSpeechRecognition = prefixed

  Object.defineProperty(global, 'window', {
    configurable: true,
    value: fakeWindow,
    writable: true,
  })

  return () => {
    if (previousWindow) Object.defineProperty(global, 'window', previousWindow)
    else Reflect.deleteProperty(global, 'window')
  }
}

const createResult = (transcript: string, isFinal: boolean): WebSpeechResult =>
  Object.assign([{ confidence: 1, transcript }], { isFinal })

describe('getWebSpeechRecognitionCtor', () => {
  test('returns null when there is no window (native / SSR)', () => {
    const previousWindow = Object.getOwnPropertyDescriptor(global, 'window')
    Reflect.deleteProperty(global, 'window')

    try {
      expect(getWebSpeechRecognitionCtor()).toBeNull()
    } finally {
      if (previousWindow) Object.defineProperty(global, 'window', previousWindow)
    }
  })

  test('prefers the unprefixed SpeechRecognition constructor', () => {
    const restore = installWindow(FakeRecognition, FakePrefixedRecognition)

    try {
      expect(getWebSpeechRecognitionCtor()).toBe(FakeRecognition)
    } finally {
      restore()
    }
  })

  test('falls back to webkitSpeechRecognition (Chrome/Safari prefix)', () => {
    const restore = installWindow(undefined, FakePrefixedRecognition)

    try {
      expect(getWebSpeechRecognitionCtor()).toBe(FakePrefixedRecognition)
    } finally {
      restore()
    }
  })

  test('returns null when the browser has no speech API (Firefox)', () => {
    const restore = installWindow()

    try {
      expect(getWebSpeechRecognitionCtor()).toBeNull()
    } finally {
      restore()
    }
  })
})

describe('isVoiceInputAvailable', () => {
  test('is true on web only when a recognizer constructor exists', () => {
    const restore = installWindow()

    try {
      expect(isVoiceInputAvailable('web')).toBe(false)
    } finally {
      restore()
    }

    const restoreWithApi = installWindow(undefined, FakePrefixedRecognition)

    try {
      expect(isVoiceInputAvailable('web')).toBe(true)
    } finally {
      restoreWithApi()
    }
  })

  test('keeps the Android system recognizer available without the Web Speech API', () => {
    expect(isVoiceInputAvailable('android')).toBe(true)
  })

  test('reports iOS as unavailable (no implementation yet)', () => {
    expect(isVoiceInputAvailable('ios')).toBe(false)
  })

  test('defaults to the running platform', () => {
    const restorePlatform = jest.replaceProperty(Platform, 'OS', 'ios')

    try {
      expect(isVoiceInputAvailable()).toBe(false)
    } finally {
      restorePlatform.restore()
    }
  })
})

describe('extractWebSpeechTranscript', () => {
  test('reads the final transcript out of the results list', () => {
    const event = { resultIndex: 0, results: [createResult(` ${PHRASE} `, true)] }

    expect(extractWebSpeechTranscript(event)).toBe(PHRASE)
  })

  test('skips results already handled before resultIndex', () => {
    const event = {
      resultIndex: 1,
      results: [createResult('старое', true), createResult('новое', true)],
    }

    expect(extractWebSpeechTranscript(event)).toBe('новое')
  })

  test('joins several final results with a space', () => {
    const event = {
      resultIndex: 0,
      results: [createResult('привет', true), createResult('мир', true)],
    }

    expect(extractWebSpeechTranscript(event)).toBe(PHRASE)
  })

  test('ignores interim results until they are final', () => {
    const event = { resultIndex: 0, results: [createResult('привет', false)] }

    expect(extractWebSpeechTranscript(event)).toBe('')
  })

  test('keeps a final result that omits the isFinal flag', () => {
    const event = { resultIndex: 0, results: [[{ transcript: 'аминь' }]] }

    expect(extractWebSpeechTranscript(event)).toBe('аминь')
  })

  test('never throws on unexpected payloads', () => {
    expect(extractWebSpeechTranscript({ results: [] })).toBe('')
    expect(extractWebSpeechTranscript({ results: [null] as never })).toBe('')
    expect(extractWebSpeechTranscript({ results: [[{ transcript: 42 } as never]] })).toBe('')
    expect(extractWebSpeechTranscript(undefined as never)).toBe('')
  })
})
