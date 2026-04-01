/* eslint-disable max-lines -- FIXME: refactor */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type AudioPlayer } from 'expo-audio'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_REPEAT_MODE } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { parseJsonWithSchema, type PlaylistData, playlistDataSchema } from 'shared/model'
import { RepeatMode, repeatModeSchema, setCurrentAudioAction } from '../../model'
import { type AudioPlayerData, audioPlayerDataSchema } from '../../ui/PlayerControls.types'
import { lockScreenControls } from './LockScreenControls'

export interface PlayerActions {
  pause(): Promise<void>
  play(): Promise<void>
  replaceAudio(audioUrl: string, initialPositionMs?: number): Promise<AudioPlayer | null>
}

class TrackAutoAdvanceService {
  public ensurePlayerActions(): PlayerActions {
    if (!this.playerActions)
      throw new Error('PlayerActions not set. Call setPlayerActions() before using the service.')
    return this.playerActions
  }

  public setPlayerActions(actions: PlayerActions): void {
    this.playerActions = actions
  }

  public getPlayerActions(): null | PlayerActions {
    return this.playerActions
  }

  public async handleTrackEnd(): Promise<void> {
    const [[, storedCurrentAudio], [, storedCurrentPlaylist], [, storedRepeatMode]] =
      await AsyncStorage.multiGet([CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_REPEAT_MODE])
    const { data: repeatMode = RepeatMode.Off } = repeatModeSchema.safeParse(storedRepeatMode)
    const currentAudio = parseJsonWithSchema(audioPlayerDataSchema)(storedCurrentAudio)
    const currentPlaylist = parseJsonWithSchema(playlistDataSchema)(storedCurrentPlaylist)

    if (!currentPlaylist) return

    const currentIndex = currentPlaylist.list.findIndex(t => t.id === currentAudio?.id)
    const isLastTrack = currentIndex === currentPlaylist.list.length - 1

    if (repeatMode === RepeatMode.Track) {
      if (currentAudio?.audioUrl)
        await this.repeatTrack(currentAudio, currentPlaylist, currentAudio.audioUrl)
      return
    }

    if (isLastTrack) {
      if (repeatMode === RepeatMode.Queue) {
        await this.playFirstTrackInQueue(currentPlaylist)
        return
      }
      await this.ensurePlayerActions().pause()
      return
    }

    const nextTrack = currentPlaylist.list[currentIndex + 1]

    if (!nextTrack?.audioUrl) return

    await this.playNextTrack(
      { ...nextTrack, audioUrl: nextTrack.audioUrl },
      currentPlaylist,
      nextTrack.audioUrl,
    )
  }

  private async repeatTrack(
    audio: AudioPlayerData,
    playlist: PlaylistData,
    audioUrl: string,
  ): Promise<void> {
    await setCurrentAudioAction(ctx, audio)
    await this.playTrackWithMetadata(audio, playlist, audioUrl, 0)
  }

  private async playNextTrack(
    nextTrack: AudioPlayerData,
    playlist: PlaylistData,
    audioUrl: string,
  ): Promise<void> {
    const newAudio: AudioPlayerData = { ...nextTrack, artwork: nextTrack.artwork, audioUrl }
    await setCurrentAudioAction(ctx, newAudio)
    await this.playTrackWithMetadata(newAudio, playlist, audioUrl)
  }

  private async playFirstTrackInQueue(playlist: PlaylistData): Promise<void> {
    const firstTrack = playlist.list[0]
    if (!firstTrack?.audioUrl) return

    const newAudio: AudioPlayerData = {
      ...firstTrack,
      artwork: firstTrack.artwork ?? '',
      audioUrl: firstTrack.audioUrl,
    }
    await setCurrentAudioAction(ctx, newAudio)
    await this.playTrackWithMetadata(newAudio, playlist, newAudio.audioUrl)
  }

  private async playTrackWithMetadata(
    audio: AudioPlayerData,
    playlist: PlaylistData,
    audioUrl: string,
    initialPositionMs = 0,
  ): Promise<void> {
    const playerInstance = await this.ensurePlayerActions().replaceAudio(
      audioUrl,
      initialPositionMs,
    )
    lockScreenControls.setMetadata(playerInstance, {
      albumTitle: playlist.title,
      artist: audio.artist,
      artworkUrl: audio.artwork,
      title: audio.title,
    })
    await this.playWithAppStateHandling()
  }

  private async playWithAppStateHandling(): Promise<void> {
    try {
      await this.ensurePlayerActions().play()
    } catch (error) {
      if (error instanceof Error && error.message.includes('activity is no longer available'))
        console.warn('[TrackAutoAdvanceService] Ignoring AppState-related error:', error.message)
      else throw error
    }
  }

  private playerActions: null | PlayerActions = null
}

export const trackAutoAdvanceService = new TrackAutoAdvanceService()
