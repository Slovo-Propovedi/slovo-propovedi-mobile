import AsyncStorage from '@react-native-async-storage/async-storage'
import { markHistoryCompletedAction } from 'entities/listening-history/@x/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST, CURRENT_REPEAT_MODE } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { audioPlayerDataSchema, getParseJsonWithSchema, playlistDataSchema } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { isOnlineAtom } from 'shared/model/network'
import type { OldTrackFlush } from './playback'
import type { PlayerActions } from './types'
import { durationAtom, positionAtom, RepeatMode, repeatModeSchema } from '../../../model'
import { guardOfflinePlayback } from '../../playOfflineGuard'
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

const buildOldFlush = (sermonId: string): OldTrackFlush => ({
  oldDurationMs: ctx.get(durationAtom),
  oldPositionMs: ctx.get(positionAtom),
  oldSermonId: sermonId,
})

const reportParseFailure = (
  key: string,
  storedValue: null | string | undefined,
  label: string,
): void => {
  if (!storedValue) return
  console.error(`[TrackAutoAdvanceService] ${key} schema validation failed`)
  reportError(new Error(`Не удалось прочитать данные ${label} из хранилища`))
}

const isAdvanceBlocked = (audioUrl: null | string | undefined): Promise<boolean> =>
  audioUrl ? guardOfflinePlayback(audioUrl, ctx.get(isOnlineAtom)) : Promise.resolve(false)

export class TrackAutoAdvanceService {
  public ensurePlayerActions(): PlayerActions {
    if (!this.playerActions)
      throw new Error('PlayerActions not set. Call setPlayerActions() before using the service.')
    return this.playerActions
  }

  public setPlayerActions(actions: PlayerActions): void {
    this.playerActions = actions
  }

  public async handleTrackEnd(): Promise<void> {
    try {
      await this.advanceToNextTrack()
    } catch (error) {
      console.error('[TrackAutoAdvanceService] handleTrackEnd failed:', error)
      reportError(error, 'Ошибка при автоматическом переходе к следующей проповеди')
    }
  }

  private async advanceToNextTrack(): Promise<void> {
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

    if (!currentAudio) {
      reportParseFailure('CURRENT_AUDIO', storedCurrentAudio, 'проповеди')
      return
    }
    if (!currentPlaylist) {
      reportParseFailure('CURRENT_PLAYLIST', storedCurrentPlaylist, 'плейлиста')
      return
    }

    const playerActions = this.ensurePlayerActions()
    const currentIndex = findCurrentTrackIndex(currentAudio.id, currentPlaylist.sermons)
    const isLastTrack = isLastTrackInPlaylist(currentIndex, currentPlaylist.sermons.length)
    const oldFlush = buildOldFlush(currentAudio.id)

    if (shouldRepeatTrack(repeatMode)) {
      if (!currentAudio.audioUrl || (await isAdvanceBlocked(currentAudio.audioUrl))) return

      await repeatCurrentTrack(
        playerActions,
        currentAudio,
        currentPlaylist,
        currentAudio.audioUrl,
        oldFlush,
      )
      return
    }

    if (isLastTrack) {
      if (shouldRestartQueue(repeatMode, isLastTrack)) {
        if (await isAdvanceBlocked(currentPlaylist.sermons[0]?.audioUrl)) return
        await playFirstTrackInQueue(playerActions, currentPlaylist, oldFlush)
        return
      }
      void markHistoryCompletedAction(ctx, currentAudio.id, ctx.get(durationAtom)).catch(error => {
        console.error('[TrackAutoAdvanceService] markHistoryCompletedAction failed:', error)
        reportError(error, 'Ошибка при завершении записи истории')
      })
      await playerActions.pause()
      return
    }

    const nextTrack = getNextTrack(currentPlaylist, currentIndex)
    if (!nextTrack?.audioUrl || (await isAdvanceBlocked(nextTrack.audioUrl))) return

    await playNextTrack(playerActions, nextTrack, currentPlaylist, nextTrack.audioUrl, oldFlush)
  }

  private playerActions: null | PlayerActions = null
}

export const trackAutoAdvanceService = new TrackAutoAdvanceService()
