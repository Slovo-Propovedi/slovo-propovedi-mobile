import { useCallback, useRef } from 'react'
import { reportError } from 'shared/model/error-dialog'
import {
  isWebVoiceUnavailableError,
  startWebVoiceSession,
  VOICE_ERROR,
  type WebVoiceSession,
} from './webVoiceSession'

const VOICE_RECOGNIZE_ERROR = 'Не удалось распознать речь'

interface WebVoiceSessionOptions {
  /** Keeps the mic icon in sync with the live session. */
  onListeningChange: (isListening: boolean) => void
  /** Receives the recognized text (already trimmed). */
  onTranscript: (text: string) => void
  /** The recognizer refused to run at all; the device is unavailable. */
  onUnavailable: () => void
}

type WebVoiceStartResult = 'failed' | 'started' | 'unavailable'

/**
 * Owns the Web Speech recognizer lifecycle for voice search. Starting again
 * replaces the live session; a superseded recognizer's late events are ignored
 * by the session itself.
 * @param options - Callbacks for listening changes, transcripts and refusal.
 * @param options.onListeningChange - Keeps the mic icon in sync with the session.
 * @param options.onTranscript - Receives the recognized text.
 * @param options.onUnavailable - Called when the recognizer refuses to run.
 * @returns Start (with the outcome) and abort triggers.
 */
export const useWebVoiceSession = ({
  onListeningChange,
  onTranscript,
  onUnavailable,
}: WebVoiceSessionOptions) => {
  const sessionRef = useRef<null | WebVoiceSession>(null)

  const stop = useCallback(() => {
    const session = sessionRef.current
    if (session === null) return

    sessionRef.current = null
    onListeningChange(false)
    session.abort()
  }, [onListeningChange])

  const start = useCallback((): WebVoiceStartResult => {
    // A previous session may still be live if its `onend` never arrived.
    stop()

    try {
      const session = startWebVoiceSession({
        onEnd: () => {
          sessionRef.current = null
          onListeningChange(false)
        },
        onError: error => {
          sessionRef.current = null
          onListeningChange(false)

          // A recognizer that refuses to run at all is an availability problem,
          // not a failed attempt: the caller shows the friendly info instead.
          if (isWebVoiceUnavailableError(error)) {
            onUnavailable()
            return
          }

          reportError(error, VOICE_RECOGNIZE_ERROR)
        },
        onResult: transcript => {
          // The mic returns to its idle icon immediately; the session reference
          // stays until `onend` so the abort path still has a live handle.
          onListeningChange(false)
          onTranscript(transcript)
        },
      })

      if (session === null) return 'unavailable'

      sessionRef.current = session
      onListeningChange(true)
      return 'started'
    } catch (error) {
      onListeningChange(false)
      reportError(error, VOICE_ERROR)
      return 'failed'
    }
  }, [onListeningChange, onTranscript, onUnavailable, stop])

  return { start, stop }
}
