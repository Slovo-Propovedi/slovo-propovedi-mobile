import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { reportError } from 'shared/model/error-dialog'
import { showInfo } from 'shared/model/info-dialog'
import { recognizeAndroidSpeech } from './androidVoiceInput'
import { useWebVoiceSession } from './useWebVoiceSession'
import { getWebVoicePermissionState, isVoiceInputAvailable } from './webSpeechRecognition'
import { VOICE_ERROR } from './webVoiceSession'

const VOICE_UNAVAILABLE = 'Голосовой ввод недоступен на этом устройстве'

interface VoiceInput {
  isListening: boolean
  /** True when this device cannot run speech recognition at all. */
  isUnavailable: boolean
  startListening: () => void
  stopListening: () => void
}

/**
 * Voice search with a zero-dependency platform split.
 * Web uses the Web Speech API; Android launches the system RECOGNIZE_SPEECH intent through expo-intent-launcher, which returns the activity extras.
 * IOS has no implementation yet: pressing the always-visible mic reports the feature as unavailable.
 * The web recognizer is owned by this hook: starting again replaces the live
 * session, and `stopListening` aborts it on blur, clear, close and unmount.
 * `isUnavailable` starts true where no recognizer exists and flips on when the
 * recognizer itself reports it cannot run (browser without a speech backend) or
 * when the microphone permission is already denied; the mic stays tappable and
 * explains itself through the info dialog.
 * Every failure is soft: the recognizer reports through `reportError` and never throws into the UI.
 * @param root0 - Hook options.
 * @param root0.onTranscript - Receives the recognized text (already trimmed).
 * @returns Listening state, availability, the start trigger and the abort trigger.
 */
export const useVoiceInput = ({
  onTranscript,
}: {
  onTranscript: (text: string) => void
}): VoiceInput => {
  const [isListening, setIsListening] = useState(false)
  // Platforms without a recognizer (iOS, browsers without the constructor)
  // still render the mic, but it starts in the unavailable state.
  const [isUnavailable, setIsUnavailable] = useState(!isVoiceInputAvailable())
  const { start: startWeb, stop: stopWeb } = useWebVoiceSession({
    onListeningChange: setIsListening,
    onTranscript,
    onUnavailable: () => {
      setIsUnavailable(true)
      showInfo(VOICE_UNAVAILABLE)
    },
  })

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

    if (isUnavailable || !isVoiceInputAvailable()) {
      showInfo(VOICE_UNAVAILABLE)
      return
    }

    if (Platform.OS === 'web') {
      if (startWeb() === 'unavailable') showInfo(VOICE_UNAVAILABLE)
      return
    }

    void startAndroid()
  }, [isListening, isUnavailable, startAndroid, startWeb])

  // The bar stays mounted for the island's exit animation, so an in-flight
  // recognizer must be torn down explicitly when the tree unmounts.
  useEffect(() => stopWeb, [stopWeb])

  // An already-denied permission cannot be retried by pressing the mic, so the
  // icon starts muted. The probe never rejects; a failure just keeps the mic
  // on its optimistic default.
  useEffect(() => {
    if (Platform.OS !== 'web') return

    void getWebVoicePermissionState().then(state => {
      if (state === 'denied') setIsUnavailable(true)
    })
  }, [])

  return {
    isListening,
    isUnavailable,
    startListening,
    stopListening,
  }
}
