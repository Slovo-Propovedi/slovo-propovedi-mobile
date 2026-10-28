import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  COMPLETION_REMAINING_MS,
  getResumePosition,
  historyAtom,
  markHistoryCompletedAction,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { currentPlaylistAtom, setCurrentAudioAction } from '../../../../model'
import { savePlaybackProgress } from '../../../playbackProgress'
import { startBackgroundCaching } from '../../BackgroundCachingService'
import { lockScreenControls } from '../LockScreenControls'
import { playlistEngine } from '../PlaylistEngine'
import { parseAudioPlayerData, parsePlaylistData } from './parsers'

const ADVANCE_ERROR_MESSAGE = 'Ошибка при автоматическом переходе к следующей проповеди'
const COMPLETION_ERROR_MESSAGE = 'Ошибка при завершении записи истории'

const toMs = (seconds: number | undefined): number => Math.floor((seconds ?? 0) * 1000)

const reportParseFailure = (
  key: string,
  storedValue: null | string | undefined,
  label: string,
): void => {
  if (!storedValue) return
  console.error(`[TrackAutoAdvanceService] ${key} schema validation failed`)
  reportError(new Error(`Не удалось прочитать данные ${label} из хранилища`))
}

/**
 * Native-switch coordinator: the playlist advances tracks natively (surviving a
 * frozen JS process), and JS reconciles the switch after the fact. Manual
 * next/prev switches are already committed by the JS funnel before skipTo —
 * storage then already holds the new track id, so the event is ignored here.
 */
class TrackAutoAdvanceService {
  public async handleTrackChanged(previousIndex: number, currentIndex: number): Promise<void> {
    try {
      if (previousIndex < 0 || previousIndex === currentIndex) return
      const storedMap = Object.fromEntries(
        await AsyncStorage.multiGet([CURRENT_AUDIO, CURRENT_PLAYLIST]),
      )
      const storedAudio = parseAudioPlayerData(storedMap[CURRENT_AUDIO])
      const playlist = parsePlaylistData(storedMap[CURRENT_PLAYLIST])
      if (!playlist) {
        reportParseFailure('CURRENT_PLAYLIST', storedMap[CURRENT_PLAYLIST], 'плейлиста')
        return
      }
      const newTrack = playlistEngine.getTrackAt(currentIndex)
      if (!newTrack) return
      if (storedAudio?.id === newTrack.id) return

      const previousTrack = playlistEngine.getTrackAt(previousIndex)
      const oldSermonId = previousTrack?.id ?? storedAudio?.id
      if (!oldSermonId) return

      this.completedQueueEndIndex = -1
      const newAudio = { ...newTrack, artwork: playlist.artwork }
      const snapshot = playlistEngine.getSnapshot(previousIndex)
      await setCurrentAudioAction(ctx, newAudio)
      void recordSermonSwitchAction(ctx, {
        markOldCompleted: true,
        newAudio,
        newPlaylist: playlist,
        oldDurationMs: toMs(snapshot?.duration),
        oldPositionMs: toMs(snapshot?.currentTime),
        oldSermonId,
      })

      const resumeMs = getResumePosition(ctx.get(historyAtom), newTrack.id)
      await this.seekToResume(resumeMs)
      await savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: newTrack.id })
      lockScreenControls.setMetadata(playlistEngine.getPlaylist(), {
        albumTitle: playlist.title,
        artist: newAudio.artist,
        artworkUrl: newAudio.artwork,
        title: newAudio.title,
      })
      startBackgroundCaching(newAudio.audioUrl)
    } catch (error) {
      console.error('[TrackAutoAdvanceService] handleTrackChanged failed:', error)
      reportError(error, ADVANCE_ERROR_MESSAGE)
    }
  }

  public async handleQueueEnd(): Promise<void> {
    try {
      const lastIndex = playlistEngine.getTrackCount() - 1
      if (playlistEngine.getCurrentIndex() !== lastIndex) return
      if (playlistEngine.getLoop() !== 'none') return
      if (this.completedQueueEndIndex === lastIndex) return
      const lastTrack = playlistEngine.getTrackAt(lastIndex)
      if (!lastTrack) return

      this.completedQueueEndIndex = lastIndex
      const snapshot = playlistEngine.getSnapshot(lastIndex)
      await markHistoryCompletedAction(
        ctx,
        lastTrack.id,
        toMs(snapshot?.duration),
        lastTrack,
        ctx.get(currentPlaylistAtom) ?? undefined,
      )
      playlistEngine.pause()
    } catch (error) {
      console.error('[TrackAutoAdvanceService] handleQueueEnd failed:', error)
      reportError(error, COMPLETION_ERROR_MESSAGE)
    }
  }

  private async seekToResume(resumeMs: number): Promise<void> {
    if (resumeMs <= 0) return
    const durationMs = playlistEngine.getStatus().durationMs
    if (durationMs > 0 && resumeMs >= durationMs - COMPLETION_REMAINING_MS) return
    await playlistEngine.seekTo(resumeMs / 1000)
  }

  private completedQueueEndIndex = -1
}

export const trackAutoAdvanceService = new TrackAutoAdvanceService()
