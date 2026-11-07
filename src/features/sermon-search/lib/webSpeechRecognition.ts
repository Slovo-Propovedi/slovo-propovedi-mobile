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
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  start: () => void
  stop: () => void
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
