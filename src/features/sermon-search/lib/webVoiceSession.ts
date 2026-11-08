import {
  extractWebSpeechTranscript,
  getWebSpeechRecognitionCtor,
  type WebSpeechRecognition,
} from './webSpeechRecognition'

const SPEECH_LANGUAGE = 'ru-RU'

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
