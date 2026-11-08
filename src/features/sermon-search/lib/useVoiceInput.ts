import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { reportError } from 'shared/model/error-dialog'
import { showInfo } from 'shared/model/info-dialog'
import { recognizeAndroidSpeech } from './androidVoiceInput'
import { isVoiceInputAvailable } from './webSpeechRecognition'
import { startWebVoiceSession, type WebVoiceSession } from './webVoiceSession'

const VOICE_ERROR = 'Не удалось запустить голосовой ввод'
const VOICE_UNAVAILABLE = 'Голосовой ввод недоступен на этом устройстве'
const VOICE_RECOGNIZE_ERROR = 'Не удалось распознать речь'

interface VoiceInput {
  isListening: boolean
  startListening: () => void
  stopListening: () => void
}

/**
 * Voice search with a zero-dependency platform split.
 * Web uses the Web Speech API; Android launches the system RECOGNIZE_SPEECH intent through expo-intent-launcher, which returns the activity extras.
 * IOS has no implementation yet: pressing the always-visible mic reports the feature as unavailable.
 * The web recognizer is owned by this hook: starting again replaces the live
 * session, and `stopListening` aborts it on blur, clear, close and unmount.
 * Every failure is soft: the recognizer reports through `reportError` and never throws into the UI.
 * @param root0 - Hook options.
 * @param root0.onTranscript - Receives the recognized text (already trimmed).
 * @returns Listening state, the start trigger and the abort trigger.
 */
export const useVoiceInput = ({
  onTranscript,
}: {
  onTranscript: (text: string) => void
}): VoiceInput => {
  const [isListening, setIsListening] = useState(false)
  const webSessionRef = useRef<null | WebVoiceSession>(null)

  const stopWeb = useCallback(() => {
    const session = webSessionRef.current
    if (session === null) return

    webSessionRef.current = null
    setIsListening(false)
    session.abort()
  }, [])

  const startWeb = useCallback(() => {
    // A previous session may still be live if its `onend` never arrived.
    stopWeb()

    try {
      const session = startWebVoiceSession({
        onEnd: () => {
          webSessionRef.current = null
          setIsListening(false)
        },
        onError: error => {
          webSessionRef.current = null
          setIsListening(false)
          reportError(error, VOICE_RECOGNIZE_ERROR)
        },
        onResult: transcript => {
          // The mic returns to its idle icon immediately; the session reference
          // stays until `onend` so the abort path still has a live handle.
          setIsListening(false)
          onTranscript(transcript)
        },
      })

      if (session === null) {
        showInfo(VOICE_UNAVAILABLE)
        return
      }

      webSessionRef.current = session
      setIsListening(true)
    } catch (error) {
      setIsListening(false)
      reportError(error, VOICE_ERROR)
    }
  }, [onTranscript, stopWeb])

  const startAndroid = useCallback(async () => {
    setIsListening(true)

    try {
      const transcript = await recognizeAndroidSpeech()
      if (transcript) onTranscript(transcript)
    } catch (error) {
      reportError(error, VOICE_ERROR)
    } finally {
      setIsListening(false)
    }
  }, [onTranscript])

  const stopListening = useCallback(() => {
    stopWeb()
  }, [stopWeb])

  const startListening = useCallback(() => {
    if (isListening) return

    if (!isVoiceInputAvailable()) {
      showInfo(VOICE_UNAVAILABLE)
      return
    }

    if (Platform.OS === 'web') {
      startWeb()
      return
    }

    void startAndroid()
  }, [isListening, startAndroid, startWeb])

  // The bar stays mounted for the island's exit animation, so an in-flight
  // recognizer must be torn down explicitly when the tree unmounts.
  useEffect(() => stopWeb, [stopWeb])

  return {
    isListening,
    startListening,
    stopListening,
  }
}
