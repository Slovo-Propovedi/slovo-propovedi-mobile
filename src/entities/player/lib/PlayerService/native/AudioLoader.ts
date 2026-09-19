import { type AudioPlayer, createAudioPlayer } from 'expo-audio'
import { PART_SUFFIX } from 'shared/lib/audio-cache'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { setIsBufferingAction, setPositionAction } from '../../../model'
import { setIsStalledOfflineAction } from '../../stalledOffline'
import { applyPartialDuration } from './partialDuration'
import { resolvePlaybackUrl } from './resolvePlaybackUrl'
import { waitForLoaded } from './waitForLoaded'

const REPLACE_AUDIO_ERROR_MESSAGE = 'Ошибка при замене аудио'

class AudioLoader {
  public async loadAudio(audioUrl: string, initialPositionMs = 0): Promise<AudioPlayer | null> {
    if (!audioUrl) return null
    this.loaded = false
    // A new source invalidates any previous offline stall — the heal must not
    // auto-resume a track the user has already switched away from.
    void setIsStalledOfflineAction(ctx, false)
    void setIsBufferingAction(ctx, true)
    void setPositionAction(ctx, 0)
    this.trackEndHandled = false
    if (this.playerInstance) {
      // release() (not remove()) — remove() leaks the native player (expo-audio #41852)
      this.playerInstance.release()
      this.playerInstance = null
    }
    const playUrl = await resolvePlaybackUrl(audioUrl)
    this.lastResolvedUrl = playUrl
    const partial = this.isPartialSource()
    // keepAudioSessionActive prevents iOS AVAudioSession deactivation at track end,
    // which otherwise stalls background auto-advance until the app is foregrounded
    const player = createAudioPlayer(
      { uri: playUrl },
      { downloadFirst: false, keepAudioSessionActive: true },
    )
    this.playerInstance = player
    return waitForLoaded(player, initialPositionMs, p => p === this.playerInstance, partial)
      .then(loaded => {
        this.loaded = loaded !== null
        this.applyPartialDurationIfNeeded(partial, loaded)
        return loaded
      })
      .catch(error => {
        console.error('[AudioLoader] loadAudio: Promise rejected with error:', error)
        reportError(error, 'Ошибка при загрузке аудио')
        void setIsBufferingAction(ctx, false)
        return null
      })
  }

  public async replaceAudio(audioUrl: string, initialPositionMs = 0): Promise<AudioPlayer | null> {
    if (!audioUrl) return null
    this.loaded = false
    void setIsStalledOfflineAction(ctx, false)
    void setIsBufferingAction(ctx, true)
    this.trackEndHandled = false
    if (!this.playerInstance) return this.loadAudio(audioUrl, initialPositionMs)
    const playUrl = await resolvePlaybackUrl(audioUrl)
    this.lastResolvedUrl = playUrl
    const partial = this.isPartialSource()
    try {
      // replace-in-place: same native player, same MediaSession, same foreground service.
      // Never pass null to replace() — it crashes the player (expo-audio #48219)
      this.playerInstance.replace(playUrl)
    } catch (error) {
      console.error('[AudioLoader] replaceAudio: replace failed with error:', error)
      reportError(error, REPLACE_AUDIO_ERROR_MESSAGE)
      void setIsBufferingAction(ctx, false)
      return null
    }
    return waitForLoaded(
      this.playerInstance,
      initialPositionMs,
      p => p === this.playerInstance,
      partial,
    ).then(loaded => {
      this.loaded = loaded !== null
      this.applyPartialDurationIfNeeded(partial, loaded)
      return loaded
    })
  }

  public isPartialSource(): boolean {
    return this.lastResolvedUrl?.endsWith(PART_SUFFIX) ?? false
  }

  public releaseAndReset(): void {
    this.loaded = false
    this.lastResolvedUrl = null
    if (!this.playerInstance) return
    this.playerInstance.release()
    this.playerInstance = null
  }

  public getPlayerInstance(): AudioPlayer | null {
    return this.playerInstance
  }

  public getLastResolvedUrl(): null | string {
    return this.lastResolvedUrl
  }

  public isPlayerLoaded(): boolean {
    return this.loaded
  }

  public resetTrackEndHandled(): void {
    this.trackEndHandled = false
  }

  public isTrackEndHandled(): boolean {
    return this.trackEndHandled
  }

  public markTrackEndHandled(): void {
    this.trackEndHandled = true
  }

  private applyPartialDurationIfNeeded(partial: boolean, loaded: AudioPlayer | null): void {
    if (!partial || !loaded) return
    applyPartialDuration(Math.floor(loaded.duration * 1000))
  }

  private playerInstance: AudioPlayer | null = null
  private trackEndHandled = false
  private lastResolvedUrl: null | string = null
  private loaded = false
}
export const audioLoader = new AudioLoader()
