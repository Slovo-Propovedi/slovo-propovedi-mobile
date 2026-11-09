import {
  extractWebSpeechTranscript,
  getWebSpeechRecognitionCtor,
  type WebSpeechRecognition,
} from './webSpeechRecognition'

const SPEECH_LANGUAGE = 'ru-RU'

/** Soft failure shown when a recognition attempt cannot be started at all. */
export const VOICE_ERROR = 'Не удалось запустить голосовой ввод'

export interface WebVoiceSession {
  abort: () => void
}

interface WebVoiceSessionHandlers {
  /** The session ended on its own (final result, silence, cancel). */
  onEnd: () => void
  /** The browser reported a real failure (`not-allowed`, `network`, …). */
  onError: (error: string) => void
  /** A final transcript is available. */
  onResult: (transcript: string) => void
}

const isNormalOutcome = (error: string) => error === 'aborted' || error === 'no-speech'

// These errors mean the recognizer cannot run on this device at all, not that
// one attempt failed: Chromium forks without a speech service still expose the
// constructor but refuse every session with `not-allowed`; `service-not-allowed`
// is the same refusal, while `not-found`/`audio-capture`/`language-not-supported`
// report a missing recognizer, missing microphone or unsupported language.
// `not-found` is not part of the standard W3C `SpeechRecognitionErrorCode` set:
// it stays here as defensive coverage for browsers that report it.
const UNAVAILABLE_ERRORS = [
  'not-allowed',
  'service-not-allowed',
  'not-found',
  'audio-capture',
  'language-not-supported',
] as const

/**
 * Whether a Web Speech error means speech recognition is unavailable on this
 * device, rather than a real failure of a single recognition attempt.
 * `aborted`/`no-speech` are normal outcomes; `network` and unknown errors stay
 * on the regular error path.
 * @param error - The `SpeechRecognitionErrorEvent.error` value.
 * @returns True when the mic should switch to the unavailable state.
 */
export const isWebVoiceUnavailableError = (error: string): boolean =>
  UNAVAILABLE_ERRORS.some(unavailableError => unavailableError === error)

/**
 * Starts one Web Speech recognition session. The session owns its recognition
 * instance: every callback is ignored once it ended or was aborted, so a late
 * event from a superseded session can never write into the query.
 * @param handlers - Callbacks for the final transcript and session end.
 * @returns The abortable session, or null when the browser has no API.
 * @throws {Error} When `start()` fails synchronously (`InvalidStateError`, denied permission).
 */
export const startWebVoiceSession = (handlers: WebVoiceSessionHandlers): null | WebVoiceSession => {
  const Recognition = getWebSpeechRecognitionCtor()
  if (Recognition === null) return null

  const recognition: WebSpeechRecognition = new Recognition()
  let isActive = true

  const finish = () => {
    if (!isActive) return
    isActive = false
    handlers.onEnd()
  }

  recognition.lang = SPEECH_LANGUAGE
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = event => {
    if (!isActive) return

    const transcript = extractWebSpeechTranscript(event)
    if (transcript.length > 0) handlers.onResult(transcript)
  }
  recognition.onerror = event => {
    if (!isActive) return
    isActive = false

    // Cancelling and silence are normal user outcomes, not app errors.
    if (isNormalOutcome(event.error ?? '')) handlers.onEnd()
    else handlers.onError(event.error ?? 'unknown')
  }
  recognition.onend = finish

  try {
    recognition.start()
  } catch (error) {
    isActive = false
    throw error
  }

  return {
    abort: () => {
      if (!isActive) return
      isActive = false

      try {
        recognition.abort()
      } catch {
        // Already stopped or never started: nothing to abort, nothing to report.
      }
    },
  }
}
