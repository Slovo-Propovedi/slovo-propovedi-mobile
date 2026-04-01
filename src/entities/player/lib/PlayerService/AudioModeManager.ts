import { type AudioMode, setAudioModeAsync } from 'expo-audio'
import { AppState } from 'react-native'

/**
 * Audio mode configuration for expo-audio.
 * Using 'doNotMix' interruption mode ensures playback pauses completely
 * on interruptions (like phone calls) instead of just ducking/muting.
 */
const AUDIO_MODE_CONFIG: Partial<AudioMode> = {
  // Interruption mode - 'doNotMix' pauses playback on interruptions
  // (phone calls, other audio apps) instead of just muting/ducking
  interruptionMode: 'doNotMix',
  // iOS - allow playback in silent mode
  playsInSilentMode: true,
  // Background playback
  shouldPlayInBackground: true,
}

const ACTIVITY_UNAVAILABLE_ERROR = 'activity is no longer available'

class AudioModeManager {
  /**
   * Configure audio mode with AppState-aware retry logic.
   * If configuration fails due to AppState, queues retry for next active state.
   * Early exit if already configured or app is not in active state.
   */
  public async configure(): Promise<void> {
    if (this.isConfigured()) return

    if (!this.isAppActive()) {
      this.pendingConfiguration = true
      return
    }

    try {
      await setAudioModeAsync(AUDIO_MODE_CONFIG)
      this.configured = true
      this.pendingConfiguration = false
    } catch (error) {
      if (this.isAppStateError(error)) {
        this.pendingConfiguration = true
        console.warn('[AudioModeManager] Audio mode unavailable - will retry when app is active')
        return
      }
      throw new Error(
        `[AudioModeManager] Failed to set audio mode: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  public isConfigured(): boolean {
    return this.configured
  }

  /**
   * Setup AppState listener to retry failed configurations when app becomes active.
   * Automatically cleans up listener on success.
   */
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active' && this.pendingConfiguration && !this.isConfigured())
        void this.configure()
    })
  }

  /**
   * Check if app is currently in active state.
   * Early exit for background/inactive states.
   */
  private isAppActive(): boolean {
    return AppState.currentState === 'active'
  }

  /**
   * Detect if error is related to AppState being unavailable.
   * @param error - The error to check.
   */
  private isAppStateError(error: unknown): boolean {
    if (error instanceof Error) return error.message.includes(ACTIVITY_UNAVAILABLE_ERROR)
    return false
  }

  public constructor() {
    this.setupAppStateListener()
  }

  private configured = false
  private pendingConfiguration = false
  private appStateSubscription: { remove: () => void } | null = null
}

export const audioModeManager = new AudioModeManager()
