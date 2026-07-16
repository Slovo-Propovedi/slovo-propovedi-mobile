import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer } from 'expo-audio'
import { CURRENT_SOUND_POSITION } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import {
  setIsPlayingAction,
  setIsSeekingAction,
  setPositionAction,
  setVolumeAction,
} from '../../model'
import { type PlaybackStatus } from './types'

const DEFAULT_PLAYBACK_STATUS: PlaybackStatus = {
  duration: 0,
  isPlaying: false,
  position: 0,
}

/**
 * PlaybackController handles core playback operations.
 * Works with an external player instance passed as parameter.
 */
class PlaybackController {
  public play = async (player: AudioPlayer | null): Promise<void> => {
    if (!player?.isLoaded) return

    player.play()
  }

  public pause = async (player: AudioPlayer | null): Promise<void> => {
    if (!player?.isLoaded) return

    const positionMs = Math.floor(player.currentTime * 1000)
    await AsyncStorage.setItem(CURRENT_SOUND_POSITION, String(positionMs))
    player.pause()
    void setIsPlayingAction(ctx, false)
  }

  public stop = async (player: AudioPlayer | null): Promise<void> => {
    if (!player?.isLoaded) return

    player.pause()
    await player.seekTo(0)
    void setIsPlayingAction(ctx, false)
  }

  public seekTo = async (player: AudioPlayer | null, positionMs: number): Promise<void> => {
    if (!player?.isLoaded) return

    const clampedPosition = Math.max(0, positionMs)
    void setIsSeekingAction(ctx, true)
    void setPositionAction(ctx, clampedPosition)
    try {
      await player.seekTo(clampedPosition / 1000)
    } finally {
      void setIsSeekingAction(ctx, false)
    }
  }

  public setVolume = async (player: AudioPlayer | null, volume: number): Promise<void> => {
    this.volume = Math.max(0, Math.min(1, volume))

    if (player?.isLoaded) player.volume = this.volume

    void setVolumeAction(ctx, this.volume)
  }

  public getStatus = (player: AudioPlayer | null): PlaybackStatus => {
    if (!player?.isLoaded) return DEFAULT_PLAYBACK_STATUS

    return {
      duration: Math.floor(player.duration * 1000),
      isPlaying: player.playing,
      position: Math.floor(player.currentTime * 1000),
    }
  }

  public getVolume = (): number => this.volume

  private volume = 1
}

export const playbackController = new PlaybackController()
