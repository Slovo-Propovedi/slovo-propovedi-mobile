import { reportError } from 'shared/model/error-dialog'
import { getErrorName } from './errorName'

const ABORT_RETRY_DELAY_MS = 75
const AUTOPLAY_BLOCKED_MESSAGE = 'Браузер заблокировал автоматическое возобновление воспроизведения'
const RESUME_FAILED_MESSAGE = 'Не удалось возобновить воспроизведение после прерывания'

const reportResumeFailure = (error: unknown): void => {
  const message =
    getErrorName(error) === 'NotAllowedError' ? AUTOPLAY_BLOCKED_MESSAGE : RESUME_FAILED_MESSAGE

  reportError(error, message)
}

const playWithAbortRetry = (audio: HTMLAudioElement, allowRetry: boolean): void => {
  audio.play().catch(error => {
    if (getErrorName(error) === 'AbortError' && allowRetry) {
      setTimeout(() => playWithAbortRetry(audio, false), ABORT_RETRY_DELAY_MS)
      return
    }
    reportResumeFailure(error)
  })
}

/**
 * Resumes playback the OS interrupted (phone call) once the page is visible
 * again, mirroring the native createAudioInterruptionHandler auto-resume. An
 * autoplay-policy rejection (NotAllowedError) leaves the element paused.
 * @param audio - Live audio element to resume.
 * @param wasPlaying - Play intent captured before the interruption.
 */
export const resumeInterruptedPlayback = (
  audio: HTMLAudioElement,
  wasPlaying: () => boolean,
): void => {
  if (!wasPlaying()) return
  if (!audio.paused) return
  // A naturally finished track leaves `paused` true; replaying it on return
  // would be a surprise, so only genuine interruptions may auto-resume.
  if (audio.ended) return

  playWithAbortRetry(audio, true)
}
