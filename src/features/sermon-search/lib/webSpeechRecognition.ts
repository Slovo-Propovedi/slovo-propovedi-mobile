import { Platform } from 'react-native'

/** Minimal Web Speech API surface the search bar relies on. */
export interface WebSpeechRecognition {
  abort: () => void
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: WebSpeechResultEvent) => void) | null
  start: () => void
  stop: () => void
}

/** One recognition result; `isFinal` is false while the phrase is still interim. */
export interface WebSpeechResult extends ArrayLike<WebSpeechAlternative> {
  isFinal?: boolean
}

/** The subset of `SpeechRecognitionEvent` the search bar reads. */
export interface WebSpeechResultEvent {
  resultIndex?: number
  results: ArrayLike<WebSpeechResult>
}

/** One recognized alternative as delivered by the Web Speech API. */
interface WebSpeechAlternative {
  confidence?: number
  transcript?: string
}

type WebSpeechRecognitionCtor = new () => WebSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: WebSpeechRecognitionCtor
    webkitSpeechRecognition?: WebSpeechRecognitionCtor
  }
}

/**
 * Resolves the browser's speech-recognition constructor. Browsers disagree on
 * the prefix (`SpeechRecognition` / `webkitSpeechRecognition`), so both are
 * probed; a missing API means the mic stays hidden.
 * @returns The constructor, or null when the browser has no support.
 */
export const getWebSpeechRecognitionCtor = (): null | WebSpeechRecognitionCtor => {
  if (typeof window === 'undefined') return null

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

/**
 * Whether voice search can run on the current platform.
 * Web uses the Web Speech API; Android uses the system recognizer intent.
 * IOS is not wired this round.
 * @param platform - Platform to check; defaults to the running one.
 * @returns True when the mic affordance should be shown.
 */
export const isVoiceInputAvailable = (platform = Platform.OS): boolean => {
  if (platform === 'web') return getWebSpeechRecognitionCtor() !== null

  return platform === 'android'
}

/**
 * Reads the recognized phrase out of a Web Speech result event. Only final
 * results are taken: interim text is not written into the query, because the
 * field would flicker and each keystroke-like change would trigger a search.
 * Never throws — a malformed event degrades to an empty transcript.
 * @param event - The event the recognizer delivered.
 * @returns The final phrase, or an empty string when none is available.
 */
export const extractWebSpeechTranscript = (event: WebSpeechResultEvent): string => {
  const results = event?.results
  if (!results || typeof results.length !== 'number') return ''

  const phrases: string[] = []
  for (let index = event.resultIndex ?? 0; index < results.length; index += 1) {
    const result = results[index]
    if (!result || result.isFinal === false) continue

    const transcript = result[0]?.transcript
    if (typeof transcript !== 'string') continue

    const phrase = transcript.trim()
    if (phrase.length > 0) phrases.push(phrase)
  }

  return phrases.join(' ')
}
