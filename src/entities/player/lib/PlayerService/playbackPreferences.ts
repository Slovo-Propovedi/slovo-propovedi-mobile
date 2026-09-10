import { type AudioPlayer } from 'expo-audio'
import { ctx } from 'shared/lib/reatom-ctx'
import { setVolumeAction } from '../../model'
import { type PlaybackRate, setPlaybackRateAction } from '../../playback-rate'

const MIN_VOLUME = 0
const MAX_VOLUME = 1
const DEFAULT_PLAYBACK_RATE: PlaybackRate = 1
const DEFAULT_VOLUME = 1

/**
 * Persisted playback preferences (rate and volume) that must outlive a player
 * instance. A freshly created AudioPlayer always starts at rate 1 / volume 1,
 * so `applyPlaybackRate` / `applyVolume` re-apply the stored values once the
 * new instance is ready (see PlayerService.loadAudio / replaceAudio).
 */
class PlaybackPreferences {
  public setPlaybackRate = (player: AudioPlayer | null, rate: PlaybackRate): void => {
    this.playbackRate = rate
    player?.setPlaybackRate(rate, 'high')
    void setPlaybackRateAction(ctx, rate)
  }

  public setVolume = (player: AudioPlayer | null, volume: number): void => {
    this.volume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume))

    if (player?.isLoaded) player.volume = this.volume

    void setVolumeAction(ctx, this.volume)
  }

  public applyPlaybackRate = (player: AudioPlayer | null): void => {
    if (this.playbackRate === DEFAULT_PLAYBACK_RATE) return
    if (!player?.isLoaded) return

    player.setPlaybackRate(this.playbackRate, 'high')
  }

  public applyVolume = (player: AudioPlayer | null): void => {
    if (this.volume === DEFAULT_VOLUME) return
    if (!player?.isLoaded) return

    player.volume = this.volume
  }

  public getPlaybackRate = (): PlaybackRate => this.playbackRate

  public getVolume = (): number => this.volume

  private playbackRate: PlaybackRate = DEFAULT_PLAYBACK_RATE
  private volume = DEFAULT_VOLUME
}

export const playbackPreferences = new PlaybackPreferences()
