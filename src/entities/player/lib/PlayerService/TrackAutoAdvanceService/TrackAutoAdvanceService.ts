import AsyncStorage from '@react-native-async-storage/async-storage'
import { markHistoryCompletedAction } from 'entities/listening-history'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_REPEAT_MODE } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { getParseJsonWithSchema, playlistDataSchema } from 'shared/model'
import type { PlayerActions } from './types'
import { RepeatMode, repeatModeSchema } from '../../../model'
import { audioPlayerDataSchema } from '../../../ui/PlayerControls/PlayerControls.types'
import {
  findCurrentTrackIndex,
  getNextTrack,
  isLastTrackInPlaylist,
  shouldRepeatTrack,
  shouldRestartQueue,
} from './navigation'
import { playFirstTrackInQueue, playNextTrack, repeatCurrentTrack } from './playback'

const parseAudioPlayerData = getParseJsonWithSchema(audioPlayerDataSchema)
const parsePlaylistData = getParseJsonWithSchema(playlistDataSchema)

export type { PlayerActions } from './types'

export class TrackAutoAdvanceService {
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
    const stored = await AsyncStorage.multiGet([
      CURRENT_AUDIO,
      CURRENT_PLAYLIST,
      CURRENT_REPEAT_MODE,
    ])
    const storedMap = Object.fromEntries(stored)
    const storedCurrentAudio = storedMap[CURRENT_AUDIO]
    const storedCurrentPlaylist = storedMap[CURRENT_PLAYLIST]
    const storedRepeatMode = storedMap[CURRENT_REPEAT_MODE]
    const { data: repeatMode = RepeatMode.Off } = repeatModeSchema.safeParse(storedRepeatMode)
    const currentAudio = parseAudioPlayerData(storedCurrentAudio)
    const currentPlaylist = parsePlaylistData(storedCurrentPlaylist)

    if (currentAudio?.id) void markHistoryCompletedAction(ctx, currentAudio.id)

    if (!currentPlaylist) return

    const playerActions = this.ensurePlayerActions()
    const currentIndex = findCurrentTrackIndex(currentAudio?.id, currentPlaylist.sermons)
    const isLastTrack = isLastTrackInPlaylist(currentIndex, currentPlaylist.sermons.length)

    if (shouldRepeatTrack(repeatMode)) {
      if (currentAudio?.audioUrl)
        await repeatCurrentTrack(
          playerActions,
          currentAudio,
          currentPlaylist,
          currentAudio.audioUrl,
        )
      return
    }

    if (isLastTrack) {
      if (shouldRestartQueue(repeatMode, isLastTrack)) {
        await playFirstTrackInQueue(playerActions, currentPlaylist)
        return
      }
      await playerActions.pause()
      return
    }

    const nextTrack = getNextTrack(currentPlaylist, currentIndex)
    if (!nextTrack?.audioUrl) return

    await playNextTrack(playerActions, nextTrack, currentPlaylist, nextTrack.audioUrl)
  }

  private playerActions: null | PlayerActions = null
}

export const trackAutoAdvanceService = new TrackAutoAdvanceService()
