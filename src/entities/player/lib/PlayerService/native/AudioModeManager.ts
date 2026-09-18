import { type AudioMode, setAudioModeAsync } from 'expo-audio'
import { AppState } from 'react-native'

/**
 * Audio mode configuration for expo-audio.
 * Using 'doNotMix' interruption mode ensures playback pauses completely
 * on interruptions (like phone calls) instead of just ducking/muting.
 */
const AUDIO_MODE_CONFIG: Partial<AudioMode> = {
  interruptionMode: 'doNotMix',
  playsInSilentMode: true,
  shouldPlayInBackground: true,
}

const ACTIVITY_UNAVAILABLE_ERROR = 'activity is no longer available'

/**
 * Manages audio mode configuration with re-assertion semantics.
 * Each configure() call re-runs setAudioModeAsync (cheap, idempotent native call)
 * to re-assert after OS-side resets (Android MediaSession/audio-focus wedges).
 * Concurrent in-flight calls are deduplicated by returning the same Promise.
 * AppState listener always re-asserts on transition to active.
 */
class AudioModeManager {
  /**
   * Configure audio mode with deduplication.
   * Re-asserts audio mode on every call (re-asserts after OS-side resets).
   * Deduplicates concurrent in-flight calls by returning the same Promise.
   * Returns early if app is not active; the AppState listener will re-assert on foreground.
   */
  public async configure(): Promise<void> {
    if (this.configurePromise) return this.configurePromise

    if (!this.isAppActive()) return

    this.configurePromise = this.runConfigure()
    return this.configurePromise
  }

  /**
   * AppState listener: on transition to active, always re-assert audio mode.
   * This handles OS-side resets (e.g., Android MediaSession/audio-focus wedges)
   * that occur while the app is backgrounded.
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active')
        void this.configure().catch(error => {
          console.warn('[AudioModeManager] Failed to re-assert audio mode on foreground:', error)
        })
    })
  }

  private isAppActive(): boolean {
    return AppState.currentState === 'active'
  }

  private isAppStateError(error: unknown): boolean {
    if (error instanceof Error) return error.message.includes(ACTIVITY_UNAVAILABLE_ERROR)
    return false
  }

  private async runConfigure(): Promise<void> {
    try {
      await setAudioModeAsync(AUDIO_MODE_CONFIG)
    } catch (error: unknown) {
      if (this.isAppStateError(error)) {
        console.warn('[AudioModeManager] Audio mode unavailable - will retry when app is active')
        return
      }
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[AudioModeManager] Failed to set audio mode: ${message}`, {
        cause: error,
      })
    } finally {
      this.configurePromise = null
    }
  }

  public constructor() {
    this.setupAppStateListener()
  }

  private configurePromise: null | Promise<void> = null
  private appStateSubscription: { remove: () => void } | null = null
}

export const audioModeManager = new AudioModeManager()
