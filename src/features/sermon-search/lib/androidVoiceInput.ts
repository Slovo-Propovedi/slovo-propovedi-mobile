import { extractSpeechTranscript } from './speechResult'

const ANDROID_RECOGNIZE_SPEECH = 'android.speech.action.RECOGNIZE_SPEECH'
const ANDROID_LANGUAGE_MODEL = 'android.speech.extra.LANGUAGE_MODEL'
const ANDROID_PROMPT = 'android.speech.extra.PROMPT'
const VOICE_PROMPT = 'Произнесите поисковый запрос'

/**
 * Launches the system speech recognizer through expo-intent-launcher and reads
 * the recognized phrase out of the returned activity extras. No new dependency
 * is needed: `startActivityAsync` resolves with the activity result.
 * @returns The recognized phrase, or undefined when the user cancelled.
 */
export const recognizeAndroidSpeech = async (): Promise<string | undefined> => {
  const IntentLauncher = await import('expo-intent-launcher')
  const result = await IntentLauncher.startActivityAsync(ANDROID_RECOGNIZE_SPEECH, {
    extra: {
      [ANDROID_LANGUAGE_MODEL]: 'free_form',
      [ANDROID_PROMPT]: VOICE_PROMPT,
    },
  })
  if (result.resultCode !== IntentLauncher.ResultCode.Success) return undefined

  // Extras come from a foreign activity: every shape must degrade to "no
  // transcript" instead of throwing back into the UI.
  return extractSpeechTranscript(result)
}
