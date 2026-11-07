import { useCallback, useState } from 'react'
import { Platform } from 'react-native'
import { z } from 'zod'
import { reportError } from 'shared/model/error-dialog'
import { showInfo } from 'shared/model/info-dialog'
import { getWebSpeechRecognitionCtor, isVoiceInputAvailable } from './webSpeechRecognition'

const SPEECH_LANGUAGE = 'ru-RU'
const ANDROID_RECOGNIZE_SPEECH = 'android.speech.action.RECOGNIZE_SPEECH'
const ANDROID_LANGUAGE_MODEL = 'android.speech.extra.LANGUAGE_MODEL'
const ANDROID_PROMPT = 'android.speech.extra.PROMPT'
const ANDROID_RESULTS = 'android.speech.extra.RESULTS'
const VOICE_PROMPT = 'Произнесите поисковый запрос'
const VOICE_ERROR = 'Не удалось запустить голосовой ввод'
const VOICE_UNAVAILABLE = 'Голосовой ввод недоступен на этом устройстве'

const androidSpeechResultSchema = z
  .object({ [ANDROID_RESULTS]: z.array(z.string()).optional() })
  .passthrough()

interface VoiceInput {
  isListening: boolean
  startListening: () => void
}

/**
 * Voice search with a zero-dependency platform split.
 * Web uses the Web Speech API; Android launches the system RECOGNIZE_SPEECH intent through expo-intent-launcher, which returns the activity extras.
 * IOS has no implementation yet: pressing the always-visible mic reports the feature as unavailable.
 * Every failure is soft: the recognizer reports through `reportError` and never throws into the UI.
 * @param root0 - Hook options.
 * @param root0.onTranscript - Receives the recognized text (already trimmed).
 * @returns Listening state and the start trigger.
 */
export const useVoiceInput = ({
  onTranscript,
}: {
  onTranscript: (text: string) => void
}): VoiceInput => {
  const [isListening, setIsListening] = useState(false)

  const startWeb = useCallback(() => {
    const Recognition = getWebSpeechRecognitionCtor()
    if (Recognition === null) return

    const recognition = new Recognition()
    recognition.lang = SPEECH_LANGUAGE
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
      if (transcript) onTranscript(transcript)
    }
    recognition.onerror = event => {
      // Cancelling and silence are normal user outcomes, not app errors.
      if (event.error === 'aborted' || event.error === 'no-speech') return
      reportError(event.error, 'Не удалось распознать речь')
    }
    recognition.onend = () => {
      setIsListening(false)
    }
    setIsListening(true)

    try {
      recognition.start()
    } catch (error) {
      setIsListening(false)
      reportError(error, VOICE_ERROR)
    }
  }, [onTranscript])

  const startAndroid = useCallback(async () => {
    setIsListening(true)

    try {
      const IntentLauncher = await import('expo-intent-launcher')
      const result = await IntentLauncher.startActivityAsync(ANDROID_RECOGNIZE_SPEECH, {
        extra: {
          [ANDROID_LANGUAGE_MODEL]: 'free_form',
          [ANDROID_PROMPT]: VOICE_PROMPT,
        },
      })
      if (result.resultCode !== IntentLauncher.ResultCode.Success) return

      const parsed = androidSpeechResultSchema.safeParse(result.extra)
      const transcript = parsed.success ? parsed.data[ANDROID_RESULTS]?.[0]?.trim() : ''
      if (transcript) onTranscript(transcript)
    } catch (error) {
      reportError(error, VOICE_ERROR)
    } finally {
      setIsListening(false)
    }
  }, [onTranscript])

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

  return {
    isListening,
    startListening,
  }
}
