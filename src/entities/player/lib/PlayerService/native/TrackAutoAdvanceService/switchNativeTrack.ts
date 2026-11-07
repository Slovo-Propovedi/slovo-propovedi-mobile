import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  COMPLETION_REMAINING_MS,
  getResumePosition,
  historyAtom,
  recordSermonSwitchAction,
} from 'entities/listening-history/@x/player'
import { CURRENT_AUDIO, CURRENT_PLAYLIST } from 'shared/config'
import { ctx } from 'shared/lib/reatom-ctx'
import { reportError } from 'shared/model/error-dialog'
import { setCurrentAudioAction } from '../../../../model'
import { savePlaybackProgress } from '../../../playbackProgress'
import { startBackgroundCaching } from '../../BackgroundCachingService'
import { lockScreenControls } from '../LockScreenControls'
import { playlistEngine } from '../PlaylistEngine'
import { parseAudioPlayerData, parsePlaylistData } from './parsers'

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

const seekToResume = async (resumeMs: number): Promise<void> => {
  if (resumeMs <= 0) return
  const durationMs = playlistEngine.getStatus().durationMs
  if (durationMs > 0 && resumeMs >= durationMs - COMPLETION_REMAINING_MS) return
  await playlistEngine.seekTo(resumeMs / 1000)
}

/**
 * Applies a native track switch. With `previousIndex` the old track is flushed
 * and marked completed (auto-advance); without it this is a manual hop, so the
 * history of the previous track is left untouched.
 * @param root0 - Target index and optional previous index.
 * @param root0.currentIndex - Index the engine moved to.
 * @param root0.previousIndex - Index JS believed was playing (auto-advance only).
 */
export const switchNativeTrack = async ({
  currentIndex,
  previousIndex,
}: {
  currentIndex: number
  previousIndex?: number
}): Promise<void> => {
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

  const newAudio = { ...newTrack, artwork: playlist.artwork }
  const resumeMs = getResumePosition(ctx.get(historyAtom), newTrack.id)
  await setCurrentAudioAction(ctx, newAudio)

  if (previousIndex !== undefined) {
    const oldSermonId = playlistEngine.getTrackAt(previousIndex)?.id ?? storedAudio?.id
    if (oldSermonId) {
      const snapshot = playlistEngine.getSnapshot(previousIndex)
      void recordSermonSwitchAction(ctx, {
        markOldCompleted: true,
        newAudio,
        newPlaylist: playlist,
        oldDurationMs: toMs(snapshot?.duration),
        oldPositionMs: toMs(snapshot?.currentTime),
        oldSermonId,
      })
    }
  }

  await seekToResume(resumeMs)
  await savePlaybackProgress(ctx, { positionMs: resumeMs, sermonId: newTrack.id })
  lockScreenControls.setMetadata(playlistEngine.getPlaylist(), {
    albumTitle: playlist.title,
    artist: newAudio.artist,
    artworkUrl: newAudio.artwork,
    title: newAudio.title,
  })
  startBackgroundCaching(newAudio.audioUrl)
}
